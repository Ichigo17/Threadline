import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "threadline.db");

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      raw_text TEXT NOT NULL,
      source_type TEXT DEFAULT 'unknown',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      embedding TEXT DEFAULT NULL
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
      title, raw_text, content='documents', content_rowid='rowid'
    );

    CREATE TRIGGER IF NOT EXISTS documents_ai AFTER INSERT ON documents BEGIN
      INSERT INTO documents_fts(rowid, title, raw_text)
      VALUES (new.rowid, new.title, new.raw_text);
    END;

    CREATE TRIGGER IF NOT EXISTS documents_ad AFTER DELETE ON documents BEGIN
      INSERT INTO documents_fts(documents_fts, rowid, title, raw_text)
      VALUES ('delete', old.rowid, old.title, old.raw_text);
    END;

    CREATE TRIGGER IF NOT EXISTS documents_au AFTER UPDATE ON documents BEGIN
      INSERT INTO documents_fts(documents_fts, rowid, title, raw_text)
      VALUES ('delete', old.rowid, old.title, old.raw_text);
      INSERT INTO documents_fts(rowid, title, raw_text)
      VALUES (new.rowid, new.title, new.raw_text);
    END;

    CREATE TABLE IF NOT EXISTS meta_entities (
      id TEXT PRIMARY KEY,
      canonical_name TEXT NOT NULL,
      entity_type TEXT NOT NULL CHECK(entity_type IN ('Person','Vehicle','Location')),
      aliases TEXT DEFAULT '[]',
      metadata TEXT DEFAULT '{}',
      document_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS incident_links (
      id TEXT PRIMARY KEY,
      source_doc_a TEXT NOT NULL,
      source_doc_b TEXT NOT NULL,
      confidence TEXT NOT NULL CHECK(confidence IN ('Weak','Moderate','Strong')),
      explanation TEXT NOT NULL,
      counterfactual_argument TEXT NOT NULL,
      is_investigator_validated INTEGER DEFAULT 0,
      dismissed INTEGER DEFAULT 0,
      primary_vector TEXT DEFAULT '',
      weak_signals TEXT DEFAULT '[]',
      negative_constraints TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (source_doc_a) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (source_doc_b) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS extracted_features (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      persons TEXT DEFAULT '[]',
      vehicles TEXT DEFAULT '[]',
      locations TEXT DEFAULT '[]',
      weak_signals TEXT DEFAULT '[]',
      negative_constraints TEXT DEFAULT '[]',
      raw_extraction TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );
  `);
}

export default db;
