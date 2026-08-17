import { useWeb3Auth } from "@/containers/global/Web3AuthProvider";
import { motion, useReducedMotion } from "framer-motion";
import { Home, LogOut, Layers } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { appRoutes } from "../constants/routes";

/**
 * Navigation is two pieces, deliberately:
 *
 *   1. A quiet top bar carrying identity and the account action. No border, no
 *      shadow — it sits *on* the warm ground rather than banding it.
 *   2. A floating glass pill carrying the routes. Bottom on mobile (thumb
 *      reach), top on desktop. The active indicator slides between items via a
 *      shared `layoutId`, which is what makes it feel physical rather than
 *      switched.
 */

const NAV_ITEMS = [
  { to: appRoutes.dashboard.path, label: "Home", icon: Home, end: true },
  { to: appRoutes.vaults.path, label: "My Homes", icon: Layers, end: false },
];

const GlassNav = () => {
  const reduceMotion = useReducedMotion();

  return (
    <nav
      aria-label="Primary"
      className={[
        "glass fixed z-50 rounded-full p-1.5",
        // Mobile: floating above the home indicator, centred.
        "bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] left-1/2 -translate-x-1/2",
        // Desktop: floating just under the top bar instead.
        "md:bottom-auto md:top-4",
      ].join(" ")}
    >
      <ul className="flex items-center gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} className="block">
              {({ isActive }) => (
                <span
                  className={[
                    "relative flex items-center justify-center gap-2 rounded-full",
                    "px-4 py-2 md:px-5 transition-colors",
                    isActive ? "text-ink" : "text-ink-muted hover:text-ink",
                  ].join(" ")}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-surface-raised shadow-sm"
                      // Spring, not ease — it should feel physical. Reduced
                      // motion drops the slide entirely and cross-fades.
                      transition={
                        reduceMotion
                          ? { duration: 0.15 }
                          : { type: "spring", stiffness: 400, damping: 32 }
                      }
                    />
                  )}
                  <Icon className="relative w-[18px] h-[18px]" />
                  <span className="relative text-sm font-medium">{label}</span>
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export const Header = () => {
  const { logout, isAuthenticated } = useWeb3Auth() || {};

  return (
    <>
      <header className="sticky top-0 z-40 h-16 bg-surface/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-full items-center justify-between px-4">
          <Link
            to={appRoutes.dashboard.path}
            className="flex-shrink-0 text-lg font-medium tracking-tight text-ink transition-opacity hover:opacity-70"
          >
            Home Record
          </Link>

          <div className="flex-shrink-0">
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-inset hover:text-ink"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Log out</span>
              </button>
            ) : (
              <span className="text-sm text-ink-subtle">
                Verified home records
              </span>
            )}
          </div>
        </div>
      </header>

      <GlassNav />
    </>
  );
};
