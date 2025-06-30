import jwt from "jsonwebtoken";

// Auth middleware to verify JWT token from cookies
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from cookies
    const token = req.cookies.token;

    console.log("Cookies received:", req.cookies);
    console.log("Token from cookies:", token);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log("Decoded token:", decoded);

    // Attach user to request object
    req.user = {
      userId: decoded.userId,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export { authenticateToken };