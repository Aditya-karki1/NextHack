const mongoose = require('mongoose');

const mrvSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'RestorationProject' },
  // For front-end mock/task ids or external references that are not ObjectId
  externalProjectId: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dateReported: Date,
  treeCount: Number,
  droneImages: [String], // stored in S3 / IPFS
  status: { type: String, enum: ['Pending','Validated','Rejected'] },
  blockchainTx: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MRVRecord', mrvSchema);
