import { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../api";
import type { IncidentLink, Document } from "../types";

interface MapLocation {
  document_id: string;
  name: string;
  lat: number;
  lng: number;
  timestamp: string | null;
  details: string | null;
}

interface LinkPath {
  link_id: string;
  source_doc_a: string;
  source_doc_b: string;
  confidence: string;
  is_validated: boolean;
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  from_locations: { name: string; lat: number; lng: number }[];
  to_locations: { name: string; lat: number; lng: number }[];
}

interface MapWorkspaceProps {
  links: IncidentLink[];
  documents: Document[];
  onSelectLink: (id: string) => void;
}

const CONFIDENCE_COLORS: Record<string, string> = {
  Strong: "#22d3ee",
  Moderate: "#facc15",
  Weak: "#6b7280",
};

function createMarkerIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 14px; height: 14px;
      background: ${color};
      border: 2px solid rgba(255,255,255,0.8);
      border-radius: 50%;
      box-shadow: 0 0 8px ${color}80;
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

function FitBounds({ locations }: { locations: MapLocation[] }) {
  const map = useMap();
  useEffect(() => {
    if (locations.length === 0) return;
    const bounds = L.latLngBounds(
      locations.map((l) => [l.lat, l.lng] as [number, number])
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [locations, map]);
  return null;
}

export default function MapWorkspace({
  links,
  documents,
  onSelectLink,
}: MapWorkspaceProps) {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [paths, setPaths] = useState<LinkPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [showValidatedOnly, setShowValidatedOnly] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [locs, pths] = await Promise.all([
          api.map.locations(),
          api.map.linkPaths(),
        ]);
        setLocations(locs);
        setPaths(pths);
      } catch (err) {
        console.error("Failed to load map data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const docTitles = useMemo(() => {
    const map = new Map<string, string>();
    for (const doc of documents) map.set(doc.id, doc.title);
    return map;
  }, [documents]);

  const docColors = useMemo(() => {
    const palette = [
      "#22d3ee",
      "#f97316",
      "#a78bfa",
      "#34d399",
      "#f472b6",
      "#60a5fa",
      "#fbbf24",
    ];
    const map = new Map<string, string>();
    const uniqueDocIds = [...new Set(locations.map((l) => l.document_id))];
    uniqueDocIds.forEach((id, i) => map.set(id, palette[i % palette.length]));
    return map;
  }, [locations]);

  const filteredPaths = useMemo(() => {
    if (showValidatedOnly) return paths.filter((p) => p.is_validated);
    return paths;
  }, [paths, showValidatedOnly]);

  const validatedLinks = useMemo(
    () => links.filter((l) => l.is_investigator_validated && !l.dismissed),
    [links]
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading map data...</p>
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-600">No location data available</p>
          <p className="text-xs text-gray-700 mt-1">
            Process documents to extract geographic coordinates
          </p>
        </div>
      </div>
    );
  }

  const center: [number, number] = [
    locations.reduce((s, l) => s + l.lat, 0) / locations.length,
    locations.reduce((s, l) => s + l.lng, 0) / locations.length,
  ];

  return (
    <div className="h-full flex flex-col bg-gray-950">
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Spatial-Temporal Map
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {locations.length} locations &middot; {filteredPaths.length} link
            paths
          </p>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showValidatedOnly}
              onChange={(e) => setShowValidatedOnly(e.target.checked)}
              className="rounded bg-gray-800 border-gray-700 text-cyan-500 focus:ring-cyan-500/30"
            />
            Validated links only
          </label>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block rounded" />
              Strong
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-yellow-400 inline-block rounded" />
              Moderate
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-gray-500 inline-block rounded" />
              Weak
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="flex-1 relative">
          <MapContainer
            center={center}
            zoom={15}
            className="h-full w-full"
            style={{ background: "#0a0a0f" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <FitBounds locations={locations} />

            {locations.map((loc, i) => (
              <Marker
                key={`${loc.document_id}-${i}`}
                position={[loc.lat, loc.lng]}
                icon={createMarkerIcon(
                  docColors.get(loc.document_id) || "#22d3ee"
                )}
              >
                <Popup>
                  <div className="text-xs min-w-[180px]">
                    <div className="font-bold text-gray-900">{loc.name}</div>
                    <div className="text-gray-600 mt-0.5">
                      {docTitles.get(loc.document_id) || loc.document_id}
                    </div>
                    {loc.timestamp && (
                      <div className="text-gray-500 mt-0.5">
                        {loc.timestamp}
                      </div>
                    )}
                    {loc.details && (
                      <div className="text-gray-500 mt-1 border-t border-gray-200 pt-1">
                        {loc.details}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            {filteredPaths.map((path) => {
              const isSelected = selectedPathId === path.link_id;
              const color =
                CONFIDENCE_COLORS[path.confidence] || CONFIDENCE_COLORS.Weak;
              return (
                <Polyline
                  key={path.link_id}
                  positions={[
                    [path.from.lat, path.from.lng],
                    [path.to.lat, path.to.lng],
                  ]}
                  pathOptions={{
                    color,
                    weight: isSelected ? 4 : 2,
                    opacity: isSelected ? 1 : 0.6,
                    dashArray: path.is_validated ? undefined : "8 4",
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedPathId(path.link_id);
                      onSelectLink(path.link_id);
                    },
                  }}
                >
                  <Popup>
                    <div className="text-xs min-w-[200px]">
                      <div className="font-bold text-gray-900 mb-1">
                        Link: {path.confidence}
                      </div>
                      <div className="text-gray-600">
                        {docTitles.get(path.source_doc_a) || path.source_doc_a}
                      </div>
                      <div className="text-gray-400 text-center">&darr;</div>
                      <div className="text-gray-600">
                        {docTitles.get(path.source_doc_b) || path.source_doc_b}
                      </div>
                      {path.is_validated && (
                        <div className="mt-1 text-green-600 font-medium">
                          Validated
                        </div>
                      )}
                    </div>
                  </Popup>
                </Polyline>
              );
            })}
          </MapContainer>
        </div>

        <div className="w-72 border-l border-gray-800 overflow-y-auto flex-shrink-0">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Document Layers
            </h3>
            {[...docColors.entries()].map(([docId, color]) => (
              <div
                key={docId}
                className="flex items-center gap-2 py-1.5 text-xs"
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <span className="text-gray-300 truncate">
                  {docTitles.get(docId) || docId}
                </span>
                <span className="text-gray-600 ml-auto">
                  {locations.filter((l) => l.document_id === docId).length}
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-800">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Validated Links
            </h3>
            {validatedLinks.length === 0 ? (
              <p className="text-xs text-gray-600">
                No validated links yet. Verify links in Signal Inbox to see them
                here.
              </p>
            ) : (
              validatedLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    setSelectedPathId(link.id);
                    onSelectLink(link.id);
                  }}
                  className={`w-full text-left p-2 rounded-lg mb-1.5 text-xs transition-colors ${
                    selectedPathId === link.id
                      ? "bg-cyan-500/10 border border-cyan-500/20"
                      : "hover:bg-gray-800/60"
                  }`}
                >
                  <div className="text-gray-300 truncate">
                    {docTitles.get(link.source_doc_a) || link.source_doc_a}
                  </div>
                  <div className="text-gray-600 my-0.5">&rarr;</div>
                  <div className="text-gray-300 truncate">
                    {docTitles.get(link.source_doc_b) || link.source_doc_b}
                  </div>
                  <div
                    className={`mt-1 font-medium ${
                      link.confidence === "Strong"
                        ? "text-cyan-400"
                        : link.confidence === "Moderate"
                          ? "text-yellow-400"
                          : "text-gray-500"
                    }`}
                  >
                    {link.confidence}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
