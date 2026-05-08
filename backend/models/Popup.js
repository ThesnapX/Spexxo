import mongoose from "mongoose";

const popupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    title: {
      type: String,
    },
    content: {
      type: String,
    },
    image: {
      url: String,
      alt: String,
    },
    buttonText: {
      type: String,
    },
    buttonLink: {
      type: String,
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
    pages: [
      {
        type: String,
      },
    ],
    excludePages: [
      {
        type: String,
      },
    ],
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    position: {
      type: String,
      enum: ["center", "top", "bottom", "left", "right"],
      default: "center",
    },
    overlay: {
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
