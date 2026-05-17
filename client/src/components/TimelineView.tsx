import { useState } from "react";
import { Clock, CheckCircle2, MapPin, User, Truck, FileDown, X, FileText, Code } from "lucide-react";
import { api } from "../api";
import type { IncidentLink, Document, MetaEntity } from "../types";

interface TimelineViewProps {
  links: IncidentLink[];
  documents: Document[];
  entities: MetaEntity[];
}

export default function TimelineView({ links, documents, entities }: TimelineViewProps) {
  const [exporting, setExporting] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewFormat, setPreviewFormat] = useState<"markdown" | "html">("html");

  const validatedLinks = links.filter((l) => l.is_investigator_validated);
  const sortedDocs = [...documents].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const validatedDocIds = new Set<string>();
  validatedLinks.forEach((l) => {
    validatedDocIds.add(l.source_doc_a);
    validatedDocIds.add(l.source_doc_b);
  });

  const timelineDocs = sortedDocs.filter((d) => validatedDocIds.has(d.id));
  const entityMap = new Map<string, MetaEntity[]>();
  entities.forEach((e) => {
    const existing = entityMap.get(e.document_id) || [];
    existing.push(e);
    entityMap.set(e.document_id, existing);
  });

  function entityIcon(type: string) {
    switch (type) {
      case "Person":
        return <User className="w-3 h-3" />;
      case "Vehicle":
        return <Truck className="w-3 h-3" />;
      case "Location":
        return <MapPin className="w-3 h-3" />;
      default:
        return null;
    }
  }

  async function handleExport(format: "markdown" | "html") {
    setExporting(true);
    try {
      const content = await api.export.caseBrief(format);
      setPreviewContent(content);
      setPreviewFormat(format);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }

  function handleDownload() {
    if (!previewContent) return;
    const ext = previewFormat === "html" ? "html" : "md";
    const mime = previewFormat === "html" ? "text/html" : "text/markdown";
    const blob = new Blob([previewContent], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `threadline-case-brief.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="h-full flex flex-col">
      {previewContent && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Intelligence Case Brief Preview</h3>
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                  {previewFormat.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Download
                </button>
                <button
                  onClick={() => setPreviewContent(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {previewFormat === "html" ? (
                <iframe
                  srcDoc={previewContent}
                  className="w-full h-full min-h-[60vh] rounded-lg border border-gray-800"
                  title="Case Brief Preview"
                />
              ) : (
                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {previewContent}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Narrative Timeline
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Verified events pinned to the chronological timeline &middot;{" "}
            {validatedLinks.length} verified link(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport("html")}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 text-xs font-medium border border-cyan-500/20 transition-colors disabled:opacity-50"
          >
            <Code className="w-3.5 h-3.5" />
            {exporting ? "Generating..." : "Export HTML"}
          </button>
          <button
            onClick={() => handleExport("markdown")}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 text-xs font-medium border border-cyan-500/20 transition-colors disabled:opacity-50"
          >
            <FileDown className="w-3.5 h-3.5" />
            {exporting ? "Generating..." : "Export Markdown"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {validatedLinks.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-10 h-10 text-gray-800 mx-auto mb-3" />
            <p className="text-sm text-gray-600">
              No verified links yet. Validate signals from the Signal Inbox to build the timeline.
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/40 via-cyan-500/20 to-transparent" />

            {timelineDocs.map((doc, idx) => {
              const docEntities = entityMap.get(doc.id) || [];
              const relatedLinks = validatedLinks.filter(
                (l) => l.source_doc_a === doc.id || l.source_doc_b === doc.id
              );

              return (
                <div key={doc.id} className="relative pl-10 pb-8">
                  <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full bg-cyan-500 border-2 border-gray-950 z-10" />
                  {idx < timelineDocs.length - 1 && (
                    <div className="absolute left-4 top-4 bottom-0 w-px bg-gray-800" />
                  )}

                  <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/40 hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-gray-500 font-mono">
                        {doc.source_type}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-200 mb-2">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-3">
                      {doc.raw_text.slice(0, 250)}...
                    </p>

                    {docEntities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {docEntities.slice(0, 6).map((ent) => (
                          <span
                            key={ent.id}
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700"
                          >
                            {entityIcon(ent.entity_type)}
                            {ent.canonical_name}
                          </span>
                        ))}
                      </div>
                    )}

                    {relatedLinks.length > 0 && (
                      <div className="text-xs text-emerald-500/80">
                        {relatedLinks.length} verified connection(s)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
