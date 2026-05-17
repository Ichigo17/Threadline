import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import db from "./db.js";
import { shouldUseMock, getMockExtraction, getMockCorrelation } from "./mockPipelineEngine.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "demo" });

const PASS1_SYSTEM_PROMPT = `You are a forensic intelligence analyst. Given a raw incident document, extract structured data in JSON format:
{
  "persons": [{ "name": "string", "clothing": "string|null", "description": "string|null" }],
  "vehicles": [{ "description": "string", "trajectory": "string|null", "plate": "string|null" }],
  "locations": [{ "name": "string", "timestamp": "string|null", "details": "string|null" }],
  "weak_signals": [{ "signal": "string", "excerpt": "string", "significance": "string" }],
  "negative_constraints": [{ "description": "string", "severity": "Low|Medium|High", "details": "string" }]
}
Extract ALL persons with clothing details if mentioned, ALL vehicles with trajectories, ALL locations with timestamps.
For weak_signals: identify specific phrases, camera-avoidant behaviors, unusual patterns, and include exact string excerpts.
For negative_constraints: identify internal contradictions, descriptive discrepancies, or geographic/temporal timeline gaps.
Return ONLY valid JSON, no markdown.`;

const PASS2_SYSTEM_PROMPT = `You are a critical intelligence evaluator performing correlation analysis between two documents. You must generate:
1. A "Primary Correlation Vector" - the strongest positive linking logic between documents
2. A "Devil's Advocate Hypothesis" - an explicit counterfactual analysis explaining why the correlation could be a false positive

Return JSON:
{
  "confidence": "Weak|Moderate|Strong",
  "primary_vector": "string - detailed positive linking logic",
  "explanation": "string - summary of the correlation",
  "counterfactual_argument": "string - detailed devil's advocate analysis explaining why this could be a false positive",
  "shared_entities": ["string"],
  "weak_signals": [{ "signal": "string", "excerpt": "string" }],
  "negative_constraints": [{ "description": "string", "severity": "Low|Medium|High" }]
}
Be thorough and critical. The counterfactual must be substantive and challenge the correlation.
Return ONLY valid JSON, no markdown.`;

