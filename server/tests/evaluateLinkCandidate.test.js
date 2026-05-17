import { describe, it, expect } from "@jest/globals";
import {
  evaluateLinkCandidate,
  collectNegativeConstraints,
  parseTimeToMinutes,
  detectTemporalContradictions,
  detectLocationContradictions,
} from "../src/evaluateLinkCandidate.js";

describe("evaluateLinkCandidate", () => {
  it("returns 'Linked' status when documents share persons", () => {
    const a = {
      persons: [{ name: "Sgt. Marcus Hale" }],
      locations: [],
      vehicles: [],
      weak_signals: [],
      negative_constraints: [],
    };
    const b = {
      persons: [{ name: "Sgt. Marcus Hale" }],
      locations: [],
      vehicles: [],
      weak_signals: [],
      negative_constraints: [],
    };
    const result = evaluateLinkCandidate(a, b);
    expect(result.status).toBe("Linked");
    expect(result.shared_entities).toContain("sgt. marcus hale");
  });

  it("returns 'Linked' status when documents share locations", () => {
    const a = {
      persons: [],
      locations: [{ name: "Pier 7" }],
      vehicles: [],
      weak_signals: [],
      negative_constraints: [],
    };
    const b = {
      persons: [],
      locations: [{ name: "Pier 7, East Loading Dock" }],
      vehicles: [],
      weak_signals: [],
      negative_constraints: [],
    };
    const result = evaluateLinkCandidate(a, b);
    expect(result.status).toBe("Linked");
    expect(result.shared_entities.length).toBeGreaterThan(0);
  });

  it("returns 'Unlinked' status when no shared entities or keywords", () => {
    const a = {
      persons: [{ name: "Alice" }],
      locations: [{ name: "Park" }],
      vehicles: [],
      weak_signals: [],
      negative_constraints: [],
    };
    const b = {
      persons: [{ name: "Bob" }],
      locations: [{ name: "Airport" }],
      vehicles: [],
      weak_signals: [],
      negative_constraints: [],
    };
    const result = evaluateLinkCandidate(a, b, {
      textA: "sunny day at the park",
      textB: "flight landed on time",
    });
    expect(result.status).toBe("Unlinked");
    expect(result.confidence).toBe("Weak");
  });

  it("assigns 'Strong' confidence when 5+ shared signals", () => {
    const a = {
      persons: [{ name: "Alpha" }, { name: "Bravo" }],
      locations: [{ name: "Dock A" }, { name: "Harbor Gate" }],
      vehicles: [],
      weak_signals: [],
      negative_constraints: [],
    };
    const b = {
      persons: [{ name: "Alpha" }, { name: "Bravo" }],
      locations: [{ name: "Dock A" }, { name: "Harbor Gate" }],
      vehicles: [],
      weak_signals: [],
      negative_constraints: [],
    };
    const result = evaluateLinkCandidate(a, b, {
      textA: "harbor dock vessel fuel cargo",
      textB: "harbor dock vessel fuel cargo",
    });
    expect(result.confidence).toBe("Strong");
  });

  it("assigns 'Moderate' confidence when 2-4 shared signals", () => {
    const a = {
      persons: [{ name: "Alpha" }],
      locations: [{ name: "Pier 7" }],
      vehicles: [],
      weak_signals: [],
      negative_constraints: [],
    };
    const b = {
      persons: [{ name: "Alpha" }],
      locations: [{ name: "Pier 7" }],
      vehicles: [],
      weak_signals: [],
      negative_constraints: [],
    };
    const result = evaluateLinkCandidate(a, b);
    expect(result.confidence).toBe("Moderate");
  });

  it("generates primary vector and counterfactual for linked documents", () => {
    const a = {
      persons: [{ name: "Hale" }],
      locations: [],
      vehicles: [],
      weak_signals: [],
      negative_constraints: [],
    };
    const b = {
      persons: [{ name: "Hale" }],
      locations: [],
      vehicles: [],
      weak_signals: [],
      negative_constraints: [],
    };
    const result = evaluateLinkCandidate(a, b);
    expect(result.primary_vector).toContain("1 person(s)");
    expect(result.counterfactual_argument).toBeTruthy();
    expect(typeof result.counterfactual_argument).toBe("string");
  });

  it("generates counterfactual for unlinked documents", () => {
    const a = {
      persons: [{ name: "Alice" }],
      locations: [],
      vehicles: [],
      weak_signals: [],
      negative_constraints: [],
    };
    const b = {
      persons: [{ name: "Bob" }],
      locations: [],
      vehicles: [],
      weak_signals: [],
      negative_constraints: [],
    };
    const result = evaluateLinkCandidate(a, b, {
      titleA: "Report A",
      titleB: "Report B",
    });
    expect(result.primary_vector).toContain("No direct entity overlap");
    expect(result.counterfactual_argument).toContain("No direct entity overlap");
  });

  it("includes shared keywords from text content", () => {
    const a = {
      persons: [],
      locations: [],
      vehicles: [],
      weak_signals: [],
      negative_constraints: [],
    };
    const b = {
      persons: [],
      locations: [],
      vehicles: [],
      weak_signals: [],
      negative_constraints: [],
    };
    const result = evaluateLinkCandidate(a, b, {
      textA: "The dock worker loaded fuel onto the vessel near the harbor",
      textB: "Fuel was delivered to the harbor dock for a waiting vessel",
    });
    expect(result.status).toBe("Linked");
    expect(result.shared_keywords).toEqual(
      expect.arrayContaining(["dock", "fuel", "harbor", "vessel"])
    );
  });
});

