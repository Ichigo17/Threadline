import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const { type } = req.query;
  let entities;
  if (type) {
    entities = db.prepare("SELECT * FROM meta_entities WHERE entity_type = ? ORDER BY canonical_name").all(type);
  } else {
    entities = db.prepare("SELECT * FROM meta_entities ORDER BY entity_type, canonical_name").all();
  }
  res.json(
    entities.map((e) => ({
      ...e,
      aliases: JSON.parse(e.aliases),
      metadata: JSON.parse(e.metadata),
    }))
  );
});

router.get("/by-document/:documentId", (req, res) => {
  const entities = db
    .prepare("SELECT * FROM meta_entities WHERE document_id = ? ORDER BY entity_type, canonical_name")
    .all(req.params.documentId);
  res.json(
    entities.map((e) => ({
      ...e,
      aliases: JSON.parse(e.aliases),
      metadata: JSON.parse(e.metadata),
    }))
  );
});

export default router;
