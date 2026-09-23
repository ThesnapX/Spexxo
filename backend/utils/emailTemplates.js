// backend/utils/emailTemplates.js

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  process.env.SITE_URL ||
  "https://spexxo.vercel.app";

// Base wrapper — all emails use this
const wrap = (inner) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Spexxo</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Poppins',Arial,sans-serif;color:#0B1C39;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:#0B1C39;padding:24px;text-align:center;">
              <a href="${FRONTEND_URL}" style="text-decoration:none;color:#fff;font-size:26px;font-weight:700;letter-spacing:0.5px;">
                Spe<span style="color:#3D96EB;">xx</span>o
              </a>
              <p style="margin:6px 0 0;color:#94a3b8;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Premium Eyewear</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 28px;font-size:15px;line-height:1.65;color:#0B1C39;">
              ${inner}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:22px 28px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Questions? Reply to this email or contact <a href="mailto:satyapatanakar5@gmail.com" style="color:#3D96EB;text-decoration:none;">satyapatanakar5@gmail.com</a></p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Spexxo. All rights reserved.</p>
              <p style="margin:8px 0 0;font-size:12px;">
                <a href="${FRONTEND_URL}" style="color:#3D96EB;text-decoration:none;margin:0 6px;">Visit Store</a>
                ·
                <a href="${FRONTEND_URL}/account" style="color:#3D96EB;text-decoration:none;margin:0 6px;">My Account</a>
                ·
                <a href="${FRONTEND_URL}/contact" style="color:#3D96EB;text-decoration:none;margin:0 6px;">Contact</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const button = (text, url, bg = "#3D96EB") => `
  <a href="${url}" style="display:inline-block;padding:13px 28px;background:${bg};color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">${text}</a>
`;

const infoBox = (inner) => `
  <div style="background:#f9fafb;border-radius:12px;padding:16px;margin:18px 0;border:1px solid #eef1f5;">
    ${inner}
  </div>
`;

// ─────────────────────────────────────────────
// ORDER emails
// ─────────────────────────────────────────────
export const orderPlacedEmail = ({ user, order }) => {
  const items = (order.items || [])
    .map(
      (it) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
          <p style="margin:0;font-weight:600;color:#0B1C39;">${it.name}</p>
          ${it.variant?.name ? `<p style="margin:2px 0 0;font-size:12px;color:#3D96EB;">Variant: ${it.variant.name}</p>` : ""}
          <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Qty: ${it.quantity} × ₹${it.price?.toLocaleString()}</p>
        </td>
        <td style="padding:10px 0;text-align:right;border-bottom:1px solid #f0f0f0;font-weight:600;">₹${it.subtotal?.toLocaleString()}</td>
      </tr>`,
    )
    .join("");

  return {
    subject: `Order Confirmed #${order.orderNumber} | Spexxo`,
    html: wrap(`
      <h2 style="margin:0 0 8px;color:#0B1C39;">Thank you, ${user.firstName || "there"}! 🎉</h2>
      <p style="margin:0 0 16px;color:#6b7280;">Your order has been placed successfully. We'll notify you as soon as it ships.</p>

      ${infoBox(`
        <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Order Number</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#3D96EB;">#${order.orderNumber}</p>
      `)}

      <h3 style="margin:20px 0 8px;font-size:15px;">Order Summary</h3>
      <table width="100%" cellpadding="0" cellspacing="0">${items}</table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
        <tr><td style="padding:4px 0;color:#6b7280;">Subtotal</td><td style="text-align:right;">₹${order.subtotal?.toLocaleString()}</td></tr>
        ${order.discount > 0 ? `<tr><td style="padding:4px 0;color:#10b981;">Discount</td><td style="text-align:right;color:#10b981;">-₹${order.discount?.toLocaleString()}</td></tr>` : ""}
        <tr><td style="padding:4px 0;color:#6b7280;">Shipping</td><td style="text-align:right;">${order.shippingCost === 0 ? "FREE" : "₹" + order.shippingCost?.toLocaleString()}</td></tr>
        <tr><td style="padding:10px 0 0;font-weight:700;border-top:1px solid #e5e7eb;">Total</td><td style="text-align:right;font-weight:700;color:#3D96EB;border-top:1px solid #e5e7eb;padding-top:10px;">₹${order.total?.toLocaleString()}</td></tr>
      </table>

      <div style="text-align:center;margin:26px 0 8px;">
        ${button("View Order Details", `${FRONTEND_URL}/account/orders/${order._id}`)}
      </div>
    `),
  };
};

