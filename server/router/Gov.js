const express = require("express");
const router = express.Router();
const multer = require('multer');
const {auth,isGov} = require("../middlewares/auth");
const {signupGov,loginGov} = require("../controllers/Auth");
const { createProject,getAllNGOs,requestProject,getProjectReports, getAllProjects, assignProject  } = require('../controllers/Project');
const mongoose = require('mongoose');
const RestorationProject = require('../models/RestorationProject');
// Use memory storage
const sharp = require("sharp");
const axios = require("axios");
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

          //  Fetch actual on-chain balance
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
router.post("/gemini/analyze-image", upload.single("image"), async (req, res) => {
  try {
    console.log("Received image for analysis");
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    // Resize image to max 512x512 for Gemini
    const resizedBuffer = await sharp(req.file.buffer)
      .resize(512, 512, { fit: "inside" })
      .toBuffer();

    const base64Image = resizedBuffer.toString("base64");
    const mimeType = req.file.mimetype; // Use the actual mime type

    // --- CORRECTION APPLIED HERE ---
    // The contents array must contain two parts: the image and the text prompt.
    const contents = [
      {
        parts: [
          // 1. The image part (separate from text)
          {
            inlineData: {
              data: base64Image, // The actual image data
              mimeType: mimeType
            }
          },
          // 2. The text prompt part (separate from image)
          {
            text: `Count the number of trees and estimate the greenery percentage. DO NOT attempt to generate bounding box data (x1, y1, x2, y2). ONLY respond with valid JSON exactly in this format: 
                { "treeCount": number, "greeneryPercentage": number, "co2Level": number } and nothing else.`
          }
        ]
      }
    ];
    // -------------------------------

    // Send resized image and prompt to Gemini
    const geminiResponse = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      { contents: contents }, // Use the correctly formatted 'contents'
      {
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": process.env.GEMINI_API_KEY
        }
      }
    );

    let analysisText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    console.log("Gemini raw response:", analysisText);

    // Extract JSON safely
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("No JSON found in Gemini response");
      // Note: Removed 'boxes' since the model isn't expected to provide it
      return res.json({ treeCount: 0, greeneryPercentage: 0, co2Level: 0 }); 
    }

    let analysis;
    try {
      analysis = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", e);
      return res.json({ treeCount: 0, greeneryPercentage: 0, co2Level: 0 });
    }

    // Ensure required fields exist
    analysis.treeCount = analysis.treeCount ?? 0;
    analysis.greeneryPercentage = analysis.greeneryPercentage ?? 0;
    analysis.co2Level = analysis.co2Level ?? 0;
    // analysis.boxes is now removed from expectation

    // Add back an empty 'boxes' array to satisfy the frontend interface if needed
    // You MUST update the frontend interface or remove 'boxes' from the response if you don't use it.
    analysis.boxes = []; 

    res.json(analysis);
  } catch (err) {
    console.error("Gemini analysis error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to analyze image" });
  }
});

router.post("/:projectId/analysis", async (req, res) => {
  try {
    const { treeCount, greeneryPercentage, co2Level } = req.body;
  console.log("Received analysis data:", { treeCount, greeneryPercentage, co2Level });
    const project = await RestorationProject.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Update project metrics
    project.greeneryPercentage = greeneryPercentage;
    project.co2Level = co2Level;
    project.lastTreeCount = treeCount; // optional field to store last analyzed tree count
    await project.save();
    console.log("Project analysis updated:", project);
    
    res.json({ message: "Analysis saved successfully", project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save analysis" });
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
