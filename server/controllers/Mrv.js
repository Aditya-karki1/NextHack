const MRVRecord = require("../models/MRVRecord");
const RestorationProject = require("../models/RestorationProject");
const blockchainService = require("../services/blockchainService");
const cloudinary = require("../config/cloudinary");
const mongoose = require("mongoose");

exports.submitMRV = async (req, res) => {
  try {
    const {
      projectId: bodyProjectId,
      userId: bodyUserId,
      dateReported,
      treeCount,
    } = req.body;

    // Determine userId from auth middleware or request body
    const userId = req.user
      ? req.user._id || req.user.id || req.user.userId
      : bodyUserId;
    if (!userId)
      return res
        .status(401)
        .json({ message: "User ID missing or unauthenticated" });
    if (!bodyProjectId)
      return res.status(400).json({ message: "projectId is required" });
    console.log(req.body);
    // Upload drone images if provided
    console.log("Files received:", req.files);
    const droneImages = [];
    if (req.files && req.files.length > 0) {
  for (const f of req.files) {
    // Convert buffer to base64 data URI
    const dataUri = `data:${f.mimetype};base64,${f.buffer.toString('base64')}`;
    const upload = await cloudinary.uploader.upload(dataUri, {
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
      status: "Pending",
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
      const txHash = await blockchainService.issueCredit(
        record._id,
        record.userId,
        record.treeCount
      );
      record.blockchainTx = txHash;
      await record.save();
    } catch (blockchainErr) {
      console.error("Blockchain issuance failed:", blockchainErr.message);
    }

    res.status(201).json({ success: true, record });
  } catch (err) {
    console.error("submitMRV error:", err);
    res
      .status(500)
      .json({ success: false, message: err.message || "Failed to submit MRV" });
  }
};

exports.validateMRV = async (req, res) => {
  const { recordId, status } = req.body;
  const record = await MRVRecord.findByIdAndUpdate(
    recordId,
    { status },
    { new: true }
  );
  res.json(record);
};

// Get MRV records by project identifier (accepts ObjectId or externalProjectId)
exports.getByProject = async (req, res) => {
  try {
    const projectKey = req.params.id;
    const mongoose = require("mongoose");
    const isObjectId = mongoose.Types.ObjectId.isValid(projectKey);
    const query = isObjectId
      ? { projectId: projectKey }
      : { externalProjectId: projectKey };
    const records = await MRVRecord.find(query).sort({ createdAt: -1 });
    res.json({ records });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: err.message || "Failed to fetch MRV records" });
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
    res
      .status(500)
      .json({ message: err.message || "Failed to fetch MRV records" });
  }
};
