import test from "node:test";
import assert from "node:assert/strict";
import {
    selectDeploymentChannel,
    inspectGitHubActions,
} from "./deployment-channel.mjs";

const billingText =
    "The job was not started because your account is locked due to a billing issue.";

function failedJob(overrides = {}) {
    return {
        id: 131859282980,
        name: "Secret Scan (Gitleaks)",
        status: "completed",
        conclusion: "failure",
        runner_id: 0,
        steps: [],
        ...overrides,
    };
}

test("routes only verified account billing lock to MyDevil", () => {
    const outcome = selectDeploymentChannel({
        run: { id: 43417583215, status: "completed", conclusion: "failure" },
        jobs: [failedJob()],
        annotations: {
            131859282980: [
                { annotation_level: "failure", message: billingText },
                { annotation_level: "notice", message: "Ubuntu 26 migration" },
            ],
        },
    });
    assert.equal(outcome.channel, "mydevil");
    assert.equal(outcome.reason, "GITHUB_ACTIONS_ACCOUNT_BILLING_LOCK");
    assert.equal(outcome.jobId, 131859282980);
});

test("genuine failing security check stays on Actions: never bypass tests", () => {
    const outcome = selectDeploymentChannel({
        run: { id: 1, status: "completed", conclusion: "failure" },
        jobs: [failedJob({ runner_id: 42, steps: [{ name: "Gitleaks" }] })],
        annotations: {},
    });
    assert.equal(outcome.channel, "actions");
    assert.equal(outcome.reason, "RUNNER_AVAILABLE_CI_STATUS_NOT_BYPASSED");
});

test("successful CI with a provisioned runner selects Actions", () => {
    const outcome = selectDeploymentChannel({
        run: { id: 2, status: "completed", conclusion: "success" },
        jobs: [
            failedJob({
                conclusion: "success",
                runner_id: 55,
                steps: [{ name: "Checkout" }],
            }),
        ],
        annotations: {},
    });
    assert.equal(outcome.channel, "actions");
});

test("job failed before runner for another cause stays blocked", () => {
    const outcome = selectDeploymentChannel({
        run: { id: 3, status: "completed", conclusion: "failure" },
        jobs: [failedJob()],
        annotations: {
            131859282980: [
                { annotation_level: "failure", message: "Unsupported runner label" },
            ],
        },
    });
    assert.equal(outcome.channel, "blocked");
});

test("queued/no-runner workflow is not evidence of a billing lock", () => {
    assert.equal(
        selectDeploymentChannel({
            run: { id: 4, status: "queued", conclusion: null },
            jobs: [],
        }).channel,
        "blocked",
    );
});

test("missing CI evidence stays blocked", () => {
    assert.equal(selectDeploymentChannel({ run: null }).channel, "blocked");
});

test("GitHub API adapter reads exact failure annotation", () => {
    const requests = [];
    const get = (path) => {
        requests.push(path);
        if (path.endsWith("/actions/runs?per_page=30")) {
            return {
                workflow_runs: [
                    { id: 43417583215, name: "CI", status: "completed", conclusion: "failure" },
                ],
            };
        }
        if (path.includes("/jobs?")) return { jobs: [failedJob()] };
        if (path.includes("/annotations?")) return [{ message: billingText }];
        throw new Error("Unexpected endpoint: " + path);
    };
    const result = inspectGitHubActions(get);
    assert.equal(result.channel, "mydevil");
    assert.equal(requests.length, 3);
});

test("does not fetch annotations for a completed, executed CI run", () => {
    let requests = 0;
    const result = inspectGitHubActions((path) => {
        requests += 1;
        if (path.includes("?per_page=30")) {
            return {
                workflow_runs: [
                    { id: 50, name: "CI", status: "completed", conclusion: "failure" },
                ],
            };
        }
        return { jobs: [failedJob({ runner_id: 55, steps: [{ name: "Run test" }] })] };
    });
    assert.equal(result.channel, "actions");
    assert.equal(requests, 2);
});
