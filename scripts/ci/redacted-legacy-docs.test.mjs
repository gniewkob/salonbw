import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (file) => fs.readFileSync(path.join(repo, file), "utf8");

test("backend README does not expose a legacy CircleCI badge token", () => {
    const readme = read("backend/salonbw-backend/README.md");
    assert.doesNotMatch(readme, /circleci[^\r\n]*[?&]token=/i);
});

test("Versum parity audit uses required environment references, not literal credentials", () => {
    const text = read("docs/VERSUM_CLONE_PROGRESS.md");
    for (const name of [
        "PANEL_LOGIN_EMAIL",
        "PANEL_LOGIN_PASSWORD",
        "VERSUM_LOGIN_EMAIL",
        "VERSUM_LOGIN_PASSWORD",
    ]) {
        const line = text.split(/\r?\n/).find((s) =>
            new RegExp("^\\s*" + name + "=").test(s),
        );
        assert.ok(line, "Missing " + name + " audit input");
        assert.match(
            line,
            new RegExp(
                "^\\s*" +
                    name +
                    '="\\$\\{' +
                    name +
                    ':\\?[^"]+\\}"\\s*\\\\\\s*$',
            ),
            name + " must reference a private required shell variable",
        );
    }
});
