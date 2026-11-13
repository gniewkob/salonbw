import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { safeFindings, readSafeSummary } from "./gitleaks-safe-report.mjs";

const MARKER = "DO_NOT_PRINT_A_SECRET_VALUE";
const original = {
    File: "src/fixtures/example.ts",
    StartLine: 12,
    EndLine: 13,
    RuleID: "generic-api-key",
    Secret: MARKER,
    Match: "token=" + MARKER,
    Line: "export const token='" + MARKER + "'",
    Fingerprint: "secret-index:" + MARKER,
};

test("only approved metadata is included in report output", () => {
    const result = safeFindings([original], "/tmp/sample");
    assert.equal(result.findingCount, 1);
    assert.deepEqual(result.findings[0], {
        file: original.File,
        startLine: 12,
        endLine: 13,
        rule: "generic-api-key",
    });
    assert.equal(JSON.stringify(result).includes(MARKER), false);
});

test("absolute paths are normalized relative to scanned root", () => {
    const result = safeFindings(
        [{ ...original, File: "/tmp/sample/path/file.ts" }],
        "/tmp/sample",
    );
    assert.equal(result.findings[0].file, "path/file.ts");
});

test("malformed report is rejected instead of dumped", () => {
    assert.throws(() => safeFindings(null));
    assert.throws(() => safeFindings([{ File: "ok" }, null]));
});

test("private JSON report is sanitized, symlink rejected", () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), "safe-gitleaks-test-"));
    try {
        const report = path.join(base, "report.json");
        fs.writeFileSync(report, JSON.stringify([original]), { mode: 0o600 });
        const result = readSafeSummary(report, base);
        assert.equal(result.findingCount, 1);
        assert.equal(JSON.stringify(result).includes(MARKER), false);
        const symlink = path.join(base, "report-link");
        fs.symlinkSync(report, symlink);
        assert.throws(() => readSafeSummary(symlink, base));
    } finally {
        fs.rmSync(base, { recursive: true, force: true });
    }
});

test("long reports are bounded without losing total count", () => {
    const result = safeFindings(Array.from({ length: 31 }, () => original));
    assert.equal(result.findingCount, 31);
    assert.equal(result.listedCount, 30);
});
