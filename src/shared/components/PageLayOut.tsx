import { GlobalSelectors } from "@/containers/global/selectors";
import React from "react";
import { useSelector } from "react-redux";
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

const PageLayout = ({ children, bleed }: PageLayoutProps) => {
  const authData = useSelector(GlobalSelectors.authData);

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {authData ? (
        <>
          <Header />
          {/* The header floats clear of the page rather than banding the top
              of it, so nothing below reserves its space — this does, unless the
              page asked to run underneath. */}
          {!bleed && <div aria-hidden className="h-[4.25rem] md:h-[5rem]" />}
          <main className="flex-1">{children}</main>
          <Footer />
          {/* The nav pill floats over the page on mobile; this is the clearance
              that stops it covering the end of the page. */}
          <div
            aria-hidden
            className="h-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] md:hidden"
          />
        </>
      ) : (
        <></>
      )}
    </div>
  );
};

export default PageLayout;
