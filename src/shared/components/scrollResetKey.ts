/**
 * What counts as "somewhere else" for the purpose of scrolling back to the top.
 *
 * Every route change used to reset the scroll, which is right for a move
 * between pages and wrong for a move *inside* one. The vault shell keeps its
 * photograph, its provenance bar and its structure column mounted while you
 * move between the vault and its five sections; yanking the page back to the
 * top of the hero on every row click would make the column useless as
 * navigation, because the thing you just clicked would leave the screen.
 *
 * So a vault and all its sections share one key. Moving to a different vault
 * still resets, because the house, the address and the subject all change.
 */
const VAULT_PATH = /^(\/vaults\/[^/]+)(\/.*)?$/;

export const scrollResetKey = (pathname: string): string =>
  VAULT_PATH.exec(pathname)?.[1] ?? pathname;
