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
router.patch('/reports/:reportId/status', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, amount } = req.body; // <-- include amount

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    // Build the update object dynamically
    const updateData = {};
    if (status) updateData.status = status;
    if (amount !== undefined) updateData.amount = amount; // optional update

    // Update MRV report
    const report = await MRVRecord.findByIdAndUpdate(
      reportId,
      updateData,
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // If report is verified, update the parent project's status
    if (status === 'Verified' && report.projectId) {
      const project = await RestorationProject.findById(report.projectId);
      if (project && project.status !== 'Verified') {
        project.status = 'Verified';
        await project.save();
      }
    }

    // Update NGO credits if amount is provided
    if (amount !== undefined && report.userId) {
      const ngo = await Ngo.findById(report.userId);
      if (ngo) {
        ngo.credits.balance += amount;
        ngo.credits.lastUpdated = new Date();
        await ngo.save();
      }
    }

    res.json({ success: true, report });
  } catch (err) {
    console.error('Error updating report status:', err);
    res.status(500).json({ success: false, message: 'Server error' });
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
