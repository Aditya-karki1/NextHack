const express = require("express");
const router = express.Router();

const {auth,isComp} = require("../middlewares/auth");
const {signupComp,loginComp} = require("../controllers/Auth");
const { createProject } = require('../controllers/Project');
const CarbonCredit = require("../models/CarbonCredit");
const creditListingSchema = require("../models/CreditListing");
const mongoose = require('mongoose');
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
    const { creditId } = req.params;
    const { quantity, companyId } = req.body;
    const tokensPerCredit = 1;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(creditId) || !mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ success: false, message: "Invalid ID(s)" });
    }

    // Fetch credit and company
    const credit = await creditListingSchema.findById(creditId).populate("ngoId");
    const company = await Comp.findById(companyId);
    const ngo = credit?.ngoId;

    if (!credit) return res.status(404).json({ success: false, message: "Credit not found" });
    if (!company) return res.status(404).json({ success: false, message: "Company not found" });
    if (!ngo) return res.status(404).json({ success: false, message: "NGO not found" });

    // Check credit availability
    if (credit.amount < quantity) {
      return res.status(400).json({ success: false, message: "Not enough credits available" });
    }

    // 1️⃣ Reduce credits in marketplace
    credit.amount -= quantity;
    await credit.save();

    // 2️⃣ Update company credits & transactions
    if (!company.credits) company.credits = { balance: 0, walletAddress: company.walletAddress, lastUpdated: new Date() };
    company.credits.balance += quantity;
    company.credits.lastUpdated = new Date();

    if (!company.transactions) company.transactions = [];
    company.transactions.push({
      creditId: credit._id,
      quantity,
      pricePerUnit: credit.price,
      type: "PURCHASED",
      timestamp: new Date(),
    });
    await company.save();
  console.log('ngo:', ngo);
  console.log('company:', company);
    // 3️⃣ Transfer tokens from NGO → Company on blockchain
    if (ngo.credits.walletAddress && company.credits.walletAddress) {
      try {
        console.log("Transferring tokens on blockchain from NGO to Company");
        const txHash = await blockchainService.transferCredits(
          ngo.credits.walletAddress,
          company.credits.walletAddress,
          quantity * tokensPerCredit
        );



        // Update NGO DB credits (decrement)
        if (!ngo.credits) ngo.credits = { balance: 0, walletAddress: ngo.organization.walletAddress, lastUpdated: new Date() };
        ngo.credits.balance -= quantity;
        ngo.credits.lastUpdated = new Date();

        // Record transaction
        if (!ngo.transactions) ngo.transactions = [];
        ngo.transactions.push({
          companyId: company._id,
          creditId,
          quantity,
          txHash,
          date: new Date(),
          type: "SOLD_TO_COMPANY",
        });

        if (!ngo.credits.txHistory) ngo.credits.txHistory = [];
        ngo.credits.txHistory.push({ creditId, txHash, quantity, date: new Date(), type: "SOLD_TO_COMPANY" });

        await ngo.save();
      } catch (err) {
        console.error("Blockchain transfer failed:", err.message);
        return res.status(500).json({ success: false, message: "Blockchain transfer failed" });
      }
    }

    res.json({ success: true, message: "Credits purchased successfully", company, credit, ngo });
  } catch (err) {
    console.error("Error purchasing credits:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Payment routes for company purchases
router.post('/capture-payment', auth, isComp, captureCompanyPayment);
router.post('/verify-payment', auth, isComp, verifyCompanyPayment);





module.exports = router;
