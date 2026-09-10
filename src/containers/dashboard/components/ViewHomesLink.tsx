import { cn } from "@/lib/utils";
import { appRoutes } from "@/shared/constants/routes";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * The landing page's one call to action, which it makes twice.
 *
 * It is not the shadcn `Button`: the page wants a larger target than any
 * `Button` size offers, and putting a marketing size into the shared primitive
 * would make it available to every screen in the app, which is the opposite of
 * what a size scale is for.
 *
 * What it does share is a recipe. The two call sites used to differ by 4px of
 * padding — `px-7 py-3.5` in the hero and `px-8 py-4` at the close — which is a
 * difference nobody chose and nobody could defend. One size now; the only thing
 * that varies is the ground it sits on.
 */
type Tone = "film" | "ground";

const TONE: Record<Tone, string> = {
  /** Over the hero film, where a near-black fill would sink into the scrim. */
  film: "bg-white text-ink hover:bg-white/90",
  /** On the warm ground, which is what the brand colour is for. */
  ground: "bg-brand text-ink-inverse hover:bg-brand-hover",
};

interface ViewHomesLinkProps {
  tone: Tone;
  className?: string;
}

export const ViewHomesLink = ({ tone, className }: ViewHomesLinkProps) => (
  <Link
    to={appRoutes.vaults.path}
    className={cn(
      "group inline-flex items-center justify-center whitespace-nowrap",
      "rounded-full px-8 py-4 text-base font-medium transition-colors",
      TONE[tone],
      className,
    )}
  >
    View your homes
    {/* The arrow leans the way the link goes, on hover. */}
    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-1" />
  </Link>
);

export default ViewHomesLink;