export const orderStatusEmail = ({ user, order, status, note }) => {
  const statusLabels = {
    confirmed: "Order Confirmed",
    processing: "Order Being Prepared",
    shipped: "Order Shipped 🚚",
    delivered: "Order Delivered ✅",
    cancelled: "Order Cancelled",
  };
  const statusCopy = {
    confirmed:
      "We've received your payment and confirmed your order. We'll start preparing it shortly.",
    processing:
      "Your order is being carefully packed and prepared for dispatch.",
    shipped: "Great news! Your order is on the way. Track it in your account.",
    delivered:
      "Your order has been delivered. We hope you love it! Please leave a review.",
    cancelled:
      "Your order has been cancelled. If you paid online, a refund will be initiated within 5-7 business days.",
  };

  return {
    subject: `${statusLabels[status] || status} - #${order.orderNumber} | Spexxo`,
    html: wrap(`
      <h2 style="margin:0 0 8px;">${statusLabels[status] || status}</h2>
      <p style="margin:0 0 16px;color:#6b7280;">Hi ${user.firstName || "there"}, ${statusCopy[status] || ""}</p>

      ${infoBox(`
        <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Order Number</p>
        <p style="margin:0;font-size:18px;font-weight:700;">#${order.orderNumber}</p>
      `)}

      ${note ? `<p style="background:#EBF4FC;border-left:4px solid #3D96EB;padding:10px 14px;border-radius:8px;margin:16px 0;color:#0B1C39;font-size:14px;">📝 ${note}</p>` : ""}

      <div style="text-align:center;margin:24px 0 8px;">
        ${button("View Order", `${FRONTEND_URL}/account/orders/${order._id}`)}
      </div>
    `),
  };
};

// ─────────────────────────────────────────────
// WELCOME email
// ─────────────────────────────────────────────
export const welcomeEmail = ({ user }) => ({
  subject: "Welcome to Spexxo! 👓",
  html: wrap(`
    <h2 style="margin:0 0 8px;">Welcome, ${user.firstName || "friend"}! 🎉</h2>
    <p style="margin:0 0 16px;color:#6b7280;">Thanks for joining Spexxo. You now have access to premium eyewear at unbeatable prices, plus these perks:</p>

    ${infoBox(`
      <ul style="margin:0;padding-left:20px;color:#0B1C39;">
        <li style="margin-bottom:6px;">✅ Exclusive member-only discounts</li>
        <li style="margin-bottom:6px;">🚚 Free shipping on orders above ₹999</li>
        <li style="margin-bottom:6px;">❤️ Save your favorites to your wishlist</li>
        <li style="margin-bottom:6px;">📦 Easy order tracking</li>
      </ul>
    `)}

    <div style="text-align:center;margin:24px 0 8px;">
      ${button("Start Shopping", `${FRONTEND_URL}/shop`)}
    </div>

    <p style="margin:20px 0 0;color:#6b7280;font-size:13px;text-align:center;">Questions? We're always here to help.</p>
  `),
});

