import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const { include_dismissed } = req.query;
  let links;
  if (include_dismissed === "true") {
    links = db.prepare("SELECT * FROM incident_links ORDER BY created_at DESC").all();
  } else {
    links = db.prepare("SELECT * FROM incident_links WHERE dismissed = 0 ORDER BY created_at DESC").all();
  }
  res.json(
    links.map((l) => ({
      ...l,
      weak_signals: JSON.parse(l.weak_signals),
      negative_constraints: JSON.parse(l.negative_constraints),
      is_investigator_validated: Boolean(l.is_investigator_validated),
      dismissed: Boolean(l.dismissed),
    }))
  );
});

router.get("/:id", (req, res) => {
  const link = db.prepare("SELECT * FROM incident_links WHERE id = ?").get(req.params.id);
  if (!link) return res.status(404).json({ error: "Link not found" });
  res.json({
    ...link,
    weak_signals: JSON.parse(link.weak_signals),
    negative_constraints: JSON.parse(link.negative_constraints),
    is_investigator_validated: Boolean(link.is_investigator_validated),
    dismissed: Boolean(link.dismissed),
  });
});

router.patch("/:id/validate", (req, res) => {
  const result = db
    .prepare("UPDATE incident_links SET is_investigator_validated = 1, dismissed = 0 WHERE id = ?")
    .run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Link not found" });
  const link = db.prepare("SELECT * FROM incident_links WHERE id = ?").get(req.params.id);
  res.json({
    ...link,
    weak_signals: JSON.parse(link.weak_signals),
    negative_constraints: JSON.parse(link.negative_constraints),
    is_investigator_validated: Boolean(link.is_investigator_validated),
    dismissed: Boolean(link.dismissed),
  });
});

router.patch("/:id/dismiss", (req, res) => {
  const result = db
    .prepare("UPDATE incident_links SET dismissed = 1, is_investigator_validated = 0 WHERE id = ?")
    .run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Link not found" });
  const link = db.prepare("SELECT * FROM incident_links WHERE id = ?").get(req.params.id);
  res.json({
    ...link,
    weak_signals: JSON.parse(link.weak_signals),
    negative_constraints: JSON.parse(link.negative_constraints),
    is_investigator_validated: Boolean(link.is_investigator_validated),
    dismissed: Boolean(link.dismissed),
  });
});

export default router;
