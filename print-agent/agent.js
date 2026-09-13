import axios from "axios";
import fs from "fs";
import path from "path";
import config from "./config.js";
import { printDocument, getSystemPrinters } from "./printService.js";

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    Authorization: `Bearer ${config.agentToken}`,
  },
});

const getJobs = async () => {
  const response = await api.get("/agents/jobs");
  return response.data;
};

const sendHeartbeat = async () => {
  const response = await api.post("/agents/heartbeat");
  return response.data;
};

const downloadDocument = async (orderId) => {
  const response = await api.get(`/agents/jobs/${orderId}/document`, {
    responseType: "arraybuffer",
  });

  const tempDir = path.join(process.cwd(), "temp");

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const filePath = path.join(tempDir, `${orderId}.pdf`);
  fs.writeFileSync(filePath, response.data);

  return filePath;
};

const updateJobStatus = async (orderId, status) => {
  const response = await api.patch(`/agents/jobs/${orderId}/status`, {
    status,
  });

  return response.data;
};

// Process one print job
const processJob = async (job) => {
  let filePath = null;

  try {
    if (!job || !job.orderId) {
      throw new Error("Invalid print job");
    }

    console.log(`\n⏳ Processing job: ${job.orderId}`);

    // 1. Change PENDING → PRINTING
    await updateJobStatus(job.orderId, "PRINTING");

    // 2. Download PDF
    filePath = await downloadDocument(job.orderId);

    if (!fs.existsSync(filePath)) {
      throw new Error("Downloaded PDF was not found");
    }

    console.log(`📥 PDF downloaded to: ${filePath}`);

    if (!job.copies || job.copies < 1) {
      throw new Error("Invalid number of copies");
    }

    // 3. Print document
    await printDocument(filePath, {
      copies: job.copies,
      colorMode: job.colorMode,
      sides: job.sides,
      paperSize: job.paperSize,
    });

    // 4. Change PRINTING → COMPLETED
    await updateJobStatus(job.orderId, "COMPLETED");

    console.log(`✅ Job ${job.orderId} COMPLETED successfully`);
  } catch (error) {
    console.error(
      `❌ Job ${job?.orderId || "unknown"} failed:`,
      error.response?.data?.message || error.message
    );

    try {
      if (job?.orderId) {
        await updateJobStatus(job.orderId, "PRINT_FAILED");
        console.log(`⚠️ Job ${job.orderId} marked as PRINT_FAILED`);
      }
    } catch (statusError) {
      console.error(
        "Failed to update print failure status:",
        statusError.response?.data?.message || statusError.message
      );
    }
  } finally {
    // 5. Delete temporary PDF
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("🗑️  Temporary PDF deleted");
    }
  }
};

const main = async () => {
  console.log("=================================================");
  console.log("       🖨️   PrintSaaS Agent v2 Active           ");
  console.log("=================================================");
  console.log(`📡 API URL      : ${config.apiUrl}`);
  console.log(`⚙️  Printer Mode : ${config.printerMode.toUpperCase()}`);

  if (config.printerMode !== "mock") {
    console.log("🔍 Scanning system printers...");
    const printers = await getSystemPrinters();
    if (printers.length > 0) {
      console.log("🖨️  Detected System Printers:");
      printers.forEach((p, idx) => console.log(`   ${idx + 1}. ${p.name || p}`));
    } else {
      console.log("⚠️  No physical printers detected. Defaulting to system spooler.");
    }
  } else {
    console.log("🧪 Mock Mode Enabled: Print outputs will be saved to 'printed_jobs/'");
  }

  console.log("\n🚀 Listening for print jobs...\n");

  while (true) {
    try {
      await sendHeartbeat();
      const data = await getJobs();

      if (data.count > 0) {
        console.log(`📋 ${data.count} pending print job(s) found.`);
        for (const job of data.jobs) {
          await processJob(job);
        }
      }
    } catch (error) {
      console.error(
        "⚠️  Agent error:",
        error.response?.data?.message || error.message
      );
    }

    await new Promise((resolve) => setTimeout(resolve, config.pollInterval));
  }
};

main();
