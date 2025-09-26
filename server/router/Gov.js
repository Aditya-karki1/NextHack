const express = require("express");
const router = express.Router();
const multer = require('multer');
const {auth,isGov} = require("../middlewares/auth");
const {signupGov,loginGov} = require("../controllers/Auth");
const { createProject,getAllNGOs,requestProject,getProjectReports, getAllProjects, assignProject  } = require('../controllers/Project');
const mongoose = require('mongoose');
const RestorationProject = require('../models/RestorationProject');
// Use memory storage
const MRVRecord = require("../models/MRVRecord");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const Ngo=require('../models/Ngo');
const blockchainService = require('../services/blockchainService');
router.post("/login", loginGov);

// Route for user signup
router.post("/signup", signupGov);
router.post(
  "/projects",
  upload.array("landImages", 5), // ✅ Multer runs FIRST
  (req, res, next) => {
    console.log("✅ Files received:", req.files?.length || 0);
    next();
  },
  auth, // ✅ Auth after files parsed
  (req, res, next) => {
    console.log("✅ Authenticated User:", req.user?.id || "No user");
    next();
  },
  createProject
);

 // your contract interaction service
router.patch("/reports/:reportId/status", async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;
    const tokensPerTree = 10; // Fixed token rate per tree

    console.log("Updating report status:", reportId, status);

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ success: false, message: "Invalid report ID" });
    }

    const report = await MRVRecord.findById(reportId);
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });

    report.status = status;
    await report.save();
    console.log("Report status updated in DB:", status);

    if (status === "Verified") {
      if (report.projectId) {
        const project = await RestorationProject.findById(report.projectId);
        if (project && project.status !== "Verified") {
          project.status = "Verified";
          await project.save();
          console.log("Project marked as Verified:", project._id);
        }
      }

      if (report.userId) {
        const ngo = await Ngo.findById(report.userId);
        if (!ngo) return res.status(404).json({ success: false, message: "NGO not found" });
        if (!ngo.credits || !ngo.credits.walletAddress)
          return res.status(400).json({ success: false, message: "NGO wallet address missing" });

        const dataHash = `${report._id}-${report.treeCount}-${report.dateReported.getTime()}`;
        console.log("Data hash for blockchain:", dataHash);

        try {
          const txHash = await blockchainService.addMRVAndVerify(
            report._id.toString(),
            dataHash,
            report.treeCount,
            ngo.credits.walletAddress,
            tokensPerTree
          );

          console.log("Blockchain transaction successful:", txHash);

          report.blockchainTx = txHash;
          await report.save();

          // ✅ Fetch actual on-chain balance
          const actualBalance = await blockchainService.getBalance(ngo.credits.walletAddress);
          console.log("Actual on-chain NGO balance:", actualBalance);

          // Update local DB with actual on-chain balance
          ngo.credits.balance = parseFloat(actualBalance);
          ngo.credits.lastUpdated = new Date();
          await ngo.save();

          console.log("NGO token balance updated in DB:", ngo.credits.balance);
        } catch (err) {
          console.error("Blockchain error:", err.message);
          return res.status(500).json({ success: false, message: "Blockchain transaction failed" });
        }
      }
    }

    res.json({ success: true, report });
  } catch (err) {
    console.error("Error updating report status:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/ngos", getAllNGOs);
router.get("/projects", getAllProjects);
router.put(
  "/projects/:id/assign", // use PUT instead of POST
  auth,                   // authenticate the user
  isGov,                  // only government users can assign
  assignProject            // controller
);
router.patch('/project/:projectId/status', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.body;
    console.log("Updating project status:", projectId, status);

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID' });
    }

    // Only allow valid statuses
    // const validStatuses = ['Created', 'Assigned', 'InProgress', 'Completed', 'Verified'];
    // if (!validStatuses.includes(status)) {
    //   return res.status(400).json({ success: false, message: 'Invalid status value' });
    // }

    // Update project
    const project = await RestorationProject.findByIdAndUpdate(
      projectId,
      { status },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, project });
  } catch (err) {
    console.error('Error updating project status:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get("/projects/:id", async (req, res) => {
  const project = await RestorationProject.findById(req.params.id); // mongoose model
  res.json({ project });
});
router.post('/projects/:id/analysis', async (req, res) => {
  const { greenCover, idleLand } = req.body;
  const project = await RestorationProject.findByIdAndUpdate(
    req.params.id,
    { greeneryPercentage: greenCover },
    { new: true }
  );
  res.json({ success: true, project });
});
// New route for an NGO to request a project
router.put("/projects/:id/request", requestProject);
router.get("/projects/:projectId/reports", auth, isGov, getProjectReports);
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
