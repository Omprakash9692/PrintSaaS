import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import { cleanupOldOrders } from "./utils/cleanupOrders.js";

dotenv.config();

const app = express();

// __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//connect to database
connectDB();

//middlewares

// Parse allowed origins from env — supports comma-separated values
// Automatically adds https:// if protocol is missing
const parseOrigins = (raw) => {
  if (!raw) return [];
  return raw
    .split(",")
    .map((o) => {
      o = o.trim().replace(/\/+$/, ""); // strip trailing slashes
      if (o && !o.startsWith("http")) o = "https://" + o; // ensure protocol
      return o;
    })
    .filter(Boolean);
};

const allowedOrigins = [
  ...parseOrigins(process.env.FRONTEND_URL),
  "http://localhost:5173",
  "http://localhost:5174",
];

console.log("✅ CORS allowed origins:", allowedOrigins);

app.use(
  cors({
    origin: (incomingOrigin, callback) => {
      // Allow server-to-server or same-origin requests (no Origin header)
      if (!incomingOrigin) return callback(null, true);

      const normalized = incomingOrigin.replace(/\/+$/, "");
      if (allowedOrigins.includes(normalized)) {
        callback(null, true);
      } else {
        console.warn("🚫 CORS blocked origin:", incomingOrigin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Serve uploaded files as static assets
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//routes
app.use("/api/auth", authRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/orders", orderRoutes);

app.get("/", (req,res)=>{
    res.send("API is running...");
})

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

cleanupOldOrders();

setInterval(()=>{
    cleanupOldOrders();
},60*60*1000);