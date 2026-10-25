import fs from "node:fs";
import path from "node:path";
const root = process.argv[2];
const env = process.env;
if (
    !root ||
    !/^[a-f0-9]{40}$/.test(env.APP_RELEASE || "") ||
    !["production", "development"].includes(env.FRONTEND_ENVIRONMENT)
)
    throw new Error("Explicit frontend release required");
const buildId = fs
    .readFileSync(path.join(root, ".next", "BUILD_ID"), "utf8")
    .trim();
fs.writeFileSync(
    path.join(root, "public", "__release.json"),
    JSON.stringify({
        sha: env.APP_RELEASE,
        environment: env.FRONTEND_ENVIRONMENT,
        api: env.UPSTREAM_API,
        buildId,
    }),
);
