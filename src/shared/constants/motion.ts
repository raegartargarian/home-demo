/**
 * One motion vocabulary, so the app cannot drift into several.
 *
 * The curve below is not new — it is the one already written inline in the
 * dialog, the provenance disclosure, the structure tree, the drop hint and the
 * landing page. Naming it here is the whole point: seven copies of the same
 * four numbers is one typo away from two curves that nearly match, which reads
 * worse than two that obviously differ.
 *
 * It is a strong ease-out. Entrances and exits get it because a UI element
 * should arrive fast and settle, never start slow — `ease-in` delays the exact
 * moment someone is watching.
 */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/**
 * Durations, in seconds, named for what they are rather than how long.
 *
 * All well under the 300ms an interface has before it starts to feel slow.
 * `swap` is deliberately at the edge of perception: the things it covers are
 * seen dozens of times in a session, and anything more than a hint there is a
 * tax on every one of them.
 */
export const DURATION = {
  /** Text replacing text in place. Barely there, and meant to be. */
  swap: 0.15,
  /** A panel or a row disclosing. */
  reveal: 0.2,
} as const;

/** What every animation here collapses to when motion is turned down. */
export const REDUCED = { duration: 0.15, ease: "easeOut" } as const;
