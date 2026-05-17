import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/case-brief", (req, res) => {
  const documents = db
    .prepare("SELECT * FROM documents ORDER BY created_at ASC")
    .all();

  const validatedLinks = db
    .prepare(
      "SELECT * FROM incident_links WHERE is_investigator_validated = 1 AND dismissed = 0 ORDER BY created_at ASC"
    )
    .all()
    .map((l) => ({
      ...l,
      weak_signals: JSON.parse(l.weak_signals),
      negative_constraints: JSON.parse(l.negative_constraints),
    }));

  const entities = db
    .prepare(
      "SELECT * FROM meta_entities ORDER BY entity_type, canonical_name"
    )
    .all()
    .map((e) => ({
      ...e,
      aliases: JSON.parse(e.aliases),
      metadata: JSON.parse(e.metadata),
    }));

  const features = db.prepare("SELECT * FROM extracted_features").all();

  const allLinks = db
    .prepare(
      "SELECT * FROM incident_links WHERE dismissed = 0 ORDER BY created_at ASC"
    )
    .all()
    .map((l) => ({
      ...l,
      weak_signals: JSON.parse(l.weak_signals),
      negative_constraints: JSON.parse(l.negative_constraints),
    }));

  const docMap = new Map();
  for (const doc of documents) docMap.set(doc.id, doc);

  const entityByDoc = new Map();
  for (const ent of entities) {
    const list = entityByDoc.get(ent.document_id) || [];
    list.push(ent);
    entityByDoc.set(ent.document_id, list);
  }

  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  let md = "";

  md += "# THREADLINE — Intelligence Case Brief\n\n";
  md += `**Generated:** ${now} UTC  \n`;
  md += `**Classification:** UNCLASSIFIED — FOR OFFICIAL USE ONLY  \n`;
  md += `**Documents Analyzed:** ${documents.length}  \n`;
  md += `**Validated Links:** ${validatedLinks.length}  \n`;
  md += `**Active Unresolved Links:** ${allLinks.length - validatedLinks.length}  \n\n`;
  md += "---\n\n";

  // Section 1: Executive Summary
  md += "## 1. Executive Summary\n\n";
  if (validatedLinks.length === 0) {
    md += "No investigator-validated links have been established. All correlations remain pending analyst review.\n\n";
  } else {
    const strongCount = validatedLinks.filter(
      (l) => l.confidence === "Strong"
    ).length;
    const moderateCount = validatedLinks.filter(
      (l) => l.confidence === "Moderate"
    ).length;
    const weakCount = validatedLinks.filter(
      (l) => l.confidence === "Weak"
    ).length;
    md += `Analyst review has validated **${validatedLinks.length}** intelligence link(s) across the case documents`;
    md += ` (${strongCount} Strong, ${moderateCount} Moderate, ${weakCount} Weak).`;
    md += " The following brief compiles all validated correlations, resolved entities, and the chronological narrative timeline.\n\n";
  }

  // Section 2: Resolved Meta-Entities
  md += "## 2. Resolved Meta-Entities\n\n";
  const personEntities = entities.filter((e) => e.entity_type === "Person");
  const vehicleEntities = entities.filter((e) => e.entity_type === "Vehicle");
  const locationEntities = entities.filter(
    (e) => e.entity_type === "Location"
  );

  if (personEntities.length > 0) {
    md += "### Persons\n\n";
    md += "| Name | Source Document |\n";
    md += "|------|----------------|\n";
    for (const ent of personEntities) {
      const docTitle = docMap.get(ent.document_id)?.title || ent.document_id;
      md += `| ${ent.canonical_name} | ${docTitle} |\n`;
    }
    md += "\n";
  }

  if (vehicleEntities.length > 0) {
    md += "### Vehicles\n\n";
    md += "| Description | Source Document |\n";
    md += "|-------------|----------------|\n";
    for (const ent of vehicleEntities) {
      const docTitle = docMap.get(ent.document_id)?.title || ent.document_id;
      md += `| ${ent.canonical_name} | ${docTitle} |\n`;
    }
    md += "\n";
  }

  if (locationEntities.length > 0) {
    md += "### Locations\n\n";
    md += "| Name | Source Document |\n";
    md += "|------|----------------|\n";
    for (const ent of locationEntities) {
      const docTitle = docMap.get(ent.document_id)?.title || ent.document_id;
      md += `| ${ent.canonical_name} | ${docTitle} |\n`;
    }
    md += "\n";
  }

  // Section 3: Validated Intelligence Links
  md += "## 3. Validated Intelligence Links\n\n";
  if (validatedLinks.length === 0) {
    md += "*No validated links.*\n\n";
  } else {
    for (let i = 0; i < validatedLinks.length; i++) {
      const link = validatedLinks[i];
      const docA = docMap.get(link.source_doc_a);
      const docB = docMap.get(link.source_doc_b);
      md += `### Link ${i + 1}: ${link.confidence} Correlation\n\n`;
      md += `**Document A:** ${docA?.title || link.source_doc_a}  \n`;
      md += `**Document B:** ${docB?.title || link.source_doc_b}  \n\n`;
      md += `**Primary Correlation Vector:**  \n${link.primary_vector || link.explanation}\n\n`;
      md += `**Devil's Advocate Assessment:**  \n${link.counterfactual_argument}\n\n`;

      if (link.weak_signals.length > 0) {
        md += "**Supporting Weak Signals:**\n\n";
        for (const ws of link.weak_signals) {
          md += `- **${ws.signal}** — _\"${ws.excerpt}\"_\n`;
        }
        md += "\n";
      }
    }
  }

  // Section 4: Chronological Timeline
  md += "## 4. Chronological Narrative Timeline\n\n";
  const validatedDocIds = new Set();
  validatedLinks.forEach((l) => {
    validatedDocIds.add(l.source_doc_a);
    validatedDocIds.add(l.source_doc_b);
  });
  const timelineDocs = documents
    .filter((d) => validatedDocIds.has(d.id))
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  if (timelineDocs.length === 0) {
    md += "*No events pinned to the timeline.*\n\n";
  } else {
    for (const doc of timelineDocs) {
      const docEnts = entityByDoc.get(doc.id) || [];
      const relatedLinks = validatedLinks.filter(
        (l) => l.source_doc_a === doc.id || l.source_doc_b === doc.id
      );
      md += `#### ${doc.title}\n\n`;
      md += `- **Type:** ${doc.source_type}  \n`;
      md += `- **Entities:** ${docEnts.map((e) => `${e.canonical_name} (${e.entity_type})`).join(", ") || "None extracted"}  \n`;
      md += `- **Validated connections:** ${relatedLinks.length}  \n`;
      md += `- **Excerpt:** ${doc.raw_text.slice(0, 300)}...  \n\n`;
    }
  }

  // Section 5: Data Discrepancy Appendix
  md += "---\n\n";
  md += "## Appendix A: Data Discrepancy Report\n\n";
  md +=
    "The following unresolved negative constraints and high-severity data contradictions were identified during analysis. ";
  md +=
    "These items require additional investigation before the case brief can be considered conclusive.\n\n";

  const allConstraints = [];

  for (const feat of features) {
    const constraints = JSON.parse(feat.negative_constraints);
    const doc = docMap.get(feat.document_id);
    for (const c of constraints) {
      allConstraints.push({
        source: doc?.title || feat.document_id,
        sourceType: "Document Extraction",
        ...c,
      });
    }
  }

  for (const link of allLinks) {
    if (link.dismissed) continue;
    const docA = docMap.get(link.source_doc_a);
    const docB = docMap.get(link.source_doc_b);
    for (const c of link.negative_constraints) {
      allConstraints.push({
        source: `${docA?.title || link.source_doc_a} ↔ ${docB?.title || link.source_doc_b}`,
        sourceType: "Correlation Analysis",
        ...c,
      });
    }
  }

  const highConstraints = allConstraints.filter(
    (c) => c.severity === "High"
  );
  const medConstraints = allConstraints.filter(
    (c) => c.severity === "Medium"
  );
  const lowConstraints = allConstraints.filter(
    (c) => c.severity === "Low"
  );

  if (highConstraints.length > 0) {
    md += "### High Severity\n\n";
    for (const c of highConstraints) {
      md += `- **${c.description}**  \n`;
      md += `  Source: ${c.source} (${c.sourceType})  \n`;
      if (c.details) md += `  Details: ${c.details}  \n`;
      md += "\n";
    }
  }

  if (medConstraints.length > 0) {
    md += "### Medium Severity\n\n";
    for (const c of medConstraints) {
      md += `- **${c.description}**  \n`;
      md += `  Source: ${c.source} (${c.sourceType})  \n`;
      if (c.details) md += `  Details: ${c.details}  \n`;
      md += "\n";
    }
  }

  if (lowConstraints.length > 0) {
    md += "### Low Severity\n\n";
    for (const c of lowConstraints) {
      md += `- **${c.description}**  \n`;
      md += `  Source: ${c.source} (${c.sourceType})  \n`;
      if (c.details) md += `  Details: ${c.details}  \n`;
      md += "\n";
    }
  }

  if (allConstraints.length === 0) {
    md += "*No unresolved data discrepancies identified.*\n\n";
  }

  md += "---\n\n";
  md += `*End of Intelligence Case Brief — ${now} UTC*\n`;

  const format = req.query.format || "markdown";
  if (format === "html") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(renderHtml(md, now));
  } else {
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="threadline-case-brief-${now.replace(/[: ]/g, "-")}.md"`
    );
    res.send(md);
  }
});

function renderHtml(markdown, timestamp) {
  const lines = markdown.split("\n");
  let html = "";
  let inTable = false;
  let inTableHeader = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.startsWith("# ")) {
      html += `<h1>${escHtml(line.slice(2))}</h1>\n`;
    } else if (line.startsWith("## ")) {
      html += `<h2>${escHtml(line.slice(3))}</h2>\n`;
    } else if (line.startsWith("### ")) {
      html += `<h3>${escHtml(line.slice(4))}</h3>\n`;
    } else if (line.startsWith("#### ")) {
      html += `<h4>${escHtml(line.slice(5))}</h4>\n`;
    } else if (line.startsWith("---")) {
      html += "<hr>\n";
    } else if (line.startsWith("| ") && !line.startsWith("|--")) {
      if (!inTable) {
        html += "<table>\n";
        inTable = true;
        inTableHeader = true;
      }
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      const tag = inTableHeader ? "th" : "td";
      html += `<tr>${cells.map((c) => `<${tag}>${escHtml(c)}</${tag}>`).join("")}</tr>\n`;
      if (inTableHeader) inTableHeader = false;
    } else if (line.startsWith("|--")) {
      continue;
    } else {
      if (inTable) {
        html += "</table>\n";
        inTable = false;
      }
      if (line.startsWith("- ")) {
        line = line.slice(2);
        line = inlineFormat(line);
        html += `<li>${line}</li>\n`;
      } else if (line.startsWith("*") && line.endsWith("*") && !line.startsWith("**")) {
        html += `<p><em>${escHtml(line.slice(1, -1))}</em></p>\n`;
      } else if (line.trim() === "") {
        html += "\n";
      } else {
        html += `<p>${inlineFormat(line)}</p>\n`;
      }
    }
  }
  if (inTable) html += "</table>\n";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Threadline Intelligence Case Brief</title>
<style>
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #0a0a0f; color: #d1d5db; line-height: 1.7; padding: 40px; max-width: 900px; margin: 0 auto; }
  h1 { color: #22d3ee; font-size: 1.8rem; margin: 0 0 16px; border-bottom: 2px solid #22d3ee40; padding-bottom: 12px; }
  h2 { color: #e5e7eb; font-size: 1.3rem; margin: 32px 0 12px; border-bottom: 1px solid #374151; padding-bottom: 8px; }
  h3 { color: #9ca3af; font-size: 1.1rem; margin: 24px 0 8px; }
  h4 { color: #d1d5db; font-size: 1rem; margin: 16px 0 8px; }
  p { margin: 6px 0; }
  strong { color: #f9fafb; }
  em { color: #9ca3af; font-style: italic; }
  hr { border: none; border-top: 1px solid #374151; margin: 24px 0; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th { background: #1f2937; color: #9ca3af; text-align: left; padding: 8px 12px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #374151; }
  td { padding: 8px 12px; border-bottom: 1px solid #1f2937; font-size: 0.9rem; }
  tr:hover td { background: #111827; }
  li { margin: 4px 0 4px 20px; }
  @media print { body { background: #fff; color: #111; } h1 { color: #0891b2; } h2, h3 { color: #333; } th { background: #f3f4f6; color: #374151; } td { border-bottom: 1px solid #e5e7eb; } hr { border-top-color: #d1d5db; } }
</style>
</head>
<body>
${html}
</body>
</html>`;
}

function escHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineFormat(str) {
  str = escHtml(str);
  str = str.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  str = str.replace(/_"(.+?)"_/g, "<em>&ldquo;$1&rdquo;</em>");
  str = str.replace(/_(.+?)_/g, "<em>$1</em>");
  return str;
}

export default router;