export async function runPass1(documentId) {
  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(documentId);
  if (!doc) throw new Error(`Document ${documentId} not found`);

  const existing = db.prepare("SELECT * FROM extracted_features WHERE document_id = ?").get(documentId);
  if (existing) return JSON.parse(existing.raw_extraction);

  let extraction;
  if (shouldUseMock()) {
    extraction = getMockExtraction(documentId);
  } else {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: PASS1_SYSTEM_PROMPT },
          { role: "user", content: `Analyze this document:\n\nTitle: ${doc.title}\nSource Type: ${doc.source_type}\n\n${doc.raw_text}` },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      });
      extraction = JSON.parse(response.choices[0].message.content);
    } catch {
      extraction = getMockExtraction(documentId);
    }
  }

  const featureId = uuidv4();
  db.prepare(`
    INSERT INTO extracted_features (id, document_id, persons, vehicles, locations, weak_signals, negative_constraints, raw_extraction)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    featureId,
    documentId,
    JSON.stringify(extraction.persons || []),
    JSON.stringify(extraction.vehicles || []),
    JSON.stringify(extraction.locations || []),
    JSON.stringify(extraction.weak_signals || []),
    JSON.stringify(extraction.negative_constraints || []),
    JSON.stringify(extraction)
  );

  syncEntities(documentId, extraction);
  return extraction;
}

export async function runPass2(docIdA, docIdB) {
  const docA = db.prepare("SELECT * FROM documents WHERE id = ?").get(docIdA);
  const docB = db.prepare("SELECT * FROM documents WHERE id = ?").get(docIdB);
  if (!docA || !docB) throw new Error("One or both documents not found");

  const featA = db.prepare("SELECT * FROM extracted_features WHERE document_id = ?").get(docIdA);
  const featB = db.prepare("SELECT * FROM extracted_features WHERE document_id = ?").get(docIdB);

  let correlation;
  if (shouldUseMock()) {
    correlation = getMockCorrelation(docIdA, docIdB);
  } else {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: PASS2_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Compare these two documents for correlations:\n\nDOCUMENT A:\nTitle: ${docA.title}\n${docA.raw_text}\n\nExtracted Features A:\n${featA ? featA.raw_extraction : "N/A"}\n\nDOCUMENT B:\nTitle: ${docB.title}\n${docB.raw_text}\n\nExtracted Features B:\n${featB ? featB.raw_extraction : "N/A"}`,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });
      correlation = JSON.parse(response.choices[0].message.content);
    } catch {
      correlation = getMockCorrelation(docIdA, docIdB);
    }
  }

  const linkId = uuidv4();
  db.prepare(`
    INSERT INTO incident_links (id, source_doc_a, source_doc_b, confidence, explanation, counterfactual_argument, primary_vector, weak_signals, negative_constraints)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    linkId,
    docIdA,
    docIdB,
    correlation.confidence || "Moderate",
    correlation.explanation || "",
    correlation.counterfactual_argument || "",
    correlation.primary_vector || "",
    JSON.stringify(correlation.weak_signals || []),
    JSON.stringify(correlation.negative_constraints || [])
  );

  return { id: linkId, ...correlation };
}

export async function runFullPipeline(documentIds) {
  const extractions = [];
  for (const id of documentIds) {
    const result = await runPass1(id);
    extractions.push({ documentId: id, ...result });
  }

  const links = [];
  for (let i = 0; i < documentIds.length; i++) {
    for (let j = i + 1; j < documentIds.length; j++) {
      const link = await runPass2(documentIds[i], documentIds[j]);
      links.push(link);
    }
  }

  return { extractions, links };
}

function syncEntities(documentId, extraction) {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO meta_entities (id, canonical_name, entity_type, aliases, metadata, document_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const person of extraction.persons || []) {
    insert.run(uuidv4(), person.name, "Person", JSON.stringify([]), JSON.stringify(person), documentId);
  }
  for (const vehicle of extraction.vehicles || []) {
    const name = vehicle.plate || vehicle.description || "Unknown Vehicle";
    insert.run(uuidv4(), name, "Vehicle", JSON.stringify([]), JSON.stringify(vehicle), documentId);
  }
  for (const location of extraction.locations || []) {
    insert.run(uuidv4(), location.name, "Location", JSON.stringify([]), JSON.stringify(location), documentId);
  }
}

function generateFallbackExtraction(doc) {
  const text = doc.raw_text.toLowerCase();
  const persons = [];
  const vehicles = [];
  const locations = [];
  const weakSignals = [];
  const negativeConstraints = [];

  const personPatterns = [
    /(?:man|woman|male|female|individual|subject|person|suspect|witness|officer|clerk|operator|worker|guard)\s+(?:named\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(?:,\s*(?:a|the)\s+)?(?:dock\s+worker|fuel\s+clerk|security|operator|witness|guard|captain|mate)/gi,
  ];

  for (const pattern of personPatterns) {
    let match;
    while ((match = pattern.exec(doc.raw_text)) !== null) {
      const name = match[1].trim();
      if (name.length > 2 && !["The", "This", "That", "With"].includes(name)) {
        const clothingMatch = doc.raw_text.match(new RegExp(`${name}[^.]*(?:wearing|wore|dressed in|in a)\\s+([^.]+)`, "i"));
        persons.push({ name, clothing: clothingMatch ? clothingMatch[1].trim() : null, description: null });
      }
    }
  }

  const vehiclePatterns = /(?:vessel|boat|ship|truck|van|car|vehicle|tanker|barge|craft)\s*[^.]*?(?:plate|registration|hull|number)?[^.]*/gi;
  let vMatch;
  while ((vMatch = vehiclePatterns.exec(doc.raw_text)) !== null) {
    vehicles.push({ description: vMatch[0].trim().slice(0, 120), trajectory: null, plate: null });
  }

  const locationPatterns = /(?:dock|pier|berth|slip|warehouse|terminal|gate|harbor|port|bay|loading\s+(?:dock|bay|zone)|fuel\s+(?:depot|station))\s*(?:#?\d+)?[^.]*/gi;
  let lMatch;
  while ((lMatch = locationPatterns.exec(doc.raw_text)) !== null) {
    const timeMatch = lMatch[0].match(/\d{1,2}:\d{2}\s*(?:AM|PM|hrs?)?/i);
    locations.push({ name: lMatch[0].trim().slice(0, 80), timestamp: timeMatch ? timeMatch[0] : null, details: null });
  }

  if (text.includes("camera") || text.includes("avoid") || text.includes("blind spot")) {
    weakSignals.push({ signal: "Camera-avoidant behavior", excerpt: "Referenced camera/surveillance avoidance", significance: "Possible counter-surveillance awareness" });
  }
  if (text.includes("radio silence") || text.includes("no response") || text.includes("off-channel")) {
    weakSignals.push({ signal: "Communication anomaly", excerpt: "Radio silence or off-channel communication detected", significance: "Potential coordination outside normal channels" });
  }
  if (text.includes("unscheduled") || text.includes("unauthorized") || text.includes("no manifest")) {
    weakSignals.push({ signal: "Procedural deviation", excerpt: "Unscheduled or unauthorized activity", significance: "Departure from standard operating procedures" });
  }

  const timeRefs = doc.raw_text.match(/\d{1,2}:\d{2}\s*(?:AM|PM|hrs?)?/gi) || [];
  if (timeRefs.length >= 2) {
    negativeConstraints.push({ description: "Multiple timestamps present — verify temporal consistency", severity: "Medium", details: `Found timestamps: ${timeRefs.join(", ")}` });
  }

  return { persons, vehicles, locations, weak_signals: weakSignals, negative_constraints: negativeConstraints };
}

function generateFallbackCorrelation(docA, docB, featA, featB) {
  const extractionA = featA ? JSON.parse(featA.raw_extraction) : generateFallbackExtraction(docA);
  const extractionB = featB ? JSON.parse(featB.raw_extraction) : generateFallbackExtraction(docB);

  const personsA = (extractionA.persons || []).map((p) => p.name.toLowerCase());
  const personsB = (extractionB.persons || []).map((p) => p.name.toLowerCase());
  const sharedPersons = personsA.filter((p) => personsB.includes(p));

  const locA = (extractionA.locations || []).map((l) => l.name.toLowerCase());
  const locB = (extractionB.locations || []).map((l) => l.name.toLowerCase());
  const sharedLocations = locA.filter((l) => locB.some((lb) => lb.includes(l) || l.includes(lb)));

  const textA = docA.raw_text.toLowerCase();
  const textB = docB.raw_text.toLowerCase();
  const keywords = ["dock", "vessel", "fuel", "harbor", "radio", "camera", "manifest", "unauthorized", "night", "cargo"];
  const sharedKeywords = keywords.filter((k) => textA.includes(k) && textB.includes(k));

  const totalShared = sharedPersons.length + sharedLocations.length + sharedKeywords.length;
  let confidence = "Weak";
  if (totalShared >= 5) confidence = "Strong";
  else if (totalShared >= 2) confidence = "Moderate";

  const allSignalsA = extractionA.weak_signals || [];
  const allSignalsB = extractionB.weak_signals || [];
  const allConstraintsA = extractionA.negative_constraints || [];
  const allConstraintsB = extractionB.negative_constraints || [];

  const primaryVector =
    totalShared > 0
      ? `Documents share ${sharedPersons.length} person(s), ${sharedLocations.length} location(s), and ${sharedKeywords.length} thematic keyword(s). ${sharedPersons.length > 0 ? `Shared persons: ${sharedPersons.join(", ")}.` : ""} ${sharedLocations.length > 0 ? `Shared locations: ${sharedLocations.join(", ")}.` : ""} ${sharedKeywords.length > 0 ? `Shared keywords: ${sharedKeywords.join(", ")}.` : ""} These overlapping references suggest the documents describe related events within the same operational theater, potentially involving the same actors and infrastructure.`
      : `While no direct entity overlap was found, both documents reference harbor/maritime operations and may describe adjacent events in the same operational context. Thematic analysis suggests a possible indirect connection through shared operational environment.`;

  const counterfactual =
    totalShared > 0
      ? `The shared references could be coincidental. ${sharedLocations.length > 0 ? "Harbor locations like docks and piers are common references in any maritime report — shared location names may reflect standard infrastructure rather than connected events." : ""} ${sharedPersons.length > 0 ? "Common names could refer to different individuals, especially in a large port facility with multiple shifts." : ""} ${sharedKeywords.length > 0 ? "Keywords like 'dock', 'vessel', and 'cargo' are generic maritime terminology expected in any port-related document." : ""} Without independent corroboration (security footage, access logs), the correlation remains circumstantial.`
      : `No direct entity overlap was found between documents. The apparent thematic similarity may simply reflect that both documents originate from the same general operational environment (a harbor). Without shared persons, vehicles, or specific locations, any correlation is speculative and risks confirmation bias.`;

  return {
    confidence,
    primary_vector: primaryVector,
    explanation: `Correlation analysis found ${totalShared} shared reference(s) across documents "${docA.title}" and "${docB.title}".`,
    counterfactual_argument: counterfactual,
    shared_entities: [...sharedPersons, ...sharedLocations],
    weak_signals: [...allSignalsA.slice(0, 2), ...allSignalsB.slice(0, 2)],
    negative_constraints: [...allConstraintsA, ...allConstraintsB],
  };
}
