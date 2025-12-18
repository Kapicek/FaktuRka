import { spawnSync } from "node:child_process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, "../..");
const composeFile = path.join(repoRoot, "docker-compose.e2e.yml");
const composeProjectName = process.env.E2E_COMPOSE_PROJECT ?? "fakturka-e2e";
const frontendWebDir = path.join(repoRoot, "frontend-web");

const API_READY_URL = process.env.E2E_API_READY_URL ?? "http://localhost:7010/swagger/index.html";
// Prefer explicit IPs over "localhost" to avoid IPv4/IPv6 resolution differences between Node/Cypress/OS.
const FE_URL_CANDIDATES = (process.env.E2E_FE_URLS ??
    "http://127.0.0.1:5173/,http://[::1]:5173/,http://localhost:5173/")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
const TIMEOUT_MS = Number(process.env.E2E_API_TIMEOUT_MS ?? 120_000);
const POLL_INTERVAL_MS = Number(process.env.E2E_API_POLL_INTERVAL_MS ?? 1_000);

function run(command, args, { allowFailure = false } = {}) {
    const result = spawnSync(command, args, {
        stdio: "inherit",
        cwd: repoRoot,
        env: process.env,
    });

    if (result.error) {
        if (allowFailure) return result;
        throw result.error;
    }

    if (result.status !== 0 && !allowFailure) {
        throw new Error(`Command failed (${result.status}): ${command} ${args.join(" ")}`);
    }

    return result;
}

async function waitForHttpOk(url, timeoutMs) {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        try {
            const response = await fetch(url, { method: "GET" });
            if (response.ok) return;
        } catch {
            // ignore and retry
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    throw new Error(`Timed out waiting for ${url} to become ready (timeout ${timeoutMs}ms).`);
}

async function waitForAnyHttpOk(urls, timeoutMs) {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        for (const url of urls) {
            try {
                const response = await fetch(url, { method: "GET" });
                if (response.ok) return url;
            } catch {
                // ignore and try next
            }
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    throw new Error(
        `Timed out waiting for FE to become ready (timeout ${timeoutMs}ms). Tried: ${urls.join(", ")}`,
    );
}

function resolveNpmBin() {
    return process.platform === "win32" ? "npm.cmd" : "npm";
}

function resolveCypressBin() {
    const binDir = path.join(repoRoot, "frontend-web", "node_modules", ".bin");
    const candidate = process.platform === "win32" ? "cypress.cmd" : "cypress";
    return path.join(binDir, candidate);
}

let exitCode = 0;
let viteProcess = null;

try {
    run("docker", ["compose", "-p", composeProjectName, "-f", composeFile, "up", "-d", "--build"]);
    await waitForHttpOk(API_READY_URL, TIMEOUT_MS);

    // Start FE dev server if not already running.
    try {
        await waitForAnyHttpOk(FE_URL_CANDIDATES, 2_000);
    } catch {
        const npmBin = resolveNpmBin();
        // Use host 0.0.0.0 to avoid IPv6-only binding issues (Cypress often resolves localhost to IPv4).
        viteProcess = spawn(npmBin, ["run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"], {
            cwd: frontendWebDir,
            stdio: "inherit",
            env: process.env,
        });

        await waitForAnyHttpOk(FE_URL_CANDIDATES, TIMEOUT_MS);
    }

    const feBaseUrl = (await waitForAnyHttpOk(FE_URL_CANDIDATES, 1)).replace(/\/$/, "");

    const cypressBin = resolveCypressBin();
    const cypressResult = run(
        cypressBin,
        [
            "run",
            "--project",
            frontendWebDir,
            "--config",
            `baseUrl=${feBaseUrl}`,
            "--env",
            "useRealApi=true",
        ],
        { allowFailure: true },
    );
    exitCode = cypressResult.status ?? 1;
} finally {
    if (viteProcess) {
        viteProcess.kill("SIGTERM");
    }
    run("docker", ["compose", "-p", composeProjectName, "-f", composeFile, "down", "-v"], { allowFailure: true });
}

process.exit(exitCode);
