import Product from "../models/Product.js";

// Middleware to check if product is active and in stock
export const checkProductAvailability = async (req, res, next) => {
  try {
    const productId = req.params.productId || req.body.productId;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message: "This product is currently deactivated and cannot be ordered",
      });
    }

    if (product.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: "This product is out of stock",
      });
    }

    req.product = product;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking product availability",
    });
  }
};
