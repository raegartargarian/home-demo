import { useWeb3Auth } from "@/containers/global/Web3AuthProvider";
import { wellFor } from "@/shared/components/PageContainer";
import { motion, useReducedMotion } from "framer-motion";
import { Home, Layers } from "lucide-react";
import React from "react";
import { Link, NavLink } from "react-router-dom";
import { appRoutes, BROWSE_ALL_HOMES } from "../constants/routes";
import { ProfileMenu } from "./ProfileMenu";

/**
 * A floating island, not a bar.
 *
 * The header used to be a full-bleed sticky strip with a separate nav pill
 * floating over the page beside it — two glass surfaces at two elevations, and
 * on desktop the pill landed on top of whatever the page opened with (on the
 * dashboard, the middle of the headline). It is now one detached, rounded
 * surface carrying identity, routes and the account control together, inset
 * from every edge so the warm ground shows around it on all four sides.
 *
 * The active indicator slides between routes via a shared `layoutId`, which is
 * what makes it feel physical rather than switched. The mobile bottom pill
 * carries its own id: both are in the DOM at once behind media queries, and two
 * live elements sharing one `layoutId` would animate against each other.
 *
 * The indicator is filled with the brand near-black, the same token the primary
 * button uses. A white pill on white glass was a shadow's worth of difference —
 * "which page am I on" is the one question a nav has to answer without being
 * studied — but the answer was the blueprint accent, which made the most
 * persistent coloured element in the app a second brand. The palette is
 * explicit that blue is retired as a decorative colour and that blueprint is a
 * support colour for rings, hairlines and tints; this was the only place it was
 * poured in solid. Near-black is louder, not quieter, and it inverts to
 * near-white in dark mode on its own.
 */

const NAV_ITEMS = [
  { to: appRoutes.dashboard.path, label: "Home", icon: Home, end: true },
  {
    to: appRoutes.vaults.path,
    label: "My Homes",
    icon: Layers,
    end: false,
    // Clicking the nav is asking for the list, so it is not shortcut past even
    // when there is only one home. See `BROWSE_ALL_HOMES`.
    state: BROWSE_ALL_HOMES,
  },
];

const NavItems: React.FC<{ layoutId: string }> = ({ layoutId }) => {
  const reduceMotion = useReducedMotion();

  return (
    <ul className="flex items-center gap-1">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end, state }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            state={state}
            // Before the route changes, not after.
            //
            // `ScrollToTop` resets the scroll in an effect once the navigation
            // has committed. By then the sliding indicator has already been
            // measured at the old scroll offset and is drawn at the new one,
            // so it launches down the page and flies back — measured at ~870px
            // of travel from a scroll position of 1200. Scrolling first costs
            // nothing (the later reset becomes a no-op) and keeps the slide,
            // because both measurements now happen at the same offset.
            onClick={() => window.scrollTo(0, 0)}
            className="block"
          >
            {({ isActive }) => (
              <span
                className={[
                  "relative flex items-center justify-center gap-2 rounded-full",
                  "px-4 py-2 transition-colors",
                  // No wrap: the bottom pill is `fixed` and so sizes to its
                  // own content, which let "My Homes" break onto two lines and
                  // took the pill oval with it.
                  "whitespace-nowrap",
                  isActive
                    ? "text-ink-inverse"
                    : "text-ink-muted hover:bg-surface-inset/60 hover:text-ink",
                ].join(" ")}
              >
                {isActive && (
                  <motion.span
                    layoutId={layoutId}
                    className="absolute inset-0 rounded-full bg-brand shadow-sm"
                    // Spring, not ease — it should feel physical. Reduced
                    // motion drops the slide entirely and cross-fades.
                    transition={
                      reduceMotion
                        ? { duration: 0.15 }
                        : { type: "spring", stiffness: 400, damping: 32 }
                    }
                  />
                )}
                <Icon className="relative h-[18px] w-[18px]" />
                <span
                  className={[
                    "relative text-sm",
                    isActive ? "font-semibold" : "font-medium",
                  ].join(" ")}
                >
                  {label}
                </span>
              </span>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );
};

export const Header = () => {
  const { isAuthenticated } = useWeb3Auth() || {};

  return (
    <>
      {/* The island sits in the page's own well — same measure and same gutter
          — so its ends land exactly where the content's do. Capped at the
          measure alone it was 16px wider on each side, and a size narrower than
          the page on top of that, which is what had the structure column
          starting to its left and the cards running out past its right. */}
      <div className="fixed inset-x-0 top-3 z-50 md:top-4">
        <div className={wellFor("wide")}>
          <div className="glass flex h-14 items-center gap-2 rounded-full pl-5 pr-2.5">
            <Link
              to={appRoutes.dashboard.path}
              className="flex-shrink-0 text-base font-medium tracking-tight text-ink transition-opacity hover:opacity-70"
            >
              Home Record
            </Link>

            {/* Routes ride in the island on desktop and in the thumb-reach pill
              below on mobile, where the island has room for identity only. */}
            <nav aria-label="Primary" className="ml-2 hidden md:block">
              <NavItems layoutId="nav-pill-island" />
            </nav>

            <div className="ml-auto flex-shrink-0">
              {isAuthenticated ? (
                <ProfileMenu />
              ) : (
                <span className="hidden pr-2 text-sm text-ink-subtle sm:inline">
                  Verified home records
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <nav
        aria-label="Primary"
        className={[
          "glass fixed z-50 rounded-full p-1.5 md:hidden",
          "bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)]",
          "left-1/2 -translate-x-1/2",
        ].join(" ")}
      >
        <NavItems layoutId="nav-pill-bottom" />
      </nav>
    </>
  );
};
