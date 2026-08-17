import { LoadingIndicator } from "../../shared/components/LoadingIndicator";
import { lazyLoad } from "../../shared/utils/loadable";

export const DashboardPage = lazyLoad(
  () => import("./index"),
  (module) => module.default,
  { fallback: <LoadingIndicator fullPageHeight /> }
);
