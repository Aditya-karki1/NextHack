const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },

  governmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Government', required: true },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ngo' },

  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number],  // [longitude, latitude]
      required: true
    }
  },

  areaHectares: { type: Number, required: true },
  targetTrees: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  status: { type: String, enum: ['Created', 'Assigned', 'InProgress', 'Completed', 'UnderVerification', 'Verified'], default: 'Created' },

  requestedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ngo' }],

  landImages: [{ type: String }],
  greeneryPercentage: { type: Number },
  co2Level: { type: Number },

  // NEW: Array of MRV record IDs
  hasMRVReport: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MRVRecord' }],

  createdAt: { type: Date, default: Date.now }
});

projectSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('RestorationProject', projectSchema);
