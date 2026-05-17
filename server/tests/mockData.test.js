import { describe, it, expect } from "@jest/globals";
import {
  getMockExtraction,
  getMockCorrelation,
  shouldUseMock,
} from "../src/mockPipelineEngine.js";
import {
  collectNegativeConstraints,
  detectLocationContradictions,
} from "../src/evaluateLinkCandidate.js";

const DEMO_DOC_IDS = [
  "demo-doc-001",
  "demo-doc-002",
  "demo-doc-003",
  "demo-doc-004",
  "demo-doc-005",
];

describe("shouldUseMock", () => {
  it("returns true when OPENAI_API_KEY is not set", () => {
    const original = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    expect(shouldUseMock()).toBe(true);
    if (original) process.env.OPENAI_API_KEY = original;
  });

  it("returns true when OPENAI_API_KEY is empty string", () => {
    const original = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "";
    expect(shouldUseMock()).toBe(true);
    if (original) process.env.OPENAI_API_KEY = original;
    else delete process.env.OPENAI_API_KEY;
  });
});

describe("getMockExtraction (Pass 1 data)", () => {
  for (const docId of DEMO_DOC_IDS) {
    describe(`${docId}`, () => {
      it("returns a valid extraction object", () => {
        const extraction = getMockExtraction(docId);
        expect(extraction).toBeDefined();
        expect(typeof extraction).toBe("object");
      });

      it("contains persons array with name fields", () => {
        const extraction = getMockExtraction(docId);
        expect(Array.isArray(extraction.persons)).toBe(true);
        for (const person of extraction.persons) {
          expect(typeof person.name).toBe("string");
          expect(person.name.length).toBeGreaterThan(0);
        }
      });

      it("contains locations array with name and coordinate fields", () => {
        const extraction = getMockExtraction(docId);
        expect(Array.isArray(extraction.locations)).toBe(true);
        expect(extraction.locations.length).toBeGreaterThan(0);
        for (const loc of extraction.locations) {
          expect(typeof loc.name).toBe("string");
          expect(loc.name.length).toBeGreaterThan(0);
        }
        // At least one location should have coordinates for spatial mapping
        const withCoords = extraction.locations.filter(
          (l) => l.lat != null && l.lng != null
        );
        expect(withCoords.length).toBeGreaterThan(0);
      });

      it("contains weak_signals array with signal and excerpt", () => {
        const extraction = getMockExtraction(docId);
        expect(Array.isArray(extraction.weak_signals)).toBe(true);
        expect(extraction.weak_signals.length).toBeGreaterThan(0);
        for (const ws of extraction.weak_signals) {
          expect(typeof ws.signal).toBe("string");
          expect(typeof ws.excerpt).toBe("string");
          expect(ws.signal.length).toBeGreaterThan(0);
          expect(ws.excerpt.length).toBeGreaterThan(0);
        }
      });

      it("contains negative_constraints array with severity ratings", () => {
        const extraction = getMockExtraction(docId);
        expect(Array.isArray(extraction.negative_constraints)).toBe(true);
        expect(extraction.negative_constraints.length).toBeGreaterThan(0);
        const validSeverities = ["Low", "Medium", "High"];
        for (const nc of extraction.negative_constraints) {
          expect(typeof nc.description).toBe("string");
          expect(nc.description.length).toBeGreaterThan(0);
          expect(validSeverities).toContain(nc.severity);
          expect(typeof nc.details).toBe("string");
        }
      });
    });
  }

  it("returns a fallback extraction for unknown document IDs", () => {
    const extraction = getMockExtraction("unknown-doc-999");
    expect(extraction).toBeDefined();
    expect(Array.isArray(extraction.persons)).toBe(true);
    expect(extraction.persons.length).toBe(0);
  });
});