// ─────────────────────────────────────────────
// Wishlist / Cart added
// ─────────────────────────────────────────────
export const wishlistAddedEmail = ({ user, product }) => ({
  subject: `❤️ Saved to your Wishlist: ${product.name}`,
  html: wrap(`
    <h2 style="margin:0 0 8px;">Saved to your Wishlist ❤️</h2>
    <p style="margin:0 0 16px;color:#6b7280;">Hi ${user.firstName || "there"}, we've saved this to your wishlist. Don't wait too long — popular styles sell out fast!</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td width="100" valign="top">
          ${product.images?.[0]?.url ? `<img src="${product.images[0].url}" alt="" style="width:100px;height:100px;object-fit:cover;border-radius:10px;" />` : ""}
        </td>
        <td valign="top" style="padding-left:14px;">
          <p style="margin:0;font-weight:600;font-size:15px;">${product.name}</p>
          <p style="margin:6px 0 0;color:#3D96EB;font-weight:700;">₹${(product.comparePrice || product.price)?.toLocaleString()}</p>
          ${product.comparePrice && product.comparePrice < product.price ? `<p style="margin:2px 0 0;color:#9ca3af;text-decoration:line-through;font-size:13px;">₹${product.price?.toLocaleString()}</p>` : ""}
        </td>
      </tr>
    </table>

    <div style="text-align:center;margin:20px 0 8px;">
      ${button("View Wishlist", `${FRONTEND_URL}/account/wishlist`)}
    </div>
  `),
});

export const cartAddedEmail = ({ user, product, quantity = 1 }) => ({
  subject: `🛒 Added to your Cart: ${product.name}`,
  html: wrap(`
    <h2 style="margin:0 0 8px;">Added to your Cart 🛒</h2>
    <p style="margin:0 0 16px;color:#6b7280;">Hi ${user.firstName || "there"}, we've added this to your cart. Ready to checkout?</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td width="100" valign="top">
          ${product.images?.[0]?.url ? `<img src="${product.images[0].url}" alt="" style="width:100px;height:100px;object-fit:cover;border-radius:10px;" />` : ""}
        </td>
        <td valign="top" style="padding-left:14px;">
          <p style="margin:0;font-weight:600;font-size:15px;">${product.name}</p>
          <p style="margin:6px 0 0;color:#6b7280;font-size:13px;">Qty: ${quantity}</p>
          <p style="margin:6px 0 0;color:#3D96EB;font-weight:700;">₹${(product.comparePrice || product.price)?.toLocaleString()}</p>
        </td>
      </tr>
    </table>

    <div style="text-align:center;margin:20px 0 8px;">
      ${button("Go to Cart", `${FRONTEND_URL}/cart`)}
    </div>
  `),
});

// ─────────────────────────────────────────────
// Abandoned Cart Follow-ups (4 stages)
// ─────────────────────────────────────────────
export const abandonedCartEmail = ({ user, cart, stage }) => {
  const productRows = (cart.items || [])
    .slice(0, 4)
    .map((it) => {
      const p = it.product;
      if (!p) return "";
      return `
        <tr>
          <td width="70" valign="top" style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
            ${p.images?.[0]?.url ? `<img src="${p.images[0].url}" alt="" style="width:70px;height:70px;object-fit:cover;border-radius:8px;" />` : ""}
          </td>
          <td valign="top" style="padding:8px 0 8px 12px;border-bottom:1px solid #f0f0f0;">
            <p style="margin:0;font-weight:600;font-size:14px;">${p.name}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Qty: ${it.quantity}</p>
            <p style="margin:4px 0 0;color:#3D96EB;font-weight:700;font-size:14px;">₹${(p.comparePrice || p.price)?.toLocaleString()}</p>
          </td>
        </tr>`;
    })
    .join("");

  const stages = {
    1: {
      subject: "🛒 You left something behind...",
      heading: "Still thinking about it?",
      copy: "We noticed you left some items in your cart. They're still available — but stocks are limited!",
      ctaText: "Complete Your Order",
      accent: "#3D96EB",
    },
    2: {
      subject: "⏳ Your cart is waiting for you",
      heading: "Your favorites are still here",
      copy: "Life gets busy — we get it. But your cart items are still waiting for you. Complete your purchase before they sell out!",
      ctaText: "Checkout Now",
      accent: "#8B5CF6",
    },
    3: {
      subject: "🔥 Last chance — your cart is about to expire!",
      heading: "Don't miss out!",
      copy: "We're holding your items for a little longer, but not forever. Complete your order now to secure your favorites.",
      ctaText: "Complete Checkout",
      accent: "#F59E0B",
    },
    4: {
      subject: "😢 Final reminder — we're about to clear your cart",
      heading: "Final chance to complete your order",
      copy: "This is our last reminder. Once your cart is cleared, you'll have to start over. Complete your order now to lock in these items.",
      ctaText: "Complete Order Now",
      accent: "#EF4444",
    },
  };

  const s = stages[stage] || stages[1];

  return {
    subject: s.subject,
    html: wrap(`
      <h2 style="margin:0 0 8px;">${s.heading}</h2>
      <p style="margin:0 0 16px;color:#6b7280;">Hi ${user.firstName || "there"}, ${s.copy}</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;">
        ${productRows}
      </table>

      ${infoBox(`
        <table width="100%">
          <tr>
            <td style="color:#6b7280;">Cart Total</td>
            <td style="text-align:right;font-weight:700;color:${s.accent};font-size:16px;">₹${cart.total?.toLocaleString() || ""}</td>
          </tr>
        </table>
      `)}

      <div style="text-align:center;margin:22px 0 8px;">
        ${button(s.ctaText, `${FRONTEND_URL}/cart`, s.accent)}
      </div>

      <p style="margin:22px 0 0;color:#9ca3af;font-size:12px;text-align:center;">
        If you've already completed your order, please ignore this email.
      </p>
    `),
  };
};

