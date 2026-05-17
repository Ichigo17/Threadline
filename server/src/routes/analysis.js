import { Router } from "express";
import db from "../db.js";
import { runPass1, runPass2, runFullPipeline } from "../threadlinePipeline.js";

const router = Router();

router.post("/extract/:documentId", async (req, res) => {
  try {
    const result = await runPass1(req.params.documentId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/correlate", async (req, res) => {
  const { doc_a, doc_b } = req.body;
  if (!doc_a || !doc_b) return res.status(400).json({ error: "doc_a and doc_b are required" });
  try {
    const result = await runPass2(doc_a, doc_b);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/pipeline", async (req, res) => {
  const { document_ids } = req.body;
  if (!document_ids || !Array.isArray(document_ids)) {
    return res.status(400).json({ error: "document_ids array is required" });
  }
  try {
    const result = await runFullPipeline(document_ids);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/features/:documentId", (req, res) => {
  const features = db
    .prepare("SELECT * FROM extracted_features WHERE document_id = ?")
    .get(req.params.documentId);
  if (!features) return res.status(404).json({ error: "No extracted features found" });
  res.json({
    ...features,
    persons: JSON.parse(features.persons),
    vehicles: JSON.parse(features.vehicles),
    locations: JSON.parse(features.locations),
    weak_signals: JSON.parse(features.weak_signals),
    negative_constraints: JSON.parse(features.negative_constraints),
    raw_extraction: JSON.parse(features.raw_extraction),
  });
});

export default router;
