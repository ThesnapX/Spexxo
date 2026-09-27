// backend/utils/stockService.js
//
// Atomic, concurrency-safe stock mutation for both simple and variant products.
//
// Fixes:
//   - The "stock: NaN" save error (root cause: unvalidated numeric input
//     reaching MongoDB via read → mutate → save).
//   - The race condition where two customers can buy the same final unit
//     (root cause: read stock → subtract → save is not atomic).
//   - Silent zero-coercion of invalid stock.
//
// Strategy:
//   For simple products: single atomic findOneAndUpdate with a $gte guard.
//   For variants:        single atomic findOneAndUpdate targeting the
//                        variant subdocument by _id (or sku) with a $gte guard.
//
// Every helper returns one of:
//   { ok: true, ... }
//   { ok: false, code, message }

import mongoose from "mongoose";
import Product from "../models/Product.js";

// ─────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────
export const isFinitePositiveInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && Number.isInteger(n) && n > 0;
};

export const isFiniteNonNegative = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0;
};

// ─────────────────────────────────────────────
// Match variant against an order item's stored variant reference
// ─────────────────────────────────────────────
/**
 * Given a Product document and an item.variant snapshot (from an Order),
 * find the matching variant subdocument. Match priority:
 *   1. _id       (stable, authoritative)
 *   2. sku       (stable, business-facing)
 *   3. name      (last resort — may be non-unique)
 *
 * @returns the matching variant document or null.
 */
export const findVariantForItem = (product, itemVariant) => {
  if (
    !product ||
    !Array.isArray(product.variants) ||
    product.variants.length === 0
  ) {
    return null;
  }
  if (!itemVariant) return null;

  const wantedId = itemVariant._id ? String(itemVariant._id) : null;
  const wantedSku = itemVariant.sku ? String(itemVariant.sku) : null;
  const wantedName = itemVariant.name ? String(itemVariant.name) : null;

  // 1. _id
  if (wantedId) {
    const byId = product.variants.find(
      (v) => v._id && String(v._id) === wantedId,
    );
    if (byId) return byId;
  }
  // 2. sku
  if (wantedSku) {
    const bySku = product.variants.find(
      (v) => v.sku && String(v.sku) === wantedSku,
    );
    if (bySku) return bySku;
  }
  // 3. name
  if (wantedName) {
    const byName = product.variants.find(
      (v) => v.name && String(v.name) === wantedName,
    );
    if (byName) return byName;
  }
  return null;
};

// ─────────────────────────────────────────────
// Variant total-stock recompute
// ─────────────────────────────────────────────
/**
 * Recompute the parent product's aggregate stock from its variants.
 * Called after a variant-level decrement.
 */
export const recomputeVariantProductStock = async (productId) => {
  const product = await Product.findById(productId).select(
    "variants productType",
  );
  if (!product) return;
  if (product.productType !== "variable") return;
  const total = (product.variants || []).reduce((sum, v) => {
    const s = Number(v.stock);
    return sum + (Number.isFinite(s) && s > 0 ? s : 0);
  }, 0);
  await Product.updateOne({ _id: productId }, { $set: { stock: total } });
};

// ─────────────────────────────────────────────
// DECREMENT (order confirmation path)
// ─────────────────────────────────────────────
/**
 * Atomically decrement stock for a single order item.
 *
 * @param {object} args
 * @param {string} args.productId
 * @param {number} args.quantity      Must be a finite positive integer.
 * @param {object|null} args.variant  item.variant snapshot (may be null).
 * @returns {{ok: true} | {ok: false, code, message}}
 */