// ─────────────────────────────────────────────
// Abandoned Wishlist Follow-ups (4 stages)
// ─────────────────────────────────────────────
export const abandonedWishlistEmail = ({ user, products, stage }) => {
  const productRows = products
    .slice(0, 4)
    .map(
      (p) => `
      <tr>
        <td width="70" valign="top" style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
          ${p.images?.[0]?.url ? `<img src="${p.images[0].url}" alt="" style="width:70px;height:70px;object-fit:cover;border-radius:8px;" />` : ""}
        </td>
        <td valign="top" style="padding:8px 0 8px 12px;border-bottom:1px solid #f0f0f0;">
          <p style="margin:0;font-weight:600;font-size:14px;">${p.name}</p>
          <p style="margin:4px 0 0;color:#3D96EB;font-weight:700;font-size:14px;">₹${(p.comparePrice || p.price)?.toLocaleString()}</p>
        </td>
      </tr>`,
    )
    .join("");

  const stages = {
    1: {
      subject: "❤️ Still thinking about your wishlist?",
      heading: "Your wishlist favorites are waiting",
      copy: "We noticed you saved some items to your wishlist. They're still available — ready to make them yours?",
      ctaText: "View Wishlist",
      accent: "#EC4899",
    },
    2: {
      subject: "⏳ Wishlist reminder — your favorites are still here",
      heading: "Your wishlist picks are still available",
      copy: "Popular items sell out fast! Complete your purchase before someone else does.",
      ctaText: "Shop Wishlist",
      accent: "#8B5CF6",
    },
    3: {
      subject: "🔥 Your wishlist items are in high demand!",
      heading: "Don't miss out!",
      copy: "Some of your wishlist items are running low in stock. Grab yours before they're gone!",
      ctaText: "Shop Now",
      accent: "#F59E0B",
    },
    4: {
      subject: "😢 Last chance to grab your wishlist favorites",
      heading: "Final reminder",
      copy: "This is our last reminder about your wishlist. Don't miss the chance to own these pieces.",
      ctaText: "Shop Wishlist Now",
      accent: "#EF4444",
    },
  };

  const s = stages[stage] || stages[1];

  return {
    subject: s.subject,
    html: wrap(`
      <h2 style="margin:0 0 8px;">${s.heading}</h2>
      <p style="margin:0 0 16px;color:#6b7280;">Hi ${user.firstName || "there"}, ${s.copy}</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;">
        ${productRows}
      </table>

      <div style="text-align:center;margin:22px 0 8px;">
        ${button(s.ctaText, `${FRONTEND_URL}/account/wishlist`, s.accent)}
      </div>
    `),
  };
};
