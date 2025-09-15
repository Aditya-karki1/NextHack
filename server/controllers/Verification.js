const Ngo = require("../models/Ngo");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

exports.verifyNgo = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(userId)

        // Find NGO by user ID
        const ngo = await Ngo.findById(userId);
        if (!ngo) {
            return res.status(404).json({ success: false, message: "NGO not found" });
        }

        let uploadedDocs = [];

        // Handle file uploads
        if (req.files && req.files.documents) {
            const files = Array.isArray(req.files.documents)
                ? req.files.documents
                : [req.files.documents];

            for (const file of files) {
                const uploadedFile = await cloudinary.uploader.upload(file.tempFilePath, {
                    folder: "ngo_documents",
                    resource_type: "auto",
                });

                uploadedDocs.push({
                    cid: uploadedFile.public_id,
                    filename: uploadedFile.secure_url,
                });

                // Delete temp file after upload
                fs.unlinkSync(file.tempFilePath);
            }
        }

        // Update NGO organization info
        ngo.organization = {
            name: req.body.organizationName || "",
            type: req.body.organizationType || "NGO",
            address: req.body.organizationAddress || "",
            geoBoundary: req.body.geoBoundary || null,
            contact: {
                phone: req.body.contactPhone || "",
                email: req.body.contactEmail || "",
            },
            documents: uploadedDocs,
            orgCreatedAt: new Date(),
        };


        // Set KYC status to PENDING
        ngo.kycStatus = "PENDING";

        await ngo.save();

        res.status(200).json({
            success: true,
            message: "NGO verification submitted successfully",
            ngo,
        });

    } catch (error) {
        console.error("NGO Verification Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};
