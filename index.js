import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./utils/db.js";
import authRoutes from "./routes/user.route.js";
import cookieParser from "cookie-parser";

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
const corsOption = {
  origin: [
    "http://localhost:8085",
    "http://192.168.18.112:8085", // ← IP update kiya
    "exp://192.168.18.112:8085",
    "*",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
};

// Middleware setup
app.use(cors(corsOption));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Fixed - No template literals
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

app.get("/", (req, res) => {
  res.json({
    message: "BoardBullets API Server is running!",
    port: PORT,
    host: HOST, // Added for debugging
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    server: "running",
    port: PORT,
    host: HOST
  });
});

// api routes
app.use("/api/v1/auth", authRoutes);

// Start server
app.listen(PORT, HOST, () => {
  connectDB();
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`🌐 Network access: http://192.168.18.112:${PORT}`);
});

export default app;