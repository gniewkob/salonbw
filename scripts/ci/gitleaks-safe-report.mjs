#!/usr/bin/env node
// Show only safe metadata from a private Gitleaks JSON report.
// Never display Secret, Match, Line, Fingerprint or raw source text.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const MAX_FINDINGS = 30;
const MAX_FIELD = 300;
export function safeFindings(report, workspace = process.cwd()) {
    if (!Array.isArray(report)) {
        throw new Error("Gitleaks JSON report is not an array");
    }
    const findings = report.slice(0, MAX_FINDINGS).map((finding) => {
        if (!finding || typeof finding !== "object") {
            throw new Error("Invalid Gitleaks finding");
        }
        const rawFile = String(finding.File ?? "");
        // Do not trust a report to contain only relative paths.
        const relative = path.isAbsolute(rawFile)
            ? path.relative(workspace, rawFile)
            : rawFile;
        return {
            file: relative.slice(0, MAX_FIELD),
            startLine: Number.isSafeInteger(finding.StartLine)
                ? finding.StartLine
                : null,
            endLine: Number.isSafeInteger(finding.EndLine)
                ? finding.EndLine
                : null,
            rule: String(finding.RuleID ?? "unknown").slice(0, MAX_FIELD),
        };
    });
    return {
        findingCount: report.length,
        listedCount: findings.length,
        findings,
        action:
            "Review and classify each finding. Do not add broad allowlists or print raw report contents.",
    };
}

export function readSafeSummary(reportFile, workspace = process.cwd()) {
    const stat = fs.lstatSync(reportFile);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 5 * 1024 * 1024) {
        throw new Error("Unsafe Gitleaks report file");
    }
    return safeFindings(
        JSON.parse(fs.readFileSync(reportFile, "utf8")),
        workspace,
    );
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    try {
        if (process.argv.length !== 4) {
            throw new Error("Expected report and source directory arguments");
        }
        console.log(
            JSON.stringify(
                readSafeSummary(process.argv[2], process.argv[3]),
                null,
                2,
            ),
        );
    } catch {
        // Parsing failures should never cause dumping the raw secret report.
        console.error("GITLEAKS_DIAG=BLOCKED invalid or unsafe private report");
        process.exitCode = 1;
    }
}
