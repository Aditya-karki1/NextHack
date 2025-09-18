const express = require("express");
const router = express.Router();
const multer = require('multer');
const {auth,isGov} = require("../middlewares/auth");
const {signupGov,loginGov} = require("../controllers/Auth");
const { createProject,getAllNGOs,requestProject, getAllProjects, assignProject  } = require('../controllers/Project');

const RestorationProject = require('../models/RestorationProject');
// Use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

router.get("/ngos", getAllNGOs);
router.get("/projects", getAllProjects);
router.put(
  "/projects/:id/assign", // use PUT instead of POST
  auth,                   // authenticate the user
  isGov,                  // only government users can assign
  assignProject            // controller
);
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