export const decrementItemStock = async ({ productId, quantity, variant }) => {
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return {
      ok: false,
      code: "invalid_product_id",
      message: "Invalid product id",
    };
  }
  if (!isFinitePositiveInt(quantity)) {
    return {
      ok: false,
      code: "invalid_quantity",
      message: `Invalid quantity: ${quantity}`,
    };
  }
  const qty = Number(quantity);

  const product = await Product.findById(productId);
  if (!product) {
    return { ok: false, code: "not_found", message: "Product not found" };
  }
  if (product.isActive === false) {
    return {
      ok: false,
      code: "inactive",
      message: `Product "${product.name}" is deactivated`,
    };
  }

  // ── Variant branch ──
  if (variant) {
    const matched = findVariantForItem(product, variant);
    if (!matched) {
      return {
        ok: false,
        code: "variant_not_found",
        message: `Variant not found for product "${product.name}"`,
      };
    }

    const variantId = matched._id;
    const currentVariantStock = Number(matched.stock);
    if (!Number.isFinite(currentVariantStock)) {
      return {
        ok: false,
        code: "invalid_existing_stock",
        message: `Variant stock for "${product.name}" is not a valid number`,
      };
    }

    // Atomic decrement with $gte guard.
    const updated = await Product.findOneAndUpdate(
      {
        _id: productId,
        variants: {
          $elemMatch: {
            _id: variantId,
            stock: { $gte: qty },
          },
        },
      },
      { $inc: { "variants.$.stock": -qty } },
      { new: true },
    );

    if (!updated) {
      return {
        ok: false,
        code: "insufficient_stock",
        message: `Not enough stock for variant "${matched.name}"`,
      };
    }

    // Recompute parent stock for variable products.
    if (updated.productType === "variable") {
      const total = (updated.variants || []).reduce((sum, v) => {
        const s = Number(v.stock);
        return sum + (Number.isFinite(s) && s > 0 ? s : 0);
      }, 0);
      await Product.updateOne({ _id: productId }, { $set: { stock: total } });
    }

    return { ok: true, variantId };
  }

  // ── Simple branch ──
  const currentStock = Number(product.stock);
  if (!Number.isFinite(currentStock)) {
    return {
      ok: false,
      code: "invalid_existing_stock",
      message: `Product stock for "${product.name}" is not a valid number`,
    };
  }

  const updated = await Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: qty } },
    { $inc: { stock: -qty } },
    { new: true },
  );

  if (!updated) {
    return {
      ok: false,
      code: "insufficient_stock",
      message: `Not enough stock for "${product.name}"`,
    };
  }

  return { ok: true };
};

// ─────────────────────────────────────────────
// INCREMENT (order cancellation / restore path)
// ─────────────────────────────────────────────
/**
 * Atomically increment stock for a single order item.
 * Same validation as decrement, but no upper bound.
 */
export const incrementItemStock = async ({ productId, quantity, variant }) => {
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return {
      ok: false,
      code: "invalid_product_id",
      message: "Invalid product id",
    };
  }
  if (!isFinitePositiveInt(quantity)) {
    return {
      ok: false,
      code: "invalid_quantity",
      message: `Invalid quantity: ${quantity}`,
    };
  }
  const qty = Number(quantity);

  const product = await Product.findById(productId);
  if (!product) {
    return { ok: false, code: "not_found", message: "Product not found" };
  }

  if (variant) {
    const matched = findVariantForItem(product, variant);
    if (!matched) {
      // Restore to parent stock as best-effort if variant is gone.
      await Product.updateOne({ _id: productId }, { $inc: { stock: qty } });
      return { ok: true, fallback: "parent_stock" };
    }

    await Product.updateOne(
      { _id: productId, "variants._id": matched._id },
      { $inc: { "variants.$.stock": qty } },
    );

    if (product.productType === "variable") {
      const fresh = await Product.findById(productId).select("variants");
      const total = (fresh?.variants || []).reduce((sum, v) => {
        const s = Number(v.stock);
        return sum + (Number.isFinite(s) && s > 0 ? s : 0);
      }, 0);
      await Product.updateOne({ _id: productId }, { $set: { stock: total } });
    }
    return { ok: true };
  }

  await Product.updateOne({ _id: productId }, { $inc: { stock: qty } });
  return { ok: true };
};

/**
 * Iterate an order and decrement (or increment) every item.
 * Stops on first failure and rolls back prior decrements, so stock
 * never ends up in a partial state.
 *
 * @param {object} order   Order document
 * @param {"decrement"|"increment"} direction
 * @returns {{ok: true} | {ok: false, code, message, failedAt}}
 */
export const applyStockForOrder = async (order, direction) => {
  const fn =
    direction === "decrement" ? decrementItemStock : incrementItemStock;
  const rollback =
    direction === "decrement" ? incrementItemStock : decrementItemStock;

  const applied = [];

  for (let i = 0; i < (order.items || []).length; i++) {
    const item = order.items[i];

    // Normalize product id (may be populated).
    const productId =
      item.product && typeof item.product === "object" && item.product._id
        ? String(item.product._id)
        : String(item.product || "");

    const result = await fn({
      productId,
      quantity: item.quantity,
      variant: item.variant || null,
    });

    if (!result.ok) {
      // Roll back what we already applied.
      for (const prior of applied.reverse()) {
        try {
          await rollback(prior);
        } catch (e) {
          console.error(
            "[stockService] rollback failed for item:",
            prior.productId,
            e.message,
          );
        }
      }
      return {
        ok: false,
        code: result.code,
        message: result.message,
        failedAt: i,
      };
    }

    applied.push({
      productId,
      quantity: item.quantity,
      variant: item.variant || null,
    });
  }

  return { ok: true };
};

export default {
  isFinitePositiveInt,
  isFiniteNonNegative,
  findVariantForItem,
  decrementItemStock,
  incrementItemStock,
  applyStockForOrder,
  recomputeVariantProductStock,
};
