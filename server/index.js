const express = require("express");
const app = express();
require("dotenv").config();
const auth = require("./middlewares/auth").auth;
const PORT = process.env.PORT || 4000;

const cors = require("cors");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const upload = multer();
const axios = require("axios");
// DB connection
const dbConnect = require("./config/database");
dbConnect();

// Cloudinary (configured instance)
const cloudinary = require("./config/cloudinary");

// Routes
const govRoutes = require("./router/Gov");
const ngoRoutes = require("./router/Ngo");
const compRoutes = require("./router/Comp");
const mrvRoutes = require("./router/Mrv");

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://study-notion-frontend-rosy.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// Mount Routes
app.use("/api/v1/gov", govRoutes);
app.use("/api/v1/ngo", ngoRoutes);
app.use("/api/v1/company", compRoutes);
app.use("/api/v1/mrv", mrvRoutes);

// Auth test route
app.get("/api/v1/auth/me", auth, (req, res) => {
  res.json({ user: req.user });
});

// Test Route
app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Your server is running"
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`App is running at port ${PORT}`);
});