describe("parseTimeToMinutes", () => {
  it("parses AM time correctly", () => {
    expect(parseTimeToMinutes("02:17 AM")).toBe(137);
  });

  it("parses PM time correctly", () => {
    expect(parseTimeToMinutes("02:17 PM")).toBe(857);
  });

  it("parses 12:00 AM as midnight (0 minutes)", () => {
    expect(parseTimeToMinutes("12:00 AM")).toBe(0);
  });

  it("parses 12:00 PM as noon (720 minutes)", () => {
    expect(parseTimeToMinutes("12:00 PM")).toBe(720);
  });

  it("parses 24h format without AM/PM", () => {
    expect(parseTimeToMinutes("14:30")).toBe(870);
  });

  it("returns null for invalid input", () => {
    expect(parseTimeToMinutes("not a time")).toBeNull();
    expect(parseTimeToMinutes(null)).toBeNull();
    expect(parseTimeToMinutes("")).toBeNull();
  });
});

describe("detectTemporalContradictions", () => {
  it("detects high-severity contradiction when same person at different locations within 5 minutes", () => {
    const extractionA = {
      persons: [{ name: "Subject Alpha" }],
      locations: [{ name: "Pier 7", timestamp: "02:17 AM" }],
    };
    const extractionB = {
      persons: [{ name: "Subject Alpha" }],
      locations: [{ name: "Harbor Gate", timestamp: "02:19 AM" }],
    };
    const timesA = [{ location: "Pier 7", timestamp: "02:17 AM" }];
    const timesB = [{ location: "Harbor Gate", timestamp: "02:19 AM" }];

    const contradictions = detectTemporalContradictions(
      timesA, timesB, extractionA, extractionB
    );
    expect(contradictions.length).toBeGreaterThan(0);
    expect(contradictions[0].severity).toBe("High");
    expect(contradictions[0].description).toContain("Temporal contradiction");
  });

  it("does not flag contradiction when locations are far apart in time", () => {
    const extractionA = {
      persons: [{ name: "Subject Alpha" }],
      locations: [{ name: "Pier 7", timestamp: "01:00 AM" }],
    };
    const extractionB = {
      persons: [{ name: "Subject Alpha" }],
      locations: [{ name: "Harbor Gate", timestamp: "03:00 AM" }],
    };
    const timesA = [{ location: "Pier 7", timestamp: "01:00 AM" }];
    const timesB = [{ location: "Harbor Gate", timestamp: "03:00 AM" }];

    const contradictions = detectTemporalContradictions(
      timesA, timesB, extractionA, extractionB
    );
    expect(contradictions.length).toBe(0);
  });

  it("does not flag contradiction when no shared persons", () => {
    const extractionA = {
      persons: [{ name: "Alice" }],
      locations: [{ name: "Pier 7", timestamp: "02:17 AM" }],
    };
    const extractionB = {
      persons: [{ name: "Bob" }],
      locations: [{ name: "Harbor Gate", timestamp: "02:18 AM" }],
    };
    const timesA = [{ location: "Pier 7", timestamp: "02:17 AM" }];
    const timesB = [{ location: "Harbor Gate", timestamp: "02:18 AM" }];

    const contradictions = detectTemporalContradictions(
      timesA, timesB, extractionA, extractionB
    );
    expect(contradictions.length).toBe(0);
  });
});

