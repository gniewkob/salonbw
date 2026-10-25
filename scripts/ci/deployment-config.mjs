import fs from "node:fs";
import { pathToFileURL } from "node:url";

const applications = {
    production: {
        landing: ["salon-bw.pl", "apps/nodejs/salonbw_prod"],
        panel: ["panel.salon-bw.pl", "apps/nodejs/panelbw"],
        api: ["api.salon-bw.pl", "apps/nodejs/api_salonbw"],
    },
    staging: {
        landing: ["dev.salon-bw.pl", "apps/nodejs/salonbw"],
        panel: ["dev-panel.salon-bw.pl", "apps/nodejs/panelbw_dev"],
        api: ["dev-api.salon-bw.pl", "apps/nodejs/api_salonbw_dev"],
    },
};

/** Only verified application roots are deployment destinations; never infer a fallback. */
export function resolveDeployment({
    environment,
    target = "",
    event = "workflow_dispatch",
    changes = {},
    remotePath = "",
    appName = "",
    apiUrl = "",
    prepareOnly = false,
}) {
    const map = applications[environment];
    if (!map) throw new Error("Unknown deployment environment");
    const aliases = { public: "landing", dashboard: "panel", admin: "panel" };
    target = aliases[target] ?? target;
    if (
        !["landing", "panel", "api", "all", "frontends", "probe", ""].includes(
            target,
        )
    )
        throw new Error("Unknown deployment target");
    if (prepareOnly && !(environment === "production" && target === "landing"))
        throw new Error("Prepare-only supports the canonical landing only");
    if (remotePath || appName) {
        if (!["landing", "panel", "api"].includes(target))
            throw new Error("Overrides require one explicit target");
        const path = remotePath
            .replace(/^\/usr\/home\/vetternkraft\//, "")
            .replace(/\/$/, "");
        if (
            (remotePath && path !== map[target][1]) ||
            (appName && appName !== map[target][0])
        )
            throw new Error("Override differs from the verified environment");
    }
    const proxy = "https://" + map.api[0];
    if (apiUrl && ![proxy, "/api"].includes(apiUrl))
        throw new Error("API override differs from the verified environment");
    const enabled = (key) =>
        String(
            event === "push"
                ? changes[key] === "true"
                : target === "all" ||
                      target === key ||
                      (target === "frontends" && key !== "api"),
        );
    return {
        remote_path_public: map.landing[1],
        app_name_public: map.landing[0],
        remote_path_panel: map.panel[1],
        app_name_panel: map.panel[0],
        remote_path_api: map.api[1],
        app_name_api: map.api[0],
        deploy_landing: enabled("landing"),
        deploy_panel: enabled("panel"),
        deploy_api: enabled("api"),
        api_url: "/api",
        proxy_url: proxy,
        landing_url: "https://" + map.landing[0],
        panel_url: "https://" + map.panel[0],
        frontend_environment:
            environment === "staging" ? "development" : "production",
        auth_cookie_prefix: environment === "staging" ? "dev_" : "",
        prepare_only: String(prepareOnly),
    };
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const config = resolveDeployment({
        environment: process.env.DEPLOY_ENV,
        target: process.env.DEPLOY_TARGET,
        event: process.env.EVENT_NAME,
        changes: {
            landing: process.env.CHANGED_LANDING,
            panel: process.env.CHANGED_PANEL,
            api: process.env.CHANGED_API,
        },
        remotePath: process.env.INPUT_REMOTE_PATH,
        appName: process.env.INPUT_APP_NAME,
        apiUrl: process.env.INPUT_API_URL,
        prepareOnly: process.env.PREPARE_ONLY === "true",
    });
    const output =
        Object.entries(config)
            .map(([key, value]) => `${key}=${value}`)
            .join("\n") + "\n";
    if (process.env.GITHUB_OUTPUT)
        fs.appendFileSync(process.env.GITHUB_OUTPUT, output);
    else process.stdout.write(JSON.stringify(config, null, 2) + "\n");
}
