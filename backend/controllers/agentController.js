import crypto from "crypto";
import path from "path";
import https from "https";
import PrintAgent from "../models/PrintAgent.js";
import Order from "../models/Order.js";
import fs from "fs";
import { deleteFromCloudinary } from "../config/cloudinary.js";

export const registerAgent = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Agent name is required"
            });
        }

        // Check if this shop already has an active agent
        const existingAgent = await PrintAgent.findOne({
            shopCode: req.user.shopCode,
            active: true
        });

        if (existingAgent) {
            return res.status(400).json({
                message: "A print agent is already connected to this shop"
            });
        }

        // Generate secure agent token
        const rawToken = crypto.randomBytes(32).toString("hex");

        const tokenHash = crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");

        const agent = await PrintAgent.create({
            shopCode: req.user.shopCode,
            name,
            tokenHash
        });

        res.status(201).json({
            message: "Print agent registered",
            agent: {
                id: agent._id,
                name: agent.name,
                shopCode: agent.shopCode
            },
            token: rawToken
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to register print agent"
        });
    }
};

export const getAgentJobs = async (req,res)=>{
    try{
        const shopCode = req.agent.shopCode;
        const jobs = await Order.find({
            shopCode,
            status:"PENDING"
        },
    {
        orderId: 1,
        "document.filename":1,
        "document.size": 1,
        copies: 1,
        colorMode: 1,
        sides: 1,
        paperSize: 1,
        status: 1,
        createdAt: 1
    }).sort({createdAt:1});

    res.status(200).json({
        count: jobs.length,
        jobs
    });
    } catch (err){
        console.error(err);
        res.status(500).json({
            message: "Failed to fetch agent jobs"
        })       
    }
}

export const getAgentJobDocument = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findOne({
            orderId,
            shopCode: req.agent.shopCode
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        if (order.status === "CANCELLED") {
            return res.status(400).json({
                message: "Cancelled order cannot be printed"
            });
        }

        if (order.status === "COMPLETED") {
            return res.status(400).json({
                message: "Completed order cannot be printed"
            });
        }

        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.setHeader("Content-Type", "application/pdf");

        // 1. If stored in Cloudinary
        if (order.document?.url) {
            https.get(order.document.url, (stream) => {
                stream.pipe(res);
            }).on("error", (err) => {
                console.error("Cloudinary Stream Error:", err);
                res.status(500).json({ message: "Failed to stream document from Cloud storage" });
            });
            return;
        }

        // 2. Fallback if stored on local disk
        if (order.document?.path) {
            const absoluteDocPath = path.resolve(process.cwd(), order.document.path);

            if (!fs.existsSync(absoluteDocPath)) {
                console.warn(`⚠️ Document missing on disk for order ${orderId}: ${order.document?.path}`);
                return res.status(404).json({
                    message: "Document no longer exists on server disk"
                });
            }

            res.sendFile(absoluteDocPath);
            return;
        }

        return res.status(404).json({
            message: "Document file location not found"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to access document"
        });
    }
};

export const updateAgentJobStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "PRINTING",
            "COMPLETED",
            "PRINT_FAILED"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid agent status"
            });
        }

        const order = await Order.findOne({
            orderId,
            shopCode: req.agent.shopCode
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        if (status === "PRINTING") {
            if (order.status !== "PENDING") {
                return res.status(400).json({
                    message: "Order is not pending"
                });
            }

            order.status = "PRINTING";
        }

        if (status === "COMPLETED") {
            if (order.status !== "PRINTING") {
                return res.status(400).json({
                    message: "Order is not being printed"
                });
            }

            order.status = "COMPLETED";
            order.completedAt = new Date();

            // Delete document from Cloudinary if stored in cloud
            if (order.document?.publicId) {
                await deleteFromCloudinary(order.document.publicId);
                order.document.publicId = null;
                order.document.url = null;
            }

            // Delete backend document from disk if stored locally
            if (order.document?.path) {
                const absoluteDocPath = path.resolve(process.cwd(), order.document.path);
                if (fs.existsSync(absoluteDocPath)) {
                    fs.unlinkSync(absoluteDocPath);
                }
                order.document.path = null;
            }
        }

        if (status === "PRINT_FAILED") {
            if (order.status !== "PRINTING" && order.status !== "PENDING") {
                return res.status(400).json({
                    message: "Order cannot be marked as failed from its current status"
                });
            }
            order.status = "PRINT_FAILED";
        }

        await order.save();

        res.status(200).json({
            message: "Agent job status updated",
            order: {
                orderId: order.orderId,
                status: order.status,
                completedAt: order.completedAt
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update agent job status"
        });
    }
};

export const agentHeartbeat = async (req, res) => {
    try {
        req.agent.lastSeenAt = new Date();

        await req.agent.save();

        res.status(200).json({
            message: "Agent is online",
            lastSeenAt: req.agent.lastSeenAt
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Heartbeat failed"
        });
    }
};

export const getAgentStatus = async (req,res)=>{
    try{
        const agent = await PrintAgent.findOne({
            shopCode: req.user.shopCode
        },{
            name:1,
            active:1,
            lastSeenAt: 1
        }
    );

    if(!agent){
        return res.status(404).json({
            message:"No print Agent connected"
        });

    }

    const now = Date.now();

    const lastSeen = agent.lastSeenAt? new Date(agent.lastSeenAt).getTime():0;

    const isOnline = agent.active && lastSeen > 0 && now - lastSeen < 30*1000;

     res.status(200).json({
            agent: {
                name: agent.name,
                active: agent.active,
                online: isOnline,
                lastSeenAt: agent.lastSeenAt
            }
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch agent status"
        });
    }
}