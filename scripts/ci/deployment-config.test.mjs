import test from "node:test";
import assert from "node:assert/strict";
import { resolveDeployment } from "./deployment-config.mjs";

test("development selects separate applications and API without production fallback", () => {
    const c = resolveDeployment({ environment: "staging", target: "all" });
    assert.equal(c.app_name_api, "dev-api.salon-bw.pl");
    assert.equal(c.remote_path_api, "apps/nodejs/api_salonbw_dev");
    assert.equal(c.app_name_panel, "dev-panel.salon-bw.pl");
    assert.equal(c.proxy_url, "https://dev-api.salon-bw.pl");
    assert.equal(c.auth_cookie_prefix, "dev_");
});
test("production selects canonical landing and existing API/panel roots", () => {
    const c = resolveDeployment({ environment: "production", target: "all" });
    assert.equal(c.app_name_public, "salon-bw.pl");
    assert.equal(c.remote_path_public, "apps/nodejs/salonbw_prod");
    assert.equal(c.remote_path_panel, "apps/nodejs/panelbw");
    assert.equal(c.remote_path_api, "apps/nodejs/api_salonbw");
    assert.equal(c.auth_cookie_prefix, "");
});
test("cross-environment overrides and unknown environments are rejected", () => {
    assert.throws(() =>
        resolveDeployment({
            environment: "staging",
            target: "api",
            appName: "api.salon-bw.pl",
        }),
    );
    assert.throws(() =>
        resolveDeployment({
            environment: "staging",
            target: "panel",
            remotePath: "apps/nodejs/panelbw",
        }),
    );
    assert.throws(() =>
        resolveDeployment({
            environment: "staging",
            target: "landing",
            apiUrl: "https://api.salon-bw.pl",
        }),
    );
    assert.throws(() =>
        resolveDeployment({ environment: "unknown", target: "all" }),
    );
});
test("prepare-only means an unused canonical landing artifact, never an API migration", () => {
    assert.equal(
        resolveDeployment({
            environment: "production",
            target: "landing",
            prepareOnly: true,
        }).prepare_only,
        "true",
    );
    assert.throws(() =>
        resolveDeployment({
            environment: "production",
            target: "all",
            prepareOnly: true,
        }),
    );
    assert.throws(() =>
        resolveDeployment({
            environment: "staging",
            target: "landing",
            prepareOnly: true,
        }),
    );
});
test("push detection preserves selective deployment flags and target aliases", () => {
    const c = resolveDeployment({
        environment: "production",
        event: "push",
        changes: { panel: "true" },
    });
    assert.equal(c.deploy_panel, "true");
    assert.equal(c.deploy_landing, "false");
    assert.equal(c.deploy_api, "false");
    assert.equal(
        resolveDeployment({ environment: "staging", target: "dashboard" })
            .deploy_panel,
        "true",
    );
});

test("frontends never migrates or restarts the API", () => {
    const config = resolveDeployment({
        environment: "staging",
        target: "frontends",
    });
    assert.equal(config.deploy_api, "false");
    assert.equal(config.deploy_landing, "true");
    assert.equal(config.deploy_panel, "true");
});
