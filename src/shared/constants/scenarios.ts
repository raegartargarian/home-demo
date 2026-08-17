import { GroupByAxis, HomeFacts } from "../types/home";
import { ALL_STREAM_CODES, StreamCategoryCode } from "./streams";

/**
 * Scenario presets.
 *
 * A scenario is NOT a separate app, a separate schema, or a different set of
 * streams. Every Property Vault carries the same five sections — that is what
 * makes it a template. A scenario only decides:
 *
 *   1. which sections the seed data actually populates (`populatedStreams`), and
 *   2. how Maintenance & Upgrades records are grouped by default.
 *
 * One codebase, one taxonomy, a menu of scenarios: this is the "reusable across
 * multiple customers" answer. Unpopulated sections still render — they show the
 * section's `contents` list, so the homeowner sees what belongs there.
 *
 * `templateEnvKey` is the env var holding the backend template_id for the
 * scenario's seeded vault(s).
 */
export interface Scenario {
  id: "new-construction" | "whole-home-reno" | "single-room" | "established-home";
  title: string;
  tagline: string;
  /** Sections the seed data fills. All five always exist on the vault. */
  populatedStreams: StreamCategoryCode[];
  /** Default grouping axis for the Maintenance & Upgrades section. */
  defaultGroupBy: GroupByAxis;
  /** Env var name whose value is the backend template_id for this scenario. */
  templateEnvKey: string;
  /** Representative facts, used for the scenario card and empty states. */
  sampleFacts: Partial<HomeFacts>;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "new-construction",
    title: "New Construction",
    tagline:
      "A custom home built from the ground up — every phase documented and signed off.",
    populatedStreams: [...ALL_STREAM_CODES],
    defaultGroupBy: "phase",
    templateEnvKey: "VITE_TEMPLATE_NEW_CONSTRUCTION",
    sampleFacts: {
      propertyType: "Single Family",
      beds: 4,
      baths: 3,
      sqft: 3200,
      yearBuilt: 2025,
    },
  },
  {
    id: "whole-home-reno",
    title: "Whole-Home Renovation",
    tagline:
      "A full renovation captured project by project — before, after, receipts and warranties.",
    populatedStreams: [
      "maintenance-upgrades",
      "systems-warranties",
      "property-records",
      "personal-vault",
    ],
    defaultGroupBy: "collection",
    templateEnvKey: "VITE_TEMPLATE_WHOLE_HOME_RENO",
    sampleFacts: {
      propertyType: "Single Family",
      beds: 3,
      baths: 2,
      sqft: 1850,
      yearBuilt: 1998,
    },
  },
  {
    id: "single-room",
    title: "Single-Room Project",
    tagline: "One room, done right — a kitchen remodel from teardown to reveal.",
    populatedStreams: ["maintenance-upgrades", "systems-warranties"],
    defaultGroupBy: "room",
    templateEnvKey: "VITE_TEMPLATE_SINGLE_ROOM",
    sampleFacts: {
      propertyType: "Condo",
      beds: 2,
      baths: 1,
      sqft: 1100,
      yearBuilt: 2006,
    },
  },
  {
    id: "established-home",
    title: "Established Home",
    tagline:
      "Years of upkeep in one place — service history, appliance inventory and a recent remodel.",
    populatedStreams: [
      "home-profile",
      "maintenance-upgrades",
      "systems-warranties",
      "personal-vault",
    ],
    defaultGroupBy: "timeline",
    templateEnvKey: "VITE_TEMPLATE_ESTABLISHED_HOME",
    sampleFacts: {
      propertyType: "Single Family",
      beds: 4,
      baths: 3,
      sqft: 2600,
      yearBuilt: 1974,
    },
  },
];

export const scenarioById = (id: string): Scenario | undefined =>
  SCENARIOS.find((s) => s.id === id);
