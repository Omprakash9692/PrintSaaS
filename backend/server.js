import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import { cleanupOldOrders } from "./utils/cleanupOrders.js";

dotenv.config();

const app = express();

//connect to database
connectDB();

//middlewares
app.use(cors());
app.use(express.json());

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