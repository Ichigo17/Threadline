import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDatabase } from "./db.js";
import { seedDemoData } from "./demoData.js";
import documentsRouter from "./routes/documents.js";
import entitiesRouter from "./routes/entities.js";
import linksRouter from "./routes/links.js";
import analysisRouter from "./routes/analysis.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api/documents", documentsRouter);
app.use("/api/entities", entitiesRouter);
app.use("/api/links", linksRouter);
app.use("/api/analysis", analysisRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "threadline-server" });
});

initDatabase();
console.log("Database initialized.");

seedDemoData();
console.log("Demo data seeded.");

app.listen(PORT, () => {
  console.log(`Threadline server running on http://localhost:${PORT}`);
});
