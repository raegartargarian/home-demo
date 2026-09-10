/**
 * Waiting, for the flows that create something on the chain.
 *
 * Creating a vault, a template or a stream all return as soon as the backend
 * has accepted the work, and the object then reaches its real status some
 * seconds later. Every one of those flows therefore polls, and they all need
 * the same one-line helper to do it — kept here so they cannot drift into two
 * ideas of what waiting means.
 *
 * How long to wait is *not* shared: anchoring a stream and creating a whole
 * vault are different amounts of patience, so each saga declares its own
 * bounds beside the loop that uses them.
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
