const express = require("express");
const router = express.Router();
const Ngo = require('../models/Ngo');
const {auth,isNgo} = require("../middlewares/auth");
const {signupNgo,loginNgo} = require("../controllers/Auth");
const { verifyNgo } = require("../controllers/Verification");
const razorpay = require("../config/razorpay");
const CreditListing = require("../models/CreditListing");
const { capturePayment, verifyPayment } = require('../controllers/PaymentController');
const RestorationProject = require("../models/RestorationProject");
const MRVRecord = require("../models/MRVRecord");

// NGO Dashboard - Get profile and stats
router.get("/dashboard/:ngoId", auth, async (req, res) => {
  try {
    const { ngoId } = req.params;
    
    const ngo = await Ngo.findById(ngoId).select('-password');
    if (!ngo) {
      return res.status(404).json({
        success: false,
        message: "NGO not found"
      });
    }

    // Get project stats
    const totalProjects = await RestorationProject.countDocuments({ ngoId });
    const completedProjects = await RestorationProject.countDocuments({ ngoId, status: 'completed' });
    const activeProjects = await RestorationProject.countDocuments({ ngoId, status: { $in: ['ongoing', 'active'] } });
    
    // Get MRV records for credits calculation
    const mrvRecords = await MRVRecord.find({ userId: ngoId }).sort({ dateReported: -1 });
    const totalCreditsEarned = mrvRecords.reduce((sum, record) => sum + (record.creditsGenerated || record.treeCount * 0.5), 0);
    
    // Get available credits from listings
    const availableCredits = ngo.credits?.balance || 0;
    
    res.status(200).json({
      success: true,
      data: {
        profile: ngo,
        stats: {
          totalProjects,
          completedProjects,
          activeProjects,
          totalCreditsEarned: Math.round(totalCreditsEarned),
          availableCredits,
          kycStatus: ngo.kycStatus || 'PENDING'
        },
        recentMRVRecords: mrvRecords.slice(0, 5)
      }
    });

  } catch (error) {
    console.error("NGO Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message
    });
  }
});

// Get NGO projects
router.get("/projects/:ngoId", auth, async (req, res) => {
  try {
    const { ngoId } = req.params;
    
    const projects = await RestorationProject.find({ ngoId })
      .sort({ createdAt: -1 })
      .populate('ngoId', 'name email');
    
    res.status(200).json({
      success: true,
      projects
    });

  } catch (error) {
    console.error("NGO Projects Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
      error: error.message
    });
  }
});

// Get NGO MRV records
router.get("/mrv-reports/:ngoId", auth, async (req, res) => {
  try {
    const { ngoId } = req.params;
    
    const mrvRecords = await MRVRecord.find({ userId: ngoId })
      .sort({ dateReported: -1 })
      .populate('projectId', 'name location');
    
    res.status(200).json({
      success: true,
      reports: mrvRecords
    });

  } catch (error) {
    console.error("NGO MRV Reports Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch MRV reports",
      error: error.message
    });
  }
});

// Get NGO credit listings
router.get("/credit-listings/:ngoId", auth, async (req, res) => {
  try {
    const { ngoId } = req.params;
    
    const listings = await CreditListing.find({ ngoId })
      .sort({ createdAt: -1 })
      .populate('ngoId', 'name email');
    
    res.status(200).json({
      success: true,
      listings
    });

  } catch (error) {
    console.error("NGO Credit Listings Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch credit listings",
      error: error.message
    });
  }
});

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

router.post("/:ngoId/list-credits", async (req, res) => {
  const { ngoId } = req.params;
  const { amount, price } = req.body;
console.log("Listing credits:", { ngoId, amount, price });
  try {
    const ngo = await Ngo.findById(ngoId);
    if (!ngo) return res.status(404).json({ message: "NGO not found" });

    if (ngo.credits.balance < amount) {
      return res.status(400).json({ message: "Not enough credits available." });
    }

    const listing = await CreditListing.create({
      ngoId,
      amount,
      price,
      status: "FOR_SALE"
    });

    res.status(200).json({ message: "Credits listed successfully!", listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
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
router.get("/credits-test/:id", async (req, res) => {
  try {
    console.log("Fetching credits for NGO ID:", req.params.id);
    const ngo = await Ngo.findById(req.params.id, "credits.balance");
    if (!ngo) return res.status(404).json({ success: false, message: "NGO not found" });
console.log("NGO found:", ngo);
    res.json({ success: true, balance: ngo.credits.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Payment routes
router.post('/capture-payment', auth, isNgo, capturePayment);
router.post('/verify-payment', auth, isNgo, verifyPayment);

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
