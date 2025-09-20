const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    console.log("Starting upload to Cloudinary..."); //  Debug start
    console.log("Buffer size:", buffer?.length || 0); //  Check buffer length

    const stream = cloudinary.uploader.upload_stream(
      { folder: "projects" },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error); // Log errors
          return reject(error);
        }
        console.log("Cloudinary upload successful:", result.secure_url); // Log uploaded URL
        resolve(result);
      }
    );

    stream.end(buffer); // send the buffer to Cloudinary
  });
};

module.exports.uploadToCloudinary = uploadToCloudinary;
