import { useState, useEffect, useRef } from "react";
import {
  Upload,
  Network,
  MapPin,
  Radio,
  Clock,
  FileText,
  Shield,
  BookOpen,
  ChevronRight,
  X,
} from "lucide-react";
import type { NavView, TourStep } from "../types";

interface SidebarProps {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
  linkCount: number;
  docCount: number;
  tourStep: TourStep;
  onTourNext: () => void;
  onTourEnd: () => void;
}

const NAV_ITEMS: { id: NavView; label: string; icon: React.ElementType }[] = [
  { id: "readme", label: "Read Me", icon: BookOpen },
  { id: "upload", label: "Upload Queue", icon: Upload },
  { id: "graph", label: "Case Graph", icon: Network },
  { id: "map", label: "Map Workspace", icon: MapPin },
  { id: "signals", label: "Signal Inbox", icon: Radio },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "sources", label: "Sources", icon: FileText },
];

const TOUR_TOOLTIPS: Record<string, string> = {
  upload:
    "Upload Queue — Ingest new documents here. The 5 bundled demo case files are already loaded and processed.",
  graph:
    "Case Graph — Canvas visualization showing all documents as nodes and confidence-scored correlations as edges.",
  map:
    "Map Workspace — Interactive Leaflet map with incident markers and polyline link paths between correlated locations.",
  signals:
    "Signal Inbox — Review detected correlations. Select any signal to open the split-screen Validation Workspace with Primary Hypothesis vs. Devil's Advocate Analysis.",
  timeline:
    "Timeline — Chronological view of all investigator-verified links. Export a professional case brief from here.",
};

export default function Sidebar({
  activeView,
  onNavigate,
  linkCount,
  docCount,
  tourStep,
  onTourNext,
  onTourEnd,
}: SidebarProps) {
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [tooltipPos, setTooltipPos] = useState<{ top: number } | null>(null);

  useEffect(() => {
    if (tourStep && itemRefs.current[tourStep]) {
      const el = itemRefs.current[tourStep];
      if (el) {
        const rect = el.getBoundingClientRect();
        setTooltipPos({ top: rect.top });
      }
    } else {
      setTooltipPos(null);
    }
  }, [tourStep]);

  return (
    <aside className="w-64 bg-gray-900/80 border-r border-gray-800 flex flex-col h-full backdrop-blur-sm relative">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">
              THREADLINE
            </h1>
            <p className="text-xs text-gray-500 tracking-widest uppercase">
              Intel Dashboard
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeView === id;
          const isTourTarget = tourStep === id;
          const badge =
            id === "signals"
              ? linkCount
              : id === "sources"
                ? docCount
                : null;

          return (
            <button
              key={id}
              ref={(el) => { itemRefs.current[id] = el; }}
              onClick={() => {
                onNavigate(id);
                if (isTourTarget) onTourNext();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                isTourTarget
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-400/40 ring-2 ring-cyan-400/20 ring-offset-1 ring-offset-gray-900 animate-pulse"
                  : isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {badge !== null && badge > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "bg-gray-800 text-gray-500"
                  }`}
                >
                  {badge}
                </span>
              )}
              {isTourTarget && (
                <span className="absolute -right-1 -top-1 w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Documents</span>
            <span className="text-gray-500">{docCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Active Links</span>
            <span className="text-gray-500">{linkCount}</span>
          </div>
        </div>
      </div>

      {/* Tour tooltip overlay */}
      {tourStep && tooltipPos && (
        <div
          className="absolute left-full ml-3 z-50 w-72"
          style={{ top: tooltipPos.top - 8 }}
        >
          <div className="relative bg-gray-900 border border-cyan-500/30 rounded-xl p-4 shadow-2xl shadow-cyan-500/10">
            <div className="absolute -left-2 top-4 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-gray-900" />
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                GUIDED TOUR
              </span>
              <button
                onClick={onTourEnd}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              {TOUR_TOOLTIPS[tourStep] || ""}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">
                Step{" "}
                {Object.keys(TOUR_TOOLTIPS).indexOf(tourStep) + 1} of{" "}
                {Object.keys(TOUR_TOOLTIPS).length}
              </span>
              <button
                onClick={onTourNext}
                className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
