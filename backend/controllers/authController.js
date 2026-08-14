import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      username,
      isPhoneVerified,
      isEmailVerified,
    } = req.body;

    // Check if user exists by email OR phone
    const userExists = await User.findOne({
      $or: [
        ...(email ? [{ email: email.toLowerCase() }] : []),
        ...(phone ? [{ phone }] : []),
        ...(username ? [{ username: username.toLowerCase() }] : []),
      ],
    });

    if (userExists) {
      if (email && userExists.email === email.toLowerCase()) {
        return res
          .status(400)
          .json({
            success: false,
            message: "User already exists with this email",
          });
      }
      if (phone && userExists.phone === phone) {
        return res
          .status(400)
          .json({
            success: false,
            message: "User already exists with this phone number",
          });
      }
      if (username && userExists.username === username.toLowerCase()) {
        return res
          .status(400)
          .json({ success: false, message: "Username is already taken" });
      }
    }

    const userData = {
      firstName,
      lastName,
      password,
    };

    if (email && email.trim()) userData.email = email.toLowerCase();
    if (phone && phone.trim()) userData.phone = phone;
    if (username && username.trim())
      userData.username = username.trim().toLowerCase();
    if (isPhoneVerified) userData.isPhoneVerified = true;
    if (isEmailVerified) userData.isEmailVerified = true;

    const user = await User.create(userData);
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        customerId: user.customerId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified || false,
        isPhoneVerified: user.isPhoneVerified || false,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Login user with email/phone/username + password
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please provide email/phone/username and password",
        });
    }

    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phone: email },
        { username: email.toLowerCase() },
      ],
    }).select("+password");

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        customerId: user.customerId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified || false,
        isPhoneVerified: user.isPhoneVerified || false,
        defaultAddress: user.defaultAddress,
        addresses: user.addresses,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Check username availability
// @route   GET /api/auth/check-username/:username
// @access  Public
export const checkUsername = async (req, res) => {
  try {
    const { username } = req.params;
    if (!username || username.length < 3) {
      return res.json({
        available: false,
        message: "Username must be at least 3 characters",
      });
    }
    const user = await User.findOne({ username: username.toLowerCase() });
    if (user) {
      return res.json({
        available: false,
        message: "Username is already taken",
      });
    }
    res.json({ available: true, message: "Username is available" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Check if email exists
// @route   POST /api/auth/check-email
// @access  Public
export const checkEmailExists = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
        exists: true,
      });
    }
    res.json({ success: true, message: "Email is available", exists: false });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check if phone exists
// @route   POST /api/auth/check-phone
// @access  Public
export const checkPhoneExists = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res
        .status(400)
        .json({ success: false, message: "Phone is required" });
    }
    const user = await User.findOne({ phone });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "Phone already registered",
        exists: true,
      });
    }
    res.json({ success: true, message: "Phone is available", exists: false });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile (full)
// @route   PUT /api/auth/update-profile
// @access  Private
export const updateFullProfile = async (req, res) => {
  try {
    const { firstName, lastName, username, email, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;

    if (username !== undefined) {
      const usernameToSet = username.trim().toLowerCase();
      if (usernameToSet) {
        if (!/^[a-zA-Z0-9_]+$/.test(usernameToSet)) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Username can only contain letters, numbers, and underscores",
            });
        }
        if (usernameToSet.length < 3) {
          return res
            .status(400)
            .json({
              success: false,
              message: "Username must be at least 3 characters",
            });
        }
        const existingUser = await User.findOne({
          username: usernameToSet,
          _id: { $ne: user._id },
        });
        if (existingUser) {
          return res
            .status(400)
            .json({ success: false, message: "Username is already taken" });
        }
        user.username = usernameToSet;
      } else {
        user.username = undefined;
      }
    }

    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: user._id },
      });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Email is already in use" });
      }
      user.email = email.toLowerCase();
    }

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        customerId: user.customerId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified || false,
        isPhoneVerified: user.isPhoneVerified || false,
        defaultAddress: user.defaultAddress,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update delivery address
// @route   PUT /api/auth/delivery-address
// @access  Private
export const updateDeliveryAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.defaultAddress = {
      fullName: req.body.fullName || "",
      phone: req.body.phone || "",
      addressLine1: req.body.addressLine1 || "",
      addressLine2: req.body.addressLine2 || "",
      landmark: req.body.landmark || "",
      area: req.body.area || "",
      city: req.body.city || "",
      state: req.body.state || "",
      pincode: req.body.pincode || "",
    };
    await user.save();
    res
      .status(200)
      .json({
        success: true,
        defaultAddress: user.defaultAddress,
        message: "Delivery address updated successfully",
      });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: email.toLowerCase() },
        { phone: email },
      ],
    });

    if (!user) {
      return res
        .status(404)
        .json({
          success: false,
          message: "User not found with this email/phone/username",
        });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}`;
    const emailHTML = `
      <h1>Password Reset Request</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#3D96EA;color:white;text-decoration:none;border-radius:8px;">Reset Password</a>
      <p>This link expires in 30 minutes.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset - Spexxo",
        html: emailHTML,
      });
    } catch (emailError) {
      console.log("Reset email failed to send");
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Password reset link sent to your email",
      });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Email could not be sent" });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = generateToken(user._id);
    res
      .status(200)
      .json({ success: true, token, message: "Password reset successful" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update basic profile (legacy)
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    await user.save();
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please provide current and new password",
        });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Password must be at least 6 characters",
        });
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    }
    user.password = newPassword;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
