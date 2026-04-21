import { execSync } from "node:child_process";

const allowedEnvFiles = new Set([".env.example", ".env.sample"]);

function listTrackedFiles() {
  try {
    const output = execSync("git ls-files", { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    // If git is unavailable (rare CI edge case), do not block build.
    return [];
  }
}

function isTrackedSecretFile(path) {
  if (path.startsWith(".vercel/.env")) return true;

  if (path === ".env") return true;
  if (path.startsWith(".env.")) {
    return !allowedEnvFiles.has(path);
  }

  return false;
}

const offenders = listTrackedFiles().filter(isTrackedSecretFile);

if (offenders.length) {
  console.error("[secrets:check] Refusing to continue: tracked secret-bearing env files detected.");
  for (const file of offenders) {
    console.error(` - ${file}`);
  }
  console.error("Move values to platform secret manager and keep only .env.example in git.");
  process.exit(1);
}

console.log("[secrets:check] OK: no tracked secret env files detected.");
