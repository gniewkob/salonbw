#!/usr/bin/env node
// Read-only channel detector. GitHub Actions billing locks must never be
// confused with failing code tests or unavailable GitHub API responses.
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const REPOSITORY = "gniewkob/salonbw";
const BILLING_LOCK =
    /the job was not started because your account is locked due to a billing issue/i;

export function selectDeploymentChannel({ run, jobs = [], annotations = {} }) {
    if (!run) {
        return { channel: "blocked", reason: "NO_RECENT_CI_EVIDENCE" };
    }

    // A real job executed. Its failure is a code/security issue, not permission
    // to bypass the same quality gates through the manual channel.
    const executed = jobs.some(
        (job) => Number(job.runner_id) > 0 && (job.steps?.length ?? 0) > 0,
    );
    if (executed) {
        return {
            channel: "actions",
            reason:
                run.status === "completed" && run.conclusion === "success"
                    ? "RUNNER_AND_CI_SUCCESS"
                    : "RUNNER_AVAILABLE_CI_STATUS_NOT_BYPASSED",
            runId: run.id,
        };
    }

    const billingJob = jobs.find(
        (job) =>
            job.conclusion === "failure" &&
            Number(job.runner_id) === 0 &&
            (job.steps?.length ?? 0) === 0 &&
            (annotations[String(job.id)] ?? []).some((annotation) =>
                BILLING_LOCK.test(annotation.message ?? ""),
            ),
    );
    if (billingJob) {
        return {
            channel: "mydevil",
            reason: "GITHUB_ACTIONS_ACCOUNT_BILLING_LOCK",
            runId: run.id,
            jobId: billingJob.id,
        };
    }

    return {
        channel: "blocked",
        reason: "RUNNER_STATE_UNCONFIRMED",
        runId: run.id,
    };
}

function githubGet(resource) {
    return JSON.parse(
        execFileSync("gh", ["api", resource], {
            encoding: "utf8",
            timeout: 15000,
            maxBuffer: 4 * 1024 * 1024,
            stdio: ["ignore", "pipe", "pipe"],
        }),
    );
}

export function inspectGitHubActions(get = githubGet) {
    const workflows = get(
        "repos/" + REPOSITORY + "/actions/runs?per_page=30",
    );
    const latestCi = (workflows.workflow_runs ?? []).find(
        (run) => run.name === "CI",
    );
    if (!latestCi) return selectDeploymentChannel({ run: null });
    const jobs = get(
        "repos/" + REPOSITORY + "/actions/runs/" + latestCi.id + "/jobs?per_page=100",
    ).jobs ?? [];
    const annotations = {};
    for (const job of jobs) {
        if (
            job.conclusion !== "failure" ||
            Number(job.runner_id) !== 0 ||
            (job.steps?.length ?? 0) !== 0
        ) {
            continue;
        }
        annotations[String(job.id)] = get(
            "repos/" +
                REPOSITORY +
                "/check-runs/" +
                job.id +
                "/annotations?per_page=100",
        );
    }
    return selectDeploymentChannel({
        run: latestCi,
        jobs,
        annotations,
    });
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    try {
        const result = inspectGitHubActions();
        console.log(JSON.stringify(result));
        if (result.channel === "blocked") process.exitCode = 2;
    } catch {
        // Inability to read status is NOT evidence of a GitHub billing lock.
        console.error(
            JSON.stringify({
                channel: "blocked",
                reason: "GITHUB_STATUS_UNAVAILABLE",
            }),
        );
        process.exitCode = 2;
    }
}
