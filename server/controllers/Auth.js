const Gov = require("../models/Gov");
const Ngo = require("../models/Ngo");
const Comp = require("../models/Comp");
// const OTP = require("../models/OTP");
// const otpGenerator = require("otp-generator");
const bcrypt = require("bcryptjs");
// const Profile = require("../models/Profile");
const jwt = require("jsonwebtoken");
require("dotenv").config();
// const mailSender = require("../utils/mailSender");
// const { passwordUpdated } = require("../mail/templates/passwordUpdate");

// exports.sendOTP = async (req,res) => {
//     try{
//         const {email} = req.body;

//         const existingUser = await User.findOne({email});

//         if(existingUser){
//             return res.status(401).json({
//                 success:false,
//                 message:"user already exists"
//             })
//         }

//         var otp = otpGenerator.generate(6,{
//             upperCaseAlphabets:false,
//             lowerCaseAlphabets:false,
//             specialChars:false
//         });

//         //check unique otp
//         let result = await OTP.findOne({otp:otp});

//         while(result){
//             otp = otpGenerator.generate(6,{
//                 upperCaseAlphabets:false,
//                 lowerCaseAlphabets:false,
//                 specialChars:false
//             });

//             result = await OTP.findOne({otp:otp});
//         }

//         const payload = await OTP.create({
//             email,
//             otp,
//             expiresAt: Date.now() + 5 * 60 * 1000 
//         });

//         console.log(payload);

//         return res.status(200).json({
//             success:true,
//             message:"OTP sent successfully",
//             otp,
//         })


//     }catch(error){
//         return res.status(500).json({
//             success:false,
//             message:"OTP not generated"
//         })
//     }
// };

exports.signupGov = async (req,res) => {
    try{
        const {name,email,password} = req.body;

        if(!name || !email || !password){
            return res.status(403).json({
                success:false,
                message:"All fields are required"
            })
        }

        const existingUser = await Gov.findOne({email});

        if(existingUser){
            return res.status(401).json({
                success:false,
                message:"user already exists"
            })
        }

        const hashedPassword =  await bcrypt.hash(password,10);

        const user = await Gov.create({ 
            name,
            email,
            password:hashedPassword
        })


        return res.status(200).json({
            success:true,
            message:" Gov Account created successfully",
            user,
        })


    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Gov User cannot be registered . Please try again later"
        })
    }
};

exports.signupNgo = async (req,res) => {
    try{
        const {name,email,password} = req.body;
        if(!name || !email || !password){
            return res.status(403).json({
                success:false,
                message:"All fields are required"
            })
        }

        const existingUser = await Ngo.findOne({email});

        if(existingUser){
            return res.status(401).json({
                success:false,
                message:"user already exists"
            })
        }

        const hashedPassword =  await bcrypt.hash(password,10);

        const user = await Ngo.create({ 
            name,
            email,
            password:hashedPassword
        })


        return res.status(200).json({
            success:true,
            message:" Ngo Account created successfully",
            user,
        })


    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Ngo user cannot be registered . Please try again later"
        })
    }
};

exports.signupComp = async (req,res) => {
    try{
        const {name,email,password} = req.body;

        if(!name || !email || !password){
            return res.status(403).json({
                success:false,
                message:"All fields are required"
            })
        }

        const existingUser = await Comp.findOne({email});

        if(existingUser){
            return res.status(401).json({
                success:false,
                message:"user already exists"
            })
        }

        const hashedPassword =  await bcrypt.hash(password,10);

        const user = await Comp.create({ 
            name,
            email,
            password:hashedPassword
        })


        return res.status(200).json({
            success:true,
            message:" Comp Account created successfully",
            user,
        })


    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Comp User cannot be registered . Please try again later"
        })
    }
};

exports.loginGov = async (req,res) => {
    try{

        const {email,password} = req.body;

        if(!email || !password){
            return res.status(403).json({
                success:false,
                message:"fields are empty"
            })
        }

        const user = await Gov.findOne({email});

        if(!user){
            return res.status(401).json({
                success:false,
                message:"user does not exists"
            })
        }

        const isPass = await bcrypt.compare(password,user.password);

        if(!isPass){
            return res.status(400).json({
                success:false,
                message:"wrong password"
            })
        } 

        const payload = {
            email:user.email,
            id:user._id,
            role:user.role,
        }
        
        let token = jwt.sign(payload,process.env.JWT_SECRET,{
            expiresIn:"24h",
        })

        const userObj = user.toObject();
        userObj.token = token;
        userObj.password = undefined;

        const options = {
            expires:new Date(Date.now() + 3*24*60*60*1000),
            httpOnly:true,
        }

        res.cookie("token",token,options).status(200).json({
            success:true,
            token,
            userObj,
            message:"Logged in successfully"
        })

    }catch(error){
        return res.status(500).json({
            success:false,
            message:"Login unsuccesssful"
        })
    }
};

