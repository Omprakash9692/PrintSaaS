import mongoose from "mongoose";

const printAgentSchema = new mongoose.Schema({
    shopCode:{
        type: String,
        required: true,
        index: true
    },
    name:{
        type: String,
        required: true,
        trim: true
    },
    tokenHash:{
        type: String,
        required: true,
        unique: true
    },
    active:{
        type: Boolean,
        default: true
    },
    lastSeenAt:{
        type:Date
    }
},{timestamps: true});

const PrintAgent = mongoose.model("PrintAgent",printAgentSchema);

export default PrintAgent;