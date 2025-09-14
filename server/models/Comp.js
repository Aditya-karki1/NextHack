const mongoose = require('mongoose');

const compSchema = new mongoose.Schema({
  // User fields
  name: { type: String, required: true },
  email: { type: String, unique: true, index: true, required: true },
  password: { type: String, required: true },
  role:{type:String,default:"Comp"} ,
  kycStatus: { type: String, enum: ['PENDING','VERIFIED','REJECTED'], default: 'PENDING' },
  createdAt: { type: Date, default: Date.now },

  // Organization fields (embedded directly inside user)
  organization: {
    name: { type: String },
    type: { type: String, enum: ['CORPORATE'] },
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

const Comp = mongoose.model('Comp', compSchema);

module.exports = Comp;