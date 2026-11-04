import { pathToFileURL } from "node:url";

/**
 * Prove the DEV panel's temporary review window is accessible without HTTP
 * Basic. The normal application login and session protection must remain.
 * No credentials are supplied to either request or included in diagnostics.
 */
export async function checkAnonymousDevPanel(url, request = fetch) {
    const origin = new URL(url);
    if (
        origin.protocol !== "https:" ||
        origin.hostname !== "dev-panel.salon-bw.pl"
    )
        throw new Error("Anonymous probe requires the exact DEV panel host");

    const init = {
        headers: {},
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
    };
    const login = await request(new URL("/auth/login", origin), init);
    if (
        login.status === 401 ||
        /basic/i.test(login.headers.get("www-authenticate") || "")
    )
        throw new Error("DEV panel login still requires the Basic gateway");
    if (login.status !== 200)
        throw new Error("DEV panel login is not accessible: HTTP " + login.status);

    const preview = await request(new URL("/studio-v18", origin), init);
    if (
        preview.status === 401 ||
        /basic/i.test(preview.headers.get("www-authenticate") || "")
    )
        throw new Error("DEV preview still requires the Basic gateway");
    if (![302, 303, 307, 308].includes(preview.status))
        throw new Error(
            "Anonymous Studio V18 must redirect to application login: HTTP " +
                preview.status,
        );
    const location = preview.headers.get("location");
    if (
        !location ||
        new URL(location, origin).pathname !== "/auth/login"
    )
        throw new Error("Anonymous Studio V18 did not redirect to app login");
    return { login: login.status, preview: preview.status };
}

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
    // Only the staging panel preview must permit an anonymous login page.
    // This catches a Basic prompt that authenticated warm-up would miss.
    const current = Date.now();
    if (
        environment === "development" &&
        new URL(url).hostname === "dev-panel.salon-bw.pl" &&
        current >= Date.parse("2026-11-04T17:15:00Z") &&
        current < Date.parse("2026-11-11T17:15:00Z")
    ) {
        await checkAnonymousDevPanel(url, request);
    }
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
