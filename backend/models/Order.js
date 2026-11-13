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
                default: null
            },

            url: {
                type: String,
                default: null
            },

            publicId: {
                type: String,
                default: null
            },

            fileId: {
                type: String,
                default: null
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
                "PAYMENT_PENDING",
                "PENDING",
                "PRINTING",
                "COMPLETED",
                "CANCELLED",
                "PRINT_FAILED"
            ],
            default: "PAYMENT_PENDING"
        },

        paymentStatus: {
            type: String,
            enum: ["UNPAID", "PAID", "FAILED"],
            default: "UNPAID",
            index: true
        },

        pricing: {
            pages: {
                type: Number,
                default: 1
            },
            ratePerPage: {
                type: Number,
                default: 2
            },
            totalAmount: {
                type: Number,
                default: 0
            },
            currency: {
                type: String,
                default: "INR"
            }
        },

        paymentDetails: {
            razorpayOrderId: {
                type: String,
                default: null
            },
            razorpayPaymentId: {
                type: String,
                default: null
            },
            paidAt: {
                type: Date,
                default: null
            }
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