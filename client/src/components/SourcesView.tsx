import { useState } from "react";
import { FileText, Search, User, Truck, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import type { Document, MetaEntity } from "../types";

interface SourcesViewProps {
  documents: Document[];
  entities: MetaEntity[];
}

export default function SourcesView({ documents, entities }: SourcesViewProps) {
  const [search, setSearch] = useState("");
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const filteredDocs = search
    ? documents.filter(
        (d) =>
          d.title.toLowerCase().includes(search.toLowerCase()) ||
          d.raw_text.toLowerCase().includes(search.toLowerCase())
      )
    : documents;

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

  function sourceTypeLabel(type: string) {
    switch (type) {
      case "incident_report":
        return "Incident Report";
      case "witness_statement":
        return "Witness Statement";
      case "radio_transcript":
        return "Radio Transcript";
      case "traffic_log":
        return "Traffic Log";
      default:
        return type;
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          Source Documents
        </h2>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-900 border border-gray-800 rounded-lg text-gray-200 placeholder:text-gray-700 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-600">
            {search ? "No documents match your search." : "No documents loaded."}
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isExpanded = expandedDoc === doc.id;
            const docEntities = entityMap.get(doc.id) || [];

            return (
              <div
                key={doc.id}
                className="rounded-xl border border-gray-800 bg-gray-900/40 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                  className="w-full text-left p-4 hover:bg-gray-800/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-200 font-medium">
                          {doc.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {sourceTypeLabel(doc.source_type)} &middot;{" "}
                          {doc.raw_text.length.toLocaleString()} characters
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-800 pt-3 space-y-3">
                    {docEntities.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
                          Extracted Entities
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {docEntities.map((ent) => (
                            <span
                              key={ent.id}
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400 border border-gray-700"
                            >
                              {entityIcon(ent.entity_type)}
                              {ent.canonical_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
                        Full Text
                      </p>
                      <pre className="text-xs text-gray-400 bg-gray-950 rounded-lg p-3 border border-gray-800 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
                        {doc.raw_text}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
