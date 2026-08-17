import { useEffect } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { VaultDetailPage } from "./containers/vaultDetail/loadable";
import { StreamDetailPage } from "./containers/streamDetail/loadable";
import { VaultsPage } from "./containers/vaults/loadable";
import { DashboardPage } from "./containers/dashboard/loadable";
import { ServiceRecordPage } from "./containers/serviceRecord/loadable";
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
            <PageLayout>
              <VaultDetailPage />
            </PageLayout>
          }
        />

        <Route
          path={appRoutes.streamDetail.path}
          element={
            <PageLayout>
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
