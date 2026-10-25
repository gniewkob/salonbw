import { pathToFileURL } from "node:url";

/** Verify the application actually serving HTML, not merely copied files or an old PHP response. */
export async function checkApplication(
    { url, sha, environment, api, user, password },
    request = fetch,
) {
    const headers = {};
    if (environment === "development") {
        if (!user || !password)
            throw new Error("Development access configuration missing");
        headers.Authorization =
            "Basic " + Buffer.from(user + ":" + password).toString("base64");
    }
    const init = {
        headers,
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
    };
    const response = await request(url, init);
    if (!response.ok) throw new Error("Application HTTP " + response.status);
    const html = await response.text();
    const release = await request(new URL("/__release.json", url), init);
    if (!release.ok) throw new Error("Release metadata unavailable");
    const data = await release.json();
    if (
        data.sha !== sha ||
        data.environment !== environment ||
        data.api !== api ||
        typeof data.buildId !== "string"
    )
        throw new Error("Release metadata mismatch");
    const embedded = html.match(
        /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i,
    );
    if (!embedded || JSON.parse(embedded[1]).buildId !== data.buildId)
        throw new Error("Running HTML build mismatch");
    return { status: response.status, buildId: data.buildId, sha, environment };
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const env = process.env;
    const attempts = Math.min(
        30,
        Math.max(1, Number(env.WARMUP_ATTEMPTS) || 18),
    );
    let success = false;
    for (let i = 1; i <= attempts; i++) {
        try {
            const result = await checkApplication({
                url: env.APP_URL,
                sha: env.APP_RELEASE,
                environment: env.FRONTEND_ENVIRONMENT,
                api: env.API_PROXY_URL,
                user: env.DEV_ACCESS_USER,
                password: env.DEV_ACCESS_PASSWORD,
            });
            console.log(JSON.stringify(result));
            success = true;
            break;
        } catch {
            console.log(
                `Application verification pending (${i}/${attempts}); no response body or credentials logged.`,
            );
            if (i < attempts)
                await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
    if (!success) {
        console.error("Application verification failed");
        process.exitCode = 1;
    }
}
