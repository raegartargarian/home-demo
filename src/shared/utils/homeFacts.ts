import { HomeFacts } from "@/shared/types/home";
import { VaultDto } from "@/shared/types/vault";

/**
 * Reads the standing facts sheet for a property off a vault.
 *
 * The platform DTO has no dedicated facts field, so the demo carries them as a
 * JSON object in `description` — either the facts themselves or nested under a
 * `home_facts` key. Anything else (a plain prose description, malformed JSON,
 * no description at all) yields null and the header degrades to the vault name.
 *
 * When the backend grows a real metadata field this is the one function to
 * repoint; nothing else parses the description.
 */
export const parseHomeFacts = (
  vault: Pick<VaultDto, "description">
): HomeFacts | null => {
  const raw = vault.description?.trim();
  if (!raw || !raw.startsWith("{")) return null;

  try {
    const parsed = JSON.parse(raw);
    const facts = parsed?.home_facts ?? parsed;
    // `address` is the one field the header cannot render without.
    return typeof facts?.address === "string" ? (facts as HomeFacts) : null;
  } catch {
    return null;
  }
};

/** "Austin, TX 78704" — omits whichever parts are missing. */
export const formatLocation = (facts: HomeFacts): string =>
  [facts.city, [facts.state, facts.zip].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

const numberFormat = new Intl.NumberFormat("en-US");

export interface HomeFactItem {
  label: string;
  value: string;
}

/**
 * The facts row, in the order housing sites have trained people to read it:
 * beds, baths, size, then provenance. Missing values are dropped rather than
 * rendered as "—", so a sparse record reads as short instead of broken.
 */
export const factItems = (facts: HomeFacts): HomeFactItem[] => {
  const items: HomeFactItem[] = [];

  if (facts.beds != null) {
    items.push({ label: facts.beds === 1 ? "bed" : "beds", value: `${facts.beds}` });
  }
  if (facts.baths != null) {
    items.push({
      label: facts.baths === 1 ? "bath" : "baths",
      value: `${facts.baths}`,
    });
  }
  if (facts.sqft != null) {
    items.push({ label: "sq ft", value: numberFormat.format(facts.sqft) });
  }
  if (facts.lotSqft != null) {
    items.push({ label: "sq ft lot", value: numberFormat.format(facts.lotSqft) });
  }
  if (facts.yearBuilt != null) {
    items.push({ label: "built", value: `${facts.yearBuilt}` });
  }
  if (facts.propertyType) {
    items.push({ label: "type", value: facts.propertyType });
  }

  return items;
};
