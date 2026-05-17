import { v4 as uuidv4 } from "uuid";
import db from "./db.js";
import { runPass1, runPass2 } from "./threadlinePipeline.js";

const DEMO_DOCUMENTS = [
  {
    id: "demo-doc-001",
    title: "Loading Dock Approach — Pier 7 Night Watch",
    source_type: "incident_report",
    raw_text: `INCIDENT REPORT — HARBOR PATROL UNIT 4
Date: 2024-11-14 | Time: 02:17 AM | Location: Pier 7, East Loading Dock

Reporting Officer: Sgt. Marcus Hale

At approximately 02:17 AM, I observed an unmarked white cargo van (no visible plates) approaching the east loading dock at Pier 7 via the service road. The vehicle's headlights were off despite the access road being unlit. The van stopped approximately 40 meters from the dock gate and remained stationary for 6 minutes before a male individual — later identified as wearing a dark blue coverall and black watch cap — exited the driver's side.

The individual, hereafter referred to as SUBJECT ALPHA, walked toward the dock on foot, bypassing the main gate checkpoint and instead using a gap in the perimeter fence near Camera Blind Spot #3 (documented in last quarter's security audit). SUBJECT ALPHA was carrying what appeared to be a large duffel bag.

I attempted to close distance for visual identification but SUBJECT ALPHA appeared to detect my approach (possibly via radio alert) and retreated rapidly to the van. The vehicle departed eastbound on Harbor Service Road at high speed with no lights. Pursuit was not initiated per standing orders for unmarked observations.

Note: The loading dock had no scheduled deliveries between 00:00 and 06:00. Warehouse 7-B was listed as empty on the current manifest, but the loading bay door was observed to be partially raised (~3 feet) when I arrived on scene.`,
  },
  {
    id: "demo-doc-002",
    title: "Radio Transcript — Harbor Control Channel 14",
    source_type: "radio_transcript",
    raw_text: `RADIO TRANSCRIPT — HARBOR CONTROL CHANNEL 14
Date: 2024-11-14 | Time Window: 01:45 AM — 02:30 AM

[01:47] Harbor Control: "All units, routine status check. Channel 14 active."
[01:48] Patrol Boat 2: "Patrol Boat 2, sector Bravo-3, all clear."
[01:49] Gate 4 Operator (T. Nunes): "Gate 4 quiet. One fuel truck cleared at 01:30, manifest confirmed."
[01:52] Harbor Control: "Copy all. Next check at 02:15."

[02:03] [UNIDENTIFIED TRANSMISSION — 3.2 second burst, encrypted/scrambled. Origin triangulated to approximate position near Pier 7 east approach.]

[02:05] Gate 4 Operator (T. Nunes): "Harbor Control, Gate 4. I just picked up something on the secondary frequency. Sounded like a short coded burst. Want me to log it?"
[02:06] Harbor Control: "Affirmative, Gate 4. Log it and note the time. Probably commercial vessel comms bleed. Continue monitoring."

[02:14] Patrol Boat 2: "Harbor Control, Patrol Boat 2. I've got a visual on a small craft — no running lights — moving slow near the breakwater, bearing 045 from my position. Approximately 200 meters offshore from Pier 7."
[02:15] Harbor Control: "Copy, Patrol Boat 2. Can you get a hull number or ID?"
[02:16] Patrol Boat 2: "Negative. Craft is dark. Appears to be a rigid inflatable, maybe 20-foot. It's turning south now, picking up speed."
[02:18] Harbor Control: "Patrol Boat 2, maintain visual if safe. Do not pursue beyond the breakwater."
[02:21] Patrol Boat 2: "Lost visual. Craft went south past the breakwater into open water. No ID obtained."

[02:24] [UNIDENTIFIED TRANSMISSION — 1.8 second burst, same encrypted signature as 02:03 transmission. Origin near Pier 7/Pier 8 boundary.]

[02:28] Harbor Control: "All units, be advised. Two unidentified encrypted transmissions logged from Pier 7 area within 25 minutes. Heightened awareness for remainder of shift."`,
  },
  {
    id: "demo-doc-003",
    title: "Fuel Clerk Statement — Harbor Fuel Depot",
    source_type: "witness_statement",
    raw_text: `WITNESS STATEMENT
Date: 2024-11-14 | Taken at: 09:30 AM | Location: Harbor Fuel Depot Office

Witness: Danny Cortez, Night Shift Fuel Clerk (Badge #FC-2247)
Statement taken by: Det. Rosa Salinas

I've been the night fuel clerk at the harbor depot for three years. My shift is 10 PM to 6 AM. On the night of November 13th into the 14th, things were mostly routine until around 1:15 AM.

At approximately 01:15 AM, a man I hadn't seen before came to the fuel window. He wasn't in a port vehicle — he walked up from the direction of the east service road. He was wearing dark clothing — I think a navy or dark blue jumpsuit, and a dark knit cap. Stocky build, maybe 5'10". He had a slight accent I couldn't place.

He asked to purchase 50 gallons of marine diesel. I told him I needed a vessel registration or a port-issued fuel chit. He said his "boss" would bring the paperwork in the morning and offered to pay cash. I told him we don't accept cash — everything goes through the port billing system.

He got a little agitated and said something like "it's just fuel, man, we're on a schedule." I held firm and he left, walking back east toward the piers. I logged the interaction in my shift report at the time.

The thing that stuck with me: when he turned to leave, I saw he had a small handheld radio clipped to his belt — not a standard port-issue Motorola. It looked like a compact unit, black, with a stubby antenna. Also, he was wearing work boots that looked brand new — like they'd never been on a dock before.

I mentioned this to Tony Nunes at Gate 4 when I called him on the landline around 01:30 to confirm a fuel truck manifest. Tony said it was a quiet night but he'd keep an eye out.

ADDITIONAL NOTE (added by Det. Salinas): Cross-referencing with Sgt. Hale's night watch report — the description of SUBJECT ALPHA's clothing (dark blue coverall, black watch cap) closely matches Mr. Cortez's description of the fuel depot visitor. Timeline places the fuel depot visit approximately 60 minutes before SUBJECT ALPHA was observed at Pier 7 east loading dock.`,
  },
  {
    id: "demo-doc-004",
    title: "Warehouse 7-B Inventory Discrepancy Report",
    source_type: "incident_report",
    raw_text: `INVENTORY DISCREPANCY REPORT — WAREHOUSE 7-B
Date: 2024-11-14 | Filed by: Port Operations Manager, J. Whitfield
Report #: INV-2024-1847

During the routine morning inventory check at 07:00 AM on November 14, 2024, the following discrepancies were noted in Warehouse 7-B, Pier 7:

1. LOADING BAY STATUS: Bay door #3 was found partially open (approximately 3 feet). According to operations logs, Bay #3 was last used on November 11 for the offloading of Container MSKU-4471823 (agricultural equipment, cleared by customs). No activity was scheduled for Bay #3 between November 11 and November 16.

2. INVENTORY DISCREPANCY: A pallet position in Row C, Slot 14 was found empty. According to the warehouse management system, this slot should contain 4 sealed crates listed as "Machine Parts — General" under manifest BRAVO-7719, consigned to Maritime Logistics Partners LLC. Total declared weight: 1,200 kg. The crates were logged as received on November 8 and had no scheduled pickup until November 20.

3. PHYSICAL EVIDENCE: Forklift unit FL-09 was found parked near Bay #3 with the key in the ignition. FL-09 is assigned to day shift operator Carlos Medina, who states he parked it in the charging bay at the end of his shift (6:00 PM, Nov 13). The forklift's hour meter shows 0.4 additional hours of operation beyond what Medina's shift log accounts for.

4. SECURITY FOOTAGE: Camera coverage for the interior of Warehouse 7-B is provided by cameras WH7B-CAM-01 and WH7B-CAM-02. Review of footage from 00:00 to 06:00 on Nov 14 shows WH7B-CAM-02 (which covers Bay #3 and Row C) experienced a "signal loss" from 01:55 AM to 02:35 AM. WH7B-CAM-01 (covering the north entrance) shows no unauthorized entry through the main door during this period.

5. ADDITIONAL NOTE: Maritime Logistics Partners LLC was incorporated 4 months ago. Port records show only two prior shipments through our facility, both small volumes. The registered address (147 Coastal Highway, Suite 200) was verified by port police as a virtual office / mail forwarding service.

Recommendation: Immediate investigation. Notify harbor police and customs. Preserve all camera footage and access logs.`,
  },
  {
    id: "demo-doc-005",
    title: "Coast Guard Vessel Traffic Log — Harbor Approaches",
    source_type: "traffic_log",
    raw_text: `COAST GUARD VESSEL TRAFFIC SERVICE — HARBOR APPROACHES LOG
Date: 2024-11-14 | Sector: Harbor South Approach / Breakwater Zone
Watch Officer: Lt. Cmdr. Patricia Okafor

VESSEL MOVEMENTS (00:00 — 06:00):

[00:15] MV PACIFIC TRADER (Container vessel, LOA 294m) — Departed Berth 12, outbound transit. Pilot aboard. All AIS transponders active. Cleared breakwater at 00:52.

[00:40] TUG HARBOR KING + Barge HB-44 — Inbound from anchorage, assigned to Berth 3. Slow transit due to current. Secured at berth 01:25.

[01:10] No AIS contacts in harbor south approach corridor. Radar shows clear.

[01:55] ANOMALY: Radar contact detected bearing 190°, range 3.2 nm from breakwater entrance. Small target, intermittent return — consistent with low-profile vessel or vessel with radar reflector removed. Contact tracked moving north toward breakwater at approximately 8 knots.

[02:08] Contact entered breakwater zone. AIS query negative — no AIS transponder detected. Attempted VHF contact on Channel 16: no response. Contact classified as UNIDENTIFIED VESSEL, designated UV-1114-A.

[02:12] UV-1114-A appeared to slow and turn east inside the breakwater, heading toward the Pier 7/Pier 8 area. Radar return weakened — possible vessel entered radar shadow of pier structures.

[02:22] Radar contact with UV-1114-A re-acquired heading south at approximately 15 knots. Vessel exited breakwater zone at 02:26. Attempted VHF contact: no response.

[02:30] UV-1114-A lost on radar at range 5.1 nm, bearing 175°.

NOTES FROM WATCH OFFICER:
— UV-1114-A profile consistent with rigid inflatable boat (RIB) or similar small craft, 6-8 meters.
— Behavior pattern: deliberate approach with no lights, no AIS, no VHF response. Matches profile of vessel intending to avoid detection.
— Timing of UV-1114-A presence inside breakwater (02:08-02:22) overlaps with Harbor Patrol reports of activity near Pier 7.
— Recommend cross-referencing with Harbor Patrol and Port Security reports for this time window.
— No positive identification obtained. Recommend review of any available waterside camera footage from Piers 6-8.`,
  },
];

export async function seedDemoData() {
  const existingCount = db.prepare("SELECT COUNT(*) as count FROM documents").get().count;
  if (existingCount > 0) return;

  const insertDoc = db.prepare(
    "INSERT OR IGNORE INTO documents (id, title, raw_text, source_type) VALUES (?, ?, ?, ?)"
  );

  const insertMany = db.transaction((docs) => {
    for (const doc of docs) {
      insertDoc.run(doc.id, doc.title, doc.raw_text, doc.source_type);
    }
  });

  insertMany(DEMO_DOCUMENTS);

  for (const doc of DEMO_DOCUMENTS) {
    try {
      await runPass1(doc.id);
    } catch {
      /* fallback extraction handles errors */
    }
  }

  const docIds = DEMO_DOCUMENTS.map((d) => d.id);
  for (let i = 0; i < docIds.length; i++) {
    for (let j = i + 1; j < docIds.length; j++) {
      try {
        await runPass2(docIds[i], docIds[j]);
      } catch {
        /* fallback correlation handles errors */
      }
    }
  }
}

export { DEMO_DOCUMENTS };
