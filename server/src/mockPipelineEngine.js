/**
 * Mock Pipeline Engine — Robust local fallback for Threadline.
 *
 * When the .env file lacks a valid OPENAI_API_KEY, the pipeline
 * gracefully falls back to this engine, which returns highly detailed,
 * hand-crafted synthetic JSON for the 5 bundled demo case files.
 *
 * Each mock extraction and correlation is designed to perfectly populate
 * the entities, weak signals, Devil's Advocate matrix, and spatial data
 * so the investigator workflows can be tested immediately out-of-the-box.
 */

// ─── Per-document mock extractions (Pass 1) ──────────────────────────────

const MOCK_EXTRACTIONS = {
  "demo-doc-001": {
    persons: [
      { name: "Sgt. Marcus Hale", clothing: null, description: "Harbor Patrol Unit 4, reporting officer on night watch" },
      { name: "SUBJECT ALPHA", clothing: "dark blue coverall, black watch cap", description: "Unidentified male, stocky build, carrying large duffel bag. Used perimeter fence gap near Camera Blind Spot #3" },
    ],
    vehicles: [
      { description: "Unmarked white cargo van — no visible plates, headlights off", trajectory: "Approached Pier 7 east loading dock via service road, departed eastbound on Harbor Service Road at high speed with no lights", plate: null },
    ],
    locations: [
      { name: "Pier 7, East Loading Dock", timestamp: "02:17 AM", details: "Van stopped 40m from dock gate. No scheduled deliveries 00:00–06:00", lat: 33.7405, lng: -118.2783 },
      { name: "Camera Blind Spot #3", timestamp: "02:23 AM", details: "Perimeter fence gap documented in last quarter's security audit", lat: 33.7408, lng: -118.2779 },
      { name: "Harbor Service Road", timestamp: "02:25 AM", details: "Subject departed eastbound at high speed", lat: 33.7412, lng: -118.2770 },
      { name: "Warehouse 7-B Loading Bay", timestamp: "02:17 AM", details: "Bay door partially raised (~3 feet), warehouse listed as empty", lat: 33.7403, lng: -118.2785 },
    ],
    weak_signals: [
      { signal: "Counter-surveillance awareness", excerpt: "SUBJECT ALPHA appeared to detect my approach (possibly via radio alert) and retreated rapidly", significance: "Indicates trained situational awareness and possible radio-coordinated overwatch" },
      { signal: "Camera blind spot exploitation", excerpt: "bypassing the main gate checkpoint and instead using a gap in the perimeter fence near Camera Blind Spot #3", significance: "Pre-planned route exploiting known security gap — suggests prior reconnaissance" },
      { signal: "Lights-out vehicle approach", excerpt: "The vehicle's headlights were off despite the access road being unlit", significance: "Deliberate concealment tactic consistent with clandestine logistics operation" },
      { signal: "Off-schedule dock activity", excerpt: "The loading dock had no scheduled deliveries between 00:00 and 06:00", significance: "Activity during operational dead zone maximizes probability of avoiding detection" },
    ],
    negative_constraints: [
      { description: "No positive ID obtained for SUBJECT ALPHA — clothing description only", severity: "High", details: "Without facial ID, positive match to fuel depot visitor remains circumstantial based solely on clothing similarity" },
      { description: "Pursuit not initiated — limited corroborating evidence of departure vector", severity: "Medium", details: "Standing orders prevented pursuit; no secondary unit confirmed departure route" },
      { description: "Warehouse 7-B listed as 'empty' contradicts partially raised bay door", severity: "Low", details: "If truly empty, raising the bay door serves no legitimate purpose — but manifest could be outdated" },
    ],
  },

  "demo-doc-002": {
    persons: [
      { name: "T. Nunes", clothing: null, description: "Gate 4 Operator, reported picking up coded burst on secondary frequency" },
      { name: "Patrol Boat 2 Operator", clothing: null, description: "Observed unlit small craft near breakwater, bearing 045, ~200m offshore Pier 7" },
    ],
    vehicles: [
      { description: "Rigid inflatable boat (RIB), approx. 20-foot, no running lights", trajectory: "Moving slow near breakwater bearing 045, turned south, picked up speed past breakwater into open water", plate: null },
    ],
    locations: [
      { name: "Pier 7 East Approach", timestamp: "02:03 AM", details: "Origin of first encrypted transmission burst (3.2 seconds)", lat: 33.7406, lng: -118.2781 },
      { name: "Breakwater Zone", timestamp: "02:14 AM", details: "Small craft observed 200m offshore, no running lights", lat: 33.7380, lng: -118.2800 },
      { name: "Pier 7/Pier 8 Boundary", timestamp: "02:24 AM", details: "Origin of second encrypted transmission burst (1.8 seconds)", lat: 33.7400, lng: -118.2790 },
      { name: "Gate 4", timestamp: "01:49 AM", details: "One fuel truck cleared at 01:30, quiet night", lat: 33.7425, lng: -118.2760 },
    ],
    weak_signals: [
      { signal: "Encrypted radio burst transmissions", excerpt: "UNIDENTIFIED TRANSMISSION — 3.2 second burst, encrypted/scrambled. Origin triangulated to approximate position near Pier 7 east approach", significance: "Non-standard encrypted comms near operational area — consistent with covert coordination" },
      { signal: "Matching encryption signatures", excerpt: "1.8 second burst, same encrypted signature as 02:03 transmission", significance: "Two bursts with identical encryption in 25 minutes confirms single actor/network operating in area" },
      { signal: "Dark vessel near operational zone", excerpt: "small craft — no running lights — moving slow near the breakwater", significance: "Unlit vessel at night near pier where ground activity was reported — likely waterside extraction/insertion point" },
    ],
    negative_constraints: [
      { description: "Encrypted bursts could be commercial vessel communications bleed", severity: "Medium", details: "Harbor Control initially assessed as 'probably commercial vessel comms bleed' — cannot definitively rule out routine maritime radio traffic" },
      { description: "Small craft never positively identified", severity: "High", details: "Patrol Boat 2 lost visual past breakwater — no hull number, name, or ID obtained. Could be unrelated recreational vessel" },
      { description: "Time gap between ground activity and vessel sighting", severity: "Low", details: "14 minutes between first encrypted burst (02:03) and vessel sighting (02:14) — coordination or coincidence unclear" },
    ],
  },

  "demo-doc-003": {
    persons: [
      { name: "Danny Cortez", clothing: null, description: "Night Shift Fuel Clerk (Badge #FC-2247), 3 years at harbor depot. Shift: 10 PM – 6 AM" },
      { name: "SUBJECT ALPHA (probable)", clothing: "navy/dark blue jumpsuit, dark knit cap, new work boots", description: "Unidentified male, stocky build ~5'10\", slight accent, carried non-standard handheld radio. Attempted cash purchase of 50 gal marine diesel" },
      { name: "Tony Nunes", clothing: null, description: "Gate 4 operator, contacted by Cortez at ~01:30 to confirm fuel truck manifest" },
      { name: "Det. Rosa Salinas", clothing: null, description: "Detective who took witness statement, added cross-reference note to Sgt. Hale's report" },
    ],
    vehicles: [],
    locations: [
      { name: "Harbor Fuel Depot Office", timestamp: "01:15 AM", details: "Subject approached fuel window on foot from direction of east service road", lat: 33.7418, lng: -118.2765 },
      { name: "East Service Road", timestamp: "01:15 AM", details: "Direction of subject's approach and departure", lat: 33.7415, lng: -118.2768 },
      { name: "Piers (eastward)", timestamp: "01:20 AM", details: "Subject departed walking back east toward the piers", lat: 33.7410, lng: -118.2775 },
    ],
    weak_signals: [
      { signal: "Non-standard radio equipment", excerpt: "small handheld radio clipped to his belt — not a standard port-issue Motorola. Compact unit, black, with a stubby antenna", significance: "Matches operational profile of covert comms gear — consistent with encrypted bursts detected on Channel 14" },
      { signal: "New/unused work boots", excerpt: "wearing work boots that looked brand new — like they'd never been on a dock before", significance: "Suggests subject is not a regular port worker despite wearing dock-appropriate clothing — possible disguise" },
      { signal: "Cash purchase attempt for marine diesel", excerpt: "offered to pay cash. I told him we don't accept cash — everything goes through the port billing system", significance: "Cash avoids paper trail — consistent with avoiding identification through billing records" },
      { signal: "Clothing match to SUBJECT ALPHA", excerpt: "description of SUBJECT ALPHA's clothing (dark blue coverall, black watch cap) closely matches Mr. Cortez's description", significance: "Strong circumstantial link placing same individual at fuel depot (01:15) then Pier 7 (02:17) — 62-minute gap consistent with on-foot transit" },
    ],
    negative_constraints: [
      { description: "Witness description is generic — 'dark clothing, stocky build' fits many dock workers", severity: "Medium", details: "Navy coveralls and knit caps are standard workwear in harbor environments. Without facial features or unique identifiers, match is circumstantial" },
      { description: "No confirmed identity — subject never provided name or documentation", severity: "High", details: "Subject left without completing transaction. No ID, no vessel registration, no fuel chit. Identity remains unknown" },
      { description: "Accent observation is vague — 'slight accent I couldn't place'", severity: "Low", details: "Ambiguous linguistic detail that could match hundreds of port workers from diverse backgrounds" },
    ],
  },

  "demo-doc-004": {
    persons: [
      { name: "J. Whitfield", clothing: null, description: "Port Operations Manager, filed inventory discrepancy report" },
      { name: "Carlos Medina", clothing: null, description: "Day shift forklift operator, assigned to FL-09. States he parked forklift in charging bay at end of shift (6:00 PM, Nov 13)" },
    ],
    vehicles: [
      { description: "Forklift unit FL-09 — found near Bay #3 with key in ignition", trajectory: "Normally assigned to charging bay; found at Bay #3 with 0.4 additional hours logged", plate: "FL-09" },
    ],
    locations: [
      { name: "Warehouse 7-B, Pier 7", timestamp: "07:00 AM", details: "Morning inventory check revealed multiple discrepancies", lat: 33.7403, lng: -118.2785 },
      { name: "Bay #3 (Loading Bay)", timestamp: "01:55 AM – 02:35 AM", details: "Door found partially open (~3 feet). Camera WH7B-CAM-02 experienced 'signal loss' during this window", lat: 33.7401, lng: -118.2787 },
      { name: "Row C, Slot 14", timestamp: null, details: "Empty pallet position — should contain 4 sealed crates (1,200 kg 'Machine Parts') under manifest BRAVO-7719", lat: 33.7402, lng: -118.2786 },
      { name: "147 Coastal Highway, Suite 200", timestamp: null, details: "Registered address of Maritime Logistics Partners LLC — verified as virtual office / mail forwarding service", lat: 33.7500, lng: -118.2600 },
    ],
    weak_signals: [
      { signal: "Camera signal loss during operational window", excerpt: "WH7B-CAM-02 experienced a 'signal loss' from 01:55 AM to 02:35 AM", significance: "40-minute camera outage precisely overlaps with SUBJECT ALPHA activity window — deliberate interference highly likely" },
      { signal: "Shell company consignee", excerpt: "Maritime Logistics Partners LLC was incorporated 4 months ago... registered address verified as a virtual office / mail forwarding service", significance: "Recently incorporated shell company with virtual office — classic structure for obscuring cargo ownership" },
      { signal: "Unauthorized forklift operation", excerpt: "forklift's hour meter shows 0.4 additional hours of operation beyond what Medina's shift log accounts for", significance: "~24 minutes of unaccounted forklift use overnight — consistent with moving palletized cargo to/from loading bay" },
      { signal: "Manifest mismatch", excerpt: "4 sealed crates listed as 'Machine Parts — General' under manifest BRAVO-7719... Total declared weight: 1,200 kg", significance: "Generic description ('machine parts') and substantial weight — common cover for high-value or restricted cargo" },
    ],
    negative_constraints: [
      { description: "Camera outage could be equipment malfunction rather than sabotage", severity: "Medium", details: "WH7B-CAM-02 'signal loss' could reflect aging infrastructure — harbor cameras have documented reliability issues in quarterly audits" },
      { description: "Forklift hour discrepancy could be meter calibration error", severity: "Low", details: "0.4 hours (24 min) is within plausible range of hour-meter drift, especially on older equipment" },
      { description: "Shell company may be legitimate startup", severity: "Medium", details: "Maritime Logistics Partners LLC may be a legitimate new business using virtual office for cost savings — common practice in logistics industry" },
    ],
  },

  "demo-doc-005": {
    persons: [
      { name: "Lt. Cmdr. Patricia Okafor", clothing: null, description: "Coast Guard Watch Officer, Harbor South Approach sector" },
    ],
    vehicles: [
      { description: "MV PACIFIC TRADER — Container vessel, LOA 294m, all AIS active", trajectory: "Departed Berth 12 outbound, cleared breakwater at 00:52", plate: null },
      { description: "TUG HARBOR KING + Barge HB-44", trajectory: "Inbound from anchorage, assigned to Berth 3, secured at 01:25", plate: null },
      { description: "UV-1114-A — Unidentified vessel, consistent with RIB 6-8 meters", trajectory: "Approached from bearing 190° at 8 knots, entered breakwater, turned east toward Pier 7/8, then departed south at 15 knots", plate: null },
    ],
    locations: [
      { name: "Breakwater Entrance", timestamp: "02:08 AM", details: "UV-1114-A entered breakwater zone. No AIS, no VHF response", lat: 33.7370, lng: -118.2810 },
      { name: "Pier 7/Pier 8 Area", timestamp: "02:12 AM", details: "UV-1114-A slowed and turned east, radar return weakened in pier shadow", lat: 33.7400, lng: -118.2790 },
      { name: "Berth 12", timestamp: "00:15 AM", details: "MV PACIFIC TRADER departure point", lat: 33.7440, lng: -118.2730 },
      { name: "Berth 3", timestamp: "01:25 AM", details: "TUG HARBOR KING + Barge HB-44 secured", lat: 33.7450, lng: -118.2745 },
      { name: "South Approach Corridor", timestamp: "01:55 AM", details: "Initial radar contact with UV-1114-A at 3.2 nm range, bearing 190°", lat: 33.7320, lng: -118.2830 },
    ],
    weak_signals: [
      { signal: "No AIS transponder on UV-1114-A", excerpt: "AIS query negative — no AIS transponder detected", significance: "Deliberately disabled or absent AIS on a vessel entering a controlled harbor zone — violation of maritime safety regulations, consistent with intent to avoid tracking" },
      { signal: "No VHF response", excerpt: "Attempted VHF contact on Channel 16: no response", significance: "Ignoring Channel 16 hails is a serious maritime violation — indicates vessel is deliberately avoiding identification" },
      { signal: "Speed change profile", excerpt: "approached at approximately 8 knots... departed south at approximately 15 knots", significance: "Slow ingress / fast egress pattern consistent with insertion/extraction mission profile" },
      { signal: "Radar shadow exploitation", excerpt: "Radar return weakened — possible vessel entered radar shadow of pier structures", significance: "Deliberate use of pier radar shadow to conceal position — suggests knowledge of radar coverage gaps" },
    ],
    negative_constraints: [
      { description: "Small craft could be recreational boater or fisherman", severity: "Medium", details: "RIBs are common recreational vessels. Operating without lights at night, while illegal, could indicate negligence rather than hostile intent" },
      { description: "AIS is not legally required on all vessel classes", severity: "Low", details: "Vessels under 65 feet are not always required to carry AIS in all jurisdictions — absence may not indicate deliberate evasion" },
      { description: "Timing correlation with pier activity could be coincidental", severity: "Medium", details: "Harbor is active 24/7. UV-1114-A presence near Pier 7 during the 02:00–02:30 window may be unrelated to ground activity" },
    ],
  },
};

