import { GroupByAxis } from "@/shared/types/home";
import { CalendarRange, Hammer, LayoutGrid, LucideIcon } from "lucide-react";
import { useSearchParams } from "react-router-dom";

/**
 * How the vault is being browsed. Not *where* records live — that is the fixed
 * five-section taxonomy, and it never changes with the lens.
 */
export type Lens = "sections" | "timeline" | "projects";

export const LENSES: Array<{
  id: Lens;
  label: string;
  icon: LucideIcon;
  hint: string;
}> = [
  {
    id: "sections",
    label: "Sections",
    icon: LayoutGrid,
    hint: "The five sections, as the vault stores them",
  },
  {
    id: "timeline",
    label: "Timeline",
    icon: CalendarRange,
    hint: "Everything that happened to this home, newest first",
  },
  {
    id: "projects",
    label: "Projects",
    icon: Hammer,
    hint: "One job, assembled from every section it touches",
  },
];

const isLens = (value: string | null): value is Lens =>
  LENSES.some((lens) => lens.id === value);

/** The scenario's declared grouping, mapped onto the lenses that exist today. */
const LENS_FOR_AXIS: Record<GroupByAxis, Lens> = {
  timeline: "timeline",
  collection: "projects",
  // Phase-led builds read as a chronology; rooms have no lens yet, so both fall
  // back to the section view rather than to something that misrepresents them.
  phase: "timeline",
  room: "sections",
};

/**
 * Reads the active lens from the URL so a view is linkable and survives a
 * refresh, falling back to whatever the vault's scenario declares.
 */
export const useLens = (defaultAxis?: GroupByAxis) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromUrl = searchParams.get("lens");

  const lens: Lens = isLens(fromUrl)
    ? fromUrl
    : defaultAxis
      ? LENS_FOR_AXIS[defaultAxis]
      : "sections";

  const setLens = (next: Lens) => {
    const params = new URLSearchParams(searchParams);
    params.set("lens", next);
    // replace: switching lens is a change of view, not a place to go back to.
    setSearchParams(params, { replace: true });
  };

  return [lens, setLens] as const;
};
