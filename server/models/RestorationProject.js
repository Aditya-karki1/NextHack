const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },  // Added project title

  governmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
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
  status: { type: String, enum: ['Assigned', 'InProgress', 'Completed', 'Verified'], default: 'Assigned' },

  // Optional fields
  landImages: [{ type: String }],          // Array of image URLs (Cloudinary / S3 / IPFS)
  greeneryPercentage: { type: Number },    // Optional: 0-100
  co2Level: { type: Number },              // Optional: measured CO2 level in the area

  createdAt: { type: Date, default: Date.now }
});

// Optional: create 2dsphere index for geospatial queries
projectSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('RestorationProject', projectSchema);
