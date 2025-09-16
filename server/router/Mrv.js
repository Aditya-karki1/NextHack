const express = require('express');
const router = express.Router();
const { auth, isNgo } = require('../middlewares/auth');
const { submitMRV, validateMRV, getByProject, getByUser } = require('../controllers/Mrv');

const allowUnauth = process.env.ALLOW_UNAUTH_MRV === 'true';

if (allowUnauth) {
  // For debugging/testing: allow unauthenticated MRV submissions
  router.post('/submit', submitMRV);
} else {
  router.post('/submit', auth, isNgo, submitMRV);
}

router.post('/validate', auth, validateMRV);
// Public/read routes
router.get('/project/:id', getByProject);
router.get('/user/:id', auth, getByUser);

module.exports = router;
