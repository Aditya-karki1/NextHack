const express = require("express");
const router = express.Router();
const Ngo = require('../models/Ngo');
const {auth,isNgo} = require("../middlewares/auth");
const {signupNgo,loginNgo} = require("../controllers/Auth");
const { verifyNgo } = require("../controllers/Verification");

router.post("/verifyNgo", auth, isNgo, verifyNgo);

router.post("/login", loginNgo);

// Route for user signup
router.post("/signup", signupNgo);
router.get('/:id', async (req, res) => {
  try {
    const ngo = await Ngo.findById(req.params.id);
    if (!ngo) return res.status(404).json({ message: "NGO not found" });
    res.json({ ngo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update KYC status
router.post('/:id/verify', async (req, res) => {
  try {
    const ngo = await Ngo.findById(req.params.id);
    if (!ngo) return res.status(404).json({ message: "NGO not found" });

    ngo.kycStatus = "VERIFIED";
    await ngo.save();
    res.json({ ngo, message: "KYC Verified" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


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
