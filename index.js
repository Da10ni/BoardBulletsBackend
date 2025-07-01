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
  origin: ["http://localhost:8085"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// Middleware setup
app.use(cors(corsOption));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send(`
      <h1>Hello World! 🌍</h1>
      <p>BoardBullets API Server is running on port ${PORT}</p>
      <p><a href="/health">Check Health</a> | <a href="/api-info">API Info</a></p>
    `);
});
// api routes
app.use("/api/v1/auth", authRoutes);

// Port configuration
const PORT = process.env.PORT || 9000;

// Start server
app.listen(PORT, () => {
  connectDB();
  console.log(`🚀 Server is running on port ${PORT}`);
});

export default app;
