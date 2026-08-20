// backend/controllers/cartController.js

// backend/controllers/cartController.js

import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: "items.product",
      select:
        "name slug price comparePrice images stock isInStock brand isActive productType sku",
      populate: {
        path: "brand",
        select: "name slug",
      },
    });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Filter out items with null products and calculate prices dynamically
    const activeItems = cart.items.filter((item) => item.product !== null);

    // If there are items with null products (deleted), remove them
    if (activeItems.length !== cart.items.length) {
      cart.items = activeItems;
      await cart.save();
    }

    // Build response with proper data
    const itemsWithPrices = activeItems
      .map((item) => {
        const product = item.product;
        // If product is null or undefined, skip it
        if (!product) return null;

        const currentPrice = product.comparePrice || product.price || 0;

        // Ensure we have all required fields
        return {
          _id: item._id,
          product: {
            _id: product._id,
            name: product.name || "Product",
            slug: product.slug || "",
            price: product.price || 0,
            comparePrice: product.comparePrice || null,
            images: product.images || [],
            stock: product.stock || 0,
            isInStock: product.isInStock !== false,
            isActive: product.isActive !== false,
            brand: product.brand || null,
            productType: product.productType || "",
            sku: product.sku || "",
          },
          quantity: item.quantity || 1,
          variant: item.variant || null,
          price: currentPrice,
          subtotal: currentPrice * (item.quantity || 1),
        };
      })
      .filter((item) => item !== null);

    res.status(200).json({
      success: true,
      cart: {
        _id: cart._id,
        user: cart.user,
        items: itemsWithPrices,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, variant } = req.body;

    const product = await Product.findById(productId).populate(
      "brand",
      "name slug",
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if product is active
    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message:
          "This product is currently deactivated and cannot be added to cart",
      });
    }

    // Check stock - if variant is selected, check variant stock
    let stockToCheck = product.stock;
    if (variant) {
      const variantId = variant._id || variant.id;
      const foundVariant = product.variants?.find(
        (v) =>
          v._id?.toString() === variantId?.toString() ||
          v.name === variant.name ||
          v.sku === variant.sku,
      );
      if (foundVariant) {
        stockToCheck = foundVariant.stock || 0;
      }
    }

    if (stockToCheck < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${stockToCheck} items available in stock`,
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Find existing item with same product and variant
    const itemIndex = cart.items.findIndex((item) => {
      const isSameProduct = item.product.toString() === productId;
      if (!variant) return isSameProduct && !item.variant;

      const isSameVariant =
        item.variant?.sku === variant.sku ||
        item.variant?.name === variant.name ||
        (item.variant?._id &&
          variant._id &&
          item.variant._id.toString() === variant._id.toString());
      return isSameProduct && isSameVariant;
    });

    if (itemIndex > -1) {
      const newQuantity = cart.items[itemIndex].quantity + quantity;
      // Check stock again for new quantity
      if (newQuantity > stockToCheck) {
        return res.status(400).json({
          success: false,
          message: `Only ${stockToCheck} items available in stock`,
        });
      }
      cart.items[itemIndex].quantity = newQuantity;
      // Update variant if provided
      if (variant) {
        cart.items[itemIndex].variant = variant;
      }
    } else {
      cart.items.push({
        product: productId,
        quantity,
        variant: variant || null,
      });
    }

    await cart.save();

    // Re-populate the cart
    const populatedCart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select:
        "name slug price comparePrice images stock isInStock brand isActive productType sku",
      populate: {
        path: "brand",
        select: "name slug",
      },
    });

    // Calculate prices dynamically
    const itemsWithPrices = populatedCart.items
      .filter((item) => item.product !== null)
      .map((item) => {
        const product = item.product;
        if (!product) return null;
        const currentPrice = product.comparePrice || product.price || 0;
        return {
          ...(item.toObject ? item.toObject() : item),
          price: currentPrice,
          subtotal: currentPrice * item.quantity,
        };
      })
      .filter((item) => item !== null);

    res.status(200).json({
      success: true,
      cart: {
        ...populatedCart.toObject(),
        items: itemsWithPrices,
      },
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    // Check stock
    const product = await Product.findById(item.product);
    if (product) {
      let stockToCheck = product.stock;
      if (item.variant) {
        const variantId = item.variant._id || item.variant.id;
        const foundVariant = product.variants?.find(
          (v) =>
            v._id?.toString() === variantId?.toString() ||
            v.name === item.variant.name ||
            v.sku === item.variant.sku,
        );
        if (foundVariant) {
          stockToCheck = foundVariant.stock || 0;
        }
      }

      if (quantity > stockToCheck) {
        return res.status(400).json({
          success: false,
          message: `Only ${stockToCheck} items available in stock`,
        });
      }
    }

    item.quantity = quantity;
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select:
        "name slug price comparePrice images stock isInStock brand isActive productType sku",
      populate: {
        path: "brand",
        select: "name slug",
      },
    });

    const itemsWithPrices = populatedCart.items
      .filter((item) => item.product !== null)
      .map((item) => {
        const product = item.product;
        if (!product) return null;
        const currentPrice = product.comparePrice || product.price || 0;
        return {
          ...(item.toObject ? item.toObject() : item),
          price: currentPrice,
          subtotal: currentPrice * item.quantity,
        };
      })
      .filter((item) => item !== null);

    res.status(200).json({
      success: true,
      cart: {
        ...populatedCart.toObject(),
        items: itemsWithPrices,
      },
    });
  } catch (error) {
    console.error("Update cart error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
export const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item._id.toString() !== req.params.itemId,
    );
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select:
        "name slug price comparePrice images stock isInStock brand isActive productType sku",
      populate: {
        path: "brand",
        select: "name slug",
      },
    });

    const itemsWithPrices = populatedCart.items
      .filter((item) => item.product !== null)
      .map((item) => {
        const product = item.product;
        if (!product) return null;
        const currentPrice = product.comparePrice || product.price || 0;
        return {
          ...(item.toObject ? item.toObject() : item),
          price: currentPrice,
          subtotal: currentPrice * item.quantity,
        };
      })
      .filter((item) => item !== null);

    res.status(200).json({
      success: true,
      cart: {
        ...populatedCart.toObject(),
        items: itemsWithPrices,
      },
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.status(200).json({
      success: true,
      message: "Cart cleared",
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