exports.loginNgo = async (req,res) => {
    try{

        const {email,password} = req.body;

        if(!email || !password){
            return res.status(403).json({
                success:false,
                message:"fields are empty"
            })
        }

        const user = await Ngo.findOne({email});

        if(!user){
            return res.status(401).json({
                success:false,
                message:"user does not exists"
            })
        }

        const isPass = await bcrypt.compare(password,user.password);

        if(!isPass){
            return res.status(400).json({
                success:false,
                message:"wrong password"
            })
        } 

        const payload = {
            email:user.email,
            id:user._id,
            role:user.role,
        }
        
        let token = jwt.sign(payload,process.env.JWT_SECRET,{
            expiresIn:"24h",
        })

        const userObj = user.toObject();
        userObj.token = token;
        userObj.password = undefined;

        const options = {
            expires:new Date(Date.now() + 3*24*60*60*1000),
            httpOnly:true,
        }

        res.cookie("token",token,options).status(200).json({
            success:true,
            token,
            userObj,
            message:"Logged in successfully"
        })

    }catch(error){
        return res.status(500).json({
            success:false,
            message:"Login unsuccesssful"
        })
    }
};

exports.loginComp = async (req,res) => {
    try{

        const {email,password} = req.body;

        if(!email || !password){
            return res.status(403).json({
                success:false,
                message:"fields are empty"
            })
        }

        const user = await Comp.findOne({email});

        if(!user){
            return res.status(401).json({
                success:false,
                message:"user does not exists"
            })
        }

        const isPass = await bcrypt.compare(password,user.password);

        if(!isPass){
            return res.status(400).json({
                success:false,
                message:"wrong password"
            })
        } 

        const payload = {
            email:user.email,
            id:user._id,
            role:user.role,
        }
        
        let token = jwt.sign(payload,process.env.JWT_SECRET,{
            expiresIn:"24h",
        })

        const userObj = user.toObject();
        userObj.token = token;
        userObj.password = undefined;

        const options = {
            expires:new Date(Date.now() + 3*24*60*60*1000),
            httpOnly:true,
        }

        res.cookie("token",token,options).status(200).json({
            success:true,
            token,
            userObj,
            message:"Logged in successfully"
        })

    }catch(error){
        return res.status(500).json({
            success:false,
            message:"Login unsuccesssful"
        })
    }
};


// exports.changePassword = async(req,res) => {
//     try{

//         const {password,newPassword,confirmPassword} = req.body;

//         if(!password || !newPassword || !confirmPassword){
//             return res.status(403).json({
//                 success:false,
//                 message:"fields are empty"
//             })
//         }

//         const existingUser = await User.findById(req.user.id);
//         if (!existingUser) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found",
//             });
//         }

//         const isPass = await bcrypt.compare(password,existingUser.password);
//         if(!isPass){
//             return res.status(401).json({
//                 success:false,
//                 message:"password is incorrect"
//             })
//         }

//         if(newPassword !== confirmPassword){
//             return res.status(403).json({
//                 success:false,
//                 message:"new password and confirm new password does not match"
//             })
//         }

//         existingUser.password = await bcrypt.hash(newPassword, 10);
//         await existingUser.save();

//         try {
// 			const emailResponse = await mailSender(
// 				existingUser.email,
// 				passwordUpdated(
// 					existingUser.email,
// 					`Password updated successfully for ${existingUser.firstName} ${existingUser.lastName}`
// 				)
// 			);
// 			console.log("Email sent successfully:", emailResponse.response);
// 		} catch (error) {
// 			// If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
// 			console.error("Error occurred while sending email:", error);
// 			return res.status(500).json({
// 				success: false,
// 				message: "Error occurred while sending email",
// 				error: error.message,
// 			});
// 		}

//         return res.status(200).json({
//             success: true,
//             message: "Password changed successfully",
//         });

//     }catch(error){
//         console.log(error.message)
//         return res.status(500).json({
//             success:false,
//             message:"Internal Server Error"
            
//         })
//     }
// }