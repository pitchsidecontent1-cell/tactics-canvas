// ---------------------------------------------------------------------------
// Everybody is taught the game before they are handed it.
//
// Arriving at the site starts the tutorial, once per visit. Not once ever —
// per visit: close the tab and come back tomorrow and you are taught it again,
// because this is a game whose controls nobody guesses. A reload part-way
// through a visit is not a new arrival, so it does not drag you back in.
//
// sessionStorage is what draws that line: it survives a refresh and dies with
// the tab. Storage can be blocked outright (private browsing), and a blocked
// read must not cost anyone the tutorial — so the fallback is to treat the
// page load as a fresh arrival and teach them.
// ---------------------------------------------------------------------------

const VISITED_KEY = 'tactics-canvas:visited';
const RETURN_KEY = 'tactics-canvas:tutorial-return';

/**
 * Whether this page load is the start of a new visit — read once, as this
 * module loads, and true for exactly one load. Reading it is what marks the
 * visit, so every component that asks gets the same answer.
 */
export const isNewVisit: boolean = (() => {
  try {
    if (window.sessionStorage.getItem(VISITED_KEY)) return false;
    window.sessionStorage.setItem(VISITED_KEY, '1');
    return true;
  } catch {
    return true;
  }
})();

/** Where they were headed when the tutorial cut in. */
export function rememberReturn(path: string) {
  try {
    window.sessionStorage.setItem(RETURN_KEY, path);
  } catch {
    // Then skipping lands on the board, which is where most people were going.
  }
}

/** Where skipping the tutorial should put them: back on their way. */
export function tutorialReturn(): string {
  try {
    const saved = window.sessionStorage.getItem(RETURN_KEY);
    // Only ever a path this app routed to, and never back into the tutorial.
    if (saved && saved.startsWith('/') && !saved.startsWith('//') && saved !== '/learn') {
      return saved;
    }
  } catch {
    // Fall through.
  }
  return '/';
}