// ─── Per-pair mock correlations (Pass 2) ──────────────────────────────────

const MOCK_CORRELATIONS = {
  "demo-doc-001|demo-doc-002": {
    confidence: "Strong",
    primary_vector: "Temporal and spatial convergence: SUBJECT ALPHA observed at Pier 7 loading dock at 02:17 AM directly overlaps with encrypted radio bursts (02:03, 02:24) triangulated to Pier 7 area and Patrol Boat 2's sighting of an unlit vessel 200m offshore at 02:14. The 14-minute window between the first encrypted burst and the vessel appearance, combined with SUBJECT ALPHA's apparent radio alert detection, strongly suggests coordinated air-sea-land operation with the unidentified vessel serving as waterside extraction/insertion platform.",
    explanation: "Three independent data streams converge at Pier 7 between 02:00–02:30: ground activity (SUBJECT ALPHA), encrypted comms (two bursts with matching signatures), and maritime contact (unlit RIB). The probability of three unrelated anomalies occurring at the same location within a 25-minute window is extremely low.",
    counterfactual_argument: "The harbor is a 24/7 operational environment. Pier 7 is a known high-traffic area. The encrypted transmissions could be routine commercial vessel communications bleed — Harbor Control's initial assessment. The small craft near the breakwater could be a recreational boater or fisherman operating without proper lights (common violation). SUBJECT ALPHA's 'radio alert' detection could be coincidental awareness of Sgt. Hale's approach through normal environmental awareness rather than electronic warning. Without intercepting and decrypting the radio bursts, the connection between ground and maritime activity remains speculative.",
    shared_entities: ["Pier 7", "02:00-02:30 timeframe", "encrypted radio", "unlit vessel"],
    weak_signals: [
      { signal: "Synchronized timing", excerpt: "Radio burst at 02:03, SUBJECT ALPHA at dock 02:17, vessel sighted 02:14" },
      { signal: "Radio-alerted retreat", excerpt: "SUBJECT ALPHA appeared to detect my approach (possibly via radio alert)" },
      { signal: "Dual encrypted bursts", excerpt: "Same encrypted signature — single network/actor" },
    ],
    negative_constraints: [
      { description: "No physical evidence directly links SUBJECT ALPHA to the vessel", severity: "High", details: "No intercepted communications, no observed handoff, no visual confirmation of SUBJECT ALPHA boarding or approaching waterside" },
      { description: "Encrypted bursts not decrypted — content unknown", severity: "Medium", details: "Without decryption, transmissions could contain routine traffic, weather data, or unrelated operational chatter" },
    ],
  },

  "demo-doc-001|demo-doc-003": {
    confidence: "Strong",
    primary_vector: "Identity convergence through clothing and timeline: Fuel clerk Danny Cortez describes an unidentified male at 01:15 AM wearing 'navy/dark blue jumpsuit and dark knit cap' — directly matching Sgt. Hale's description of SUBJECT ALPHA at Pier 7 at 02:17 AM wearing 'dark blue coverall and black watch cap.' The 62-minute gap is consistent with on-foot transit from Harbor Fuel Depot to Pier 7 via the east service road. Both subjects carried non-standard equipment (handheld radio at fuel depot, duffel bag at pier).",
    explanation: "Det. Salinas's cross-reference note explicitly links these two sightings. The clothing match (dark blue coverall/jumpsuit + dark/black cap), build description (stocky), direction of travel (eastward from fuel depot toward piers), and timeline (01:15→02:17, 62 minutes) create a strong circumstantial chain placing the same individual at both locations.",
    counterfactual_argument: "Dark blue coveralls and knit caps are standard harbor workwear — dozens of dock workers could match this description on any given shift. The 62-minute gap allows for multiple unrelated individuals to have been at different locations. Cortez's observation of 'new boots' is subjective and could simply reflect a new employee. The stocky build description is generic. Without a facial ID or unique physical marker, the match relies entirely on common workwear in a maritime environment.",
    shared_entities: ["SUBJECT ALPHA / fuel depot visitor", "dark blue coverall/jumpsuit", "east service road", "non-standard radio equipment"],
    weak_signals: [
      { signal: "Clothing match across reports", excerpt: "dark blue coverall/jumpsuit + black watch/knit cap" },
      { signal: "Non-standard comms equipment", excerpt: "Handheld radio at fuel depot matches operational profile" },
      { signal: "Cash purchase avoidance", excerpt: "Offered to pay cash — avoids billing paper trail" },
      { signal: "New boots on experienced-appearing operator", excerpt: "Work boots that looked brand new" },
    ],
    negative_constraints: [
      { description: "Common workwear makes clothing-only match unreliable", severity: "Medium", details: "Dark coveralls and knit caps are ubiquitous in harbor environments across multiple shifts" },
      { description: "No facial recognition or biometric match", severity: "High", details: "Identification rests solely on clothing and build — insufficient for positive ID" },
    ],
  },

  "demo-doc-001|demo-doc-004": {
    confidence: "Strong",
    primary_vector: "SUBJECT ALPHA's activity at Pier 7 loading dock at 02:17 directly explains the Warehouse 7-B anomalies: the partially raised Bay #3 door, the camera signal loss (01:55–02:35 covering the exact activity window), the forklift movement, and the missing 1,200 kg cargo. SUBJECT ALPHA's duffel bag could contain tools for forklift operation or camera interference equipment. The Camera Blind Spot #3 exploitation demonstrates advance planning consistent with the precision required to disable WH7B-CAM-02.",
    explanation: "Warehouse 7-B and the Pier 7 loading dock are the same physical complex. The camera outage window (01:55–02:35) perfectly brackets SUBJECT ALPHA's observed activity (02:17), and the forklift's unexplained 24 minutes of operation align with the time needed to move palletized cargo from Row C Slot 14 to Bay #3 for external loading.",
    counterfactual_argument: "The camera outage could be an equipment malfunction unrelated to any human activity — harbor surveillance systems are aging and documented to have reliability issues. The forklift hour discrepancy (0.4 hours) is within normal meter drift range for older equipment. The missing cargo could be an inventory system error or unreported authorized removal. Bay #3 being partially open could result from wind, mechanical failure, or a previous shift's oversight. These anomalies, while suspicious when combined, each have mundane explanations individually.",
    shared_entities: ["Warehouse 7-B", "Pier 7 Loading Dock", "Bay #3", "Camera Blind Spot"],
    weak_signals: [
      { signal: "Camera outage brackets observed activity", excerpt: "01:55–02:35 signal loss exactly covers SUBJECT ALPHA window" },
      { signal: "Forklift used to move heavy cargo", excerpt: "0.4 additional hours — enough to move 1,200 kg from Row C to Bay #3" },
      { signal: "Shell company consignee", excerpt: "Maritime Logistics Partners LLC — virtual office, 4 months old" },
    ],
    negative_constraints: [
      { description: "No direct evidence SUBJECT ALPHA entered warehouse", severity: "High", details: "Sgt. Hale observed activity at the dock exterior only — no interior observation" },
      { description: "Camera failure has documented alternative explanations", severity: "Medium", details: "Quarterly security audits note recurring camera reliability issues" },
    ],
  },

  "demo-doc-001|demo-doc-005": {
    confidence: "Strong",
    primary_vector: "Coast Guard tracking of UV-1114-A provides the maritime component of the Pier 7 operation. UV-1114-A entered the breakwater at 02:08, turned east toward Pier 7/8 at 02:12, then departed rapidly at 02:22 — creating a 14-minute window at Pier 7 that directly overlaps with SUBJECT ALPHA's observed activity at 02:17. The vessel's deliberate approach (slow ingress, no AIS/lights, radar shadow exploitation) and rapid egress pattern matches an insertion/extraction mission profile. SUBJECT ALPHA's radio-alerted retreat at approximately 02:23 aligns with UV-1114-A's departure at 02:22.",
    explanation: "UV-1114-A's movements create a precise operational timeline: approach (01:55), enter harbor (02:08), position near Pier 7 (02:12), hold for ~10 minutes during cargo operation, then rapid extraction (02:22). This perfectly aligns with ground activity and encrypted radio bursts.",
    counterfactual_argument: "UV-1114-A was never positively identified — it could be any small vessel, including a recreational boat, fishing vessel, or even a harbor maintenance craft operating informally. The vessel's presence near Pier 7 could be coincidental. Many small craft operate without AIS (not legally required under 65 feet in some jurisdictions). The 'radar shadow' could simply be the vessel passing behind pier infrastructure rather than deliberately exploiting coverage gaps. Without intercepting communications or obtaining visual identification, linking UV-1114-A to ground activity relies entirely on temporal and spatial proximity.",
    shared_entities: ["Pier 7", "02:08-02:22 AM timeframe", "unlit vessel approach"],
    weak_signals: [
      { signal: "Slow ingress / fast egress", excerpt: "8 knots in, 15 knots out — mission-profile speed changes" },
      { signal: "Synchronized departure", excerpt: "SUBJECT ALPHA retreated ~02:23, UV-1114-A departed 02:22" },
      { signal: "Radar shadow exploitation", excerpt: "Vessel used pier structures to weaken radar return" },
    ],
    negative_constraints: [
      { description: "No visual or electronic link between vessel and ground subject", severity: "High", details: "Proximity does not equal coordination without confirmed communications or observed interaction" },
      { description: "Small craft AIS absence may be legal", severity: "Low", details: "AIS carriage requirements vary by vessel class and jurisdiction" },
    ],
  },

  "demo-doc-002|demo-doc-003": {
    confidence: "Moderate",
    primary_vector: "The fuel depot visitor's non-standard handheld radio (described by Cortez as 'compact, black, stubby antenna — not a port-issue Motorola') is a plausible match for the equipment used to generate the encrypted radio bursts logged on Channel 14. The visitor's appearance at 01:15 AM precedes the first encrypted burst at 02:03 by 48 minutes — consistent with the individual moving from the fuel depot to the Pier 7 area. Tony Nunes (Gate 4) appears in both documents as a corroborating bridge witness.",
    explanation: "The radio equipment anomaly creates a potential link between the fuel depot visitor and the encrypted transmissions. Cortez specifically noted the radio was non-standard, and encrypted bursts were logged from the Pier 7 area where the visitor was heading.",
    counterfactual_argument: "Many dock workers and maritime professionals carry personal radios for convenience. The specific radio model described by Cortez (compact, black, stubby antenna) matches dozens of commercially available handheld radios. The encrypted bursts were triangulated to the general Pier 7 area — a large zone that could contain multiple radio users. The 48-minute gap between the fuel depot visit and the first burst is too large to definitively link the same individual without additional evidence. Tony Nunes' mention in both documents simply reflects his role as Gate 4 operator — he would appear in any report involving the main gate area.",
    shared_entities: ["non-standard radio equipment", "Tony Nunes / Gate 4", "Pier 7 area"],
    weak_signals: [
      { signal: "Non-standard radio → encrypted bursts connection", excerpt: "Compact radio at fuel depot; encrypted bursts near Pier 7" },
      { signal: "Timeline continuity", excerpt: "01:15 fuel depot → 02:03 first burst — 48 min transit window" },
    ],
    negative_constraints: [
      { description: "Radio model cannot be matched without physical examination", severity: "High", details: "Visual description alone is insufficient to confirm the fuel depot radio is the same equipment generating encrypted bursts" },
      { description: "48-minute gap is speculative for linking individual movement", severity: "Medium", details: "Individual could have gone anywhere after leaving fuel depot — pier direction is assumed, not confirmed" },
    ],
  },

  "demo-doc-002|demo-doc-004": {
    confidence: "Moderate",
    primary_vector: "The camera signal loss at Warehouse 7-B (01:55–02:35 AM) is temporally synchronized with the encrypted radio bursts (02:03, 02:24). This suggests a possible electronic warfare capability: the actor(s) may have used the same equipment to both jam/disable WH7B-CAM-02 and communicate via encrypted radio. The 8-minute gap between camera loss start (01:55) and first encrypted burst (02:03) could represent a deliberate sequence — disable surveillance first, then signal readiness to maritime element.",
    explanation: "Two electronic anomalies (camera failure + encrypted radio) occurring within the same 40-minute window at the same Pier 7 complex suggests coordinated electronic interference rather than coincidental equipment failures.",
    counterfactual_argument: "Camera signal loss and radio transmissions use different frequency bands and technologies. There is no technical evidence suggesting the same equipment caused both. The camera outage could be a routine equipment failure — harbor cameras have known reliability issues. The encrypted bursts may originate from commercial shipping, other harbor operations, or civilian radio hobbyists. Attributing both anomalies to a single actor requires assuming sophisticated electronic warfare capability without supporting evidence.",
    shared_entities: ["01:55-02:35 AM timeframe", "Pier 7 complex", "electronic anomalies"],
    weak_signals: [
      { signal: "Synchronized electronic events", excerpt: "Camera loss starts 01:55, first burst 02:03 — possible disable-then-signal sequence" },
      { signal: "Common operational zone", excerpt: "Both anomalies localized to Pier 7/Warehouse 7-B complex" },
    ],
    negative_constraints: [
      { description: "No technical link between camera interference and radio transmissions", severity: "High", details: "Different technologies, frequencies, and equipment — correlation is temporal only" },
      { description: "Camera reliability issues pre-date this incident", severity: "Medium", details: "Documented in quarterly security audits as recurring infrastructure problem" },
    ],
  },

  "demo-doc-002|demo-doc-005": {
    confidence: "Strong",
    primary_vector: "Patrol Boat 2's sighting of the unlit RIB at 02:14 on Channel 14 radio transcript directly corroborates Coast Guard's radar tracking of UV-1114-A entering the breakwater at 02:08 and heading toward Pier 7/8 at 02:12. These are independent observations of the same vessel from different platforms (visual from Patrol Boat 2, radar from Coast Guard VTS). The encrypted radio bursts (02:03 and 02:24) bracket the vessel's time inside the breakwater, potentially serving as ingress/egress coordination signals.",
    explanation: "Two independent sensor platforms (harbor patrol visual + coast guard radar) confirm the same unidentified vessel's presence near Pier 7 during the encrypted radio burst window. This dual-source confirmation elevates confidence from circumstantial to substantive.",
    counterfactual_argument: "Patrol Boat 2 and Coast Guard VTS may be tracking different vessels. Without a confirmed hull match or transponder correlation, assuming both observations relate to the same craft relies on timing and approximate position alone. The harbor south approach is a busy corridor — multiple small craft could be present. The encrypted bursts may have no connection to either tracked contact. Coast Guard's radar contact characterization as 'consistent with RIB' is speculative based on radar return profile, not visual confirmation.",
    shared_entities: ["unlit vessel / UV-1114-A", "breakwater zone", "Pier 7/8 area", "02:08-02:22 timeframe"],
    weak_signals: [
      { signal: "Dual-source vessel confirmation", excerpt: "Patrol Boat 2 visual + Coast Guard radar — independent observations" },
      { signal: "Radio bursts bracket vessel presence", excerpt: "02:03 burst → 02:08 entry → 02:22 exit → 02:24 burst" },
    ],
    negative_constraints: [
      { description: "Two observations may be of different vessels", severity: "Medium", details: "Without transponder match, two independent small craft could explain both observations" },
      { description: "Coast Guard radar profile analysis is probabilistic, not definitive", severity: "Low", details: "RIB characterization based on radar return size — could be kayak, dinghy, or debris" },
    ],
  },

  "demo-doc-003|demo-doc-004": {
    confidence: "Moderate",
    primary_vector: "The fuel depot visitor's attempt to purchase 50 gallons of marine diesel suggests intent to support a maritime operation. Combined with the missing 1,200 kg cargo from Warehouse 7-B, this paints a picture of a multi-phase logistics operation: acquire fuel for the extraction vessel (failed at 01:15), then proceed to execute the cargo removal (01:55–02:35). The visitor's non-standard radio could have been used to coordinate the camera disabling and cargo movement. Det. Salinas's cross-reference note explicitly connects the fuel depot visitor to SUBJECT ALPHA at Pier 7, which is the same complex as Warehouse 7-B.",
    explanation: "The fuel purchase attempt and cargo theft share a common operational narrative: maritime logistics requires fuel; the failed fuel purchase and successful cargo extraction suggest a planned operation that proceeded despite the refueling setback.",
    counterfactual_argument: "The fuel depot visitor may have had no connection to the warehouse discrepancy. Marine diesel is purchased regularly by legitimate vessel operators — a declined cash sale, while unusual, does not imply criminal intent. The visitor departed toward 'the piers' — a general direction that includes dozens of facilities beyond Warehouse 7-B. Connecting a failed fuel purchase at 01:15 to a cargo theft discovered at 07:00 requires assuming the same actor was involved in both, based solely on direction of travel and proximity. The timing gap (nearly 6 hours between the fuel visit and discovery of theft) makes real-time connection impossible.",
    shared_entities: ["harbor fuel depot", "marine diesel", "east service road / pier direction"],
    weak_signals: [
      { signal: "Marine diesel → maritime extraction vessel", excerpt: "50 gallons of marine diesel for undocumented vessel" },
      { signal: "Failed procurement → pivoted to primary mission", excerpt: "Left fuel depot heading toward piers where cargo was stolen" },
    ],
    negative_constraints: [
      { description: "No evidence fuel visitor entered Warehouse 7-B", severity: "High", details: "Movement after leaving fuel depot is entirely assumed — no tracking, no camera, no witnesses between fuel depot and warehouse" },
      { description: "Marine diesel is a common commodity", severity: "Low", details: "Hundreds of legitimate transactions occur weekly at harbor fuel depots" },
    ],
  },

  "demo-doc-003|demo-doc-005": {
    confidence: "Weak",
    primary_vector: "The fuel depot visitor's attempt to purchase marine diesel at 01:15 AM may be linked to UV-1114-A's operations. If UV-1114-A is the extraction vessel, it would require fuel for the approach and rapid egress (ingress at 8 knots, egress at 15 knots). The failed fuel purchase could indicate the vessel was running low, forcing the operation to proceed with existing fuel reserves. The visitor's non-standard radio could be the same equipment generating encrypted bursts detected by Coast Guard VHF monitoring.",
    explanation: "Tenuous but logistically consistent link: a maritime extraction requires fuel, and the failed diesel purchase occurred ~50 minutes before UV-1114-A's first radar detection.",
    counterfactual_argument: "This is the weakest link in the case network. The fuel depot visitor was on foot — there is no evidence connecting him to UV-1114-A or any vessel. Marine diesel is used by hundreds of vessels in any port; a single declined purchase does not establish a link to a specific unidentified craft. UV-1114-A's fuel status is unknown — the vessel may have had full tanks. The radio equipment similarity is speculative without physical examination. The 40-minute gap between the fuel visit and UV-1114-A's radar detection does not support a direct operational connection.",
    shared_entities: ["marine diesel", "non-standard radio equipment"],
    weak_signals: [
      { signal: "Fuel requirement for maritime operation", excerpt: "50 gal marine diesel could support RIB-sized extraction vessel" },
    ],
    negative_constraints: [
      { description: "No direct link between fuel visitor and any vessel", severity: "High", details: "Visitor was on foot — no vessel observed at fuel depot, no dock assignment, no mooring evidence" },
      { description: "Fuel status of UV-1114-A is entirely unknown", severity: "High", details: "Vessel may have had adequate fuel regardless of any land-based fuel procurement attempt" },
      { description: "Extremely circumstantial connection", severity: "High", details: "Link relies entirely on temporal proximity and speculative fuel logistics — no corroborating evidence" },
    ],
  },

  "demo-doc-004|demo-doc-005": {
    confidence: "Moderate",
    primary_vector: "UV-1114-A's presence inside the breakwater near Pier 7/8 (02:08–02:22) directly overlaps with the camera outage at Warehouse 7-B (01:55–02:35). The vessel's trajectory — slowing near Pier 7, exploiting radar shadow of pier structures — is consistent with positioning for a waterside cargo pickup from Bay #3 of Warehouse 7-B. The missing 1,200 kg of cargo could have been loaded onto UV-1114-A during the 14-minute window, then rapidly extracted south through the breakwater at 15 knots.",
    explanation: "Spatial and temporal alignment between the unidentified vessel's approach to Pier 7 and the warehouse cargo disappearance, with the camera outage providing a concealment window for the transfer operation.",
    counterfactual_argument: "Loading 1,200 kg of palletized cargo from a dock onto a 6-8 meter RIB in 14 minutes would require crane or boom equipment — not typically found on inflatable vessels. The logistics of transferring heavy crates from a warehouse bay to a small vessel at night without lighting, docking infrastructure, or multiple crew members is operationally implausible. UV-1114-A's radar return suggests a small craft that may lack the capacity for 1,200 kg payload. The vessel may have been near Pier 7 for entirely unrelated reasons. The camera outage and vessel presence may be coincidental.",
    shared_entities: ["Pier 7 area", "02:08-02:35 overlap window", "Bay #3 / waterside access"],
    weak_signals: [
      { signal: "Vessel positioned at waterside cargo access point", excerpt: "UV-1114-A headed toward Pier 7/8 — nearest waterside access to Bay #3" },
      { signal: "Rapid departure after operational window", excerpt: "15 knots egress suggests time-critical cargo retrieval" },
    ],
    negative_constraints: [
      { description: "1,200 kg payload likely exceeds RIB capacity", severity: "High", details: "A 6-8 meter RIB typically carries 500-800 kg max payload with crew — 1,200 kg would be dangerous/impossible" },
      { description: "No dock-to-vessel transfer infrastructure observed", severity: "Medium", details: "No crane, boom, or loading equipment reported at Bay #3 waterside — manual transfer of 300 kg crates unlikely" },
    ],
  },
};

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Returns true when the mock engine should be used (i.e. no valid OpenAI key).
 */
