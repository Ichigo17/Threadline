import { AlertTriangle, CheckCircle, XCircle, ChevronRight, Link2 } from "lucide-react";
import type { IncidentLink, Document } from "../types";

interface SignalInboxProps {
  links: IncidentLink[];
  documents: Document[];
  selectedLinkId: string | null;
  onSelectLink: (id: string) => void;
}

function confidenceColor(confidence: string) {
  switch (confidence) {
    case "Strong":
      return "text-red-400 bg-red-500/10 border-red-500/30";
    case "Moderate":
      return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    default:
      return "text-blue-400 bg-blue-500/10 border-blue-500/30";
  }
}

function confidenceDot(confidence: string) {
  switch (confidence) {
    case "Strong":
      return "bg-red-500";
    case "Moderate":
      return "bg-amber-500";
    default:
      return "bg-blue-500";
  }
}

export default function SignalInbox({
  links,
  documents,
  selectedLinkId,
  onSelectLink,
}: SignalInboxProps) {
  const docMap = new Map(documents.map((d) => [d.id, d]));

  const activeLinks = links.filter((l) => !l.dismissed);
  const validatedLinks = links.filter((l) => l.is_investigator_validated);
  const dismissedLinks = links.filter((l) => l.dismissed);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Link2 className="w-5 h-5 text-cyan-400" />
          Signal Inbox
        </h2>
        <div className="flex gap-3 mt-3 text-xs">
          <span className="flex items-center gap-1.5 text-gray-400">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            {activeLinks.length} pending
          </span>
          <span className="flex items-center gap-1.5 text-gray-400">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            {validatedLinks.length} verified
          </span>
          <span className="flex items-center gap-1.5 text-gray-400">
            <XCircle className="w-3 h-3 text-gray-600" />
            {dismissedLinks.length} dismissed
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {links.length === 0 && (
          <div className="text-center text-gray-600 py-12 text-sm">
            No correlation signals detected yet.
          </div>
        )}
        {links.map((link) => {
          const docA = docMap.get(link.source_doc_a);
          const docB = docMap.get(link.source_doc_b);
          const isSelected = selectedLinkId === link.id;

          return (
            <button
              key={link.id}
              onClick={() => onSelectLink(link.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all duration-150 ${
                isSelected
                  ? "bg-gray-800 border-cyan-500/40 ring-1 ring-cyan-500/20"
                  : link.dismissed
                    ? "bg-gray-900/40 border-gray-800/50 opacity-50 hover:opacity-70"
                    : link.is_investigator_validated
                      ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/30"
                      : "bg-gray-900/60 border-gray-800 hover:border-gray-700 hover:bg-gray-800/60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${confidenceDot(link.confidence)}`}
                    />
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${confidenceColor(link.confidence)}`}
                    >
                      {link.confidence}
                    </span>
                    {link.is_investigator_validated && (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    {link.dismissed && (
                      <XCircle className="w-3.5 h-3.5 text-gray-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-300 truncate">
                    {docA?.title || link.source_doc_a}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    ↔ {docB?.title || link.source_doc_b}
                  </p>
                </div>
                <ChevronRight
                  className={`w-4 h-4 mt-1 flex-shrink-0 transition-colors ${
                    isSelected ? "text-cyan-400" : "text-gray-700"
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
