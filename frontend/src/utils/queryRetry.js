// frontend/src/utils/queryRetry.js

/**
 * Retry policy for TanStack Query.
 *
 *  - Never retry 4xx (client errors, auth failures, not found).
 *  - Retry 5xx up to 2 times with exponential backoff.
 *  - Retry network errors (no response) up to 3 times.
 *  - Never retry if the request was aborted.
 */
export const shouldRetryQuery = (failureCount, error) => {
  // Aborted requests should not retry.
  if (error?.name === "AbortError" || error?.code === "ERR_CANCELED") {
    return false;
  }

  const status = error?.response?.status;

  // No response → network error → retry up to 3 times.
  if (!status) {
    return failureCount < 3;
  }

  // 4xx → do not retry.
  if (status >= 400 && status < 500) {
    return false;
  }

  // 5xx → retry up to 2 times.
  return failureCount < 2;
};

export const retryDelay = (attemptIndex) =>
  Math.min(1000 * 2 ** attemptIndex, 10000);