export function shouldUseMock() {
  const key = process.env.OPENAI_API_KEY;
  return !key || key === "demo" || key === "sk-test" || key.length < 20;
}

/**
 * Mock Pass 1 — returns hand-crafted extraction for demo documents,
 * or a basic fallback for unknown documents.
 */
export function getMockExtraction(documentId) {
  if (MOCK_EXTRACTIONS[documentId]) {
    return MOCK_EXTRACTIONS[documentId];
  }
  // For non-demo documents, return a minimal placeholder
  return {
    persons: [],
    vehicles: [],
    locations: [],
    weak_signals: [],
    negative_constraints: [],
  };
}

/**
 * Mock Pass 2 — returns hand-crafted correlation for demo document pairs,
 * or a generic placeholder for unknown pairs.
 */
export function getMockCorrelation(docIdA, docIdB) {
  const key1 = `${docIdA}|${docIdB}`;
  const key2 = `${docIdB}|${docIdA}`;
  if (MOCK_CORRELATIONS[key1]) return MOCK_CORRELATIONS[key1];
  if (MOCK_CORRELATIONS[key2]) return MOCK_CORRELATIONS[key2];

  // For non-demo pairs, return a generic weak correlation
  return {
    confidence: "Weak",
    primary_vector: "Insufficient data for detailed correlation analysis. Both documents originate from the same operational context but no specific entity or temporal overlaps were identified by the mock engine.",
    explanation: "No pre-built correlation available for this document pair.",
    counterfactual_argument: "Without specific entity, temporal, or spatial overlaps, any perceived connection between these documents may reflect shared operational context rather than a genuine investigative link.",
    shared_entities: [],
    weak_signals: [],
    negative_constraints: [
      { description: "No pre-built mock data available for this pair", severity: "Low", details: "This pair was not part of the bundled demo case set" },
    ],
  };
}
