// frontend/scripts/write-version.js
//
// Writes a version identifier to public/version.txt before each build.
// Vercel exposes VERCEL_GIT_COMMIT_SHA during builds.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const version =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GIT_COMMIT_SHA ||
  Date.now().toString();

const target = path.join(__dirname, "..", "public", "version.txt");

try {
  fs.writeFileSync(target, version, "utf-8");
  console.log(`[version] wrote ${target} → ${version}`);
} catch (e) {
  console.error("[version] write failed:", e.message);
}
