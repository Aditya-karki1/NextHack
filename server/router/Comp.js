const express = require("express");
const router = express.Router();

const {auth,isComp} = require("../middlewares/auth");
const {signupComp,loginComp} = require("../controllers/Auth");
const { createProject } = require('../controllers/Project');
const CarbonCredit = require("../models/CarbonCredit");
const creditListingSchema = require("../models/CreditListing");
const mongoose = require('mongoose');
const Ngo = require("../models/Ngo");
const Comp = require("../models/Comp");
const blockchainService = require('../services/blockchainService');
const { captureCompanyPayment, verifyCompanyPayment } = require('../controllers/PaymentController');
router.post("/login", loginComp);

// Route for user signup
router.post("/signup", signupComp);

// Get all available credits
router.get("/credits", async (req, res) => {
  try {
    const credits = await creditListingSchema
      .find({ status: "FOR_SALE" })
      .populate("ngoId", "_id name email role kycStatus organization"); // include organization details too

    console.log("Available Credits:", credits);
    res.json(credits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Purchase credits


// Route for sending OTP to the user's email
// router.post("/sendotp", sendOTP);

// // Route for Changing the password
// router.post("/changepassword", auth, changePassword);

// // Route for generating a reset password token
// router.post("/reset-password-token", resetPasswordToken);

// // Route for resetting user's password after verification
// router.post("/reset-password", resetPassword);

// Export the router for use in the main application


// PATCH /company/purchase/:creditId
router.patch("/purchase/:creditId", async (req, res) => {
  try {
    console.log("===== PURCHASE API INITIATED =====");
    const { creditId } = req.params;
    const { quantity, companyId } = req.body;

    console.log("\n===== PURCHASE API CALLED =====");
    console.log(`[INFO] Params => Credit ID: ${creditId}, Company ID: ${companyId}, Quantity: ${quantity}`);

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(creditId) || !mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ success: false, message: "Invalid ID(s)" });
    }

    // Fetch credit, company, and NGO
    const credit = await creditListingSchema.findById(creditId);
    const company = await Comp.findById(companyId);
    const ngo = await Ngo.findById(credit?.ngoId); // NGO is also a Comp
    console.log(`[INFO] Fetched Data => Credit: ${credit ? "Found" : "Not Found"}, Company: ${company ? "Found" : "Not Found"}, NGO: ${ngo ? "Found" : "Not Found"}`);

    if (!credit) return res.status(404).json({ success: false, message: "Credit not found" });
    if (!company) return res.status(404).json({ success: false, message: "Company not found" });
    if (!ngo) return res.status(404).json({ success: false, message: "NGO not found" });

    // Check credit availability
    if (credit.amount < quantity) {
      return res.status(400).json({ success: false, message: "Not enough credits available" });
    }

    console.log(`[INFO] Available credits before purchase: ${credit.amount}`);

    // 1️⃣ Reduce credits in marketplace
    credit.amount -= quantity;
    await credit.save();
    console.log(`[INFO] Credits left after purchase: ${credit.amount}`);

    // 2️⃣ Update company credits
    if (!company.credits) company.credits = { balance: 0, walletAddress: company.walletAddress, lastUpdated: new Date() };
    company.credits.balance += quantity;
    company.credits.lastUpdated = new Date();

    // Add transaction record for company
    if (!company.transactions) company.transactions = [];
    company.transactions.push({
      creditId: credit._id,
      quantity,
      pricePerUnit: credit.price,
      type: "PURCHASED",
      timestamp: new Date(),
    });
    await company.save();
    console.log(`[INFO] Company credits updated: Balance=${company.credits.balance}`);

    // 3️⃣ Update NGO credits
    if (!ngo.credits) ngo.credits = { balance: 0, walletAddress: ngo.walletAddress, lastUpdated: new Date() };
    ngo.credits.balance -= quantity; // Deduct the sold credits
    ngo.credits.lastUpdated = new Date();

    // Add transaction record for NGO
    if (!ngo.transactions) ngo.transactions = [];
    ngo.transactions.push({
      companyId: company._id,
      creditId,
      quantity,
      type: "SOLD_TO_COMPANY",
      date: new Date(),
    });
    await ngo.save();
    console.log(`[INFO] NGO credits updated: Balance=${ngo.credits.balance}`);

    res.json({ success: true, message: "Credits purchased successfully", company, credit, ngo });
    console.log("===== PURCHASE COMPLETED SUCCESSFULLY =====\n");

  } catch (err) {
    console.error("[ERROR] Purchasing credits failed:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// Payment routes for company purchases
router.post('/capture-payment', auth, isComp, captureCompanyPayment);
router.post('/verify-payment', auth, isComp, verifyCompanyPayment);





module.exports = router;
