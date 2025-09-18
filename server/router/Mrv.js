const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth, isNgo } = require('../middlewares/auth');
const { submitMRV, validateMRV, getByProject, getByUser } = require('../controllers/Mrv');

// Multer setup for in-memory file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Environment flag to allow unauthenticated MRV submissions (for testing)
const allowUnauth = process.env.ALLOW_UNAUTH_MRV === 'true';

// MRV Submission route
if (allowUnauth) {
  // Allow unauthenticated submissions for testing/debugging
  router.post('/submit', upload.array('droneImages'), submitMRV);
} else {
  // Authenticated NGO submissions
  router.post('/submit', auth, isNgo, upload.array('droneImages'), submitMRV);
}

// Validate MRV record (authenticated route)
router.post('/validate', auth, validateMRV);

// Fetch MRV records by project (public)
router.get('/project/:id', getByProject);

// Fetch MRV records by user (authenticated)
router.get('/user/:id', auth, getByUser);

module.exports = router;
