const express = require("express");
const router = express.Router();

const {auth,isComp} = require("../middlewares/auth");
const {signupComp,loginComp} = require("../controllers/Auth");
const { createProject } = require('../controllers/Project');


router.post("/login", loginComp);

// Route for user signup
router.post("/signup", signupComp);

// Route for sending OTP to the user's email
// router.post("/sendotp", sendOTP);

// // Route for Changing the password
// router.post("/changepassword", auth, changePassword);

// // Route for generating a reset password token
// router.post("/reset-password-token", resetPasswordToken);

// // Route for resetting user's password after verification
// router.post("/reset-password", resetPassword);

// Export the router for use in the main application
module.exports = router;
