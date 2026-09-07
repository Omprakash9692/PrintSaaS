import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

export const register = async (req,res) => {
    try{
        const {shopName, ownerName, email, password} = req.body;

        if(!shopName || !ownerName || !email || !password){
            return res.status(400).json({message:"Please fill all the fields"});
        }

        const existingUser = await User.findOne({email});

        if(existingUser){
            return res.status(400).json({
                message:"User already exists"
            })
        }

        const hashedPassword = await bcrypt.hash(password,10);

        const shopCode = crypto.randomBytes(4).toString("hex").toUpperCase();

        const user = await User.create({
            shopName,
            ownerName,
            email,
            password: hashedPassword,
            shopCode
        });

        return res.status(201).json({
            message:"Shop registered successfully",
            shop:{
                id:user._id,
                shopName:user.shopName,
                ownerName:user.ownerName,
                email:user.email,
                shopCode:user.shopCode
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({message:"Internal server error"});
    }
}

export const login = async (req,res)=>{
    try{
        const {email, password} = req.body;

        if(!email || !password){
            return res.status(400).json({message:"Please fill all the fields"});
        }

        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({message:"Invalid credentials"});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(400).json({message:"Invalid credentials"});
        }

        const token = jwt.sign({id:user._id, shopCode: user.shopCode}, process.env.JWT_SECRET, {expiresIn:"1d"});

        return res.status(200).json({
            message:"Login successful",
            token,
            shop: {
                id: user._id,
                shopName: user.shopName,
                ownerName: user.ownerName,
                email: user.email,
                shopCode: user.shopCode
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({message:"Internal server error"});
    }
}