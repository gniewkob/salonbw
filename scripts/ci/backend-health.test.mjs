import test from "node:test";
import assert from "node:assert/strict";
import { checkBackend } from "./backend-health.mjs";
const sha = "a".repeat(40);
test("accepts the expected running release with a healthy database and projects diagnostics", async () => {
    const out = await checkBackend(
        "https://api.example.test/healthz",
        sha,
        async () =>
            new Response(
                JSON.stringify({
                    status: "ok",
                    services: {
                        database: {
                            status: "ok",
                            message: "PRIVATE_DIAGNOSTIC",
                        },
                        smtp: { status: "skipped" },
                    },
                }),
                { headers: { "x-salonbw-release": sha } },
            ),
    );
    assert(!JSON.stringify(out).includes("PRIVATE_DIAGNOSTIC"));
    assert.equal(out.release, sha);
});
test("rejects an old process and a failed database", async () => {
    await assert.rejects(
        checkBackend(
            "https://api.example.test/healthz",
            sha,
            async () => new Response("{}"),
        ),
    );
    await assert.rejects(
        checkBackend(
            "https://api.example.test/healthz",
            sha,
            async () =>
                new Response(
                    JSON.stringify({
                        status: "error",
                        services: { database: { status: "error" } },
                    }),
                    { headers: { "x-salonbw-release": sha } },
                ),
        ),
    );
});
