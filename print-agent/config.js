import dotenv from "dotenv";

dotenv.config();

const config = {
    apiUrl: process.env.API_URL || "http://localhost:5000/api",
    agentToken: (process.env.AGENT_TOKEN || "").trim().replace(/^["']|["']$/g, ""),
    pollInterval: Number(
        process.env.POLL_INTERVAL || 5000
    ),
    printerMode: (process.env.PRINTER_MODE || "mock").toLowerCase(), // "mock" | "virtual" | "real"
    printerName: process.env.PRINTER_NAME || null,
};

if (!config.agentToken) {
    throw new Error(
        "AGENT_TOKEN is missing in .env"
    );
}

export default config;