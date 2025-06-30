import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { getProfile, login, register } from "../controllers/user.controller.js";

const router = express.Router();

// Public routes (no authentication required)
router.post("/register", register);
router.post("/login", login);

// Protected routes (authentication required)
router.get("/profile/:id", authenticateToken, getProfile);
// router.put("/profile", authenticateToken, updateProfile);

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