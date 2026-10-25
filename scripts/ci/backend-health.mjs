import { pathToFileURL } from "node:url";

export async function checkBackend(url, sha, request = fetch) {
    const response = await request(url, {
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
    });
    if (!response.ok || response.headers.get("x-salonbw-release") !== sha)
        throw new Error("Backend release is not ready");
    const data = await response.json();
    if (data.status !== "ok" || data.services?.database?.status !== "ok")
        throw new Error("Backend database is not ready");
    const services = Object.fromEntries(
        Object.entries(data.services || {}).map(([k, v]) => [
            k,
            ["ok", "error", "skipped"].includes(v.status)
                ? v.status
                : "unknown",
        ]),
    );
    return { status: "ok", release: sha, services };
}
if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    let passed = false;
    for (let attempt = 1; attempt <= 18; attempt++) {
        try {
            console.log(
                JSON.stringify(
                    await checkBackend(
                        process.env.APP_URL,
                        process.env.APP_RELEASE,
                    ),
                ),
            );
            passed = true;
            break;
        } catch {
            console.log(`Backend verification pending (${attempt}/18)`);
            if (attempt < 18) await new Promise((r) => setTimeout(r, 5000));
        }
    }
    if (!passed) process.exitCode = 1;
}
