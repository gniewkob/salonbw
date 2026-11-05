import test from "node:test";
import assert from "node:assert/strict";
import { checkApplication, checkAnonymousDevPanel } from "./warmup-app.mjs";
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

test("anonymous DEV panel login works while Studio V18 still requires app login", async () => {
    const calls = [];
    const request = async (url, init) => {
        const path = new URL(url).pathname;
        calls.push(path);
        assert.deepEqual(init.headers, {});
        assert.equal(init.redirect, "manual");
        if (path === "/auth/login") return new Response("Login", { status: 200 });
        if (path === "/studio-v18")
            return new Response(null, {
                status: 307,
                headers: { location: "/auth/login?redirectTo=%2Fstudio-v18" },
            });
        throw new Error("unexpected URL");
    };
    assert.deepEqual(
        await checkAnonymousDevPanel("https://dev-panel.salon-bw.pl/", request),
        { login: 200, preview: 307 },
    );
    assert.deepEqual(calls, ["/auth/login", "/studio-v18"]);
});

test("rejects a remaining Basic challenge or anonymous access to the panel", async () => {
    const denied = async () =>
        new Response("Basic required", {
            status: 401,
            headers: { "www-authenticate": 'Basic realm="SalonBW development"' },
        });
    await assert.rejects(
        checkAnonymousDevPanel("https://dev-panel.salon-bw.pl/", denied),
        /Basic gateway/,
    );

    const exposed = async (url) => {
        if (new URL(url).pathname === "/auth/login")
            return new Response("Login", { status: 200 });
        return new Response("Dashboard", { status: 200 });
    };
    await assert.rejects(
        checkAnonymousDevPanel("https://dev-panel.salon-bw.pl/", exposed),
        /must redirect/,
    );

    await assert.rejects(
        checkAnonymousDevPanel("https://panel.salon-bw.pl/", denied),
        /exact DEV panel host/,
    );
});

test("rejects redirects to non-login routes and Basic on preview only", async () => {
    const wrongRedirect = async (url) => {
        if (new URL(url).pathname === "/auth/login")
            return new Response("Login", { status: 200 });
        return new Response(null, {
            status: 307,
            headers: { location: "/dashboard" },
        });
    };
    await assert.rejects(
        checkAnonymousDevPanel(
            "https://dev-panel.salon-bw.pl/",
            wrongRedirect,
        ),
        /did not redirect/,
    );
    const previewBasic = async (url) => {
        if (new URL(url).pathname === "/auth/login")
            return new Response("Login", { status: 200 });
        return new Response(null, {
            status: 401,
            headers: { "www-authenticate": "Basic" },
        });
    };
    await assert.rejects(
        checkAnonymousDevPanel(
            "https://dev-panel.salon-bw.pl/",
            previewBasic,
        ),
        /Basic gateway/,
    );
});
