import { useState } from "react";
import { Upload, FileText, Loader2, Plus } from "lucide-react";
import { api } from "../api";
import type { Document } from "../types";

interface UploadQueueProps {
  documents: Document[];
  onDocumentAdded: () => void;
}

export default function UploadQueue({ documents, onDocumentAdded }: UploadQueueProps) {
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [sourceType, setSourceType] = useState("incident_report");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !rawText.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.documents.create({ title: title.trim(), raw_text: rawText.trim(), source_type: sourceType });
      setTitle("");
      setRawText("");
      onDocumentAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Upload className="w-5 h-5 text-cyan-400" />
          Upload Queue
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Ingest incident reports, witness statements, and transcripts
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-xl border border-gray-800 bg-gray-900/40">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5 font-medium">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Witness Statement — Dock Worker #4"
              className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-800 rounded-lg text-gray-200 placeholder:text-gray-700 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5 font-medium">
              Source Type
            </label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-800 rounded-lg text-gray-200 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            >
              <option value="incident_report">Incident Report</option>
              <option value="witness_statement">Witness Statement</option>
              <option value="radio_transcript">Radio Transcript</option>
              <option value="traffic_log">Traffic Log</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5 font-medium">
              Raw Text Content
            </label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={8}
              placeholder="Paste the full document text here..."
              className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-800 rounded-lg text-gray-200 placeholder:text-gray-700 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all resize-none font-mono"
            />
          </div>
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !rawText.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {isSubmitting ? "Ingesting..." : "Ingest Document"}
          </button>
        </form>

        <div>
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2 px-1">
            Ingested Documents ({documents.length})
          </h3>
          <div className="space-y-1.5">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3 rounded-lg border border-gray-800 bg-gray-900/40 hover:bg-gray-800/40 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-300 font-medium truncate">
                      {doc.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {doc.source_type} &middot;{" "}
                      {doc.raw_text.length.toLocaleString()} chars
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
