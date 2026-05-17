import {
  BookOpen,
  Play,
  Shield,
  Brain,
  Crosshair,
  AlertTriangle,
  ChevronRight,
  Zap,
  Target,
  Layers,
  ArrowRight,
} from "lucide-react";
import type { NavView } from "../types";

interface ReadMeViewProps {
  onStartTour: () => void;
  onNavigate: (view: NavView) => void;
  tourActive: boolean;
}

const TOUR_STEPS: { view: NavView; label: string }[] = [
  { view: "upload", label: "Upload Queue" },
  { view: "graph", label: "Case Graph" },
  { view: "map", label: "Map Workspace" },
  { view: "signals", label: "Signal Inbox" },
  { view: "timeline", label: "Timeline" },
];

export default function ReadMeView({ onStartTour, onNavigate, tourActive }: ReadMeViewProps) {
  return (
    <div className="h-full overflow-y-auto bg-gray-950">
      <div className="max-w-4xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Read Me &amp; Workflow Guide
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Threadline Intelligence Dashboard — Operator Manual
              </p>
            </div>
          </div>
          <button
            onClick={onStartTour}
            disabled={tourActive}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600/15 hover:bg-cyan-600/25 text-cyan-400 text-sm font-semibold border border-cyan-500/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" />
            {tourActive ? "Tour in Progress..." : "Start Guided Tour"}
          </button>
        </div>

        {/* Section 1: System Overview */}
        <Section icon={Shield} title="System Overview" accent="cyan">
          <p className="text-gray-300 leading-relaxed">
            <strong className="text-white">Threadline</strong> is an AI-powered
            narrative intelligence dashboard purpose-built for investigators,
            analysts, and intelligence officers. It ingests fragmented incident
            reports, witness statements, and transcripts — then automatically
            extracts structural data and maps hidden relationships across
            documents using a rigorous, adversarial validation workflow.
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FeatureCard
              icon={Layers}
              title="Multi-Source Ingestion"
              desc="Upload PDFs, transcripts, and reports. The pipeline extracts persons, vehicles, locations, weak signals, and timestamps automatically."
            />
            <FeatureCard
              icon={Target}
              title="Automated Correlation"
              desc="Cross-document entity matching identifies shared persons, overlapping locations, and temporal convergence patterns."
            />
            <FeatureCard
              icon={Zap}
              title="Spatial-Temporal Mapping"
              desc="Interactive Leaflet map plots incident coordinates and draws confidence-scored link paths between correlated documents."
            />
          </div>
        </Section>

        <Divider />

        {/* Section 2: Core Methodology */}
        <Section icon={Brain} title='Core Methodology — The "Devil&apos;s Advocate" Validation Engine' accent="amber">
          <p className="text-gray-300 leading-relaxed mb-4">
            Threadline's analytical engine fights confirmation bias by design.
            Instead of simply finding connections, the pipeline actively searches
            for reasons those connections might be <em className="text-amber-400">wrong</em>.
            This dual-pass architecture ensures every correlation is stress-tested
            before it reaches an investigator's desk.
          </p>

          <div className="space-y-4">
            <PassCard
              pass="1"
              title="Structured Feature Extraction"
              items={[
                "Extracts named entities: Persons (with clothing/build details), Vehicles (with trajectories and plates), and Locations (with timestamps and coordinates).",
                "Identifies Weak Signals — subtle behavioral indicators like counter-surveillance awareness, camera-avoidant movement, or off-schedule activity patterns.",
                "Detects Negative Constraints — internal contradictions, descriptive discrepancies, and geographic/temporal timeline gaps within each document. Each constraint is severity-rated: Low, Medium, or High.",
              ]}
            />
            <PassCard
              pass="2"
              title="Correlation & Devil's Advocate Reasoning"
              items={[
                "Compares extracted data payloads across every document pair to identify entity overlaps and thematic convergence.",
                "For each link candidate, generates a Primary Correlation Vector — the positive hypothesis explaining why two documents are connected.",
                "Simultaneously generates a Devil's Advocate Hypothesis — an explicit counterfactual analysis arguing why the correlation could be a false positive, citing common-cause fallacies, coincidental overlap, or ambiguous evidence.",
              ]}
            />
          </div>

          <div className="mt-5 p-4 rounded-lg bg-red-950/30 border border-red-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-400 mb-1">
                  Why This Matters
                </p>
                <p className="text-sm text-red-300/80 leading-relaxed">
                  Traditional link-analysis tools only look for connections — they
                  never tell you why a connection might be wrong. Threadline's
                  Devil's Advocate layer forces the analyst to confront data
                  contradictions and negative constraints before committing a link
                  to the narrative timeline. This reduces false positives and
                  strengthens the final intelligence product.
                </p>
              </div>
            </div>
          </div>
        </Section>

        <Divider />

        {/* Section 3: Interactive Step-by-Step Walkthrough */}
        <Section icon={Crosshair} title="Step-by-Step Walkthrough — Harbor Anomaly Case" accent="emerald">
          <p className="text-gray-300 leading-relaxed mb-5">
            Threadline ships with a bundled demonstration case: a harbor anomaly
            cluster consisting of 5 fragmented source documents (loading dock
            approach reports, radio transcripts, fuel clerk statements, warehouse
            discrepancy reports, and coast guard traffic logs). Follow these steps
            to explore the automated linkage workflow:
          </p>

          <div className="space-y-4">
            <WalkthroughStep
              step={1}
              title="Load the Demo Case"
              description="The demo case is pre-loaded on server startup. Navigate to the Upload Queue to see all 5 source documents already ingested and processed. The pipeline has automatically extracted entities, weak signals, and negative constraints from each document."
              action="Go to Upload Queue"
              onAction={() => onNavigate("upload")}
            />
            <WalkthroughStep
              step={2}
              title="Visualize the Intelligence Graph & Map"
              description="Open the Case Graph to see a canvas visualization of all documents and their confidence-scored linkages. Then switch to the Map Workspace to view coordinate markers plotted on an interactive dark-tiled map, with polyline paths connecting correlated document locations."
              action="Open Case Graph"
              onAction={() => onNavigate("graph")}
              secondaryAction="Open Map View"
              onSecondaryAction={() => onNavigate("map")}
            />
            <WalkthroughStep
              step={3}
              title="Review the Signal Inbox"
              description="Navigate to the Signal Inbox to review all detected correlations. Select any signal to open the side-by-side Validation Workspace: the left column shows the Primary Correlation Vector (positive linking logic), while the right column displays the Devil's Advocate Analysis with a red warning border highlighting data contradictions and negative constraints."
              action="Open Signal Inbox"
              onAction={() => onNavigate("signals")}
            />
            <WalkthroughStep
              step={4}
              title="Validate or Dismiss Links"
              description='Use the action controls in the Validation Workspace to make decisions. Click "Dismiss as Anomaly" to flag a link as a false positive and remove it from active views. Click "Verify & Commit to Timeline" to confirm the link and pin it to the chronological Narrative Timeline. Then navigate to the Timeline view to see your verified links and export a professional case brief.'
              action="Open Timeline"
              onAction={() => onNavigate("timeline")}
            />
          </div>
        </Section>

        <Divider />

        {/* Section 4: Guided Tour */}
        <Section icon={Play} title="Interactive Guided Tour" accent="violet">
          <p className="text-gray-300 leading-relaxed mb-4">
            Click the <strong className="text-white">"Start Guided Tour"</strong> button
            at the top of this page to activate an interactive walkthrough overlay.
            The tour will sequentially highlight each workspace in the sidebar
            navigation, displaying an instructional tooltip at each step:
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {TOUR_STEPS.map((s, i) => (
              <div key={s.view} className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-violet-400 bg-violet-500/10 px-2 py-1 rounded border border-violet-500/20">
                  {i + 1}. {s.label}
                </span>
                {i < TOUR_STEPS.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-gray-600" />
                )}
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-400 leading-relaxed">
            At each stop, an anchored badge will appear on the corresponding
            sidebar element with a brief description. Click the highlighted
            item or press "Next" to advance. The tour automatically navigates
            you to each workspace so you can see the live data in context.
          </p>

          <div className="mt-4">
            <button
              onClick={onStartTour}
              disabled={tourActive}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600/15 hover:bg-violet-600/25 text-violet-400 text-sm font-semibold border border-violet-500/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              {tourActive ? "Tour in Progress..." : "Launch Interactive Tour"}
            </button>
          </div>
        </Section>

        <div className="h-16" />
      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────── */

function Section({
  icon: Icon,
  title,
  accent,
  children,
}: {
  icon: React.ElementType;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    cyan: "from-cyan-500 to-blue-600",
    amber: "from-amber-500 to-orange-600",
    emerald: "from-emerald-500 to-teal-600",
    violet: "from-violet-500 to-purple-600",
  };
  return (
    <section className="mb-2">
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorMap[accent] || colorMap.cyan} flex items-center justify-center`}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      <div className="pl-11">{children}</div>
    </section>
  );
}

function Divider() {
  return <hr className="border-gray-800 my-8" />;
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-gray-900/60 border border-gray-800 hover:border-gray-700 transition-colors">
      <Icon className="w-5 h-5 text-cyan-400 mb-2" />
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function PassCard({
  pass,
  title,
  items,
}: {
  pass: string;
  title: string;
  items: string[];
}) {
  const bg = pass === "1" ? "bg-cyan-500/10" : "bg-amber-500/10";
  const border = pass === "1" ? "border-cyan-500/20" : "border-amber-500/20";
  const text = pass === "1" ? "text-cyan-400" : "text-amber-400";
  const bullet = pass === "1" ? "bg-cyan-500" : "bg-amber-500";

  return (
    <div className={`p-4 rounded-lg ${bg} border ${border}`}>
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`text-xs font-bold ${text} ${bg} px-2 py-0.5 rounded-full border ${border}`}
        >
          PASS {pass}
        </span>
        <h3 className={`text-sm font-semibold ${text}`}>{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300 leading-relaxed">
            <span
              className={`w-1.5 h-1.5 rounded-full ${bullet} flex-shrink-0 mt-2`}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function WalkthroughStep({
  step,
  title,
  description,
  action,
  onAction,
  secondaryAction,
  onSecondaryAction,
}: {
  step: number;
  title: string;
  description: string;
  action: string;
  onAction: () => void;
  secondaryAction?: string;
  onSecondaryAction?: () => void;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
        <span className="text-sm font-bold text-emerald-400">{step}</span>
      </div>
      <div className="flex-1 pb-4">
        <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed mb-3">
          {description}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onAction}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-xs font-medium border border-emerald-500/20 transition-colors"
          >
            <ChevronRight className="w-3 h-3" />
            {action}
          </button>
          {secondaryAction && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-xs font-medium border border-emerald-500/20 transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
              {secondaryAction}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
