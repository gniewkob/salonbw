import test from "node:test";
import assert from "node:assert/strict";
import { checkApplication } from "./warmup-app.mjs";
const sha = "a".repeat(40);
const metadata = {
    sha,
    environment: "development",
    api: "https://dev-api.salon-bw.pl",
    buildId: "fixture-build",
};
function fixtureRequest(metadataValue = metadata, rootStatus = 200) {
    return async (url, init) => {
        assert.equal(
            init.headers.Authorization,
            "Basic " +
                Buffer.from("fixture-user:fixture-password").toString("base64"),
        );
        if (new URL(url).pathname === "/__release.json")
            return new Response(JSON.stringify(metadataValue), { status: 200 });
        return new Response(
            '<script id="__NEXT_DATA__" type="application/json">{"buildId":"fixture-build"}</script>',
            { status: rootStatus },
        );
    };
}
const options = {
    url: "https://dev.salon-bw.pl",
    sha,
    environment: "development",
    api: "https://dev-api.salon-bw.pl",
    user: "fixture-user",
    password: "fixture-password",
};
test("verifies authenticated HTML, environment, upstream and running build", async () => {
    assert.deepEqual(await checkApplication(options, fixtureRequest()), {
        status: 200,
        buildId: "fixture-build",
        sha,
        environment: "development",
    });
});
test("rejects missing development credentials, wrong release or upstream", async () => {
    await assert.rejects(
        checkApplication({ ...options, password: "" }, fixtureRequest()),
    );
    await assert.rejects(
        checkApplication(
            options,
            fixtureRequest({ ...metadata, sha: "b".repeat(40) }),
        ),
    );
    await assert.rejects(
        checkApplication(
            options,
            fixtureRequest({ ...metadata, api: "https://api.salon-bw.pl" }),
        ),
    );
});
test("does not treat a protected error or a legacy homepage as deployment success", async () => {
    await assert.rejects(
        checkApplication(options, fixtureRequest(metadata, 401)),
    );
    await assert.rejects(
        checkApplication(
            options,
            async () => new Response("legacy", { status: 200 }),
        ),
    );
});
