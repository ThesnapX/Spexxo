import Popup from "../models/Popup.js";

export const getActivePopups = async (req, res) => {
  try {
    const currentPath = req.query.path || "/";
    const popups = await Popup.find({
      $or: [{ pages: currentPath }, { pages: { $size: 0 } }, { pages: "all" }],
      $and: [
        { isActive: true },
        {
          $or: [
            { startDate: { $lte: new Date() }, endDate: { $gte: new Date() } },
            { startDate: null },
            { endDate: null },
          ],
        },
      ],
    });

    res.status(200).json({ success: true, popups });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getPopups = async (req, res) => {
  try {
    const popups = await Popup.find().sort("-createdAt");
    res.status(200).json({ success: true, popups });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createPopup = async (req, res) => {
  try {
    const popup = await Popup.create(req.body);
    res.status(201).json({ success: true, popup });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updatePopup = async (req, res) => {
  try {
    const popup = await Popup.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!popup)
      return res
        .status(404)
        .json({ success: false, message: "Popup not found" });
    res.status(200).json({ success: true, popup });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deletePopup = async (req, res) => {
  try {
    const popup = await Popup.findByIdAndDelete(req.params.id);
    if (!popup)
      return res
        .status(404)
        .json({ success: false, message: "Popup not found" });
    res.status(200).json({ success: true, message: "Popup deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
