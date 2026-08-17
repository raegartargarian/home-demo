import { GlobalSelectors } from "@/containers/global/selectors";
import React from "react";
import { useSelector } from "react-redux";
import { Footer } from "./Footer";
import { Header } from "./Header";

const PageLayout = ({ children }: { children: React.ReactNode }) => {
  const authData = useSelector(GlobalSelectors.authData);

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {authData ? (
        <>
          <Header />
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