describe("getMockCorrelation (Pass 2 data)", () => {
  const DEMO_PAIRS = [
    ["demo-doc-001", "demo-doc-002"],
    ["demo-doc-001", "demo-doc-003"],
    ["demo-doc-001", "demo-doc-004"],
    ["demo-doc-001", "demo-doc-005"],
    ["demo-doc-002", "demo-doc-003"],
    ["demo-doc-002", "demo-doc-005"],
    ["demo-doc-003", "demo-doc-004"],
    ["demo-doc-004", "demo-doc-005"],
  ];

  for (const [a, b] of DEMO_PAIRS) {
    describe(`${a} <-> ${b}`, () => {
      it("returns a valid correlation object", () => {
        const corr = getMockCorrelation(a, b);
        expect(corr).toBeDefined();
        expect(typeof corr).toBe("object");
      });

      it("has a valid confidence level", () => {
        const corr = getMockCorrelation(a, b);
        expect(["Weak", "Moderate", "Strong"]).toContain(corr.confidence);
      });

      it("has a non-empty explanation", () => {
        const corr = getMockCorrelation(a, b);
        expect(typeof corr.explanation).toBe("string");
        expect(corr.explanation.length).toBeGreaterThan(0);
      });

      it("has a counterfactual argument for Devil's Advocate analysis", () => {
        const corr = getMockCorrelation(a, b);
        expect(typeof corr.counterfactual_argument).toBe("string");
        expect(corr.counterfactual_argument.length).toBeGreaterThan(0);
      });

      it("has weak_signals array", () => {
        const corr = getMockCorrelation(a, b);
        expect(Array.isArray(corr.weak_signals)).toBe(true);
      });

      it("has negative_constraints array with valid severities", () => {
        const corr = getMockCorrelation(a, b);
        expect(Array.isArray(corr.negative_constraints)).toBe(true);
        const validSeverities = ["Low", "Medium", "High"];
        for (const nc of corr.negative_constraints) {
          expect(validSeverities).toContain(nc.severity);
        }
      });
    });
  }

  it("returns correlation in either direction (a|b or b|a)", () => {
    const forward = getMockCorrelation("demo-doc-001", "demo-doc-002");
    const reverse = getMockCorrelation("demo-doc-002", "demo-doc-001");
    // At least one direction should return data
    expect(forward || reverse).toBeTruthy();
  });

  it("returns a fallback correlation for non-existent pair", () => {
    const corr = getMockCorrelation("demo-doc-001", "unknown-doc-999");
    expect(corr).toBeDefined();
    expect(corr.confidence).toBe("Weak");
    expect(typeof corr.counterfactual_argument).toBe("string");
  });
});

describe("negative constraint severity distribution", () => {
  it("includes at least one High-severity constraint across all demo docs", () => {
    let hasHigh = false;
    for (const docId of DEMO_DOC_IDS) {
      const extraction = getMockExtraction(docId);
      if (extraction.negative_constraints.some((c) => c.severity === "High")) {
        hasHigh = true;
        break;
      }
    }
    expect(hasHigh).toBe(true);
  });

  it("includes constraints at all three severity levels across the dataset", () => {
    const severities = new Set();
    for (const docId of DEMO_DOC_IDS) {
      const extraction = getMockExtraction(docId);
      for (const nc of extraction.negative_constraints) {
        severities.add(nc.severity);
      }
    }
    expect(severities.has("High")).toBe(true);
    expect(severities.has("Medium")).toBe(true);
    expect(severities.has("Low")).toBe(true);
  });

  it("contradictory dates register high-severity constraints", () => {
    const extractionA = {
      persons: [{ name: "Subject Alpha" }],
      locations: [
        { name: "Pier 7", timestamp: "02:17 AM", lat: 33.74, lng: -118.28 },
      ],
      negative_constraints: [],
    };
    const extractionB = {
      persons: [{ name: "Subject Alpha" }],
      locations: [
        {
          name: "Harbor Gate",
          timestamp: "02:18 AM",
          lat: 33.75,
          lng: -118.26,
        },
      ],
      negative_constraints: [],
    };
    const constraints = collectNegativeConstraints(extractionA, extractionB);
    const highSeverity = constraints.filter((c) => c.severity === "High");
    expect(highSeverity.length).toBeGreaterThan(0);
    expect(highSeverity[0].description).toContain("Temporal contradiction");
  });

  it("contradictory locations register high-severity constraints", () => {
    const extractionA = {
      locations: [{ name: "Pier 7", lat: 33.7405, lng: -118.2783 }],
    };
    const extractionB = {
      locations: [{ name: "Pier 7", lat: 33.8000, lng: -118.2000 }],
    };
    const contradictions = detectLocationContradictions(
      extractionA,
      extractionB
    );
    expect(contradictions.length).toBeGreaterThan(0);
    expect(contradictions[0].severity).toBe("High");
    expect(contradictions[0].description).toContain("Location contradiction");
  });
});
