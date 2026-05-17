export interface Document {
  id: string;
  title: string;
  raw_text: string;
  source_type: string;
  created_at: string;
  updated_at: string;
  embedding: string | null;
}

export interface MetaEntity {
  id: string;
  canonical_name: string;
  entity_type: "Person" | "Vehicle" | "Location";
  aliases: string[];
  metadata: Record<string, unknown>;
  document_id: string;
  created_at: string;
}

export interface IncidentLink {
  id: string;
  source_doc_a: string;
  source_doc_b: string;
  confidence: "Weak" | "Moderate" | "Strong";
  explanation: string;
  counterfactual_argument: string;
  is_investigator_validated: boolean;
  dismissed: boolean;
  primary_vector: string;
  weak_signals: WeakSignal[];
  negative_constraints: NegativeConstraint[];
  created_at: string;
}

export interface WeakSignal {
  signal: string;
  excerpt: string;
  significance?: string;
}

export interface NegativeConstraint {
  description: string;
  severity: "Low" | "Medium" | "High";
  details?: string;
}

export interface ExtractedFeatures {
  id: string;
  document_id: string;
  persons: PersonEntity[];
  vehicles: VehicleEntity[];
  locations: LocationEntity[];
  weak_signals: WeakSignal[];
  negative_constraints: NegativeConstraint[];
  raw_extraction: Record<string, unknown>;
  created_at: string;
}

export interface PersonEntity {
  name: string;
  clothing: string | null;
  description: string | null;
}

export interface VehicleEntity {
  description: string;
  trajectory: string | null;
  plate: string | null;
}

export interface LocationEntity {
  name: string;
  timestamp: string | null;
  details: string | null;
}

export type NavView =
  | "upload"
  | "graph"
  | "map"
  | "signals"
  | "timeline"
  | "sources"
  | "readme";

export type TourStep = "upload" | "graph" | "map" | "signals" | "timeline" | null;
