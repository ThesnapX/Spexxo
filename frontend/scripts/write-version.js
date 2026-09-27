// frontend/scripts/write-version.js
//
// Writes a version identifier to public/version.txt before each build.
//
// Priority of version sources:
//   1. VERCEL_GIT_COMMIT_SHA       (Vercel sets this during CI builds)
//   2. GIT_COMMIT_SHA              (custom CI)
//   3. VERCEL_DEPLOYMENT_ID        (fallback Vercel identifier)
//   4. Timestamp + random          (local dev / unknown CI)
//
// The value must change on EVERY deployment. A bare timestamp is
// not enough because two deploys within the same second would collide;
// we append a random suffix.

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const version =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GIT_COMMIT_SHA ||
  process.env.VERCEL_DEPLOYMENT_ID ||
  `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

const publicDir = path.join(__dirname, "..", "public");
const target = path.join(publicDir, "version.txt");

try {
  // Ensure directory exists (safety for fresh clones).
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(target, version, "utf-8");
  console.log(`[version] wrote ${target} → ${version}`);
} catch (e) {
  console.error("[version] write failed:", e.message);
  // Do NOT exit 1 — a missing version.txt is degraded but not fatal.
}
