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

// ===============================================
// NEW COMPANY PROFILE & VERIFICATION ROUTES
// ===============================================

// Get company profile by ID
router.get("/profile/:companyId", auth, async (req, res) => {
  try {
    const { companyId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID"
      });
    }

    const company = await Comp.findById(companyId).select('-password');
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    res.status(200).json({
      success: true,
      company: company
    });

  } catch (error) {
    console.error("Error fetching company profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch company profile",
      error: error.message
    });
  }
});

// Update company profile
router.put("/profile/:companyId", auth, isComp, async (req, res) => {
  try {
    const { companyId } = req.params;
    const updateData = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID"
      });
    }

    // Remove sensitive fields from update
    delete updateData.password;
    delete updateData.email; // Email changes require separate verification
    delete updateData.kycStatus; // KYC status is managed separately

    const updatedCompany = await Comp.findByIdAndUpdate(
      companyId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedCompany) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      company: updatedCompany
    });

  } catch (error) {
    console.error("Error updating company profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message
    });
  }
});

// Submit company verification
router.post("/verify/:companyId", auth, isComp, async (req, res) => {
  try {
    const { companyId } = req.params;
    const {
      organizationName,
      organizationType,
      address,
      phone,
      registrationNumber,
      panNumber,
      taxId,
      contactPersonName,
      contactPersonDesignation,
      website,
      businessDescription,
      employeeCount,
      incorporationDate
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID"
      });
    }

    const company = await Comp.findById(companyId);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    // Check if already verified
    if (company.kycStatus === 'VERIFIED') {
      return res.status(400).json({
        success: false,
        message: "Company is already verified"
      });
    }

    // Update company with verification details
    const verificationData = {
      kycStatus: 'VERIFIED', // Auto-verify for demo purposes
      organization: {
        name: organizationName,
        type: organizationType || 'CORPORATE',
        address: address,
        contact: {
          phone: phone,
          email: company.email
        }
      },
      registrationNumber,
      panNumber,
      taxId,
      contactPersonName,
      contactPersonDesignation,
      website,
      businessDescription,
      employeeCount: parseInt(employeeCount) || 0,
      incorporationDate: incorporationDate ? new Date(incorporationDate) : undefined
    };

    const updatedCompany = await Comp.findByIdAndUpdate(
      companyId,
      { $set: verificationData },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: "Company verification completed successfully",
      company: updatedCompany
    });

  } catch (error) {
    console.error("Error verifying company:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify company",
      error: error.message
    });
  }
});

// Get company portfolio (purchased and retired credits)
router.get("/portfolio/:companyId", auth, async (req, res) => {
  try {
    const { companyId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID"
      });
    }

    const company = await Comp.findById(companyId)
      .populate('transactions.creditId', 'ngoId price')
      .select('transactions credits');
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    // Separate purchased and retired credits
    const purchased = [];
    const retired = [];
    let totalSpent = 0;

    if (company.transactions && company.transactions.length > 0) {
      for (const transaction of company.transactions) {
        const creditData = {
          _id: transaction._id,
          amount: transaction.quantity,
          price: transaction.pricePerUnit,
          ngoId: transaction.creditId?.ngoId || null,
          createdAt: transaction.timestamp
        };

        totalSpent += transaction.quantity * transaction.pricePerUnit;

        if (transaction.type === 'PURCHASED') {
          purchased.push(creditData);
        } else if (transaction.type === 'RETIRED') {
          retired.push(creditData);
        }
      }
    }

    // Get NGO details for the credits
    const ngoIds = [...purchased, ...retired]
      .map(credit => credit.ngoId)
      .filter(Boolean);

    const ngos = await Ngo.find({ _id: { $in: ngoIds } })
      .select('name email organization');

    // Map NGO details to credits
    const mapNgoDetails = (credits) => {
      return credits.map(credit => {
        const ngo = ngos.find(n => n._id.toString() === credit.ngoId?.toString());
        return {
          ...credit,
          ngoId: ngo ? {
            _id: ngo._id,
            name: ngo.name,
            email: ngo.email,
            organization: ngo.organization
          } : null
        };
      });
    };

    res.status(200).json({
      success: true,
      purchased: mapNgoDetails(purchased),
      retired: mapNgoDetails(retired),
      totalSpent,
      carbonReduction: retired.reduce((sum, credit) => sum + credit.amount, 0),
      availableCredits: company.credits?.balance || 0
    });

  } catch (error) {
    console.error("Error fetching company portfolio:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch portfolio",
      error: error.message
    });
  }
});

// Retire credits
router.post("/retire-credits/:companyId", auth, isComp, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { creditId, quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(companyId) || !mongoose.Types.ObjectId.isValid(creditId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID(s)"
      });
    }

    const company = await Comp.findById(companyId);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    // Check if company has enough credits
    if (!company.credits || company.credits.balance < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient credits to retire"
      });
    }

    // Find the original purchase transaction
    const purchaseTransaction = company.transactions.find(
      t => t.creditId.toString() === creditId && t.type === 'PURCHASED'
    );

    if (!purchaseTransaction) {
      return res.status(404).json({
        success: false,
        message: "Purchase transaction not found"
      });
    }

    // Update company credits
    company.credits.balance -= quantity;
    company.credits.lastUpdated = new Date();

    // Add retirement transaction
    company.transactions.push({
      creditId: creditId,
      quantity: quantity,
      pricePerUnit: purchaseTransaction.pricePerUnit,
      type: "RETIRED",
      timestamp: new Date()
    });

    await company.save();

    res.status(200).json({
      success: true,
      message: "Credits retired successfully",
      remainingBalance: company.credits.balance
    });

  } catch (error) {
    console.error("Error retiring credits:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retire credits",
      error: error.message
    });
  }
});

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
