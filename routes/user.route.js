import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { getProfile, login, logout, register, resendVerificationCode, updateProfile, verifyEmail } from "../controllers/user.controller.js";
import { singleUpload } from "../middleware/multer.js";

const router = express.Router();

// Public routes (no authentication required)
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/verify-email",verifyEmail)
router.post("/resend-verification",resendVerificationCode)

// Protected routes (authentication required)
router.get("/profile/:id", authenticateToken, getProfile);
router.put("/update-profile", authenticateToken, singleUpload, updateProfile);

// Test protected route
router.get("/protected", authenticateToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Protected route accessed successfully",
    data: {
      user: req.user,
    },
  });
});

export default router;