const RestorationProject = require('../models/RestorationProject');
const { uploadToCloudinary } = require('../middlewares/upload');
const Ngo = require('../models/Ngo');
const mongoose = require('mongoose');
const MRVRecord = require("../models/MRVRecord");
const creditListing = require('../models/CreditListing');
const ngo = require('../models/Ngo');
// Create Project
exports.createProject = async (req, res) => {
  try {
    let imageUrls = [];
    console.log("Files received:", req.files);

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        console.log("Uploading file:", file.originalname);
        const result = await uploadToCloudinary(file.buffer); // use buffer
        console.log("Cloudinary result:", result.secure_url);
        imageUrls.push(result.secure_url);
      }
    }

    console.log("Images URLs:", imageUrls);

    const projectData = {
      title: req.body.title,
      governmentId: req.user.id,
      location: {
        type: 'Point',
        coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)]
      },
      areaHectares: parseFloat(req.body.areaHectares),
      targetTrees: parseInt(req.body.targetTrees),
      startDate: new Date(req.body.startDate),
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      status: 'Created',
      landImages: imageUrls,
      greeneryPercentage: req.body.greeneryPercentage || 0,
      co2Level: req.body.co2Level || 0
    };

    const project = await RestorationProject.create(projectData);
    res.status(201).json({ success: true, project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Get All NGOs
exports.getAllNGOs = async (req, res) => {
  try {
    const ngos = await Ngo.find();
    res.status(200).json({ success: true, ngos });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching NGOs" });
  }
};

// Get All Projects with NGO details
exports.getAllProjects = async (req, res) => {
  try {
    console.log("Fetching all projects");

    const projects = await RestorationProject.find()
      .populate("ngoId", "name email") // <-- populate only the name and email fields

    console.log("Projects fetched:", projects.length);
    res.status(200).json({ success: true, projects });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ success: false, message: "Error fetching projects" });
  }
};


// Assign Project to NGO
exports.assignProject = async (req, res) => {
  try {
    const { ngoId } = req.body;
    console.log("Assigning project:", req.params.id, "to NGO:", ngoId);
    const project = await RestorationProject.findById(req.params.id);

    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    project.ngoId = ngoId; // ✅ Correct field name
    project.status = "InProgress"; // ✅ Use enum value from schema
    await project.save();
console.log("Assigned project:", project);
    res.status(200).json({ success: true, message: "Project assigned successfully", project });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error assigning project" });
  }
};

exports.requestProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { requestedBy } = req.body;

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid project ID." });
        }
        if (!mongoose.Types.ObjectId.isValid(requestedBy)) {
            return res.status(400).json({ success: false, message: "Invalid user ID." });
        }

        // Find NGO
        const ngo = await Ngo.findById(requestedBy);
        if (!ngo) {
            return res.status(404).json({ success: false, message: "NGO not found." });
        }

        // Find project
        const project = await RestorationProject.findById(id);
        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found." });
        }

        // Check if NGO has already requested this project
        if (project.requestedBy.includes(requestedBy)) {
            return res.status(409).json({ success: false, message: "You have already requested this project." });
        }

        // Add NGO to requestedBy array
        project.requestedBy.push(requestedBy);

        // Save changes
        await project.save();

        res.status(200).json({
            success: true,
            message: "Project request submitted successfully.",
            data: project
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error." });
    }
};

exports.getProjectReports = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Fetch the project
    const project = await RestorationProject.findById(projectId).lean();
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    // Fetch MRV reports associated with this project
    const reports = await MRVRecord.find({ projectId }).sort({ dateReported: -1 }).lean();

    res.json({
      success: true,
      project: {
        id: project._id,
        title: project.title,
        governmentId: project.governmentId,
        ngoId: project.ngoId,
        location: project.location,
        areaHectares: project.areaHectares,
        targetTrees: project.targetTrees,
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status,
        greeneryPercentage: project.greeneryPercentage,
        co2Level: project.co2Level,
        landImages: project.landImages,
        requestedBy: project.requestedBy,
      },
      reports
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// Assume these Mongoose models and the custom User model are imported:
// const Ngo = require('../models/Ngo');
// const CreditListing = require('../models/CreditListing'); 
// const MRVRecord = require('../models/MRVRecord'); // For calculating total earned

// @route   GET /api/v1/gov/ngo-wallet-data/:ngoId
// @desc    Fetch NGO's current credit balance and market listings
// @access  Government (Requires authentication/authorization middleware)
exports.getNgoWalletData = async (req, res) => {
    const { ngoId } = req.params;

    try {
        // 1. Fetch NGO details, including the credits sub-document
        const ngo = await Ngo.findById(ngoId);

        if (!ngo) {
            return res.status(404).json({ success: false, message: "NGO not found." });
        }

        // 2. Fetch all active credit listings created by this NGO
        // We assume the NGO's ObjectId is stored in the credit listing model
        const listings = await creditListing.find({ ngoId: ngo._id })
            .select('amount price status createdAt') // Select only necessary fields
            .lean(); // Use .lean() for faster read operations

        // 3. Calculate Total Credits Earned (for the "Lifetime" metric)
        // This requires summing up all credits issued via MRV records to this NGO.
        // NOTE: This calculation is highly dependent on your MRVRecord/Project structure.
        // Placeholder Logic: Summing treeCount from all verified MRV records.
        const verifiedMRVRecords = await MRVRecord.find({ 
            userId: ngo._id, 
            status: 'Verified' 
        }).select('treeCount credits'); // Assuming 'credits' field holds the final tokens

        // Calculate total credits earned from all records
        const totalEarned = verifiedMRVRecords.reduce((sum, record) => {
            // Use the credit field if available, otherwise calculate from treeCount
            const credits = record.credits || (record.treeCount * 10); 
            return sum + credits;
        }, 0);


        // 4. Construct the final response payload
        const walletData = {
            ngo: {
                _id: ngo._id,
                name: ngo.name,
                email: ngo.email,
                walletAddress: ngo.credits?.walletAddress || 'N/A',
                balance: ngo.credits?.balance ?? 0, // Use current balance from the DB
            },
            totalCreditsEarned: totalEarned,
            creditListings: listings.map(l => ({
                _id: l._id,
                amount: l.amount,
                price: l.price,
                status: l.status,
                createdAt: l.createdAt,
            })),
        };

        res.status(200).json({ success: true, data: walletData });

    } catch (error) {
        console.error("Error fetching NGO wallet data:", error);
        res.status(500).json({ success: false, message: "Server error retrieving wallet data." });
    }
};

// You must also ensure your router uses this:
// router.get('/gov/ngo-wallet-data/:ngoId', getNgoWalletData);
// Cancel a previously submitted request by an NGO
exports.cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { requestedBy } = req.body;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid project ID." });
    }
    if (!mongoose.Types.ObjectId.isValid(requestedBy)) {
      return res.status(400).json({ success: false, message: "Invalid user ID." });
    }

    // Find project
    const project = await RestorationProject.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    // Check if NGO had requested this project
    if (!project.requestedBy || !project.requestedBy.includes(requestedBy)) {
      return res.status(409).json({ success: false, message: "You have not requested this project." });
    }

    // Remove NGO from requestedBy array
    project.requestedBy = project.requestedBy.filter(r => String(r) !== String(requestedBy));
    await project.save();

    res.status(200).json({ success: true, message: "Project request cancelled.", data: project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};