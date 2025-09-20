const jwt = require("jsonwebtoken");
require("dotenv").config();

// Auth middleware - validate JWT token
exports.auth = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = req.cookies.token || req.body.token || (authHeader && authHeader.replace("Bearer ", ""));

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token is missing"
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
           
            req.user = decoded; // Attach user info to request
        } catch (error) {
            console.log("JWT Error:", error.message);
            return res.status(401).json({
                success: false,
                message: "Token is invalid"
            });
        }

        next();
    } catch (error) {
        console.log("Auth Middleware Error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while validating token"
        });
    }
};

// Role-based Middleware
exports.isGov = (req, res, next) => {
    try {
        if (req.user.role !== "GOV") {
            return res.status(403).json({
                success: false,
                message: "This is a protected route for GOV only"
            });
        }
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while validating GOV role"
        });
    }
};

exports.isNgo = (req, res, next) => {
    try {
        if (req.user.role !== "NGO") {
            return res.status(403).json({
                success: false,
                message: "This is a protected route for NGO only"
            });
        }
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while validating NGO role"
        });
    }
};

exports.isComp = (req, res, next) => {
    try {
        if (req.user.role !== "Comp") {
            return res.status(403).json({
                success: false,
                message: "This is a protected route for Company only"
            });
        }
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while validating Company role"
        });
    }
};
