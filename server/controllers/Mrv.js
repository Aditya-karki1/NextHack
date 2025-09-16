const MRVRecord = require('../models/MRVRecord');
const blockchainService = require('../services/blockchainService');
const cloudinary = require('../config/cloudinary');

exports.submitMRV = async (req, res) => {
  try {
    // Expect multipart/form-data
    // fields: projectId, userId, dateReported, treeCount, status
    // files: droneImages (array)
  const { projectId: bodyProjectId, userId: bodyUserId, dateReported, treeCount } = req.body;

  // Prefer authenticated user id if available
  const userId = req.user ? (req.user._id || req.user.id || req.user.userId) : (bodyUserId || null);
  const projectId = bodyProjectId;

  if (!projectId) return res.status(400).json({ message: 'projectId is required' });
  if (!userId) return res.status(401).json({ message: 'userId missing or unauthenticated' });

    // Upload files (if any) to Cloudinary
    const droneImages = [];
    if (req.files && req.files.droneImages) {
      const files = Array.isArray(req.files.droneImages) ? req.files.droneImages : [req.files.droneImages];
      for (const f of files) {
        const upload = await cloudinary.uploader.upload(f.tempFilePath || f.data, {
          folder: 'mrv',
          resource_type: 'auto',
        });
        droneImages.push(upload.secure_url);
      }
    }

    const recordData = {
      projectId: null,
      externalProjectId: null,
      userId,
      dateReported: dateReported || Date.now(),
      treeCount: treeCount ? Number(treeCount) : undefined,
      droneImages,
      // Always start as Pending; verifier will set Validated/Rejected
      status: 'Pending'
    };

    // Accept either a Mongo ObjectId (projectId) or an external string id
    const isObjectId = (val) => {
      try { return require('mongoose').Types.ObjectId.isValid(val); } catch (e) { return false; }
    };

    if (projectId && isObjectId(projectId)) {
      recordData.projectId = projectId;
    } else if (projectId) {
      // not an ObjectId but provided: save as externalProjectId
      recordData.externalProjectId = projectId;
    }

    const record = await MRVRecord.create(recordData);

    // Optionally push to async queue for AI verification / blockchain issuance
    const txHash = await blockchainService.issueCredit(record._id, record.userId, record.treeCount);
    record.blockchainTx = txHash;
    await record.save();

    res.status(201).json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Failed to submit MRV' });
  }
};

exports.validateMRV = async (req, res) => {
  const { recordId, status } = req.body;
  const record = await MRVRecord.findByIdAndUpdate(recordId, { status }, { new: true });
  res.json(record);
};

// Get MRV records by project identifier (accepts ObjectId or externalProjectId)
exports.getByProject = async (req, res) => {
  try {
    const projectKey = req.params.id;
    const mongoose = require('mongoose');
    const isObjectId = mongoose.Types.ObjectId.isValid(projectKey);
    const query = isObjectId ? { projectId: projectKey } : { externalProjectId: projectKey };
    const records = await MRVRecord.find(query).sort({ createdAt: -1 });
    res.json({ records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Failed to fetch MRV records' });
  }
};

// Get MRV records by user id
exports.getByUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const records = await MRVRecord.find({ userId }).sort({ createdAt: -1 });
    res.json({ records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Failed to fetch MRV records' });
  }
};
