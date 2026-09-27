// frontend/src/utils/versionCheck.js
//
// Stale-deployment detection + chunk-load-error recovery.
//
// Responsibilities:
//   1. Fetch /version.txt on boot; if the deployed version changed,
//      hard-reload once.
//   2. Listen for chunk-load / dynamic-import errors and reload once
//      IF the server version differs.
//   3. Never loop. Track the deployment ID that caused the reload in
//      sessionStorage.
//
// IMPORTANT: This does NOT catch generic JS errors, only errors that
// are known to indicate a stale-chunk / MIME / failed-module-load
// condition. Genuine application errors must still surface normally.

const VERSION_STORAGE_KEY = "spexxo_app_version";
const RECOVERY_FLAG_KEY = "spexxo_recovery_in_progress";

// Patterns that unambiguously indicate a failed module/chunk load.
const STALE_CHUNK_PATTERNS = [
  "Failed to fetch dynamically imported module",
  "Importing a module script failed",
  'MIME type of "text/html"',
  "Loading chunk",
  "Loading CSS chunk",
  "error loading dynamically imported module",
  "Expected a JavaScript-or-Wasm module script",
];

const isStaleChunkError = (msg) => {
  if (!msg || typeof msg !== "string") return false;
  return STALE_CHUNK_PATTERNS.some((p) => msg.includes(p));
};

// ─────────────────────────────────────────────
// Version fetch — cache-busted, no-store
// ─────────────────────────────────────────────
const fetchCurrentVersion = async () => {
  try {
    const res = await fetch(`/version.txt?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const text = await res.text();
    const trimmed = text.trim();
    // Guard against accidentally serving index.html (which would be huge).
    if (!trimmed || trimmed.length > 200) return null;
    return trimmed;
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────
// Public API: run on app boot
// ─────────────────────────────────────────────
export const checkVersionAndReload = async () => {
  // If we already triggered a recovery reload in this tab, do nothing —
  // we've already handled the mismatch.
  const recoveryFlag = sessionStorage.getItem(RECOVERY_FLAG_KEY);

  const serverVersion = await fetchCurrentVersion();
  if (!serverVersion) return; // network issue → do nothing

  const lastVersion = localStorage.getItem(VERSION_STORAGE_KEY);

  if (lastVersion && lastVersion !== serverVersion) {
    // A new deployment exists. Reload ONCE.
    if (recoveryFlag === serverVersion) {
      // Already reloaded for this exact new version — do not loop.
      // Accept the new version and move on.
      localStorage.setItem(VERSION_STORAGE_KEY, serverVersion);
      sessionStorage.removeItem(RECOVERY_FLAG_KEY);
      return;
    }

    // Record the target version BEFORE reloading so a second pass
    // does not try again.
    sessionStorage.setItem(RECOVERY_FLAG_KEY, serverVersion);
    localStorage.setItem(VERSION_STORAGE_KEY, serverVersion);
    window.location.reload();
    return;
  }

  // Fresh install or already current — record it.
  localStorage.setItem(VERSION_STORAGE_KEY, serverVersion);
  sessionStorage.removeItem(RECOVERY_FLAG_KEY);
};

// ─────────────────────────────────────────────
// Public API: install chunk-error handlers
// ─────────────────────────────────────────────
export const installChunkErrorHandler = () => {
  if (typeof window === "undefined") return;

  let handling = false;

  const handle = async (message) => {
    if (handling) return;
    if (!isStaleChunkError(message)) return;

    handling = true;

    const serverVersion = await fetchCurrentVersion();
    const lastVersion = localStorage.getItem(VERSION_STORAGE_KEY);

    // Only reload if a genuinely newer deployment exists.
    const isNewerDeployment = serverVersion && serverVersion !== lastVersion;

    const alreadyTried = sessionStorage.getItem(RECOVERY_FLAG_KEY);

    if (!isNewerDeployment) {
      // No new deployment — this is a genuine error, not staleness.
      // Do NOT reload. Let the error propagate.
      console.warn(
        "[versionCheck] Chunk load failed but no new deployment detected. Not reloading.",
      );
      handling = false;
      return;
    }

    if (alreadyTried === serverVersion) {
      // Already attempted recovery for this exact new version.
      // Do not loop.
      console.warn(
        "[versionCheck] Recovery already attempted for this deployment.",
      );
      handling = false;
      return;
    }

    sessionStorage.setItem(RECOVERY_FLAG_KEY, serverVersion);
    localStorage.setItem(VERSION_STORAGE_KEY, serverVersion);
    console.warn("[versionCheck] Stale chunk detected — reloading once.");
    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    const msg =
      event?.error?.message ||
      event?.message ||
      (typeof event === "string" ? event : "");
    handle(msg);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason;
    const msg =
      (typeof reason === "string" ? reason : reason?.message) ||
      (typeof event === "string" ? event : "");
    handle(msg);
  });
};
