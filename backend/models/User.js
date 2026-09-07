import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    shopName:{
        type:String,
        required:true,
        trim:true
    },
    ownerName:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true
    },
    password:{
        type:String,
        required:true,
        trim:true
    },
    shopCode:{
        type:String,
        required:true,
        unique:true,
        trim:true
    }
},{
    timestamps:true
});

const User = mongoose.model("User", userSchema);
export default User;