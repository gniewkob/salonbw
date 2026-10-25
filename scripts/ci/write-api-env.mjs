import fs from "node:fs";
import { pathToFileURL } from "node:url";

export function buildApiEnvironment(env) {
    if (!["production", "staging"].includes(env.DEPLOY_ENV))
        throw new Error("Unknown API deployment environment");
    const development = env.DEPLOY_ENV === "staging";
    const requireValue = (name) => {
        if (!env[name])
            throw new Error("Missing required configuration: " + name);
        return env[name];
    };
    let databaseUrl;
    if (development) {
        for (const field of [
            "DEV_DB_USER",
            "DEV_DB_PASS",
            "DEV_DB_HOST",
            "DEV_DB_NAME",
            "DEV_JWT_SECRET",
            "DEV_JWT_REFRESH_SECRET",
            "DEV_ACCESS_USER",
            "DEV_ACCESS_PASSWORD",
        ])
            requireValue(field);
        if (
            env.DEV_DB_NAME === env.DB_NAME ||
            env.DEV_DB_USER === env.DB_USER ||
            env.DEV_JWT_SECRET === env.JWT_SECRET ||
            env.DEV_JWT_REFRESH_SECRET === env.JWT_REFRESH_SECRET
        )
            throw new Error("Development credentials must be independent");
        if (
            env.DEV_JWT_SECRET.length < 32 ||
            env.DEV_JWT_REFRESH_SECRET.length < 32 ||
            env.DEV_JWT_SECRET === env.DEV_JWT_REFRESH_SECRET
        )
            throw new Error("Invalid development signing configuration");
        databaseUrl = `postgresql://${encodeURIComponent(env.DEV_DB_USER)}:${encodeURIComponent(env.DEV_DB_PASS)}@${env.DEV_DB_HOST}:${env.DEV_DB_PORT || "5432"}/${encodeURIComponent(env.DEV_DB_NAME)}`;
    } else {
        databaseUrl =
            env.DB_URL_SECRET ||
            `postgresql://${encodeURIComponent(requireValue("DB_USER"))}:${encodeURIComponent(requireValue("DB_PASS"))}@${env.DB_HOST || "pgsql0.mydevil.net"}:${env.DB_PORT || "5432"}/${encodeURIComponent(requireValue("DB_NAME"))}`;
        requireValue("JWT_SECRET");
        requireValue("JWT_REFRESH_SECRET");
        requireValue("COOKIE_DOMAIN");
        requireValue("FRONTEND_URL");
    }
    const database = new URL(databaseUrl);
    if (
        database.protocol !== "postgresql:" &&
        database.protocol !== "postgres:"
    )
        throw new Error("Unexpected database protocol");
    const values = {
        NODE_ENV: "production",
        APP_ENV: development ? "development" : "production",
        APP_RELEASE: requireValue("APP_RELEASE"),
        DATABASE_URL: databaseUrl,
        JWT_SECRET: development ? env.DEV_JWT_SECRET : env.JWT_SECRET,
        JWT_REFRESH_SECRET: development
            ? env.DEV_JWT_REFRESH_SECRET
            : env.JWT_REFRESH_SECRET,
        AUTH_COOKIE_PREFIX: development ? "dev_" : "",
        COOKIE_DOMAIN: development
            ? "dev-panel.salon-bw.pl"
            : env.COOKIE_DOMAIN,
        FRONTEND_URL: development
            ? "https://dev.salon-bw.pl,https://dev-panel.salon-bw.pl"
            : env.FRONTEND_URL,
        POS_ENABLED: env.POS_ENABLED === "true" ? "true" : "false",
        PGHOST: database.hostname,
        PGPORT: database.port || "5432",
        PGUSER: decodeURIComponent(database.username),
        PGPASSWORD: decodeURIComponent(database.password),
        PGDATABASE: decodeURIComponent(database.pathname.slice(1)),
    };
    if (development)
        Object.assign(values, {
            DEV_DATABASE_NAME: env.DEV_DB_NAME,
            OUTBOUND_DELIVERY_ENABLED: "false",
            DEV_ACCESS_USER: env.DEV_ACCESS_USER,
            DEV_ACCESS_PASSWORD: env.DEV_ACCESS_PASSWORD,
            SMSAPI_ENABLED: "false",
        });
    if (!/^[a-f0-9]{40}$/.test(values.APP_RELEASE))
        throw new Error("Immutable API release SHA required");
    return (
        Object.entries(values)
            .map(([key, value]) => {
                if (typeof value !== "string" || /[\r\n\0]/.test(value))
                    throw new Error("Invalid configuration value: " + key);
                return key + "=" + JSON.stringify(value);
            })
            .join("\n") + "\n"
    );
}
if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    fs.writeFileSync(".env.production", buildApiEnvironment(process.env), {
        mode: 0o600,
    });
    fs.chmodSync(".env.production", 0o600);
}
