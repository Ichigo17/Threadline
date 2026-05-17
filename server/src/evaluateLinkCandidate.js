/**
 * evaluateLinkCandidate — Pure-function link evaluation logic.
 *
 * Given two extraction objects (from Pass 1), evaluates whether a link
 * should be established and computes confidence, shared entities,
 * and negative constraints.
 *
 * This module is side-effect-free (no DB access) so it can be unit-tested.
 */

/**
 * Evaluate whether two document extractions should be linked.
 *
 * @param {object} extractionA - Pass 1 extraction for document A
 * @param {object} extractionB - Pass 1 extraction for document B
 * @param {object} [options] - Optional metadata
 * @param {string} [options.titleA] - Title of document A
 * @param {string} [options.titleB] - Title of document B
 * @param {string} [options.textA] - Raw text of document A
 * @param {string} [options.textB] - Raw text of document B
 * @returns {object} Link evaluation result
 */
export function evaluateLinkCandidate(extractionA, extractionB, options = {}) {
  const { titleA = "Document A", titleB = "Document B", textA = "", textB = "" } = options;

  const personsA = (extractionA.persons || []).map((p) => p.name.toLowerCase());
  const personsB = (extractionB.persons || []).map((p) => p.name.toLowerCase());
  const sharedPersons = personsA.filter((p) => personsB.includes(p));

  const locA = (extractionA.locations || []).map((l) => l.name.toLowerCase());
  const locB = (extractionB.locations || []).map((l) => l.name.toLowerCase());
  const sharedLocations = locA.filter((l) =>
    locB.some((lb) => lb.includes(l) || l.includes(lb))
  );

  const keywords = [
    "dock", "vessel", "fuel", "harbor", "radio", "camera",
    "manifest", "unauthorized", "night", "cargo",
  ];
  const tA = textA.toLowerCase();
  const tB = textB.toLowerCase();
  const sharedKeywords = keywords.filter((k) => tA.includes(k) && tB.includes(k));

  const totalShared = sharedPersons.length + sharedLocations.length + sharedKeywords.length;

  let confidence = "Weak";
  if (totalShared >= 5) confidence = "Strong";
  else if (totalShared >= 2) confidence = "Moderate";

  const status = totalShared > 0 ? "Linked" : "Unlinked";

  // Collect negative constraints from both extractions
  const negativeConstraints = collectNegativeConstraints(extractionA, extractionB);

  const primaryVector =
    totalShared > 0
      ? `Documents share ${sharedPersons.length} person(s), ${sharedLocations.length} location(s), and ${sharedKeywords.length} thematic keyword(s).`
      : `No direct entity overlap found between "${titleA}" and "${titleB}".`;

  const counterfactual =
    totalShared > 0
      ? `The shared references could be coincidental. Harbor locations like docks and piers are common references in any maritime report.`
      : `No direct entity overlap was found. Any perceived connection may reflect shared operational context rather than a genuine link.`;

  return {
    status,
    confidence,
    primary_vector: primaryVector,
    counterfactual_argument: counterfactual,
    shared_entities: [...sharedPersons, ...sharedLocations],
    shared_keywords: sharedKeywords,
    negative_constraints: negativeConstraints,
  };
}

/**
 * Collect and merge negative constraints from two extractions,
 * plus detect cross-document contradictions.
 */
export function collectNegativeConstraints(extractionA, extractionB) {
  const constraints = [];

  // Pass through existing constraints from both extractions
  for (const c of extractionA.negative_constraints || []) {
    constraints.push({ ...c, source: "A" });
  }
  for (const c of extractionB.negative_constraints || []) {
    constraints.push({ ...c, source: "B" });
  }

  // Detect temporal contradictions
  const timesA = extractTimestamps(extractionA);
  const timesB = extractTimestamps(extractionB);
  const contradictions = detectTemporalContradictions(timesA, timesB, extractionA, extractionB);
  constraints.push(...contradictions);

  // Detect location contradictions
  const locContradictions = detectLocationContradictions(extractionA, extractionB);
  constraints.push(...locContradictions);

  return constraints;
}

/**
 * Extract timestamps from an extraction's locations.
 */
export function extractTimestamps(extraction) {
  const timestamps = [];
  for (const loc of extraction.locations || []) {
    if (loc.timestamp) {
      timestamps.push({ location: loc.name, timestamp: loc.timestamp });
    }
  }
  return timestamps;
}

/**
 * Detect temporal contradictions: same person referenced at two locations
 * at times that would be physically impossible.
 */
export function detectTemporalContradictions(timesA, timesB, extractionA, extractionB) {
  const contradictions = [];

  const personsA = (extractionA.persons || []).map((p) => p.name.toLowerCase());
  const personsB = (extractionB.persons || []).map((p) => p.name.toLowerCase());
  const sharedPersons = personsA.filter((p) => personsB.includes(p));

  if (sharedPersons.length > 0 && timesA.length > 0 && timesB.length > 0) {
    // Check if timestamps overlap in a way that suggests contradiction
    for (const tA of timesA) {
      for (const tB of timesB) {
        const minutesA = parseTimeToMinutes(tA.timestamp);
        const minutesB = parseTimeToMinutes(tB.timestamp);
        if (minutesA !== null && minutesB !== null) {
          const gap = Math.abs(minutesA - minutesB);
          if (gap < 5 && tA.location.toLowerCase() !== tB.location.toLowerCase()) {
            contradictions.push({
              description: `Temporal contradiction: shared person(s) referenced at "${tA.location}" (${tA.timestamp}) and "${tB.location}" (${tB.timestamp}) within ${gap} minutes`,
              severity: "High",
              details: `Less than 5 minutes between events at different locations suggests either different individuals or a data error`,
              source: "cross-document",
            });
          }
        }
      }
    }
  }

  return contradictions;
}

/**
 * Detect location contradictions: same entity described at contradictory locations.
 */
export function detectLocationContradictions(extractionA, extractionB) {
  const contradictions = [];

  const locsA = (extractionA.locations || []).map((l) => ({
    name: l.name.toLowerCase(),
    lat: l.lat,
    lng: l.lng,
  }));
  const locsB = (extractionB.locations || []).map((l) => ({
    name: l.name.toLowerCase(),
    lat: l.lat,
    lng: l.lng,
  }));

  // Check for same-named locations with very different coordinates
  for (const a of locsA) {
    for (const b of locsB) {
      if (
        a.name === b.name &&
        a.lat != null && a.lng != null &&
        b.lat != null && b.lng != null
      ) {
        const dist = Math.sqrt(
          Math.pow(a.lat - b.lat, 2) + Math.pow(a.lng - b.lng, 2)
        );
        if (dist > 0.01) {
          contradictions.push({
            description: `Location contradiction: "${a.name}" has significantly different coordinates across documents`,
            severity: "High",
            details: `Document A: (${a.lat}, ${a.lng}), Document B: (${b.lat}, ${b.lng}) — distance suggests data inconsistency`,
            source: "cross-document",
          });
        }
      }
    }
  }

  return contradictions;
}

/**
 * Parse a timestamp string like "02:17 AM" into total minutes from midnight.
 */
export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}
