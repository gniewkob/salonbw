import test from "node:test";
import assert from "node:assert/strict";
import { buildApiEnvironment } from "./write-api-env.mjs";
const source = {
    DEPLOY_ENV: "staging",
    APP_RELEASE: "a".repeat(40),
    DB_USER: "production_user",
    DB_PASS: "production_fixture",
    DB_NAME: "production_db",
    DB_URL_SECRET:
        "postgresql://production_user:production_fixture@localhost/production_db",
    JWT_SECRET: "p".repeat(64),
    JWT_REFRESH_SECRET: "q".repeat(64),
    DEV_DB_USER: "isolated_user",
    DEV_DB_PASS: "development_fixture",
    DEV_DB_HOST: "localhost",
    DEV_DB_NAME: "isolated_db",
    DEV_JWT_SECRET: "a".repeat(64),
    DEV_JWT_REFRESH_SECRET: "b".repeat(64),
    DEV_ACCESS_USER: "fixture-user",
    DEV_ACCESS_PASSWORD: "fixture-password",
};
test("development does not inherit production database, signing secrets or cookies", () => {
    const text = buildApiEnvironment(source);
    assert(!text.includes("production_fixture"));
    assert(!text.includes("production_user"));
    assert(!text.includes("p".repeat(64)));
    assert(text.includes("dev_access") === false);
    assert(text.includes('AUTH_COOKIE_PREFIX="dev_"'));
    assert(text.includes('OUTBOUND_DELIVERY_ENABLED="false"'));
    assert(text.includes('PGDATABASE="isolated_db"'));
});
test("missing development secrets and shared credentials fail closed", () => {
    assert.throws(() => buildApiEnvironment({ ...source, DEV_DB_PASS: "" }));
    assert.throws(() =>
        buildApiEnvironment({ ...source, DEV_DB_NAME: source.DB_NAME }),
    );
    assert.throws(() =>
        buildApiEnvironment({ ...source, DEV_JWT_SECRET: source.JWT_SECRET }),
    );
    assert.throws(() =>
        buildApiEnvironment({ ...source, DEPLOY_ENV: "unknown" }),
    );
});
test("production preserves its intended database and parent-domain auth configuration", () => {
    const text = buildApiEnvironment({
        ...source,
        DEPLOY_ENV: "production",
        COOKIE_DOMAIN: "salon-bw.pl",
        FRONTEND_URL: "https://panel.salon-bw.pl,https://salon-bw.pl",
    });
    assert(text.includes("production_fixture"));
    assert(!text.includes("development_fixture"));
    assert(text.includes('AUTH_COOKIE_PREFIX=""'));
    assert(!text.includes("OUTBOUND_DELIVERY_ENABLED"));
});
