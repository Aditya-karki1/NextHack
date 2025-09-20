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

  // // Subscription fields
  // subscription: {
  //   plan: { type: String, enum: ['MONTHLY', 'YEARLY'], default: 'MONTHLY' },
  //   startDate: { type: Date, default: Date.now },
  //   endDate: { type: Date }, // auto-calculated based on plan
  //   isActive: { type: Boolean, default: true }
  // },

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

// Method to check if subscription is expired
ngoSchema.methods.isSubscriptionActive = function () {
  if (!this.subscription.endDate) return false;
  return new Date() <= new Date(this.subscription.endDate);
};

// Middleware: Automatically set endDate based on plan
ngoSchema.pre('save', function (next) {
  if (this.isModified('subscription.plan') || this.isNew) {
    const startDate = this.subscription.startDate || new Date();
    this.subscription.startDate = startDate;
    if (this.subscription.plan === 'MONTHLY') {
      this.subscription.endDate = new Date(startDate.setMonth(startDate.getMonth() + 1));
    } else if (this.subscription.plan === 'YEARLY') {
      this.subscription.endDate = new Date(startDate.setFullYear(startDate.getFullYear() + 1));
    }
  }
  next();
});

const Ngo = mongoose.model('Ngo', ngoSchema);

module.exports = Ngo;
