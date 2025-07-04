import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userModel } from "../models/userModel.js";
import {
  generateCode,
  isValidEmail,
  sendVerificationEmail,
} from "../methods/methods.js";
import { schemaForVerify } from "../models/verifyModel.js";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, confirmPassword } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password do not matched",
      });
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      // If user exists but not verified, allow resending verification
      if (!existingUser.isVerified) {
        // Delete any existing verification codes for this user
        await schemaForVerify.deleteMany({ userId: existingUser._id });

        // Generate new verification code
        const verificationCode = generateCode();

        // Create new verification entry
        const newVerification = new schemaForVerify({
          userId: existingUser._id,
          verificationCode,
        });
        await newVerification.save();

        console.log(
          "first ==>",
          existingUser.email,
          verificationCode,
          existingUser.profile.firstName
        );

        // Send verification email
        await sendVerificationEmail(
          existingUser.email,
          verificationCode,
          existingUser.profile.firstName
        );

        return res.status(200).json({
          success: true,
          message: "Verification code resent to your email",
          email: existingUser.email,
        });
      }

      return res.status(409).json({
        success: false,
        message: "User with this email already exists and is verified",
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new userModel({
      email: email.toLowerCase(),
      password: hashedPassword,
      isVerified: false,
      profile: {
        firstName: firstName || "",
        lastName: lastName || "",
      },
    });

    // Save user to database
    await newUser.save();

    // Generate verification code
    const verificationCode = generateCode();

    // Create verification entry
    const newVerification = new schemaForVerify({
      userId: newUser._id,
      verificationCode,
    });
    await newVerification.save();

    console.log(
      "second ==>",
      newUser.email,
      verificationCode,
      newUser.profile.firstName
    );

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationCode, firstName);
    } catch (emailError) {
      // If email fails, delete the user and verification entry
      await userModel.findByIdAndDelete(newUser._id);
      await schemaForVerify.deleteOne({ userId: newUser._id });

      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again.",
      });
    }

    // Return success response (don't send token until verified)
    return res.status(201).json({
      success: true,
      message:
        "Registration successful! Please check your email for verification code.",
      email: newUser.email,
      verificationRequired: true,
    });
  } catch (error) {
    console.error("Register error:", error);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Verify Email Code Controller
const verifyEmail = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    // Validation
    if (!email || !verificationCode) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required",
      });
    }

    // Find user
    const user = await userModel.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "User is already verified",
      });
    }

    // Find verification entry
    const verification = await schemaForVerify.findOne({
      userId: user._id,
      verificationCode: verificationCode,
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code or code has expired",
      });
    }

    // Mark user as verified
    user.isVerified = true;
    await user.save();

    // Delete verification entry after successful verification
    await schemaForVerify.deleteOne({ _id: verification._id });

    // Generate JWT token
    const tokenData = { userId: user._id };
    const token = jwt.sign(tokenData, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Remove password from response
    const userResponse = {
      _id: user._id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      profile: user.profile,
      createdAt: user.createdAt,
    };

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during verification",
      error: error.message || undefined,
    });
  }
};

// Resend Verification Code Controller
const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find user
    const user = await userModel.findOne({
      email: email.toLowerCase(),
      isVerified: false,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found or already verified",
      });
    }

    // Delete any existing verification codes for this user
    await schemaForVerify.deleteMany({ userId: user._id });

    // Generate new verification code
    const verificationCode = generateCode();

    // Create new verification entry
    const newVerification = new schemaForVerify({
      userId: user._id,
      verificationCode,
    });
    await newVerification.save();

    // Send verification email
    await sendVerificationEmail(
      user.email,
      verificationCode,
      user.profile.firstName
    );

    return res.status(200).json({
      success: true,
      message: "New verification code sent to your email",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend verification code",
      error: error.message || undefined,
    });
  }
};

// Login API
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Find user by email
    const user = await userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Remove password from response
    const userResponse = {
      _id: user._id,
      email: user.email,
      role: user.role,
      profile: user.profile,
      createdAt: user.createdAt,
    };

    const tokenData = {
      userId: user?._id,
    };

    const token = jwt.sign(tokenData, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(201).json({
      success: true,
      message: "login successfully",
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get User Profile API (Bonus)
const getProfile = async (req, res) => {
  try {
    const userId = req.params.id; // From auth middleware

    const user = await userModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      firstName,
      lastName,
      DOB,
      gender,
      institute,
      residence,
      DOG,
      speciality,
    } = req.body;

    const profilePic = req.file;

    console.log(firstName,lastName,DOB,gender,institute,residence,DOG,speciality,profilePic)

    // Required fields validation
    if (!firstName || !lastName || !DOB || !gender) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields",
      });
    }

    // Get current user to preserve existing profile data
    const currentUser = await userModel.findById(userId);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Merge with existing profile data
    const updatedProfile = {
      ...currentUser.profile, // Preserve existing fields
      firstName,
      lastName,
      DOB,
      gender,
    };

    // Add optional fields if provided
    if (institute) updatedProfile.institute = institute;
    if (residence) updatedProfile.residence = residence;
    if (DOG) updatedProfile.DOG = DOG;
    if (speciality) updatedProfile.speciality = speciality;

    // Handle profile picture
    if (profilePic) {
      try {
        const getUrl = await getDataUri(profilePic);
        const cloudResponse = await cloudinary.uploader.upload(getUrl.content);
        updatedProfile.profilePic = cloudResponse?.secure_url || "";
      } catch (uploadError) {
        console.error("Profile picture upload failed:", uploadError);
      }
    }

    // Update user with merged profile
    const updatedUser = await userModel
      .findByIdAndUpdate(
        userId,
        { $set: { profile: updatedProfile } },
        { new: true, runValidators: true }
      )
      .select("-password");

    console.log("✅ Profile updated successfully");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Simple Logout API
const logout = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during logout",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export {
  register,
  login,
  getProfile,
  resendVerificationCode,
  verifyEmail,
  logout,
  updateProfile,
};
