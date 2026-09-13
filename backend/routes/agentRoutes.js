import express from "express";
import { registerAgent,
    getAgentJobs,
    getAgentJobDocument ,
    updateAgentJobStatus,
    agentHeartbeat,
    getAgentStatus
} from "../controllers/agentController.js";
import {protect} from "../middleware/authMiddleware.js";
import { protectAgent } from "../middleware/agentMiddleware.js";

const router = express.Router();

router.post("/register",protect,registerAgent);

router.get(
    "/test",
    protectAgent,
    (req, res) => {
        res.status(200).json({
            message: "Agent authenticated successfully",
            agent: {
                id: req.agent._id,
                name: req.agent.name,
                shopCode: req.agent.shopCode
            }
        });
    }
);

router.get("/jobs", protectAgent, getAgentJobs);

router.get(
    "/jobs/:orderId/document",
    protectAgent,
    getAgentJobDocument
);

router.patch(
    "/jobs/:orderId/status",
    protectAgent,
    updateAgentJobStatus
);

router.post(
    "/heartbeat",
    protectAgent,
    agentHeartbeat
);

router.get(
    "/status",
    protect,
    getAgentStatus
);
export default router;