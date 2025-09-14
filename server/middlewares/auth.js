const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.auth = (req,res,next) => {
    try{
        const token = req.cookies.token || req.body.token || req.header("Authorization").replace("Bearer ","");

        if(!token){
            return res.status(401).json({
                success:false,
                message:"token is missing"
            })
        }

        try{
            const decode = jwt.verify(token,process.env.JWT_SECRET);
            console.log(decode);
            req.user = decode;
        }
        catch(error){
            console.log(error.message)
            return res.status(401).json({
                success:false, 
                message:"token is invalid",
            })
        }

        next();
    }
    catch(error){
        console.log(error)
        return res.status(401).json({
            success:false,
            message:"something went wrong while validating"
        })
    }
};

exports.isGov = (req,res,next) => {
    try{
        if(req.user.role !== "Gov"){
            return res.status(401).json({
                success:false,
                message:"this is a protected route for Gov only"
            })
        }
        next();
    }catch(error){
        return res.status(500).json({
            success:false,
            message:"something went wrong while validating"
        })
    }
};

exports.isNgo = (req,res,next) => {
    try{
        if(req.user.role !== "Ngo"){
            return res.status(401).json({
                success:false,
                message:"this is a protected route for Ngo only"
            })
        }
        next();
    }catch(error){
        return res.status(500).json({
            success:false,
            message:"something went wrong while validating"
        })
    }
};

exports.isComp = (req,res,next) => {
    try{
        if(req.user.role !== "Comp"){
            return res.status(401).json({
                success:false,
                message:"this is a protected route for Comp only"
            })
        }
        next();
    }catch(error){
        return res.status(500).json({
            success:false,
            message:"something went wrong while validating"
        })
    }
}
