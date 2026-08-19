// here routes are defined
enum RouteNames {
  dashboard = "dashboard",
  vaults = "vaults",
  vaultDetail = "vaultDetail",
  streamDetail = "streamDetail",
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

/**
 * Router state that says "I meant to see the list."
 *
 * A homeowner with a single property is normally sent straight to it — a page
 * whose whole job is choosing between homes has nothing to choose. But the
 * shortcut must not swallow the list: someone who clicks "My Homes" or "All
 * homes" is asking for it, and bouncing them forward again would make the way
 * back unusable. Those two links carry this; every other arrival gets the
 * shortcut.
 */
export const BROWSE_ALL_HOMES = { browseAll: true } as const;

/** Build the URL for one vault's page. */
export const vaultDetailPath = (vaultId: string): string =>
  `/vaults/${vaultId}`;

/** Build the URL for a single stream's attachment page. */
export const streamDetailPath = (vaultId: string, assetCode: string): string =>
  `/vaults/${vaultId}/streams/${encodeURIComponent(assetCode)}`;
