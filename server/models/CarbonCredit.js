const mongoose = require('mongoose');

const creditSchema = new mongoose.Schema({
  recordId: { type: mongoose.Schema.Types.ObjectId, ref: 'MRVRecord' },
  issuedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amountTCO2: Number,
  tokenId: String,
  status: { type: String, enum: ['Available','Sold','Redeemed'] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CarbonCredit', creditSchema);
