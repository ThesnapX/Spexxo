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
        "name slug price comparePrice images stock isInStock brand isActive",
      populate: {
        path: "brand",
        select: "name slug",
      },
    });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Calculate prices dynamically from product data
    const itemsWithPrices = cart.items.map((item) => {
      const product = item.product;
      const currentPrice = product?.comparePrice || product?.price || 0;
      return {
        ...(item.toObject ? item.toObject() : item),
        price: currentPrice,
        subtotal: currentPrice * item.quantity,
      };
    });

    res.status(200).json({
      success: true,
      cart: {
        ...cart.toObject(),
        items: itemsWithPrices,
      },
    });
  } catch (error) {
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

    if (!product.isInStock || product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Product out of stock or insufficient quantity",
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        (variant ? item.variant?.sku === variant.sku : true),
    );

    // Get current price from product
    const currentPrice = product.comparePrice || product.price;

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
      // Remove price assignment - will use product price dynamically
    } else {
      cart.items.push({
        product: productId,
        quantity,
        variant,
        // Remove price - will use product price dynamically
      });
    }

    await cart.save();

    // Re-populate the cart
    const populatedCart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select:
        "name slug price comparePrice images stock isInStock brand isActive",
      populate: {
        path: "brand",
        select: "name slug",
      },
    });

    // Calculate prices dynamically
    const itemsWithPrices = populatedCart.items.map((item) => {
      const product = item.product;
      const currentPrice = product?.comparePrice || product?.price || 0;
      return {
        ...(item.toObject ? item.toObject() : item),
        price: currentPrice,
        subtotal: currentPrice * item.quantity,
      };
    });

    res.status(200).json({
      success: true,
      cart: {
        ...populatedCart.toObject(),
        items: itemsWithPrices,
      },
    });
  } catch (error) {
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
    if (product && quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`,
      });
    }

    item.quantity = quantity;
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select:
        "name slug price comparePrice images stock isInStock brand isActive",
      populate: {
        path: "brand",
        select: "name slug",
      },
    });

    // Calculate prices dynamically
    const itemsWithPrices = populatedCart.items.map((item) => {
      const product = item.product;
      const currentPrice = product?.comparePrice || product?.price || 0;
      return {
        ...(item.toObject ? item.toObject() : item),
        price: currentPrice,
        subtotal: currentPrice * item.quantity,
      };
    });

    res.status(200).json({
      success: true,
      cart: {
        ...populatedCart.toObject(),
        items: itemsWithPrices,
      },
    });
  } catch (error) {
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
        "name slug price comparePrice images stock isInStock brand isActive",
      populate: {
        path: "brand",
        select: "name slug",
      },
    });

    // Calculate prices dynamically
    const itemsWithPrices = populatedCart.items.map((item) => {
      const product = item.product;
      const currentPrice = product?.comparePrice || product?.price || 0;
      return {
        ...(item.toObject ? item.toObject() : item),
        price: currentPrice,
        subtotal: currentPrice * item.quantity,
      };
    });

    res.status(200).json({
      success: true,
      cart: {
        ...populatedCart.toObject(),
        items: itemsWithPrices,
      },
    });
  } catch (error) {
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
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
