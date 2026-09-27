// frontend/src/utils/versionCheck.js
//
// Stale-deployment detection + chunk-load-error recovery.
//
// Design:
//   - "Installed version" is what the user is currently running.
//   - "Attempted recovery version" is tracked separately from the
//     installed version, so a reload that didn't help can retry.
//   - Bounded: at most ONE recovery attempt per browser session per
//     target version. No infinite loops.
//
// Failure modes handled:
//   - Failed dynamic imports
//   - ChunkLoadError
//   - "expected JS module but got text/html" (MIME)
//   - generic module-load failure messages

const INSTALLED_VERSION_KEY = "spexxo_app_version"; // what we believe we're running
const ATTEMPTED_RECOVERY_KEY = "spexxo_recovery_attempted_for"; // version we already tried to reload to
const RECOVERY_TS_KEY = "spexxo_recovery_ts"; // last reload timestamp

// Patterns that unambiguously indicate a failed module/chunk load.
const STALE_CHUNK_PATTERNS = [
  "Failed to fetch dynamically imported module",
  "Importing a module script failed",
  'MIME type of "text/html"',
  "Loading chunk",
  "Loading CSS chunk",
  "error loading dynamically imported module",
  "Expected a JavaScript-or-Wasm module script",
  "ChunkLoadError",
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
    // Guard: index.html is large; a valid version file is short.
    if (!trimmed || trimmed.length > 200) return null;
    return trimmed;
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────
// Boot-time version check
// ─────────────────────────────────────────────
export const checkVersionAndReload = async () => {
  // If a recovery is already in flight this session, do nothing at boot.
  const attemptedFor = sessionStorage.getItem(ATTEMPTED_RECOVERY_KEY);

  const serverVersion = await fetchCurrentVersion();
  if (!serverVersion) return; // network issue → skip

  const installed = localStorage.getItem(INSTALLED_VERSION_KEY);

  // First-ever visit → record and continue.
  if (!installed) {
    localStorage.setItem(INSTALLED_VERSION_KEY, serverVersion);
    return;
  }

  // Already on the latest → nothing to do.
  if (installed === serverVersion) {
    // Clear stale recovery bookkeeping — we are healthy.
    sessionStorage.removeItem(ATTEMPTED_RECOVERY_KEY);
    sessionStorage.removeItem(RECOVERY_TS_KEY);
    return;
  }

  // Deployment mismatch detected.
  if (attemptedFor === serverVersion) {
    // We already tried to reload for this exact newer version and
    // something still isn't right. Accept the newer version and stop.
    // Do NOT loop.
    localStorage.setItem(INSTALLED_VERSION_KEY, serverVersion);
    return;
  }

  // Mark the attempt BEFORE reloading so a second failure cannot loop.
  sessionStorage.setItem(ATTEMPTED_RECOVERY_KEY, serverVersion);
  sessionStorage.setItem(RECOVERY_TS_KEY, String(Date.now()));
  localStorage.setItem(INSTALLED_VERSION_KEY, serverVersion);
  window.location.reload();
};

// ─────────────────────────────────────────────
// Chunk-error handler
// ─────────────────────────────────────────────
export const installChunkErrorHandler = () => {
  if (typeof window === "undefined") return;

  let handling = false;

  const handle = async (message) => {
    if (handling) return;
    if (!isStaleChunkError(message)) return;
    handling = true;

    try {
      const serverVersion = await fetchCurrentVersion();
      if (!serverVersion) {
        handling = false;
        return;
      }

      const attemptedFor = sessionStorage.getItem(ATTEMPTED_RECOVERY_KEY);

      // If we already attempted recovery for THIS version in this
      // session, do not loop. Fall through to a normal error.
      if (attemptedFor === serverVersion) {
        console.warn(
          "[versionCheck] Recovery already attempted for this deployment.",
        );
        handling = false;
        return;
      }

      // Bound recovery attempts: at most one per 60 seconds per session.
      const lastTs = Number(sessionStorage.getItem(RECOVERY_TS_KEY) || 0);
      if (lastTs && Date.now() - lastTs < 60_000) {
        handling = false;
        return;
      }

      sessionStorage.setItem(ATTEMPTED_RECOVERY_KEY, serverVersion);
      sessionStorage.setItem(RECOVERY_TS_KEY, String(Date.now()));
      localStorage.setItem(INSTALLED_VERSION_KEY, serverVersion);
      console.warn("[versionCheck] Stale chunk — reloading once.");
      window.location.reload();
    } catch {
      handling = false;
    }
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
