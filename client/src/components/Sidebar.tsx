import {
  Upload,
  Network,
  MapPin,
  Radio,
  Clock,
  FileText,
  Shield,
} from "lucide-react";
import type { NavView } from "../types";

interface SidebarProps {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
  linkCount: number;
  docCount: number;
}

const NAV_ITEMS: { id: NavView; label: string; icon: React.ElementType }[] = [
  { id: "upload", label: "Upload Queue", icon: Upload },
  { id: "graph", label: "Case Graph", icon: Network },
  { id: "map", label: "Map Workspace", icon: MapPin },
  { id: "signals", label: "Signal Inbox", icon: Radio },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "sources", label: "Sources", icon: FileText },
];

export default function Sidebar({
  activeView,
  onNavigate,
  linkCount,
  docCount,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-gray-900/80 border-r border-gray-800 flex flex-col h-full backdrop-blur-sm">
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
          const badge =
            id === "signals"
              ? linkCount
              : id === "sources"
                ? docCount
                : null;

          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
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
    </aside>
  );
}
