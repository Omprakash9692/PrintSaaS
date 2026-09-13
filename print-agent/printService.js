import fs from "fs";
import path from "path";
import config from "./config.js";

const validatePrintOptions = (options) => {
    if (!options) {
        throw new Error("Print options are missing");
    }

    if (!Number.isInteger(options.copies) || options.copies < 1) {
        throw new Error("Invalid number of copies");
    }

    const validColorModes = ["B/W", "COLOR"];
    const validSides = ["SINGLE", "DOUBLE"];
    const validPaperSizes = ["A4", "A3"];

    if (!validColorModes.includes(options.colorMode)) {
        throw new Error("Invalid color mode");
    }

    if (!validSides.includes(options.sides)) {
        throw new Error("Invalid sides option");
    }

    if (!validPaperSizes.includes(options.paperSize)) {
        throw new Error("Invalid paper size");
    }
};

export const getSystemPrinters = async () => {
    try {
        const pdfToPrinter = await import("pdf-to-printer");
        const printers = await pdfToPrinter.getPrinters();
        return printers;
    } catch (err) {
        return [];
    }
};

export const printDocument = async (filePath, options) => {
    console.log("\n🖨️  PRINT JOB INITIATED");
    console.log("-----------------------------------------");

    if (!filePath || !fs.existsSync(filePath)) {
        throw new Error("PDF file does not exist");
    }

    validatePrintOptions(options);

    console.log(`📄 File      : ${path.basename(filePath)}`);
    console.log(`📄 Copies    : ${options.copies}`);
    console.log(`🎨 Color     : ${options.colorMode}`);
    console.log(`🔄 Sides     : ${options.sides}`);
    console.log(`📐 Paper     : ${options.paperSize}`);
    console.log(`⚙️  Mode      : ${config.printerMode.toUpperCase()}`);

    const mode = config.printerMode;

    if (mode === "mock") {
        console.log("🧪 Running in MOCK mode (Laptop Dev Testing)...");

        // Save simulated output copy to printed_jobs/ folder for visual inspection
        const printedJobsDir = path.join(process.cwd(), "printed_jobs");
        if (!fs.existsSync(printedJobsDir)) {
            fs.mkdirSync(printedJobsDir);
        }

        const timeStamp = Date.now();
        const copyPath = path.join(printedJobsDir, `mock_printed_${timeStamp}_${path.basename(filePath)}`);
        fs.copyFileSync(filePath, copyPath);

        // Retain only the 20 most recent mock outputs to prevent disk bloat
        try {
            const files = fs.readdirSync(printedJobsDir);
            if (files.length > 20) {
                const fileStats = files.map((file) => {
                    const fullPath = path.join(printedJobsDir, file);
                    return { fullPath, mtime: fs.statSync(fullPath).mtimeMs };
                }).sort((a, b) => b.mtime - a.mtime);

                for (let i = 20; i < fileStats.length; i++) {
                    fs.unlinkSync(fileStats[i].fullPath);
                }
            }
        } catch (cleanupErr) {
            // Ignore non-critical cleanup error
        }

        console.log(`📁 Mock output saved to: ${copyPath}`);
        console.log("⏳ Simulating paper feed & printer ink output...");

        await new Promise((resolve) => setTimeout(resolve, 2500));

        console.log("✅ Simulated printing successful!");
        return true;
    } else {
        console.log("📠 Sending job to Physical System Printer...");
        const pdfToPrinter = await import("pdf-to-printer");

        const printParams = {
            copies: options.copies,
            paperSize: options.paperSize,
            side: options.sides === "DOUBLE" ? "duplex" : "simplex",
        };

        if (config.printerName) {
            printParams.printer = config.printerName;
            console.log(`🖨️ Target Printer: ${config.printerName}`);
        } else {
            console.log(`🖨️ Target Printer: System Default Printer`);
        }

        await pdfToPrinter.print(filePath, printParams);

        console.log("✅ Job spooled & sent to physical printer successfully!");
        return true;
    }
};