// here routes are defined
enum RouteNames {
  dashboard = "dashboard",
  vaults = "vaults",
  vaultDetail = "vaultDetail",
  streamDetail = "streamDetail",
  projectDetail = "projectDetail",
  serviceRecord = "serviceRecord",
}

export const appRoutes: { [key in RouteNames]: IRouteStructure } = {
  [RouteNames.dashboard]: {
    path: "/",
  },
  [RouteNames.vaults]: {
    path: "/vaults",
  },
  [RouteNames.vaultDetail]: {
    path: "/vaults/:id",
    name: "/vaults/",
  },
  [RouteNames.streamDetail]: {
    path: "/vaults/:id/streams/:code",
  },
  [RouteNames.projectDetail]: {
    path: "/vaults/:id/projects/:project",
  },
  [RouteNames.serviceRecord]: {
    path: "/records/:attachmentId",
    name: "/records/",
  },
};
interface IRouteStructure {
  path: string;
  redirect?: string;
  query?: string;
  name?: string;
}

/** Build the URL for one vault's page. */
export const vaultDetailPath = (vaultId: string): string =>
  `/vaults/${vaultId}`;

/** Build the URL for one project — the records of a single job, drawn from
 *  every section it touches. The project name is the key, since it is what the
 *  record-naming convention carries. */
export const projectDetailPath = (vaultId: string, project: string): string =>
  `/vaults/${vaultId}/projects/${encodeURIComponent(project)}`;

/** Build the URL for a single stream's attachment page. */
export const streamDetailPath = (vaultId: string, assetCode: string): string =>
  `/vaults/${vaultId}/streams/${encodeURIComponent(assetCode)}`;
