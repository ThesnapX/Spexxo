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
        "name slug price comparePrice images stock isInStock brand isActive productType sku variants",
      populate: {
        path: "brand",
        select: "name slug",
      },
    });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Filter out items with null products
    const activeItems = cart.items.filter((item) => item.product !== null);

    if (activeItems.length !== cart.items.length) {
      cart.items = activeItems;
      await cart.save();
    }

    // Build response with proper variant data
    const itemsWithPrices = activeItems
      .map((item) => {
        const product = item.product;
        if (!product) return null;

        let currentPrice = product.comparePrice || product.price || 0;
        let variantStock = product.stock;
        let variantName = null;
        let variantSku = null;
        let variantColor = null;
        let variantImages = [];
        let variantPrice = null;

        if (item.variant) {
          const foundVariant = product.variants?.find(
            (v) =>
              v._id?.toString() === item.variant._id?.toString() ||
              v.name === item.variant.name ||
              v.sku === item.variant.sku,
          );
          if (foundVariant) {
            currentPrice = foundVariant.price || currentPrice;
            variantStock = foundVariant.stock || 0;
            variantName = foundVariant.name;
            variantSku = foundVariant.sku;
            variantColor = foundVariant.color;
            variantImages = foundVariant.images || [];
            variantPrice = foundVariant.price;
          }
        }

        // ✅ FIXED: Use variant images if available, otherwise product images
        const displayImage =
          variantImages.length > 0
            ? variantImages[0]?.url || product.images?.[0]?.url || ""
            : product.images?.[0]?.url || "";

        return {
          _id: item._id,
          product: {
            _id: product._id,
            name: product.name || "Product",
            slug: product.slug || "",
            price: product.price || 0,
            comparePrice: product.comparePrice || null,
            images: product.images || [],
            stock: variantStock !== null ? variantStock : product.stock || 0,
            isInStock: product.isInStock !== false,
            isActive: product.isActive !== false,
            brand: product.brand || null,
            productType: product.productType || "",
            sku: product.sku || "",
            variants: product.variants || [],
          },
          quantity: item.quantity || 1,
          variant: item.variant || null,
          price: currentPrice,
          subtotal: currentPrice * (item.quantity || 1),
          variantName: variantName,
          variantSku: variantSku,
          variantColor: variantColor,
          variantImages: variantImages,
          image: displayImage,
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

    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message:
          "This product is currently deactivated and cannot be added to cart",
      });
    }

    let stockToCheck = product.stock;
    let variantData = null;
    let variantImages = [];

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
        variantImages = foundVariant.images || [];
        variantData = {
          name: foundVariant.name,
          sku: foundVariant.sku,
          price: foundVariant.price,
          color: foundVariant.color,
          attributes: foundVariant.attributes || {},
          images: variantImages,
        };
      } else {
        return res.status(400).json({
          success: false,
          message: "Selected variant not found",
        });
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

      const itemVariantId = item.variant?._id || item.variant?.id;
      const variantId = variant._id || variant.id;
      const isSameVariant =
        itemVariantId?.toString() === variantId?.toString() ||
        item.variant?.sku === variant.sku ||
        item.variant?.name === variant.name;
      return isSameProduct && isSameVariant;
    });

    if (itemIndex > -1) {
      const newQuantity = cart.items[itemIndex].quantity + quantity;
      if (newQuantity > stockToCheck) {
        return res.status(400).json({
          success: false,
          message: `Only ${stockToCheck} items available in stock`,
        });
      }
      cart.items[itemIndex].quantity = newQuantity;
      if (variantData) {
        cart.items[itemIndex].variant = variantData;
      }
    } else {
      cart.items.push({
        product: productId,
        quantity,
        variant: variantData || null,
      });
    }

    await cart.save();

    // Re-populate the cart
    const populatedCart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select:
        "name slug price comparePrice images stock isInStock brand isActive productType sku variants",
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

        let currentPrice = product.comparePrice || product.price || 0;
        let variantImages = [];
        let variantPrice = null;

        if (item.variant) {
          const foundVariant = product.variants?.find(
            (v) =>
              v._id?.toString() === item.variant._id?.toString() ||
              v.name === item.variant.name ||
              v.sku === item.variant.sku,
          );
          if (foundVariant) {
            currentPrice = foundVariant.price || currentPrice;
            variantImages = foundVariant.images || [];
            variantPrice = foundVariant.price;
          }
        }

        const displayImage =
          variantImages.length > 0
            ? variantImages[0]?.url
            : product.images?.[0]?.url || "";

        return {
          ...(item.toObject ? item.toObject() : item),
          price: currentPrice,
          subtotal: currentPrice * item.quantity,
          image: displayImage,
          variantPrice: variantPrice,
          variantImages: variantImages,
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

    // Check stock with variant support
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
        "name slug price comparePrice images stock isInStock brand isActive productType sku variants",
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
        let currentPrice = product.comparePrice || product.price || 0;
        let variantImages = [];

        if (item.variant) {
          const foundVariant = product.variants?.find(
            (v) =>
              v._id?.toString() === item.variant._id?.toString() ||
              v.name === item.variant.name ||
              v.sku === item.variant.sku,
          );
          if (foundVariant) {
            currentPrice = foundVariant.price || currentPrice;
            variantImages = foundVariant.images || [];
          }
        }

        const displayImage =
          variantImages.length > 0
            ? variantImages[0]?.url
            : product.images?.[0]?.url || "";

        return {
          ...(item.toObject ? item.toObject() : item),
          price: currentPrice,
          subtotal: currentPrice * item.quantity,
          image: displayImage,
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
        "name slug price comparePrice images stock isInStock brand isActive productType sku variants",
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
        let currentPrice = product.comparePrice || product.price || 0;
        let variantImages = [];

        if (item.variant) {
          const foundVariant = product.variants?.find(
            (v) =>
              v._id?.toString() === item.variant._id?.toString() ||
              v.name === item.variant.name ||
              v.sku === item.variant.sku,
          );
          if (foundVariant) {
            currentPrice = foundVariant.price || currentPrice;
            variantImages = foundVariant.images || [];
          }
        }

        const displayImage =
          variantImages.length > 0
            ? variantImages[0]?.url
            : product.images?.[0]?.url || "";

        return {
          ...(item.toObject ? item.toObject() : item),
          price: currentPrice,
          subtotal: currentPrice * item.quantity,
          image: displayImage,
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
