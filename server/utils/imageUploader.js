const cloudinary = require("cloudinary").v2;

exports.imageUploader = async (file,folder,height,quality) => {
    const fileName = `${Date.now()}_${file.name.split('.')[0]}`; // Ensure unique filename
    const options = {
        folder,
        public_id: fileName,
        use_filename: true,
        unique_filename: false,
        resource_type: "auto" // Set the correct resource type
    };

    if(quality){
        options.quality = quality;
    }

    if(height){
        options.height = height;
    }

    const uploadResponse = await cloudinary.uploader.upload(file.tempFilePath, options);
    return uploadResponse;

};