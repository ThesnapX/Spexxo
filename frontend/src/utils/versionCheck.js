// frontend/src/utils/versionCheck.js
//
// Detects when a new deployment has shipped and forces a hard reload
// so the browser fetches fresh chunk hashes.
//
// Why: Vite emits content-hashed chunk filenames. After a new deploy,
// old chunks are gone. A user with cached index.html will 404 on the
// old chunk and crash. This module prevents that.

const VERSION_STORAGE_KEY = "spexxo_app_version";

/**
 * Fetch a tiny version file that Vercel serves with no caching.
 * We use /version.txt so it's a plain static asset (has a dot → not
 * rewritten by the SPA rule).
 */
const fetchCurrentVersion = async () => {
  try {
    const res = await fetch(`/version.txt?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text.trim();
  } catch {
    return null;
  }
};

/**
 * If the version changed since the last visit, hard-reload the page.
 * Safe to call once on app boot.
 */
export const checkVersionAndReload = async () => {
  const serverVersion = await fetchCurrentVersion();
  if (!serverVersion) return; // network issue → do nothing

  const lastVersion = localStorage.getItem(VERSION_STORAGE_KEY);

  if (lastVersion && lastVersion !== serverVersion) {
    // New deploy → force a full reload
    localStorage.setItem(VERSION_STORAGE_KEY, serverVersion);
    // Only reload if we're not already in a reload loop
    const reloadKey = "spexxo_reload_in_progress";
    if (!sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, "1");
      window.location.reload();
    }
    return;
  }

  localStorage.setItem(VERSION_STORAGE_KEY, serverVersion);
  sessionStorage.removeItem("spexxo_reload_in_progress");
};

/**
 * Attach a listener that catches dynamic import errors (chunk 404s)
 * and reloads the page once.
 */
export const installChunkErrorHandler = () => {
  const handler = (event) => {
    const msg =
      event?.reason?.message ||
      event?.message ||
      (typeof event === "string" ? event : "");

    if (
      msg &&
      (msg.includes("Failed to fetch dynamically imported module") ||
        msg.includes('MIME type of "text/html"') ||
        msg.includes("Importing a module script failed"))
    ) {
      const reloadKey = "spexxo_chunk_reload";
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, "1");
        console.warn("[VersionCheck] Chunk load error — reloading once.");
        window.location.reload();
      }
    }
  };

  window.addEventListener("error", handler);
  window.addEventListener("unhandledrejection", handler);
};
