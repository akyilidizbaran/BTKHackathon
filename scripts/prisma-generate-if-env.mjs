import { spawnSync } from "node:child_process";

const placeholderUrl = "postgresql://postgres:postgres@localhost:5432/commercepilot";
const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || placeholderUrl,
  DIRECT_URL: process.env.DIRECT_URL || process.env.DATABASE_URL || placeholderUrl,
};

const result = spawnSync("prisma", ["generate"], {
  env,
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}
