const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  creditId: { type: mongoose.Schema.Types.ObjectId, ref: 'CarbonCredit' },
  amountPaid: Number,
  txStatus: { type: String, enum: ['Pending','Completed','Failed'] },
  blockchainTx: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
