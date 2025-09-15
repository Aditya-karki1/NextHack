const RestorationProject = require('../models/RestorationProject');
const { uploadToCloudinary } = require('../middlewares/upload');
const Ngo = require('../models/Ngo');

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
      status: 'Assigned',
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

// Get All Projects
exports.getAllProjects = async (req, res) => {
  try {
    console.log("Fetching all projects");
    
    const projects = await RestorationProject.find(); // ✅ Populate NGO details if needed
    console.log("Projects fetched:", projects.length);
    res.status(200).json({ success: true, projects });
  } catch (err) {
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
