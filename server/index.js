const express = require("express");
const app = express();

require("dotenv").config();
const PORT = process.env.PORT || 4000;

app.use(express.json());

const fileupload = require("express-fileupload");
app.use(fileupload({
    useTempFiles : true,
    tempFileDir : '/tmp/'
}) ); 

const dbConnect =  require("./config/database");
dbConnect();

const cloudinaryConnect = require("./config/cloudinary");
cloudinaryConnect();

const govRoutes = require("./router/Gov");
const ngoRoutes = require("./router/Ngo");
const compRoutes = require("./router/Comp");


const cors = require("cors");
const cookieParser = require("cookie-parser");

app.use(cookieParser());
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://study-notion-frontend-rosy.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);


app.use("/api/v1/gov",govRoutes);
app.use("/api/v1/ngo",ngoRoutes);
app.use("/api/v1/company",compRoutes);


app.get("/" , (req,res) => {
    return res.json({
        success:true,
        message:"Your server is running"
    })
})

app.listen(PORT,() => {
    console.log(`App is running at port ${PORT}`);
})
