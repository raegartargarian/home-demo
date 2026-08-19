import { useEffect } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { VaultDetailPage } from "./containers/vaultDetail/loadable";
import { StreamDetailPage } from "./containers/streamDetail/loadable";
import { VaultsPage } from "./containers/vaults/loadable";
import { DashboardPage } from "./containers/dashboard/loadable";
import { ServiceRecordPage } from "./containers/serviceRecord/loadable";
import UploadRecordModal from "./containers/upload/components/UploadRecordModal";
import UploadTray from "./containers/upload/components/UploadTray";
import AuthModal from "./shared/components/AuthModal";
import PageLayout from "./shared/components/PageLayOut";
import ScrollToTop from "./shared/components/ScrollToTop";
import { appRoutes } from "./shared/constants/routes";

function App() {
  useEffect(() => {
    document.documentElement.classList.add("bg-surface-sunken");
  }, []);
  return (
    <HashRouter>
      <AuthModal />

      {/* One upload modal for the whole app: the vault page and the stream
          page both open it, and both learn it finished the same way. */}
      <UploadRecordModal />

      {/* Where an upload goes once the form hands it over, so filing a record
          never pins the homeowner to one page. */}
      <UploadTray />

      <ScrollToTop />

      <Routes>
        {/* Routes with Header and Footer */}
        <Route
          path={appRoutes.dashboard.path}
          element={
            <PageLayout>
              <DashboardPage />
            </PageLayout>
          }
          index
        />
        <Route
          path={appRoutes.vaults.path}
          element={
            <PageLayout>
              <VaultsPage />
            </PageLayout>
          }
        />
        <Route
          path={appRoutes.vaultDetail.path}
          element={
            // Opens on the property photograph, which runs to the top edge with
            // the header floating on it.
            <PageLayout bleed>
              <VaultDetailPage />
            </PageLayout>
          }
        />

        <Route
          path={appRoutes.streamDetail.path}
          element={
            // Opens on the same photograph the vault does, so it bleeds too.
            <PageLayout bleed>
              <StreamDetailPage />
            </PageLayout>
          }
        />

        <Route
          path={appRoutes.serviceRecord.path}
          element={
            <PageLayout>
              <ServiceRecordPage />
            </PageLayout>
          }
        />

        {/* Route without Header and Footer (do not wrap in PageLayout) */}
      </Routes>
    </HashRouter>
  );
}

export default App;
