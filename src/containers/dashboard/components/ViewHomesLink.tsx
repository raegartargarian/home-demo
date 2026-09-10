import { useWeb3Auth } from "@/containers/global/Web3AuthProvider";
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

/**
 * Two destinations, one control.
 *
 * Signed in, the homes are a page away and this is a link to them. Signed out
 * there are no homes to view yet, so the same control offers the way in — and
 * it is the only one the landing page has, since the page is now readable
 * without an account. Sending a signed-out visitor to the vaults list instead
 * would land them on an empty state that cannot explain itself.
 */
export const ViewHomesLink = ({ tone, className }: ViewHomesLinkProps) => {
  const { isAuthenticated, login } = useWeb3Auth() || {};

  const shape = cn(
    "group inline-flex items-center justify-center whitespace-nowrap",
    "rounded-full px-8 py-4 text-base font-medium transition-colors",
    TONE[tone],
    className,
  );

  /* The arrow leans the way the control goes, on hover. */
  const arrow = (
    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-1" />
  );

  if (!isAuthenticated) {
    return (
      <button type="button" onClick={() => login?.()} className={shape}>
        Get started
        {arrow}
      </button>
    );
  }

  return (
    <Link to={appRoutes.vaults.path} className={shape}>
      View your homes
      {arrow}
    </Link>
  );
};

export default ViewHomesLink;
