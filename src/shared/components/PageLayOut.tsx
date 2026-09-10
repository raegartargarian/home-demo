import React from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";

interface PageLayoutProps {
  children: React.ReactNode;
  /**
   * Let the page start at the very top of the viewport, under the floating
   * header, instead of below it. For pages that open on a full-bleed image: the
   * photograph running to the top edge with the island resting on it is the
   * point of a floating header, and a band of ground above it reads as a bar
   * that forgot to be one.
   */
  bleed?: boolean;
}

/**
 * The page renders whether or not anyone is signed in.
 *
 * It used to render nothing at all without `authData`, which is how a visitor
 * arriving at the demo met a blank warm rectangle — with the Web3Auth modal
 * over it, because `GlobalProvider` opened one on sight. The landing page is
 * the pitch and it is public; what is behind a sign-in is the vaults, and those
 * pages come up empty on their own without a token.
 */
const PageLayout = ({ children, bleed }: PageLayoutProps) => (
  <div className="flex flex-col min-h-screen bg-surface">
    <Header />
    {/* The header floats clear of the page rather than banding the top of it,
        so nothing below reserves its space — this does, unless the page asked
        to run underneath. */}
    {!bleed && <div aria-hidden className="h-[4.25rem] md:h-[5rem]" />}
    <main className="flex-1">{children}</main>
    <Footer />
    {/* The nav pill floats over the page on mobile; this is the clearance that
        stops it covering the end of the page. */}
    <div
      aria-hidden
      className="h-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] md:hidden"
    />
  </div>
);

export default PageLayout;
