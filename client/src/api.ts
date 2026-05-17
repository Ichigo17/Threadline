const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  documents: {
    list: (search?: string) =>
      request<import("./types").Document[]>(
        `/api/documents${search ? `?search=${encodeURIComponent(search)}` : ""}`
      ),
    get: (id: string) => request<import("./types").Document>(`/api/documents/${id}`),
    create: (data: { title: string; raw_text: string; source_type?: string }) =>
      request<import("./types").Document>("/api/documents", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ deleted: boolean }>(`/api/documents/${id}`, { method: "DELETE" }),
  },
  entities: {
    list: (type?: string) =>
      request<import("./types").MetaEntity[]>(
        `/api/entities${type ? `?type=${encodeURIComponent(type)}` : ""}`
      ),
    byDocument: (docId: string) =>
      request<import("./types").MetaEntity[]>(`/api/entities/by-document/${docId}`),
  },
  links: {
    list: (includeDismissed?: boolean) =>
      request<import("./types").IncidentLink[]>(
        `/api/links${includeDismissed ? "?include_dismissed=true" : ""}`
      ),
    get: (id: string) => request<import("./types").IncidentLink>(`/api/links/${id}`),
    validate: (id: string) =>
      request<import("./types").IncidentLink>(`/api/links/${id}/validate`, {
        method: "PATCH",
      }),
    dismiss: (id: string) =>
      request<import("./types").IncidentLink>(`/api/links/${id}/dismiss`, {
        method: "PATCH",
      }),
  },
  map: {
    locations: () =>
      request<{ document_id: string; name: string; lat: number; lng: number; timestamp: string | null; details: string | null }[]>(
        "/api/map/locations"
      ),
    linkPaths: () =>
      request<{ link_id: string; source_doc_a: string; source_doc_b: string; confidence: string; is_validated: boolean; from: { lat: number; lng: number }; to: { lat: number; lng: number }; from_locations: { name: string; lat: number; lng: number }[]; to_locations: { name: string; lat: number; lng: number }[] }[]>(
        "/api/map/link-paths"
      ),
  },
  analysis: {
    extract: (documentId: string) =>
      request<import("./types").ExtractedFeatures>(
        `/api/analysis/extract/${documentId}`,
        { method: "POST" }
      ),
    correlate: (docA: string, docB: string) =>
      request<import("./types").IncidentLink>("/api/analysis/correlate", {
        method: "POST",
        body: JSON.stringify({ doc_a: docA, doc_b: docB }),
      }),
    pipeline: (documentIds: string[]) =>
      request<{ extractions: unknown[]; links: import("./types").IncidentLink[] }>(
        "/api/analysis/pipeline",
        {
          method: "POST",
          body: JSON.stringify({ document_ids: documentIds }),
        }
      ),
    features: (documentId: string) =>
      request<import("./types").ExtractedFeatures>(
        `/api/analysis/features/${documentId}`
      ),
  },
};
