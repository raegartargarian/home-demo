/**
 * Home-domain types layered on top of the platform's generic Vault/Stream/
 * Attachment model. These describe the home-specific payloads the demo puts
 * *inside* the generic containers — they don't replace the platform DTOs.
 */

/** Standing "facts sheet" for a home, shown Zillow-style on the vault header. */
export interface HomeFacts {
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  lotSqft?: number;
  yearBuilt?: number;
  propertyType?: string; // e.g. "Single Family", "Townhome"
}

/**
 * How a record was produced. This — not the section — carries the workflow
 * distinction, so the same five sections serve a builder, a renovator and a
 * long-term owner. The UI groups records by whichever axis a scenario picks.
 */
export type HomeRecordType =
  | "build_phase" // a stage of new construction
  | "renovation" // a discrete improvement project
  | "repair" // a one-off fix
  | "service" // recurring maintenance visit
  | "purchase" // acquisition / financial event
  | "document"; // static doc (deed, warranty, policy)

/** Axis the vault detail page groups a stream's records by. */
export type GroupByAxis = "phase" | "collection" | "room" | "timeline";

/**
 * Manifest bundled inside each record zip as `home_record.json`.
 * Home analog of car-demo's `repair_session.json`. `collection` is the phase
 * or project name (e.g. "Kitchen Remodel 2026"); `rooms`/`systems` are tags,
 * never the primary hierarchy.
 */
export interface HomeRecordManifest {
  recordInfo: {
    name: string; // "Left Wing Framing", "Kitchen Remodel 2026"
    type: HomeRecordType;
    collection?: string; // phase/project this record belongs to
    rooms?: string[]; // tags: ["Kitchen", "Dining"]
    systems?: string[]; // tags: ["Electrical", "Plumbing"]
    trade?: string; // "General", "Electrical", "Roofing"
    date?: string; // ISO date of the work
  };
  contractor?: {
    name?: string;
    license?: string;
    phone?: string;
    warranty?: string;
  };
  cost?: {
    labor?: number;
    materials?: number;
    total?: number;
    permitNo?: string;
  };
  materials?: Array<{
    item?: string;
    sku?: string;
    quantity?: number;
    cost?: number;
    warranty?: string;
  }>;
  photos?: {
    before?: string[]; // filenames present in the zip
    after?: string[];
  };
  inspection?: {
    date?: string;
    result?: "pass" | "fail" | "conditional";
    inspector?: string;
  };
  warranty?: {
    provider?: string;
    term?: string;
    expires?: string;
  };
}
