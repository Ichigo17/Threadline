import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XOctagon,
  AlertTriangle,
  Radio,
  Target,
} from "lucide-react";
import type { IncidentLink, Document } from "../types";

interface ValidationWorkspaceProps {
  link: IncidentLink;
  documents: Document[];
  onValidate: (id: string) => void;
  onDismiss: (id: string) => void;
}

function severityBadge(severity: string) {
  switch (severity) {
    case "High":
      return "bg-red-500/10 text-red-400 border-red-500/30";
    case "Medium":
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    default:
      return "bg-blue-500/10 text-blue-400 border-blue-500/30";
  }
}

export default function ValidationWorkspace({
  link,
  documents,
  onValidate,
  onDismiss,
}: ValidationWorkspaceProps) {
  const docA = documents.find((d) => d.id === link.source_doc_a);
  const docB = documents.find((d) => d.id === link.source_doc_b);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            Analytical Validation
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {docA?.title || "Doc A"} ↔ {docB?.title || "Doc B"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDismiss(link.id)}
            disabled={link.dismissed}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-gray-800 text-gray-300 hover:bg-red-500/10 hover:text-red-400 border border-gray-700 hover:border-red-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <XOctagon className="w-3.5 h-3.5" />
            Dismiss as Anomaly
          </button>
          <button
            onClick={() => onValidate(link.id)}
            disabled={link.is_investigator_validated}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verify &amp; Commit to Timeline
          </button>
        </div>
      </div>

      {(link.is_investigator_validated || link.dismissed) && (
        <div
          className={`mx-4 mt-3 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
            link.is_investigator_validated
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-gray-800 text-gray-500 border border-gray-700"
          }`}
        >
          {link.is_investigator_validated ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              This link has been verified and committed to the narrative timeline.
            </>
          ) : (
            <>
              <XOctagon className="w-4 h-4" />
              This link has been dismissed as an anomaly.
            </>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
          {/* Left Column: Primary Correlation Vector */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-emerald-500/20 bg-emerald-500/10 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-emerald-400 tracking-wide">
                PRIMARY CORRELATION VECTOR
              </h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <div>
                <p className="text-xs text-emerald-500/70 uppercase tracking-wider font-medium mb-1.5">
                  Linking Logic
                </p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {link.primary_vector || link.explanation}
                </p>
              </div>

              {link.explanation && link.primary_vector && (
                <div>
                  <p className="text-xs text-emerald-500/70 uppercase tracking-wider font-medium mb-1.5">
                    Summary
                  </p>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {link.explanation}
                  </p>
                </div>
              )}

              {link.weak_signals.length > 0 && (
                <div>
                  <p className="text-xs text-emerald-500/70 uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5">
                    <Radio className="w-3 h-3" />
                    Weak Signals Detected
                  </p>
                  <div className="space-y-2">
                    {link.weak_signals.map((sig, i) => (
                      <div
                        key={i}
                        className="text-xs p-2.5 rounded-lg bg-gray-900/60 border border-gray-800"
                      >
                        <span className="text-amber-400 font-medium">
                          {sig.signal}
                        </span>
                        {sig.excerpt && (
                          <p className="text-gray-500 mt-1 italic">
                            &ldquo;{sig.excerpt}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Devil's Advocate Analysis */}
          <div className="rounded-xl border-2 border-red-500/30 bg-red-500/5 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-red-500/30 bg-red-500/10 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-red-400 tracking-wide">
                DEVIL&apos;S ADVOCATE ANALYSIS
              </h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <div className="p-3 rounded-lg bg-red-500/5 border-l-4 border-red-500/60">
                <p className="text-xs text-red-400/80 uppercase tracking-wider font-medium mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3" />
                  Counterfactual Hypothesis
                </p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {link.counterfactual_argument}
                </p>
              </div>

              {link.negative_constraints.length > 0 && (
                <div>
                  <p className="text-xs text-red-400/70 uppercase tracking-wider font-medium mb-2">
                    Negative Constraints
                  </p>
                  <div className="space-y-2">
                    {link.negative_constraints.map((nc, i) => (
                      <div
                        key={i}
                        className="text-xs p-2.5 rounded-lg bg-gray-900/60 border border-gray-800"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-1.5 py-0.5 rounded border text-xs font-medium ${severityBadge(nc.severity)}`}
                          >
                            {nc.severity}
                          </span>
                        </div>
                        <p className="text-gray-400">{nc.description}</p>
                        {nc.details && (
                          <p className="text-gray-600 mt-1">{nc.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
