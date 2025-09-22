const mongoose = require('mongoose');

const ngoSchema = new mongoose.Schema({
  // User fields
  name: { type: String, required: true },
  email: { type: String, unique: true, index: true, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "NGO" },
  kycStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
  createdAt: { type: Date, default: Date.now },

  credits: {
    balance: { type: Number, default: 0 }, // Current token balance
    walletAddress: { type: String },       // Optional: linked blockchain wallet
    lastUpdated: { type: Date, default: Date.now }
  },

  // Organization fields (embedded directly inside user)
  organization: {
    name: { type: String },
    type: { type: String, enum: ['NGO','SOCIETY','COMMUNITY'] },
    address: { type: String },
    geoBoundary: { type: Object }, // GeoJSON optional
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
  }
});

const Ngo = mongoose.model('Ngo', ngoSchema);

module.exports = Ngo;
