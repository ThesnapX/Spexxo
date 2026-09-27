// backend/utils/retryOnDuplicateKey.js
//
// Retries a Mongoose document save() when a duplicate-key error is
// caused by a sequential business ID (userId, productId, orderId, etc.).
//
// Rationale: counters are atomic, but a race is still possible if a
// counter got out of sync (e.g. after a data restore). Rather than
// returning a generic 500, we retry with a fresh ID.
//
// The caller MUST pass a function that regenerates the ID on the doc
// BEFORE each retry.

/**
 * @param {object} args
 * @param {() => Promise<mongoose.Document>} args.createFn
 *        Function that creates and saves the doc. Called again on retry.
 * @param {() => void} [args.onRetry]
 *        Called before each retry — use to regenerate IDs if needed.
 * @param {number} [args.maxAttempts=3]
 * @returns {Promise<mongoose.Document>}
 */
export const createWithDuplicateRetry = async ({
  createFn,
  onRetry,
  maxAttempts = 3,
}) => {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await createFn();
    } catch (err) {
      lastError = err;
      const isDuplicate = err && err.code === 11000;
      if (!isDuplicate) throw err;

      // Detect whether the duplicate is on a sequential business ID.
      const keyPattern = err.keyPattern || {};
      const isSequentialIdDup =
        keyPattern.userId ||
        keyPattern.productId ||
        keyPattern.orderId ||
        keyPattern.orderNumber ||
        keyPattern.categoryId ||
        keyPattern.cartId ||
        keyPattern.couponId ||
        keyPattern.reviewId ||
        keyPattern.blogId;

      if (!isSequentialIdDup) {
        // A real uniqueness violation (email, phone, slug) — do not retry.
        throw err;
      }

      console.warn(
        `[ID-RETRY] Attempt ${attempt}/${maxAttempts} hit duplicate key on ${Object.keys(keyPattern).join(",")} — regenerating.`,
      );

      if (attempt === maxAttempts) {
        throw err;
      }

      if (typeof onRetry === "function") {
        onRetry();
      }

      // Small backoff to allow the winner to commit.
      await new Promise((r) => setTimeout(r, 25 * attempt));
    }
  }
  throw lastError;
};

export default createWithDuplicateRetry;
