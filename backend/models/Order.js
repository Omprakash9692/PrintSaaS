import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            required: true,
            unique: true
        },

        shopCode: {
            type: String,
            required: true,
            index: true
        },

        document: {
            filename: {
                type: String,
                required: true
            },

            path: {
                type: String,
                required: null
            },

            size: {
                type: Number,
                required: true
            }
        },

        copies: {
            type: Number,
            required: true,
            min: 1
        },

        colorMode: {
            type: String,
            enum: ["B/W", "COLOR"],
            default: "B/W"
        },

        sides: {
            type: String,
            enum: ["SINGLE", "DOUBLE"],
            default: "SINGLE"
        },

        paperSize: {
            type: String,
            enum: ["A4", "A3"],
            default: "A4"
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "PRINTING",
                "COMPLETED",
                "CANCELLED"
            ],
            default: "PENDING"
        },

        completedAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;