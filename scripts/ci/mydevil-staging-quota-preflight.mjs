#!/usr/bin/env node
/**
 * Fail-closed MyDevil ACCOUNT capacity gate for staging deployments.
 *
 * Parses the "Powierzchnia" line from `devil info limits`, NOT `df`.
 * Never logs the raw CLI output; no network, file writes or mutation.
 * The >= 5 GiB lower-bound is an internal staging admission threshold,
 * not a guarantee of sufficient space for an arbitrary release.
 */
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const UNIT_BYTES = Object.freeze({
  K: 1024, M: 1024 ** 2, G: 1024 ** 3, T: 1024 ** 4,
});
const MIN_FREE_GIB = 5;
const LIMIT_INPUT_BYTES = 65536;

export function evaluateQuota(raw, { minimumFreeGiB = MIN_FREE_GIB } = {}) {
  if (typeof raw !== 'string' || raw.length === 0 ||
      Buffer.byteLength(raw, 'utf8') > LIMIT_INPUT_BYTES) {
    throw new Error('QUOTA_OUTPUT_INVALID');
  }
  if (!Number.isFinite(minimumFreeGiB) || minimumFreeGiB < MIN_FREE_GIB ||
      minimumFreeGiB > 100) {
    throw new Error('QUOTA_THRESHOLD_INVALID');
  }

  const clean = raw.replace(/\x1B\[[0-9;]*[ -/]*[@-~]/g, '');
  const lines = clean.split(/\r?\n/).filter(line => /^\s*Powierzchnia\s*:/.test(line));
  if (lines.length !== 1) throw new Error('QUOTA_LINE_MISSING_OR_AMBIGUOUS');

  // Require utilization percentage AND independently rendered used/limit.
  const pattern = /^\s*Powierzchnia\s*:\s*\[[^\]\r\n]{0,200}\]\s*(\d{1,3}(?:[.,]\d{1,3})?)%\s*\(\s*(\d+(?:[.,]\d{1,3})?)\s*([KMGT])\s*\/\s*(\d+(?:[.,]\d{1,3})?)\s*([KMGT])\s*\)\s*$/;
  const m = lines[0].match(pattern);
  if (!m) throw new Error('QUOTA_FORMAT_UNRECOGNIZED');
  const number = s => Number(s.replace(',', '.'));
  const percentage = number(m[1]);
  const used = number(m[2]) * UNIT_BYTES[m[3]];
  const limit = number(m[4]) * UNIT_BYTES[m[5]];
  if (![percentage, used, limit].every(Number.isFinite) ||
      percentage < 0 || percentage > 100 ||
      used < 0 || limit <= 0 || used > limit * 1.002) {
    throw new Error('QUOTA_VALUES_INVALID');
  }
  const calculatedPct = 100 * used / limit;
  // Rounded "47.3G/50.0G" may differ from "94.61%" in last digits.
  if (Math.abs(calculatedPct - percentage) > 0.6) {
    throw new Error('QUOTA_VALUES_INCONSISTENT');
  }

  // The display uses rounded figures. Underestimate free space by one
  // unit of the last reported decimal digit for each printed number.
  const resolution = (s, unit) =>
    UNIT_BYTES[unit] * 10 ** -(s.split(/[.,]/)[1]?.length ?? 0);
  const roundingReserve =
    resolution(m[2], m[3]) + resolution(m[4], m[5]);
  const conservativeFreeBytes = Math.max(0,
    Math.min(limit - used, limit * (1 - percentage / 100)) - roundingReserve);
  const thresholdBytes = minimumFreeGiB * 1024 ** 3;

  return {
    accountUsagePercent: percentage,
    conservativeFreeGiB: Math.floor(conservativeFreeBytes / 1024 ** 3 * 100) / 100,
    thresholdGiB: minimumFreeGiB,
    allowed: conservativeFreeBytes >= thresholdBytes,
  };
}

if (process.argv[1] &&
    import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    let text = '';
    for await (const chunk of process.stdin) {
      text += chunk.toString();
      if (Buffer.byteLength(text, 'utf8') > LIMIT_INPUT_BYTES) {
        throw new Error('QUOTA_OUTPUT_INVALID');
      }
    }
    const result = evaluateQuota(text);
    process.stdout.write(
      `ACCOUNT_QUOTA_USAGE_PERCENT=${result.accountUsagePercent}\n` +
      `ACCOUNT_QUOTA_FREE_LOWER_BOUND_GIB=${result.conservativeFreeGiB}\n` +
      `REQUIRED_FREE_GIB=${result.thresholdGiB}\n`
    );
    if (!result.allowed) throw new Error('ACCOUNT_QUOTA_INSUFFICIENT');
    process.stdout.write('STAGING_QUOTA_PREFLIGHT=PASS\n');
  } catch (error) {
    // Deliberately do not echo raw CLI output, paths or unexpected errors.
    const code = /^QUOTA_|^ACCOUNT_QUOTA_/.test(error?.message ?? '')
      ? error.message : 'QUOTA_PREFLIGHT_UNAVAILABLE';
    process.stderr.write(`STAGING_QUOTA_PREFLIGHT=BLOCKED (${code})\n`);
    process.exitCode = 2;
  }
}
