import fs from "node:fs";
import path from "node:path";

const root = process.argv[2];
const env = process.env;
if (
    !root ||
    !/^[a-f0-9]{40}$/.test(env.APP_RELEASE || "") ||
    !["production", "development"].includes(env.FRONTEND_ENVIRONMENT)
) {
    throw new Error("Explicit frontend release required");
}

const buildId = fs
    .readFileSync(path.join(root, ".next", "BUILD_ID"), "utf8")
    .trim();
const metadata = {
    sha: env.APP_RELEASE,
    environment: env.FRONTEND_ENVIRONMENT,
    api: env.UPSTREAM_API,
    buildId,
};
const packageInfo = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
);
const publicPath = path.join(root, "public", "__release.json");
const privatePath = path.join(root, ".next", "__release.private.json");

// nginx may serve files from public/ before Next middleware runs, bypassing
// DEV Basic Auth. Only Landing DEV needs a guarded dynamic endpoint.
// Production and the Panel retain their previous metadata contract.
if (
    env.FRONTEND_ENVIRONMENT === "development" &&
    packageInfo.name === "@salonbw/landing"
) {
    fs.writeFileSync(privatePath, JSON.stringify(metadata), { mode: 0o600 });
    fs.rmSync(publicPath, { force: true });
    console.log("DEV Landing release metadata staged outside public/");
} else {
    fs.writeFileSync(publicPath, JSON.stringify(metadata));
}
