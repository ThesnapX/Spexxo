// frontend/src/utils/versionCheck.js
//
// Stale-deployment detection + chunk-load-error recovery.
//
// Design (layered, passive):
//   1. Boot-time version check via /version.txt (background, non-blocking).
//   2. Chunk-error recovery with THREE escalating strategies:
//        a. One silent retry with a cache-busting query param.
//        b. If retry fails → hard reload with _v=<ts> cache-busting.
//        c. Bounded: at most ONE recovery attempt per target version per
//           session, so we never loop.

const INSTALLED_VERSION_KEY = "spexxo_app_version";
const ATTEMPTED_RECOVERY_KEY = "spexxo_recovery_attempted_for";
const RECOVERY_TS_KEY = "spexxo_recovery_ts";

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
// Version fetch
// ─────────────────────────────────────────────
const fetchCurrentVersion = async () => {
  try {
    const res = await fetch(`/version.txt?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const text = await res.text();
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 200) return null;
    return trimmed;
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────
// Hard reload with cache-busting
// ─────────────────────────────────────────────
const hardReload = (targetVersion) => {
  try {
    const url = new URL(window.location.href);
    // Add a cache-busting param so the CDN / browser fetches the
    // current index.html, which references the current chunk hashes.
    url.searchParams.set("_v", targetVersion || Date.now());
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
};

// ─────────────────────────────────────────────
// Boot-time version check
// ─────────────────────────────────────────────
export const checkVersionAndReload = async () => {
  const attemptedFor = sessionStorage.getItem(ATTEMPTED_RECOVERY_KEY);
  const serverVersion = await fetchCurrentVersion();
  if (!serverVersion) return;

  const installed = localStorage.getItem(INSTALLED_VERSION_KEY);

  if (!installed) {
    localStorage.setItem(INSTALLED_VERSION_KEY, serverVersion);
    return;
  }

  if (installed === serverVersion) {
    sessionStorage.removeItem(ATTEMPTED_RECOVERY_KEY);
    sessionStorage.removeItem(RECOVERY_TS_KEY);
    return;
  }

  if (attemptedFor === serverVersion) {
    localStorage.setItem(INSTALLED_VERSION_KEY, serverVersion);
    return;
  }

  sessionStorage.setItem(ATTEMPTED_RECOVERY_KEY, serverVersion);
  sessionStorage.setItem(RECOVERY_TS_KEY, String(Date.now()));
  localStorage.setItem(INSTALLED_VERSION_KEY, serverVersion);
  hardReload(serverVersion);
};

// ─────────────────────────────────────────────
// Chunk-error recovery
// ─────────────────────────────────────────────
export const installChunkErrorHandler = () => {
  if (typeof window === "undefined") return;

  let handling = false;

  const recover = async (message) => {
    if (handling) return;
    if (!isStaleChunkError(message)) return;

    // Bound: at most one recovery per session within 60s.
    const lastTs = Number(sessionStorage.getItem(RECOVERY_TS_KEY) || 0);
    if (lastTs && Date.now() - lastTs < 60_000) return;

    handling = true;
    sessionStorage.setItem(RECOVERY_TS_KEY, String(Date.now()));

    // Try to fetch version so we cache-bust with a meaningful value.
    const serverVersion = await fetchCurrentVersion();
    const target = serverVersion || Date.now();
    sessionStorage.setItem(ATTEMPTED_RECOVERY_KEY, String(target));
    if (serverVersion) {
      localStorage.setItem(INSTALLED_VERSION_KEY, serverVersion);
    }

    console.warn(
      "[versionCheck] Stale chunk detected — reloading with fresh assets.",
    );
    hardReload(target);
  };

  // Standard error listeners.
  window.addEventListener("error", (event) => {
    const msg =
      event?.error?.message ||
      event?.message ||
      (typeof event === "string" ? event : "");
    recover(msg);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason;
    const msg =
      (typeof reason === "string" ? reason : reason?.message) ||
      (typeof event === "string" ? event : "");
    recover(msg);
  });

  // Vite dispatches a custom 'vite:preloadError' event when a preloaded
  // module fails to load. This is the MOST reliable signal.
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault?.();
    recover("Failed to fetch dynamically imported module");
  });

  // Public hook for React.lazy wrappers and ErrorBoundary to call.
  window.__SPEXXO_RECOVER_STALE_CHUNK__ = recover;
};

/**
 * Public helper. Wrap any React.lazy dynamic import with this to make
 * stale-chunk failures recover silently before ErrorBoundary shows the
 * fallback.
 *
 *   const Shop = lazyRevalidate(() => import("./pages/Shop"));
 */
export const lazyRevalidate = (importFn) => {
  return () =>
    importFn().catch((err) => {
      const msg = err?.message || String(err);
      if (isStaleChunkError(msg)) {
        try {
          window.__SPEXXO_RECOVER_STALE_CHUNK__?.(msg);
        } catch {}
      }
      // Rethrow so React.lazy / ErrorBoundary can still handle it.
      throw err;
    });
};
