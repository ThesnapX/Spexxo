// backend/models/Popup.js

import mongoose from "mongoose";

const popupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
      url: String,
      alt: String,
    },
    // ✅ Button fields - ADD THESE
    buttonType: {
      type: String,
      enum: ["visit", "copy", "none"],
      default: "visit",
    },
    buttonText: {
      type: String,
      default: "Shop Now",
    },
    buttonLink: {
      type: String,
      default: "",
    },
    buttonCopyText: {
      type: String,
      default: "",
    },
    triggerType: {
      type: String,
      enum: ["onload", "scroll", "exit-intent", "time-delay", "click"],
      default: "onload",
    },
    triggerDelay: {
      type: Number,
      default: 0,
    },
    frequency: {
      type: String,
      enum: [
        "every-visit",
        "once-per-session",
        "once-per-day",
        "once-per-week",
        "once-only",
      ],
      default: "once-per-session",
    },
    pages: [String],
    excludePages: [String],
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const Popup = mongoose.model("Popup", popupSchema);
export default Popup;
