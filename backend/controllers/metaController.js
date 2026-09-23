// backend/controllers/metaController.js

import {
  sendMetaEvent,
  getFbcFromRequest,
  getFbpFromRequest,
} from "../utils/metaCapi.js";

// @desc    Receive event from frontend, forward to Meta CAPI
// @route   POST /api/meta/event
// @access  Public (optional: protect if you want logged-in only)
export const sendMetaEventController = async (req, res) => {
  try {
    const {
      eventName,
      eventId,
      customData = {},
      userData = {},
      eventSourceUrl,
    } = req.body;

    if (!eventName || !eventId) {
      return res
        .status(400)
        .json({ success: false, message: "eventName and eventId required" });
    }

    // Enrich user data with IP, user agent, fbc, fbp
    const enrichedUserData = {
      ...userData,
      clientIpAddress:
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip,
      clientUserAgent: req.headers["user-agent"],
      fbc: getFbcFromRequest(req),
      fbp: getFbpFromRequest(req),
    };

    // If authenticated, use the user's ID as external_id
    if (req.user?._id) {
      enrichedUserData.externalId = req.user._id.toString();
    }

    await sendMetaEvent({
      eventName,
      eventId,
      userData: enrichedUserData,
      customData,
      eventSourceUrl: eventSourceUrl || req.headers.referer,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("[META CTRL] Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
