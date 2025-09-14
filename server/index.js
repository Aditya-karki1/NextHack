const express = require("express");
const app = express();
require("dotenv").config();

const PORT = process.env.PORT || 4000;

// Middleware
const fileUpload = require("express-fileupload");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// DB connection
const dbConnect = require("./config/database");
dbConnect();

// Cloudinary (configured instance)
const cloudinary = require("./config/cloudinary");

// Routes
const govRoutes = require("./router/Gov");
const ngoRoutes = require("./router/Ngo");
const compRoutes = require("./router/Comp");

// Middleware setup
app.use(express.json());
app.use(cookieParser());
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
}));

const allowedOrigins = [
  "http://localhost:3000",
  "https://study-notion-frontend-rosy.vercel.app"
];

app.use(cors({
    origin: function(origin, callback) {
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
