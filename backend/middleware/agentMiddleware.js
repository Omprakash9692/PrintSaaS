import crypto from "crypto";
import PrintAgent from "../models/PrintAgent.js";

export const protectAgent = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                message: "Agent not authorized"
            });
        }

        const rawToken = authHeader.split(" ")[1];
        const token = (rawToken || "").trim().replace(/^["']|["']$/g, "");

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const agent = await PrintAgent.findOne({
            tokenHash,
            active: true
        });

        if (!agent) {
            return res.status(401).json({
                message: "Invalid or inactive agent"
            });
        }

        agent.lastSeenAt = new Date();
        await agent.save();

        req.agent = agent;

        next();

    } catch (error) {
        console.error(error);

        res.status(401).json({
            message: "Agent authentication failed"
        });
    }
};