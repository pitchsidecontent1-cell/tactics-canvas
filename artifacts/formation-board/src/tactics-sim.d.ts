/* Types for `tactics-sim.jsx`.

   The simulator is a single self-contained JSX file of about six thousand
   lines, developed and measured outside this app by a headless harness that
   slices the simulation out of it. It is deliberately not TypeScript: the
   harness reads the same file, and converting it would fork the thing being
   measured from the thing being shipped.

   `allowJs` is off for this package, so without this declaration the import
   fails `pnpm typecheck` — which gates the deploy — even though Vite bundles
   the file happily. Declaring the module here keeps the typecheck honest
   about the boundary: everything inside the simulator is untyped, and the app
   only ever touches this one default export, which takes no props. */
declare const TacticsSim: () => import('react').ReactElement;
export default TacticsSim;
