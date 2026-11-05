import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const generator = fileURLToPath(new URL("./frontend-release-metadata.mjs", import.meta.url));
const sha = "a".repeat(40);

function generate(name, environment) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "salonbw-release-"));
    try {
        fs.mkdirSync(path.join(root, ".next"));
        fs.mkdirSync(path.join(root, "public"));
        fs.writeFileSync(path.join(root, ".next", "BUILD_ID"), "fixture-build");
        fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ name }));
        fs.writeFileSync(path.join(root, "public", "__release.json"), '{"old":true}');
        execFileSync(process.execPath, [generator, root], {
            env: {
                ...process.env,
                APP_RELEASE: sha,
                FRONTEND_ENVIRONMENT: environment,
                UPSTREAM_API: "https://dev-api.salon-bw.pl",
            },
        });
        const pub = path.join(root, "public", "__release.json");
        const priv = path.join(root, ".next", "__release.private.json");
        return {
            publicExists: fs.existsSync(pub),
            privateExists: fs.existsSync(priv),
            metadata: JSON.parse(fs.readFileSync(fs.existsSync(priv) ? priv : pub, "utf8")),
            privateMode: fs.existsSync(priv) ? (fs.statSync(priv).mode & 0o777) : null,
        };
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
}

test("DEV Landing release metadata is private and not an nginx static asset", () => {
    const result = generate("@salonbw/landing", "development");
    assert.equal(result.publicExists, false);
    assert.equal(result.privateExists, true);
    assert.equal(result.privateMode, 0o600);
    assert.deepEqual(result.metadata, {
        sha,
        environment: "development",
        api: "https://dev-api.salon-bw.pl",
        buildId: "fixture-build",
    });
});

test("DEV Panel metadata contract is unchanged", () => {
    const result = generate("@salonbw/panel", "development");
    assert.equal(result.publicExists, true);
    assert.equal(result.privateExists, false);
});

test("PROD Landing metadata contract is unchanged", () => {
    const result = generate("@salonbw/landing", "production");
    assert.equal(result.publicExists, true);
    assert.equal(result.privateExists, false);
});