describe("detectLocationContradictions", () => {
  it("detects high-severity contradiction when same location has very different coordinates", () => {
    const a = {
      locations: [{ name: "Pier 7", lat: 33.7405, lng: -118.2783 }],
    };
    const b = {
      locations: [{ name: "Pier 7", lat: 33.7600, lng: -118.2500 }],
    };
    const contradictions = detectLocationContradictions(a, b);
    expect(contradictions.length).toBeGreaterThan(0);
    expect(contradictions[0].severity).toBe("High");
    expect(contradictions[0].description).toContain("Location contradiction");
  });

  it("does not flag contradiction when coordinates are close", () => {
    const a = {
      locations: [{ name: "Pier 7", lat: 33.7405, lng: -118.2783 }],
    };
    const b = {
      locations: [{ name: "Pier 7", lat: 33.7406, lng: -118.2782 }],
    };
    const contradictions = detectLocationContradictions(a, b);
    expect(contradictions.length).toBe(0);
  });

  it("does not flag contradiction for different location names", () => {
    const a = {
      locations: [{ name: "Pier 7", lat: 33.7405, lng: -118.2783 }],
    };
    const b = {
      locations: [{ name: "Gate 4", lat: 33.7600, lng: -118.2500 }],
    };
    const contradictions = detectLocationContradictions(a, b);
    expect(contradictions.length).toBe(0);
  });
});

describe("collectNegativeConstraints", () => {
  it("merges constraints from both extractions", () => {
    const a = {
      persons: [],
      locations: [],
      negative_constraints: [
        { description: "Constraint A", severity: "High", details: "Detail A" },
      ],
    };
    const b = {
      persons: [],
      locations: [],
      negative_constraints: [
        { description: "Constraint B", severity: "Medium", details: "Detail B" },
      ],
    };
    const constraints = collectNegativeConstraints(a, b);
    expect(constraints.length).toBeGreaterThanOrEqual(2);
    const descs = constraints.map((c) => c.description);
    expect(descs).toContain("Constraint A");
    expect(descs).toContain("Constraint B");
  });

  it("adds cross-document temporal contradictions", () => {
    const a = {
      persons: [{ name: "Subject Alpha" }],
      locations: [{ name: "Pier 7", timestamp: "02:17 AM" }],
      negative_constraints: [],
    };
    const b = {
      persons: [{ name: "Subject Alpha" }],
      locations: [{ name: "Harbor Gate", timestamp: "02:18 AM" }],
      negative_constraints: [],
    };
    const constraints = collectNegativeConstraints(a, b);
    const crossDoc = constraints.filter((c) => c.source === "cross-document");
    expect(crossDoc.length).toBeGreaterThan(0);
    expect(crossDoc[0].severity).toBe("High");
  });

  it("handles empty constraint arrays gracefully", () => {
    const a = { persons: [], locations: [], negative_constraints: [] };
    const b = { persons: [], locations: [], negative_constraints: [] };
    const constraints = collectNegativeConstraints(a, b);
    expect(Array.isArray(constraints)).toBe(true);
    expect(constraints.length).toBe(0);
  });
});
