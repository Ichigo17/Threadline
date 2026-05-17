import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const { search } = req.query;
  let docs;
  if (search) {
    docs = db
      .prepare(
        `SELECT d.* FROM documents d
         JOIN documents_fts fts ON d.rowid = fts.rowid
         WHERE documents_fts MATCH ?
         ORDER BY rank`
      )
      .all(search);
  } else {
    docs = db.prepare("SELECT * FROM documents ORDER BY created_at DESC").all();
  }
  res.json(docs);
});

router.get("/:id", (req, res) => {
  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });
  res.json(doc);
});

router.post("/", (req, res) => {
  const { title, raw_text, source_type } = req.body;
  if (!title || !raw_text) return res.status(400).json({ error: "title and raw_text are required" });

  const id = uuidv4();
  db.prepare("INSERT INTO documents (id, title, raw_text, source_type) VALUES (?, ?, ?, ?)").run(
    id,
    title,
    raw_text,
    source_type || "unknown"
  );

  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(id);
  res.status(201).json(doc);
});

router.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM documents WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Document not found" });
  res.json({ deleted: true });
});

export default router;
