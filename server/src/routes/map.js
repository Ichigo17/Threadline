import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/locations", (req, res) => {
  const features = db
    .prepare("SELECT document_id, locations, raw_extraction FROM extracted_features")
    .all();

  const locations = [];
  for (const row of features) {
    const parsed = JSON.parse(row.locations);
    for (const loc of parsed) {
      if (loc.lat != null && loc.lng != null) {
        locations.push({
          document_id: row.document_id,
          name: loc.name,
          lat: loc.lat,
          lng: loc.lng,
          timestamp: loc.timestamp || null,
          details: loc.details || null,
        });
      }
    }
  }
  res.json(locations);
});

router.get("/link-paths", (req, res) => {
  const links = db
    .prepare(
      `SELECT id, source_doc_a, source_doc_b, confidence, is_investigator_validated, dismissed
       FROM incident_links
       WHERE dismissed = 0`
    )
    .all();

  const features = db
    .prepare("SELECT document_id, locations FROM extracted_features")
    .all();

  const locByDoc = {};
  for (const row of features) {
    const parsed = JSON.parse(row.locations);
    const coords = parsed.filter((l) => l.lat != null && l.lng != null);
    if (coords.length > 0) {
      locByDoc[row.document_id] = coords;
    }
  }

  const paths = [];
  for (const link of links) {
    const locsA = locByDoc[link.source_doc_a];
    const locsB = locByDoc[link.source_doc_b];
    if (locsA && locsB) {
      const centroidA = getCentroid(locsA);
      const centroidB = getCentroid(locsB);
      paths.push({
        link_id: link.id,
        source_doc_a: link.source_doc_a,
        source_doc_b: link.source_doc_b,
        confidence: link.confidence,
        is_validated: !!link.is_investigator_validated,
        from: centroidA,
        to: centroidB,
        from_locations: locsA.map((l) => ({ name: l.name, lat: l.lat, lng: l.lng })),
        to_locations: locsB.map((l) => ({ name: l.name, lat: l.lat, lng: l.lng })),
      });
    }
  }
  res.json(paths);
});

function getCentroid(locations) {
  const sum = locations.reduce(
    (acc, l) => ({ lat: acc.lat + l.lat, lng: acc.lng + l.lng }),
    { lat: 0, lng: 0 }
  );
  return {
    lat: sum.lat / locations.length,
    lng: sum.lng / locations.length,
  };
}

export default router;
