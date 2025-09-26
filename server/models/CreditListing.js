// models/CreditListing.js
const mongoose = require("mongoose");

const creditListingSchema = new mongoose.Schema({
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: "Ngo", required: true },
  amount: { type: Number, required: true },
  price: { type: Number, required: true },
  status: { type: String, default: "FOR_SALE" }, // FOR_SALE, SOLD, CANCELLED
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CreditListing", creditListingSchema);
