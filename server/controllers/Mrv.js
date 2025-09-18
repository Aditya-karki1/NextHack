const MRVRecord = require('../models/MRVRecord');
const RestorationProject = require('../models/RestorationProject');
const blockchainService = require('../services/blockchainService');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');

exports.submitMRV = async (req, res) => {
  try {
    const { projectId: bodyProjectId, userId: bodyUserId, dateReported, treeCount } = req.body;

    // Determine userId from auth middleware or request body
    const userId = req.user ? (req.user._id || req.user.id || req.user.userId) : bodyUserId;
    if (!userId) return res.status(401).json({ message: 'User ID missing or unauthenticated' });
    if (!bodyProjectId) return res.status(400).json({ message: 'projectId is required' });

    // Upload drone images if provided
    const droneImages = [];
    if (req.files && req.files.droneImages) {
      const files = Array.isArray(req.files.droneImages) ? req.files.droneImages : [req.files.droneImages];
      for (const f of files) {
        const upload = await cloudinary.uploader.upload(f.tempFilePath || f.data, {
          folder: 'mrv',
          resource_type: 'auto'
        });
        droneImages.push(upload.secure_url);
      }
    }

    // Prepare MRV record data
    const recordData = {
      projectId: null,
      externalProjectId: null,
      userId,
      dateReported: dateReported ? new Date(dateReported) : new Date(),
      treeCount: treeCount ? Number(treeCount) : 0,
      droneImages,
      status: 'Pending'
    };

    // Check if projectId is a valid MongoDB ObjectId
    const isObjectId = mongoose.Types.ObjectId.isValid(bodyProjectId);
    if (isObjectId) {
      recordData.projectId = bodyProjectId;
    } else {
      recordData.externalProjectId = bodyProjectId;
    }

    // Create MRV record
    const record = await MRVRecord.create(recordData);

    // Push MRV record ID to RestorationProject.hasMRVReport if applicable
    if (record.projectId) {
      await RestorationProject.findByIdAndUpdate(
        record.projectId,
        { $push: { hasMRVReport: record._id } },
        { new: true, upsert: true } // Ensure field exists
      );
    }

    // Issue carbon credit on blockchain (optional)
    try {
      const txHash = await blockchainService.issueCredit(record._id, record.userId, record.treeCount);
      record.blockchainTx = txHash;
      await record.save();
    } catch (blockchainErr) {
      console.error('Blockchain issuance failed:', blockchainErr.message);
    }

    res.status(201).json({ success: true, record });
  } catch (err) {
    console.error('submitMRV error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to submit MRV' });
  }
};
