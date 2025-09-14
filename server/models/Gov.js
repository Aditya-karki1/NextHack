const mongoose = require("mongoose");


const govSchemna = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, unique: true, index: true, required: true },
        password: { type: String, required: true },
        role: { type: String, default:"GOV"},
        createdAt: { type: Date, default: Date.now },
        contact:{type:String}

    }
);


module.exports = mongoose.model("Gov", govSchemna);