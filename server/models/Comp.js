const mongoose = require('mongoose');

const compSchema = new mongoose.Schema({
  // User fields
  name: { type: String, required: true },
  email: { type: String, unique: true, index: true, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "Comp" },
  kycStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
  createdAt: { type: Date, default: Date.now },

  // Wallet & On-chain Credits
  credits: {
    balance: { type: Number, default: 0 }, // Total tokens allocated
    walletAddress: { type: String },       // Company blockchain wallet
    lastUpdated: { type: Date, default: Date.now }
  },

  // Organization fields (embedded)
  organization: {
    name: { type: String },
    type: { type: String, enum: ['CORPORATE'] },
    address: { type: String },
    geoBoundary: { type: Object }, // Optional GeoJSON
    contact: {
      phone: { type: String },
      email: { type: String }
    },
    documents: [
      {
        cid: { type: String },
        filename: { type: String }
      }
    ],
    orgCreatedAt: { type: Date, default: Date.now }
  },

  // Previous transactions
  transactions: [
    {
      creditId: { type: mongoose.Schema.Types.ObjectId, ref: 'Credit', required: true },
      quantity: { type: Number, required: true },
      pricePerUnit: { type: Number, required: true },
      type: { type: String, enum: ['PURCHASED', 'RETIRED'], required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ]
});

const Comp = mongoose.model('Comp', compSchema);

module.exports = Comp;
