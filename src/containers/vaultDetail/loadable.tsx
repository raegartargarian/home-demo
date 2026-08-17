import { LoadingIndicator } from "../../shared/components/LoadingIndicator";
import { lazyLoad } from "../../shared/utils/loadable";

export const VaultDetailPage = lazyLoad(
  () => import("./index"),
  (module) => module.default,
  { fallback: <LoadingIndicator fullPageHeight /> }
);
