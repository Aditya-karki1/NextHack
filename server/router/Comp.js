const express = require("express");
const router = express.Router();

const {auth,isComp} = require("../middlewares/auth");
const {signupComp,loginComp} = require("../controllers/Auth");
const { createProject } = require('../controllers/Project');
const { parseUnits } = require("ethers");
const CarbonCredit = require("../models/CarbonCredit");
const creditListingSchema = require("../models/CreditListing");
const mongoose = require('mongoose');
const Ngo = require("../models/Ngo");
const Comp = require("../models/Comp");
const blockchainService = require('../services/blockchainService');
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
// PATCH /company/purchase/:creditId
// PATCH /company/purchase/:creditId
// router.patch("/purchase/:creditId", async (req, res) => {
//   try {
//     const { creditId } = req.params;
//     const { quantity, companyId } = req.body;
//     const tokensPerCredit = 1;

//     console.log("\n===== PURCHASE API CALLED =====");
//     console.log("Credit ID:", creditId, "Company ID:", companyId, "Quantity:", quantity);

//     // Validate IDs
//     if (!mongoose.Types.ObjectId.isValid(creditId) || !mongoose.Types.ObjectId.isValid(companyId)) {
//       return res.status(400).json({ success: false, message: "Invalid ID(s)" });
//     }

//     // Fetch credit, company, and NGO
//     const credit = await creditListingSchema.findById(creditId).populate("ngoId");
//     const company = await Comp.findById(companyId);
//     const ngo = credit?.ngoId;

//     if (!credit) return res.status(404).json({ success: false, message: "Credit not found" });
//     if (!company) return res.status(404).json({ success: false, message: "Company not found" });
//     if (!ngo) return res.status(404).json({ success: false, message: "NGO not found" });

//     // Check credit availability in marketplace
//     if (credit.amount < quantity) {
//       return res.status(400).json({ success: false, message: "Not enough credits available" });
//     }

//     console.log("Available credits before purchase:", credit.amount);

//     // 1️⃣ Reduce credits in marketplace
//     credit.amount -= quantity;
//     await credit.save();
//     console.log("Credits left after purchase:", credit.amount);

//     // 2️⃣ Update company credits & transactions locally
//     if (!company.credits) company.credits = { balance: 0, walletAddress: company.walletAddress, lastUpdated: new Date() };
//     company.credits.balance += quantity;
//     company.credits.lastUpdated = new Date();

//     if (!company.transactions) company.transactions = [];
//     company.transactions.push({
//       creditId: credit._id,
//       quantity,
//       pricePerUnit: credit.price,
//       type: "PURCHASED",
//       timestamp: new Date(),
//     });
//     await company.save();

//     console.log("Company Wallet:", company.credits.walletAddress);
//     console.log("NGO Wallet:", ngo.credits?.walletAddress);

//     // 3️⃣ Transfer tokens from NGO → Company on blockchain
//     if (ngo.credits?.walletAddress && company.credits.walletAddress) {
//       try {
//         // ✅ Get actual on-chain NGO balance
//         const actualNGOBalance = await blockchainService.getBalance(ngo.credits.walletAddress);
//         console.log("Actual NGO balance on chain:", actualNGOBalance);

//         // Convert purchase amount to BigNumber in wei (18 decimals)
//         const amountToSend = parseUnits((quantity * tokensPerCredit).toString(), 18);

//         if (parseFloat(actualNGOBalance) < quantity * tokensPerCredit) {
//           return res.status(400).json({ success: false, message: "Insufficient balance on-chain" });
//         }

//         console.log("Initiating Blockchain Transfer...");
//         const txHash = await blockchainService.transferCredits(
//           company.credits.walletAddress,
//           amountToSend // ✅ pass BigNumber in wei
//         );

//         console.log("Blockchain Transfer Success, Tx Hash:", txHash);

//         // ✅ Update NGO credits locally based on actual blockchain balance
//         ngo.credits.balance = parseFloat(actualNGOBalance) - quantity * tokensPerCredit;
//         ngo.credits.lastUpdated = new Date();

//         // Record NGO transaction
//         if (!ngo.transactions) ngo.transactions = [];
//         ngo.transactions.push({
//           companyId: company._id,
//           creditId,
//           quantity,
//           txHash,
//           date: new Date(),
//           type: "SOLD_TO_COMPANY",
//         });

//         if (!ngo.credits.txHistory) ngo.credits.txHistory = [];
//         ngo.credits.txHistory.push({ creditId, txHash, quantity, date: new Date(), type: "SOLD_TO_COMPANY" });

//         await ngo.save();
//       } catch (err) {
//         console.error("Blockchain transfer failed:", err.message);
//         return res.status(500).json({ success: false, message: "Blockchain transfer failed", error: err.message });
//       }
//     } else {
//       return res.status(400).json({ success: false, message: "Missing Wallet Address for NGO or Company" });
//     }

//     console.log("===== PURCHASE COMPLETED SUCCESSFULLY =====\n");
//     res.json({ success: true, message: "Credits purchased successfully", company, credit, ngo });
//   } catch (err) {
//     console.error("Error purchasing credits:", err);
//     res.status(500).json({ success: false, message: "Server error", error: err.message });
//   }
// });

router.patch("/purchase/:creditId", async (req, res) => {
  try {
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



module.exports = router;
