const MRVRecord = require('../models/MRVRecord');
const blockchainService = require('../services/blockchainService');

exports.submitMRV = async (req, res) => {
  const record = await MRVRecord.create(req.body);

  // Optionally push to async queue for AI verification / blockchain issuance
  const txHash = await blockchainService.issueCredit(record._id, record.userId, record.treeCount);
  record.blockchainTx = txHash;
  await record.save();

  res.json(record);
};

exports.validateMRV = async (req, res) => {
  const { recordId, status } = req.body;
  const record = await MRVRecord.findByIdAndUpdate(recordId, { status }, { new: true });
  res.json(record);
};
