import { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import SignalInbox from "./components/SignalInbox";
import ValidationWorkspace from "./components/ValidationWorkspace";
import UploadQueue from "./components/UploadQueue";
import CaseGraph from "./components/CaseGraph";
import MapWorkspace from "./components/MapWorkspace";
import TimelineView from "./components/TimelineView";
import SourcesView from "./components/SourcesView";
import ReadMeView from "./components/ReadMeView";
import { api } from "./api";
import type { NavView, Document, IncidentLink, MetaEntity, TourStep } from "./types";

export default function App() {
  const [activeView, setActiveView] = useState<NavView>("signals");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [links, setLinks] = useState<IncidentLink[]>([]);
  const [entities, setEntities] = useState<MetaEntity[]>([]);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tourStep, setTourStep] = useState<TourStep>(null);

  const TOUR_SEQUENCE: TourStep[] = ["upload", "graph", "map", "signals", "timeline"];

  function handleStartTour() {
    setTourStep("upload");
    setActiveView("upload");
  }

  function handleTourNext() {
    if (!tourStep) return;
    const idx = TOUR_SEQUENCE.indexOf(tourStep);
    if (idx < TOUR_SEQUENCE.length - 1) {
      const next = TOUR_SEQUENCE[idx + 1];
      setTourStep(next);
      if (next) setActiveView(next);
    } else {
      setTourStep(null);
    }
  }

  function handleTourEnd() {
    setTourStep(null);
  }

  const fetchData = useCallback(async () => {
    try {
      const [docs, lnks, ents] = await Promise.all([
        api.documents.list(),
        api.links.list(true),
        api.entities.list(),
      ]);
      setDocuments(docs);
      setLinks(lnks);
      setEntities(ents);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedLink = links.find((l) => l.id === selectedLinkId) || null;

  async function handleValidate(id: string) {
    try {
      await api.links.validate(id);
      await fetchData();
    } catch (err) {
      console.error("Failed to validate link:", err);
    }
  }

  async function handleDismiss(id: string) {
    try {
      await api.links.dismiss(id);
      await fetchData();
    } catch (err) {
      console.error("Failed to dismiss link:", err);
    }
  }

  function handleSelectLink(id: string) {
    setSelectedLinkId(id);
    if (activeView !== "signals") setActiveView("signals");
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Initializing Threadline...</p>
        </div>
      </div>
    );
  }

  const activeLinks = links.filter((l) => !l.dismissed);

  return (
    <div className="h-screen flex bg-gray-950">
      <Sidebar
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view);
          if (tourStep && view === tourStep) handleTourNext();
        }}
        linkCount={activeLinks.length}
        docCount={documents.length}
        tourStep={tourStep}
        onTourNext={handleTourNext}
        onTourEnd={handleTourEnd}
      />

      <main className="flex-1 flex overflow-hidden">
        {activeView === "upload" && (
          <div className="flex-1 overflow-hidden">
            <UploadQueue documents={documents} onDocumentAdded={fetchData} />
          </div>
        )}

        {activeView === "graph" && (
          <div className="flex-1 overflow-hidden">
            <CaseGraph
              links={links}
              documents={documents}
              onSelectLink={handleSelectLink}
            />
          </div>
        )}

        {activeView === "map" && (
          <div className="flex-1 overflow-hidden">
            <MapWorkspace
              links={links}
              documents={documents}
              onSelectLink={handleSelectLink}
            />
          </div>
        )}

        {activeView === "signals" && (
          <>
            <div className="w-80 border-r border-gray-800 overflow-hidden flex-shrink-0">
              <SignalInbox
                links={links}
                documents={documents}
                selectedLinkId={selectedLinkId}
                onSelectLink={setSelectedLinkId}
              />
            </div>
            <div className="flex-1 overflow-hidden">
              {selectedLink ? (
                <ValidationWorkspace
                  link={selectedLink}
                  documents={documents}
                  onValidate={handleValidate}
                  onDismiss={handleDismiss}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">
                      Select a signal to review
                    </p>
                    <p className="text-xs text-gray-700 mt-1">
                      Analyze correlations and validate intelligence links
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeView === "timeline" && (
          <div className="flex-1 overflow-hidden">
            <TimelineView
              links={links}
              documents={documents}
              entities={entities}
            />
          </div>
        )}

        {activeView === "sources" && (
          <div className="flex-1 overflow-hidden">
            <SourcesView documents={documents} entities={entities} />
          </div>
        )}

        {activeView === "readme" && (
          <div className="flex-1 overflow-hidden">
            <ReadMeView
              onStartTour={handleStartTour}
              onNavigate={setActiveView}
              tourActive={tourStep !== null}
            />
          </div>
        )}
      </main>
    </div>
  );
}
