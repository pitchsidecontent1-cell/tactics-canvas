// Signature-tactic animations, keyed by era id, split into its own module so
// the data is fetched only when someone actually plays a clip. App.tsx imports
// it with a dynamic import() on click, which keeps it out of the initial
// bundle — it is by far the largest content blob in the app.
//
// Coordinates are pitch percentages (x: 0 left -> 100 right, y: 0 opponent
// goal -> 100 own goal). Each step glides the listed pieces to their new spots
// over `duration` seconds; pieces not listed stay put. Player ids are era
// slots: p1 GK, then back to front, left to right.

import type { Position } from './pitch-types';


export type AnimStep = {
  duration: number;
  note: string;
  players?: Record<string, Position>;
  ball?: Position;
  opponents?: Position[];
};

export type TacticAnimation = {
  intro: string;
  opponents: Position[];
  steps: AnimStep[];
};

export type EraAnimations = {
  attack: TacticAnimation[];
  defense: TacticAnimation[];
};

export const ERA_ANIMATIONS: Record<string, EraAnimations> = {
  'fergie-99': {
    attack: [
      {
        intro: 'Wing play: get it wide early and flood the box.',
        opponents: [{ x: 32, y: 16 }, { x: 46, y: 17 }, { x: 60, y: 17 }, { x: 74, y: 20 }, { x: 52, y: 42 }],
        steps: [
          { duration: 1.0, note: 'The ball is won in midfield and goes wide at once', ball: { x: 44, y: 50 }, players: { p7: { x: 44, y: 48 } } },
          { duration: 1.0, note: 'Out to the right winger — no backwards passes', ball: { x: 82, y: 40 }, players: { p9: { x: 84, y: 38 } } },
          { duration: 1.1, note: 'The full-back overlaps to make it two against one', players: { p5: { x: 90, y: 48 }, p9: { x: 86, y: 28 } }, ball: { x: 86, y: 30 } },
          { duration: 1.2, note: 'The strike pair splits: one near post, one far', players: { p10: { x: 42, y: 12 }, p11: { x: 58, y: 13 }, p6: { x: 24, y: 20 } }, opponents: [{ x: 35, y: 12 }, { x: 47, y: 13 }, { x: 60, y: 13 }, { x: 74, y: 16 }, { x: 52, y: 38 }] },
          { duration: 1.0, note: 'The cross comes early, whipped behind the line', ball: { x: 46, y: 8 } },
          { duration: 0.8, note: 'Attacked at the near post', ball: { x: 50, y: 3 }, players: { p10: { x: 47, y: 6 } } },
        ],
      },
      {
        intro: 'The other route: switch the play and run at them.',
        opponents: [{ x: 35, y: 20 }, { x: 48, y: 20 }, { x: 62, y: 20 }, { x: 30, y: 38 }, { x: 55, y: 40 }],
        steps: [
          { duration: 1.0, note: 'The deeper midfielder finds a pocket and looks long', ball: { x: 58, y: 50 }, players: { p8: { x: 58, y: 48 } } },
          { duration: 1.1, note: 'The switch to the opposite flank, flat and fast', ball: { x: 18, y: 35 }, players: { p6: { x: 16, y: 33 } } },
          { duration: 1.2, note: 'Taken on the run — the defenders backpedal', players: { p6: { x: 28, y: 20 } }, ball: { x: 29, y: 21 }, opponents: [{ x: 33, y: 16 }, { x: 46, y: 16 }, { x: 60, y: 18 }, { x: 34, y: 26 }, { x: 52, y: 34 }] },
          { duration: 1.2, note: 'One drop of the shoulder, then another', players: { p6: { x: 40, y: 12 } }, ball: { x: 41, y: 13 } },
          { duration: 0.9, note: 'A striker peels off for the square ball', players: { p11: { x: 55, y: 9 } }, ball: { x: 54, y: 8 } },
          { duration: 0.8, note: 'Rolled in at the far post', ball: { x: 51, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: two banks of four, and a midfield that hunts.',
        opponents: [{ x: 50, y: 30 }, { x: 35, y: 35 }, { x: 65, y: 35 }, { x: 45, y: 48 }, { x: 60, y: 50 }],
        steps: [
          { duration: 1.1, note: 'Two banks of four form in seconds', players: { p6: { x: 20, y: 58 }, p7: { x: 40, y: 56 }, p8: { x: 60, y: 56 }, p9: { x: 80, y: 58 }, p10: { x: 40, y: 35 }, p11: { x: 55, y: 35 } }, ball: { x: 50, y: 30 } },
          { duration: 1.0, note: 'The strikers screen the pass back inside', ball: { x: 35, y: 35 }, players: { p10: { x: 36, y: 30 } } },
          { duration: 1.0, note: 'Forced wide, where the winger has already dropped', players: { p6: { x: 26, y: 48 } }, ball: { x: 30, y: 42 } },
          { duration: 0.9, note: 'The tackle arrives — that is the shape working', players: { p7: { x: 32, y: 46 } }, ball: { x: 32, y: 45 } },
          { duration: 1.0, note: 'Won, and United break the other way at once', ball: { x: 48, y: 40 }, players: { p8: { x: 50, y: 42 } } },
          { duration: 1.2, note: 'But if a one-two beats that midfield line…', ball: { x: 45, y: 62 }, opponents: [{ x: 50, y: 40 }, { x: 38, y: 55 }, { x: 65, y: 45 }, { x: 46, y: 64 }, { x: 60, y: 60 }] },
          { duration: 1.0, note: '…the back four takes over: narrow, calm, no diving in', players: { p2: { x: 30, y: 76 }, p3: { x: 44, y: 74 }, p4: { x: 57, y: 74 }, p5: { x: 70, y: 76 } } },
          { duration: 1.0, note: 'One centre-back steps out; the others cover behind him', players: { p4: { x: 50, y: 68 } }, ball: { x: 49, y: 67 } },
          { duration: 0.9, note: 'The ball is taken cleanly, not the man', ball: { x: 48, y: 70 } },
          { duration: 1.0, note: 'Headed clear, and the shape rebuilds', ball: { x: 45, y: 52 } },
        ],
      },
    ],
  },
  'fergie-08': {
    attack: [
      {
        intro: 'The fluid front three: no positions, no reference points.',
        opponents: [{ x: 40, y: 20 }, { x: 55, y: 20 }, { x: 68, y: 22 }, { x: 50, y: 35 }, { x: 35, y: 40 }],
        steps: [
          { duration: 1.0, note: 'The ball is intercepted and played forward in one motion', ball: { x: 50, y: 45 }, players: { p7: { x: 48, y: 44 } } },
          { duration: 1.1, note: 'The right winger drifts inside — who picks him up?', players: { p11: { x: 60, y: 25 } }, ball: { x: 58, y: 28 } },
          { duration: 1.0, note: 'A forward pulls wide to drag the shape apart', players: { p9: { x: 18, y: 22 } }, opponents: [{ x: 40, y: 18 }, { x: 52, y: 22 }, { x: 64, y: 24 }, { x: 44, y: 32 }, { x: 30, y: 32 }] },
          { duration: 1.0, note: 'The third forward links the one-two in the crowd', players: { p10: { x: 48, y: 18 } }, ball: { x: 47, y: 19 } },
          { duration: 1.0, note: 'Returned first time — through the middle', ball: { x: 56, y: 10 }, players: { p11: { x: 55, y: 9 } } },
          { duration: 0.8, note: 'Struck low and early', ball: { x: 50, y: 3 } },
        ],
      },
      {
        intro: 'Or the counter: box to box before they can reset.',
        opponents: [{ x: 45, y: 60 }, { x: 60, y: 62 }, { x: 35, y: 55 }, { x: 52, y: 70 }, { x: 65, y: 72 }],
        steps: [
          { duration: 1.0, note: 'A corner is headed clear from the six-yard box', ball: { x: 45, y: 60 }, players: { p3: { x: 42, y: 72 } } },
          { duration: 1.0, note: 'The winger is already ten metres clear of everyone', players: { p11: { x: 65, y: 45 } }, ball: { x: 62, y: 48 } },
          { duration: 1.3, note: 'The sprint: halfway gone in a few strides', players: { p11: { x: 58, y: 22 }, p9: { x: 30, y: 28 }, p10: { x: 45, y: 30 } }, ball: { x: 59, y: 24 }, opponents: [{ x: 45, y: 40 }, { x: 58, y: 42 }, { x: 35, y: 38 }, { x: 52, y: 50 }, { x: 63, y: 52 }] },
          { duration: 1.0, note: 'A teammate keeps pace on the left as the option', players: { p9: { x: 25, y: 15 } } },
          { duration: 0.9, note: 'No pass needed — the keeper has come too far', ball: { x: 52, y: 6 } },
          { duration: 0.8, note: 'Dropped in under the bar', ball: { x: 50, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: curved pressing runs and a brave back line.',
        opponents: [{ x: 45, y: 25 }, { x: 60, y: 28 }, { x: 35, y: 40 }, { x: 55, y: 45 }, { x: 48, y: 60 }],
        steps: [
          { duration: 1.1, note: 'The front three curve their runs to force play wide', players: { p9: { x: 30, y: 28 }, p10: { x: 47, y: 22 }, p11: { x: 63, y: 28 } }, ball: { x: 45, y: 25 } },
          { duration: 1.0, note: 'The midfield jumps onto the outlet in the half-space', players: { p8: { x: 40, y: 38 } }, ball: { x: 35, y: 40 } },
          { duration: 0.9, note: 'Nowhere forward, nowhere sideways', ball: { x: 34, y: 42 } },
          { duration: 0.9, note: 'Turned over high — the press has done its job', ball: { x: 38, y: 40 }, players: { p8: { x: 38, y: 38 } } },
          { duration: 1.2, note: 'But if the spin beats that first presser…', ball: { x: 48, y: 58 }, opponents: [{ x: 45, y: 30 }, { x: 60, y: 35 }, { x: 40, y: 52 }, { x: 50, y: 60 }, { x: 55, y: 66 }] },
          { duration: 1.1, note: '…one centre-back attacks the ball, the other covers behind', players: { p3: { x: 44, y: 66 }, p4: { x: 56, y: 72 } } },
          { duration: 0.9, note: 'The pass is bent around the challenge', ball: { x: 55, y: 70 } },
          { duration: 1.0, note: 'The covering defender was there all along', players: { p4: { x: 55, y: 72 } }, ball: { x: 55, y: 71 } },
          { duration: 1.0, note: 'Cleared long, and United break from their own box', ball: { x: 58, y: 46 } },
        ],
      },
    ],
  },
  'fergie-13': {
    attack: [
      {
        intro: 'Patient control, then one decisive ball over the top.',
        opponents: [{ x: 38, y: 25 }, { x: 52, y: 25 }, { x: 66, y: 27 }, { x: 45, y: 42 }, { x: 60, y: 45 }],
        steps: [
          { duration: 1.0, note: 'The deep midfielder collects from the back four, unhurried', ball: { x: 45, y: 60 }, players: { p6: { x: 42, y: 58 } } },
          { duration: 1.1, note: 'The second striker drops between the lines', players: { p9: { x: 40, y: 38 } }, ball: { x: 41, y: 40 } },
          { duration: 1.0, note: 'The run starts the moment he lifts his head', players: { p11: { x: 62, y: 18 } }, opponents: [{ x: 38, y: 22 }, { x: 52, y: 22 }, { x: 64, y: 22 }, { x: 45, y: 38 }, { x: 58, y: 40 }] },
          { duration: 1.1, note: 'The pass travels forty yards, over everything', ball: { x: 60, y: 12 } },
          { duration: 0.9, note: 'Met on the volley — first time', ball: { x: 52, y: 4 }, players: { p11: { x: 56, y: 8 } } },
        ],
      },
      {
        intro: 'Or the old reliable: the winger to the byline.',
        opponents: [{ x: 36, y: 16 }, { x: 50, y: 16 }, { x: 63, y: 17 }, { x: 74, y: 25 }, { x: 48, y: 38 }],
        steps: [
          { duration: 1.0, note: 'Slipped into the right winger’s path', ball: { x: 70, y: 40 }, players: { p8: { x: 45, y: 40 }, p10: { x: 74, y: 36 } } },
          { duration: 1.2, note: 'He powers outside his man', players: { p10: { x: 84, y: 20 } }, ball: { x: 84, y: 22 }, opponents: [{ x: 36, y: 14 }, { x: 50, y: 14 }, { x: 63, y: 15 }, { x: 78, y: 22 }, { x: 48, y: 32 }] },
          { duration: 1.0, note: 'One forward holds the edge of the box for the pull-back', players: { p9: { x: 52, y: 20 } } },
          { duration: 1.0, note: 'The other darts across the near post', players: { p11: { x: 45, y: 8 } } },
          { duration: 0.9, note: 'Driven low across the six-yard line', ball: { x: 48, y: 6 } },
          { duration: 0.8, note: 'Turned in at full stretch', ball: { x: 50, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: a narrow screen, then experience behind it.',
        opponents: [{ x: 50, y: 28 }, { x: 36, y: 35 }, { x: 64, y: 35 }, { x: 45, y: 50 }, { x: 58, y: 52 }],
        steps: [
          { duration: 1.1, note: 'Two holding midfielders screen the back four', players: { p6: { x: 42, y: 60 }, p7: { x: 58, y: 60 } }, ball: { x: 50, y: 28 } },
          { duration: 1.0, note: 'The wide players tuck in; the shape narrows', players: { p8: { x: 30, y: 42 }, p10: { x: 70, y: 42 } }, ball: { x: 36, y: 35 } },
          { duration: 1.0, note: 'The only pass left is the one they want to see', ball: { x: 44, y: 48 } },
          { duration: 0.9, note: 'Read early and stepped in front of', players: { p6: { x: 45, y: 52 } }, ball: { x: 45, y: 51 } },
          { duration: 1.0, note: 'Won, and released forward immediately', ball: { x: 60, y: 30 }, players: { p11: { x: 62, y: 25 } } },
          { duration: 1.2, note: 'But if a disguised pass splits both screens…', ball: { x: 50, y: 62 }, opponents: [{ x: 50, y: 34 }, { x: 40, y: 48 }, { x: 64, y: 40 }, { x: 50, y: 64 }, { x: 58, y: 58 }] },
          { duration: 1.1, note: '…the senior centre-back steps up on pure timing', players: { p4: { x: 52, y: 68 } } },
          { duration: 0.9, note: 'Intercepted before the shot can be set', ball: { x: 51, y: 67 } },
          { duration: 1.0, note: 'His partner clears the loose ball with interest', players: { p3: { x: 44, y: 70 } }, ball: { x: 40, y: 52 } },
        ],
      },
    ],
  },
  'pep-barca': {
    attack: [
      {
        intro: 'Positional play: pass them out of shape, then strike.',
        opponents: [{ x: 43, y: 74 }, { x: 57, y: 74 }, { x: 50, y: 56 }, { x: 34, y: 48 }, { x: 66, y: 48 }],
        steps: [
          { duration: 1.0, note: 'It starts with the keeper — build from the very back', ball: { x: 47, y: 84 }, players: { p3: { x: 38, y: 76 } } },
          { duration: 1.0, note: 'Into the pivot, splitting the first press', ball: { x: 50, y: 56 }, players: { p7: { x: 50, y: 54 } }, opponents: [{ x: 44, y: 70 }, { x: 55, y: 68 }, { x: 48, y: 60 }, { x: 34, y: 48 }, { x: 66, y: 48 }] },
          { duration: 1.1, note: 'The false nine drops off the front line — who follows?', players: { p10: { x: 52, y: 34 } }, ball: { x: 52, y: 36 }, opponents: [{ x: 44, y: 70 }, { x: 55, y: 68 }, { x: 48, y: 44 }, { x: 38, y: 42 }, { x: 62, y: 44 }] },
          { duration: 1.0, note: 'A midfielder runs beyond, into the space he opened', players: { p8: { x: 64, y: 28 } }, ball: { x: 64, y: 30 } },
          { duration: 1.1, note: 'The through ball, timed to the last defender', ball: { x: 30, y: 10 }, players: { p9: { x: 31, y: 11 } } },
          { duration: 0.9, note: 'Cut back, and tapped in', ball: { x: 49, y: 4 }, players: { p11: { x: 55, y: 9 } } },
        ],
      },
      {
        intro: 'Or the short game: one-touch triangles until the box opens.',
        opponents: [{ x: 40, y: 22 }, { x: 53, y: 22 }, { x: 66, y: 24 }, { x: 46, y: 34 }, { x: 58, y: 36 }],
        steps: [
          { duration: 1.0, note: 'The midfield pair start the one-touch spell', ball: { x: 35, y: 35 }, players: { p6: { x: 33, y: 33 }, p8: { x: 48, y: 32 } } },
          { duration: 0.9, note: 'Triangle one: around the corner and back', ball: { x: 48, y: 30 } },
          { duration: 0.9, note: 'Triangle two: the forward joins and wall-passes', players: { p10: { x: 55, y: 26 } }, ball: { x: 55, y: 28 } },
          { duration: 1.0, note: 'The defenders chase shadows — a gap appears', ball: { x: 44, y: 22 }, players: { p6: { x: 43, y: 20 } }, opponents: [{ x: 38, y: 18 }, { x: 52, y: 24 }, { x: 64, y: 22 }, { x: 48, y: 30 }, { x: 58, y: 32 }] },
          { duration: 1.0, note: 'A disguised ball puts the forward through', ball: { x: 55, y: 12 }, players: { p10: { x: 56, y: 11 } } },
          { duration: 0.9, note: 'Dinked over the keeper, gently', ball: { x: 50, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: six seconds to win it back.',
        opponents: [{ x: 40, y: 35 }, { x: 52, y: 40 }, { x: 65, y: 45 }, { x: 50, y: 55 }, { x: 35, y: 60 }],
        steps: [
          { duration: 1.0, note: 'The ball is lost — the six-second clock starts', players: { p10: { x: 44, y: 32 }, p8: { x: 48, y: 38 }, p6: { x: 35, y: 42 } }, ball: { x: 40, y: 35 } },
          { duration: 1.0, note: 'Passing lanes are cut first, the ball second', players: { p9: { x: 30, y: 28 }, p7: { x: 50, y: 46 } } },
          { duration: 0.9, note: 'The carrier looks up and finds nowhere to go', ball: { x: 41, y: 37 } },
          { duration: 0.9, note: 'Won back inside six seconds — and the rondo restarts', ball: { x: 45, y: 38 }, players: { p8: { x: 46, y: 38 } } },
          { duration: 1.2, note: 'But if one long ball escapes the swarm…', ball: { x: 60, y: 62 }, opponents: [{ x: 40, y: 30 }, { x: 52, y: 36 }, { x: 62, y: 60 }, { x: 50, y: 50 }, { x: 38, y: 52 }] },
          { duration: 1.0, note: '…the high line has left acres behind it', players: { p2: { x: 30, y: 68 } } },
          { duration: 1.1, note: 'So the keeper leaves his box as the spare defender', players: { p1: { x: 55, y: 74 } } },
          { duration: 0.9, note: 'Swept away thirty metres from his own line', ball: { x: 68, y: 60 }, players: { p1: { x: 58, y: 72 } } },
          { duration: 1.0, note: 'The centre-back tidies up; possession restored', players: { p3: { x: 62, y: 62 } }, ball: { x: 60, y: 58 } },
        ],
      },
    ],
  },
  'pep-bayern': {
    attack: [
      {
        intro: 'The laboratory: full-backs in midfield, wingers isolated.',
        opponents: [{ x: 40, y: 30 }, { x: 55, y: 30 }, { x: 30, y: 45 }, { x: 50, y: 48 }, { x: 65, y: 50 }],
        steps: [
          { duration: 1.1, note: 'Both full-backs invert into midfield beside the pivot', players: { p2: { x: 35, y: 58 }, p5: { x: 65, y: 58 } }, ball: { x: 46, y: 72 } },
          { duration: 1.0, note: 'Circulated calmly — the middle now outnumbers the press', ball: { x: 50, y: 60 }, players: { p6: { x: 50, y: 58 } } },
          { duration: 1.0, note: 'The forward finds space no one is watching', players: { p9: { x: 58, y: 30 } }, ball: { x: 57, y: 32 } },
          { duration: 1.0, note: 'Out to the winger: high, wide, one against one', ball: { x: 80, y: 25 }, players: { p10: { x: 82, y: 24 } } },
          { duration: 1.1, note: 'The move everyone knows and nobody stops: cut inside', players: { p10: { x: 68, y: 12 } }, ball: { x: 69, y: 13 }, opponents: [{ x: 40, y: 24 }, { x: 55, y: 22 }, { x: 34, y: 34 }, { x: 52, y: 36 }, { x: 72, y: 20 }] },
          { duration: 0.9, note: 'Curled into the far corner', ball: { x: 42, y: 4 } },
        ],
      },
      {
        intro: 'Or overload one flank, then switch to the free man.',
        opponents: [{ x: 36, y: 20 }, { x: 50, y: 20 }, { x: 63, y: 22 }, { x: 30, y: 32 }, { x: 46, y: 36 }],
        steps: [
          { duration: 1.0, note: 'Winger and full-back double up on the left', players: { p7: { x: 20, y: 28 }, p2: { x: 26, y: 38 } }, ball: { x: 24, y: 34 } },
          { duration: 1.0, note: 'Three defenders are dragged into one corner', opponents: [{ x: 28, y: 24 }, { x: 38, y: 28 }, { x: 63, y: 22 }, { x: 26, y: 34 }, { x: 46, y: 36 }], ball: { x: 18, y: 26 } },
          { duration: 1.0, note: 'Recycled inside, away from the crowd', ball: { x: 48, y: 34 }, players: { p8: { x: 48, y: 32 } } },
          { duration: 1.1, note: 'The forward drifts to the far post, unmarked', players: { p9: { x: 66, y: 12 } } },
          { duration: 1.0, note: 'The dinked cross finds him arriving', ball: { x: 64, y: 10 } },
          { duration: 0.8, note: 'Finished from close range', ball: { x: 51, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: a line at halfway, and a keeper who sweeps.',
        opponents: [{ x: 50, y: 25 }, { x: 35, y: 30 }, { x: 65, y: 32 }, { x: 48, y: 45 }, { x: 60, y: 55 }],
        steps: [
          { duration: 1.1, note: 'The line pushes to halfway — enormous space behind it', players: { p2: { x: 25, y: 55 }, p3: { x: 40, y: 52 }, p4: { x: 60, y: 52 }, p5: { x: 75, y: 55 } }, ball: { x: 48, y: 45 } },
          { duration: 1.0, note: 'The counter-press arrives before the counter can', players: { p8: { x: 45, y: 40 }, p6: { x: 50, y: 48 } } },
          { duration: 0.9, note: 'Surrounded, and the ball squirts loose', ball: { x: 47, y: 43 } },
          { duration: 0.9, note: 'Recovered instantly — the risk paid off', ball: { x: 50, y: 46 }, players: { p6: { x: 50, y: 45 } } },
          { duration: 1.2, note: 'But if one ball is lofted over everything…', ball: { x: 55, y: 70 }, opponents: [{ x: 50, y: 30 }, { x: 35, y: 32 }, { x: 58, y: 66 }, { x: 48, y: 50 }, { x: 60, y: 58 }] },
          { duration: 1.1, note: '…the race is on, and the keeper is the one favourite to win it', players: { p1: { x: 52, y: 76 } } },
          { duration: 0.9, note: 'Won outside his own penalty area', players: { p1: { x: 54, y: 72 } }, ball: { x: 54, y: 71 } },
          { duration: 1.0, note: 'Headed to a centre-back like a sweeper of old', ball: { x: 42, y: 62 }, players: { p3: { x: 42, y: 60 } } },
          { duration: 0.9, note: 'The line steps forward again, unbothered', ball: { x: 48, y: 55 } },
        ],
      },
    ],
  },
  'pep-city': {
    attack: [
      {
        intro: 'Control, half-space eights, and the cutback.',
        opponents: [{ x: 36, y: 18 }, { x: 50, y: 18 }, { x: 64, y: 18 }, { x: 45, y: 32 }, { x: 58, y: 35 }],
        steps: [
          { duration: 1.0, note: 'Build calmly — the keeper is an outfielder here', ball: { x: 48, y: 86 } },
          { duration: 1.1, note: 'Both eights occupy the half-spaces', players: { p6: { x: 35, y: 30 }, p8: { x: 65, y: 30 } }, ball: { x: 42, y: 48 } },
          { duration: 1.0, note: 'One receives between the lines, facing forward', ball: { x: 64, y: 32 }, players: { p8: { x: 66, y: 28 } } },
          { duration: 1.0, note: 'The winger sprints for the byline', players: { p11: { x: 85, y: 10 } }, ball: { x: 80, y: 14 } },
          { duration: 1.0, note: 'The cutback — never the hopeful cross', ball: { x: 62, y: 6 }, players: { p10: { x: 58, y: 8 } }, opponents: [{ x: 38, y: 12 }, { x: 50, y: 10 }, { x: 62, y: 12 }, { x: 48, y: 22 }, { x: 60, y: 24 }] },
          { duration: 0.8, note: 'Side-footed home. A training-ground goal.', ball: { x: 50, y: 3 } },
        ],
      },
      {
        intro: 'Or the specialist ball: the whipped low diagonal.',
        opponents: [{ x: 36, y: 16 }, { x: 49, y: 16 }, { x: 62, y: 17 }, { x: 44, y: 30 }, { x: 58, y: 32 }],
        steps: [
          { duration: 1.0, note: 'The keeper clips it sixty metres to feet', ball: { x: 40, y: 45 }, players: { p6: { x: 38, y: 42 } } },
          { duration: 1.0, note: 'Slipped round the corner, first time', ball: { x: 58, y: 35 }, players: { p8: { x: 60, y: 32 } } },
          { duration: 1.0, note: 'The creator shapes up on the half-turn', players: { p8: { x: 66, y: 26 } }, ball: { x: 66, y: 27 } },
          { duration: 1.0, note: 'The forwards attack different posts', players: { p10: { x: 44, y: 10 }, p9: { x: 30, y: 12 } }, opponents: [{ x: 40, y: 11 }, { x: 50, y: 12 }, { x: 62, y: 14 }, { x: 46, y: 22 }, { x: 58, y: 26 }] },
          { duration: 0.9, note: 'The low whip across the six-yard box', ball: { x: 43, y: 7 } },
          { duration: 0.8, note: 'First to it at the near post', ball: { x: 50, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: rest defence, the swarm, then recovery pace.',
        opponents: [{ x: 45, y: 30 }, { x: 58, y: 35 }, { x: 35, y: 45 }, { x: 52, y: 52 }, { x: 65, y: 58 }],
        steps: [
          { duration: 1.1, note: 'Rest defence: three stay home while the attack plays', players: { p3: { x: 42, y: 66 }, p4: { x: 58, y: 66 }, p7: { x: 50, y: 56 } }, ball: { x: 45, y: 30 } },
          { duration: 1.0, note: 'Ball lost — the nearest five swarm at once', players: { p6: { x: 42, y: 32 }, p8: { x: 56, y: 33 }, p10: { x: 48, y: 25 } } },
          { duration: 0.9, note: 'The escape pass is read before it is played', players: { p7: { x: 48, y: 38 } }, ball: { x: 47, y: 36 } },
          { duration: 0.9, note: 'Stopped at source — City keep it again', ball: { x: 45, y: 42 } },
          { duration: 1.2, note: 'But if a runner does break clear of the swarm…', ball: { x: 30, y: 60 }, opponents: [{ x: 45, y: 34 }, { x: 58, y: 38 }, { x: 28, y: 58 }, { x: 52, y: 55 }, { x: 62, y: 60 }] },
          { duration: 1.1, note: '…the full-back eats the ground behind him', players: { p5: { x: 35, y: 62 } } },
          { duration: 1.0, note: 'Shepherded wide, away from goal', ball: { x: 20, y: 72 }, opponents: [{ x: 45, y: 36 }, { x: 58, y: 40 }, { x: 21, y: 70 }, { x: 52, y: 58 }, { x: 62, y: 62 }] },
          { duration: 0.9, note: 'And the keeper claims the cross like a centre-back', players: { p1: { x: 45, y: 82 } }, ball: { x: 45, y: 80 } },
          { duration: 1.0, note: 'The next attack starts from his throw', ball: { x: 55, y: 65 } },
        ],
      },
    ],
  },
  'mou-porto': {
    attack: [
      {
        intro: 'The diamond: compact, direct, and a free man between the lines.',
        opponents: [{ x: 45, y: 50 }, { x: 60, y: 52 }, { x: 35, y: 58 }, { x: 52, y: 62 }, { x: 68, y: 64 }],
        steps: [
          { duration: 1.0, note: 'The anchor screens and wins the second ball', ball: { x: 48, y: 58 }, players: { p6: { x: 48, y: 56 } } },
          { duration: 1.0, note: 'Straight to the number ten — the one free role', ball: { x: 50, y: 40 }, players: { p9: { x: 51, y: 38 } } },
          { duration: 1.1, note: 'The strike pair stretches the last line apart', players: { p10: { x: 28, y: 20 }, p11: { x: 72, y: 20 } }, opponents: [{ x: 42, y: 40 }, { x: 58, y: 42 }, { x: 33, y: 30 }, { x: 52, y: 32 }, { x: 68, y: 30 }] },
          { duration: 1.0, note: 'The diagonal slides between two defenders', ball: { x: 68, y: 22 } },
          { duration: 1.0, note: 'Cut inside and squared across the six-yard box', ball: { x: 55, y: 8 }, players: { p11: { x: 58, y: 10 } } },
          { duration: 0.8, note: 'The other striker arrives to finish', ball: { x: 50, y: 3 }, players: { p10: { x: 47, y: 6 } } },
        ],
      },
      {
        intro: 'Or the set piece — rehearsed until it is automatic.',
        opponents: [{ x: 40, y: 10 }, { x: 50, y: 10 }, { x: 60, y: 10 }, { x: 46, y: 16 }, { x: 56, y: 16 }],
        steps: [
          { duration: 1.0, note: 'A corner is won, and everyone knows their spot', players: { p9: { x: 96, y: 4 } }, ball: { x: 96, y: 4 } },
          { duration: 1.1, note: 'Both centre-backs arrive late from deep', players: { p3: { x: 55, y: 14 }, p4: { x: 45, y: 14 } } },
          { duration: 1.0, note: 'The near-post block frees the back-post runner', players: { p10: { x: 42, y: 9 }, p3: { x: 60, y: 9 } }, opponents: [{ x: 40, y: 8 }, { x: 50, y: 9 }, { x: 58, y: 12 }, { x: 44, y: 14 }, { x: 56, y: 15 }] },
          { duration: 1.0, note: 'Whipped in, curling away from the keeper', ball: { x: 58, y: 8 } },
          { duration: 0.9, note: 'Met at the back stick', ball: { x: 52, y: 4 }, players: { p3: { x: 58, y: 7 } } },
          { duration: 0.8, note: 'Headed down and in', ball: { x: 50, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: the diamond closes, then the box holds.',
        opponents: [{ x: 50, y: 35 }, { x: 35, y: 40 }, { x: 65, y: 42 }, { x: 45, y: 55 }, { x: 58, y: 58 }],
        steps: [
          { duration: 1.1, note: 'The diamond narrows; the middle is simply closed', players: { p7: { x: 38, y: 55 }, p8: { x: 62, y: 55 }, p9: { x: 50, y: 45 }, p6: { x: 50, y: 62 } }, ball: { x: 50, y: 35 } },
          { duration: 1.0, note: 'Forced around the block, never through it', ball: { x: 35, y: 40 } },
          { duration: 1.0, note: 'The shuttler doubles up on the touchline', players: { p7: { x: 28, y: 45 } }, ball: { x: 30, y: 46 } },
          { duration: 0.9, note: 'Won in the corner — exactly where they wanted it', ball: { x: 32, y: 48 }, players: { p6: { x: 34, y: 52 } } },
          { duration: 1.2, note: 'But if a quick exchange breaks that first wall…', ball: { x: 40, y: 62 }, opponents: [{ x: 50, y: 40 }, { x: 38, y: 58 }, { x: 65, y: 45 }, { x: 42, y: 66 }, { x: 58, y: 60 }] },
          { duration: 1.1, note: '…the centre-backs attack everything that comes in', players: { p4: { x: 45, y: 72 }, p3: { x: 56, y: 72 } } },
          { duration: 0.9, note: 'The cross is met first and headed clear', ball: { x: 50, y: 62 }, players: { p4: { x: 47, y: 70 } } },
          { duration: 0.9, note: 'The follow-up shot is bravely blocked', ball: { x: 48, y: 66 }, players: { p6: { x: 47, y: 65 } } },
          { duration: 1.0, note: 'Another attack survived. On to the counter.', ball: { x: 55, y: 55 } },
        ],
      },
    ],
  },
  'mou-chelsea': {
    attack: [
      {
        intro: 'Direct and ruthless: a target man, then pace in behind.',
        opponents: [{ x: 50, y: 55 }, { x: 35, y: 58 }, { x: 65, y: 58 }, { x: 45, y: 68 }, { x: 60, y: 68 }],
        steps: [
          { duration: 1.1, note: 'The holding midfielder plugs the middle and wins it', players: { p7: { x: 50, y: 60 } }, ball: { x: 50, y: 56 } },
          { duration: 1.0, note: 'Long and hard into the striker’s chest — the outlet', ball: { x: 50, y: 30 }, players: { p10: { x: 50, y: 28 } } },
          { duration: 1.1, note: 'He holds off two defenders on his own', opponents: [{ x: 45, y: 32 }, { x: 55, y: 33 }, { x: 65, y: 50 }, { x: 45, y: 62 }, { x: 60, y: 62 }] },
          { duration: 1.0, note: 'Laid off to the winger at full sprint', ball: { x: 70, y: 28 }, players: { p11: { x: 72, y: 26 } } },
          { duration: 1.1, note: 'Sixty metres covered in a handful of seconds', players: { p11: { x: 60, y: 10 } }, ball: { x: 61, y: 11 } },
          { duration: 0.8, note: 'Slotted low into the corner', ball: { x: 51, y: 4 } },
        ],
      },
      {
        intro: 'Or width and patience, with a midfielder arriving late.',
        opponents: [{ x: 38, y: 16 }, { x: 51, y: 16 }, { x: 64, y: 18 }, { x: 44, y: 30 }, { x: 58, y: 32 }],
        steps: [
          { duration: 1.0, note: 'Rotated side to side, probing for the opening', ball: { x: 60, y: 40 }, players: { p8: { x: 62, y: 38 } } },
          { duration: 1.1, note: 'Switched to the left winger, isolated one-v-one', ball: { x: 22, y: 28 }, players: { p9: { x: 20, y: 26 } } },
          { duration: 1.0, note: 'He skips past the first challenge', players: { p9: { x: 26, y: 14 } }, ball: { x: 27, y: 15 }, opponents: [{ x: 32, y: 14 }, { x: 48, y: 14 }, { x: 62, y: 16 }, { x: 42, y: 26 }, { x: 56, y: 30 }] },
          { duration: 1.0, note: 'The striker drags both centre-backs to the near post', players: { p10: { x: 42, y: 10 } } },
          { duration: 1.0, note: 'The pull-back finds the midfielder, late as ever', players: { p6: { x: 47, y: 18 } }, ball: { x: 46, y: 17 } },
          { duration: 0.8, note: 'Swept in from the edge of the box', ball: { x: 50, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: the meanest block in the league.',
        opponents: [{ x: 50, y: 40 }, { x: 35, y: 45 }, { x: 65, y: 45 }, { x: 45, y: 58 }, { x: 58, y: 60 }],
        steps: [
          { duration: 1.1, note: 'The block sets: compact, disciplined, patient', players: { p6: { x: 35, y: 55 }, p7: { x: 50, y: 52 }, p8: { x: 65, y: 55 }, p9: { x: 28, y: 48 }, p11: { x: 72, y: 48 } }, ball: { x: 50, y: 40 } },
          { duration: 1.0, note: 'The holder patrols the zone in front of the centre-backs', players: { p7: { x: 50, y: 58 } }, ball: { x: 65, y: 45 } },
          { duration: 0.9, note: 'The pass inside is cut out without a tackle', players: { p7: { x: 56, y: 52 } }, ball: { x: 56, y: 50 } },
          { duration: 0.9, note: 'Won, and worked calmly out to the left', ball: { x: 35, y: 55 } },
          { duration: 1.2, note: 'But if they do work it past the midfield…', ball: { x: 60, y: 64 }, opponents: [{ x: 50, y: 44 }, { x: 35, y: 48 }, { x: 62, y: 62 }, { x: 48, y: 62 }, { x: 58, y: 66 }] },
          { duration: 1.1, note: '…the full-back closes the angle, the centre-back covers inside', players: { p5: { x: 66, y: 70 }, p4: { x: 52, y: 70 } } },
          { duration: 0.9, note: 'The shot is fired from a narrowing angle', ball: { x: 58, y: 74 } },
          { duration: 0.9, note: 'The captain throws himself in front of it', players: { p3: { x: 55, y: 73 } }, ball: { x: 55, y: 72 } },
          { duration: 1.0, note: 'Blocked and cleared. Reset. Again.', ball: { x: 45, y: 55 } },
        ],
      },
    ],
  },
  'mou-inter': {
    attack: [
      {
        intro: 'Absorb, then release: two runners and one killer pass.',
        opponents: [{ x: 50, y: 58 }, { x: 34, y: 62 }, { x: 66, y: 62 }, { x: 42, y: 72 }, { x: 58, y: 72 }, { x: 28, y: 55 }],
        steps: [
          { duration: 1.2, note: 'The block sets: two tight lines, no space between', players: { p8: { x: 30, y: 58 }, p9: { x: 50, y: 55 }, p10: { x: 70, y: 58 }, p11: { x: 50, y: 42 }, p6: { x: 38, y: 68 }, p7: { x: 62, y: 68 } }, ball: { x: 50, y: 58 } },
          { duration: 1.0, note: 'Shown sideways — nothing through the middle', ball: { x: 34, y: 62 }, players: { p9: { x: 44, y: 57 }, p6: { x: 33, y: 70 } } },
          { duration: 0.9, note: 'Intercepted — the trap snaps shut', ball: { x: 36, y: 66 } },
          { duration: 0.9, note: 'First pass to the ten, the only free role', ball: { x: 50, y: 46 }, players: { p9: { x: 52, y: 44 } } },
          { duration: 1.2, note: 'Both strikers are already sprinting', players: { p10: { x: 74, y: 22 }, p11: { x: 50, y: 18 } }, ball: { x: 68, y: 28 }, opponents: [{ x: 50, y: 42 }, { x: 34, y: 46 }, { x: 66, y: 45 }, { x: 42, y: 32 }, { x: 58, y: 34 }, { x: 28, y: 40 }] },
          { duration: 1.0, note: 'Finished cold', ball: { x: 51, y: 4 }, players: { p11: { x: 49, y: 8 } } },
        ],
      },
      {
        intro: 'Or down the right: the wing-back arrives like a train.',
        opponents: [{ x: 38, y: 18 }, { x: 51, y: 18 }, { x: 64, y: 20 }, { x: 44, y: 32 }, { x: 30, y: 35 }],
        steps: [
          { duration: 1.0, note: 'The ten draws three shirts towards the ball', ball: { x: 45, y: 35 }, players: { p9: { x: 44, y: 33 } }, opponents: [{ x: 40, y: 28 }, { x: 48, y: 30 }, { x: 64, y: 20 }, { x: 44, y: 36 }, { x: 30, y: 35 }] },
          { duration: 1.0, note: 'A striker pulls wide right, selfless as ever', players: { p10: { x: 82, y: 28 } }, ball: { x: 80, y: 30 } },
          { duration: 1.2, note: 'And the full-back overlaps at full steam', players: { p5: { x: 88, y: 18 } } },
          { duration: 1.0, note: 'Fed into the gallop — no one is catching him', ball: { x: 87, y: 16 } },
          { duration: 1.0, note: 'One holds the near post, one the far', players: { p11: { x: 44, y: 8 }, p8: { x: 60, y: 12 } } },
          { duration: 0.9, note: 'Drilled across and turned in', ball: { x: 47, y: 4 }, players: { p11: { x: 46, y: 6 } } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: everyone behind the ball, every zone filled.',
        opponents: [{ x: 50, y: 45 }, { x: 35, y: 50 }, { x: 65, y: 50 }, { x: 42, y: 62 }, { x: 58, y: 62 }, { x: 50, y: 70 }],
        steps: [
          { duration: 1.2, note: 'Ten men behind the ball — every zone accounted for', players: { p8: { x: 30, y: 62 }, p9: { x: 50, y: 60 }, p10: { x: 70, y: 62 }, p11: { x: 50, y: 50 }, p6: { x: 40, y: 70 }, p7: { x: 60, y: 70 } }, ball: { x: 50, y: 45 } },
          { duration: 1.0, note: 'They pass across the front of it, looking for a seam', ball: { x: 35, y: 50 } },
          { duration: 0.9, note: 'There isn’t one — the pass is intercepted', players: { p8: { x: 36, y: 56 } }, ball: { x: 36, y: 54 } },
          { duration: 0.9, note: 'Cleared to safety, and the block reforms', ball: { x: 45, y: 40 } },
          { duration: 1.2, note: 'But if a through ball does reach the box…', ball: { x: 45, y: 68 }, opponents: [{ x: 50, y: 50 }, { x: 38, y: 60 }, { x: 65, y: 55 }, { x: 44, y: 70 }, { x: 58, y: 66 }, { x: 50, y: 74 }] },
          { duration: 1.1, note: '…the centre-back reads it and commits to the tackle', players: { p4: { x: 48, y: 74 } } },
          { duration: 0.9, note: 'Timed to the centimetre — ball first, always', ball: { x: 49, y: 73 } },
          { duration: 0.9, note: 'It breaks loose and the second defender hacks it away', players: { p3: { x: 44, y: 76 } }, ball: { x: 38, y: 66 } },
          { duration: 1.0, note: 'The lead survives another wave', ball: { x: 40, y: 58 } },
        ],
      },
    ],
  },
  'carlo-milan': {
    attack: [
      {
        intro: 'Freedom for the artists: the deep playmaker paints.',
        opponents: [{ x: 40, y: 48 }, { x: 60, y: 48 }, { x: 50, y: 36 }, { x: 35, y: 22 }, { x: 65, y: 22 }],
        steps: [
          { duration: 1.0, note: 'The playmaker drops in front of the defence', players: { p7: { x: 50, y: 66 } }, ball: { x: 44, y: 72 } },
          { duration: 1.1, note: 'One look up, then the sixty-metre diagonal', ball: { x: 74, y: 30 }, players: { p10: { x: 74, y: 28 } } },
          { duration: 1.0, note: 'Taken on the half-turn between the lines', players: { p9: { x: 44, y: 24 } }, ball: { x: 70, y: 24 } },
          { duration: 1.0, note: 'Slipped inside to the runner', ball: { x: 46, y: 20 } },
          { duration: 1.1, note: 'He drives at the backpedalling line', players: { p9: { x: 52, y: 10 } }, ball: { x: 52, y: 11 }, opponents: [{ x: 40, y: 36 }, { x: 60, y: 36 }, { x: 50, y: 26 }, { x: 38, y: 14 }, { x: 62, y: 14 }] },
          { duration: 0.9, note: 'The striker was moving before anyone else', players: { p11: { x: 44, y: 6 } }, ball: { x: 45, y: 5 } },
        ],
      },
      {
        intro: 'Or one man in full flight — the counter nobody stops.',
        opponents: [{ x: 45, y: 55 }, { x: 58, y: 58 }, { x: 40, y: 40 }, { x: 55, y: 35 }, { x: 48, y: 22 }],
        steps: [
          { duration: 1.0, note: 'The ball is ripped away in their own half', ball: { x: 40, y: 62 }, players: { p6: { x: 40, y: 60 } } },
          { duration: 1.0, note: 'Given to the attacking midfielder, forty metres out', ball: { x: 48, y: 48 }, players: { p9: { x: 49, y: 46 } } },
          { duration: 1.2, note: 'The first touch beats the first man', players: { p9: { x: 52, y: 34 } }, ball: { x: 53, y: 35 }, opponents: [{ x: 45, y: 42 }, { x: 58, y: 48 }, { x: 46, y: 36 }, { x: 55, y: 30 }, { x: 48, y: 20 }] },
          { duration: 1.2, note: 'Pure speed does the rest — two more left behind', players: { p9: { x: 50, y: 18 } }, ball: { x: 51, y: 19 } },
          { duration: 1.0, note: 'The keeper commits; he waits', ball: { x: 50, y: 10 } },
          { duration: 0.8, note: 'Rolled past him into the empty net', ball: { x: 52, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: one hunts, and the great defenders clean up.',
        opponents: [{ x: 48, y: 30 }, { x: 35, y: 38 }, { x: 62, y: 38 }, { x: 50, y: 50 }, { x: 40, y: 58 }],
        steps: [
          { duration: 1.0, note: 'The ball-winner hunts it down in midfield', players: { p6: { x: 35, y: 42 } }, ball: { x: 48, y: 30 } },
          { duration: 1.0, note: 'The playmaker screens behind him — reading, never chasing', players: { p7: { x: 50, y: 58 } }, ball: { x: 35, y: 38 } },
          { duration: 0.9, note: 'Crowded out, and the ball comes loose', ball: { x: 37, y: 44 } },
          { duration: 0.9, note: 'Collected, and the artists have it back', ball: { x: 45, y: 52 }, players: { p7: { x: 46, y: 54 } } },
          { duration: 1.2, note: 'But if a flick releases their runner past midfield…', ball: { x: 45, y: 60 }, opponents: [{ x: 48, y: 34 }, { x: 38, y: 44 }, { x: 62, y: 42 }, { x: 46, y: 62 }, { x: 42, y: 60 }] },
          { duration: 1.1, note: '…the centre-back glides across — never a lunge', players: { p4: { x: 48, y: 68 } } },
          { duration: 0.9, note: 'The tackle, timed to perfection', ball: { x: 47, y: 67 }, players: { p4: { x: 46, y: 66 } } },
          { duration: 1.0, note: 'His partner sweeps the loose ball away', players: { p3: { x: 42, y: 70 } }, ball: { x: 38, y: 62 } },
          { duration: 1.0, note: 'Out from the back, calm as ever', ball: { x: 48, y: 60 }, players: { p7: { x: 48, y: 58 } } },
        ],
      },
    ],
  },
  'carlo-chelsea': {
    attack: [
      {
        intro: 'Veterans off the leash, with a target man leading the charge.',
        opponents: [{ x: 38, y: 20 }, { x: 52, y: 20 }, { x: 66, y: 22 }, { x: 45, y: 35 }, { x: 60, y: 38 }],
        steps: [
          { duration: 1.0, note: 'Won in midfield, and they pour forward in numbers', ball: { x: 60, y: 50 }, players: { p8: { x: 62, y: 48 } } },
          { duration: 1.1, note: 'The left winger takes the touchline route at pace', ball: { x: 22, y: 30 }, players: { p9: { x: 20, y: 28 } } },
          { duration: 1.0, note: 'The striker drags both centre-backs to the near post', players: { p10: { x: 42, y: 12 } }, opponents: [{ x: 40, y: 14 }, { x: 50, y: 13 }, { x: 64, y: 18 }, { x: 45, y: 28 }, { x: 58, y: 30 }] },
          { duration: 1.0, note: 'The cross comes early and hard', ball: { x: 45, y: 10 } },
          { duration: 1.0, note: 'The midfielder arrives late — his trademark', players: { p6: { x: 50, y: 14 } }, ball: { x: 51, y: 12 } },
          { duration: 0.8, note: 'Swept in from twelve yards', ball: { x: 50, y: 4 }, players: { p6: { x: 49, y: 9 } } },
        ],
      },
      {
        intro: 'Or no build-up at all: a strike from thirty yards.',
        opponents: [{ x: 40, y: 22 }, { x: 53, y: 22 }, { x: 65, y: 24 }, { x: 46, y: 35 }, { x: 58, y: 38 }],
        steps: [
          { duration: 1.0, note: 'The second forward drops in and links with one touch', ball: { x: 55, y: 32 }, players: { p11: { x: 56, y: 30 } } },
          { duration: 1.0, note: 'The give-and-go around the corner', ball: { x: 48, y: 26 }, players: { p10: { x: 49, y: 25 } } },
          { duration: 1.0, note: 'The striker squares up, thirty yards out', players: { p10: { x: 50, y: 22 } }, ball: { x: 50, y: 23 }, opponents: [{ x: 42, y: 18 }, { x: 53, y: 18 }, { x: 64, y: 20 }, { x: 47, y: 28 }, { x: 57, y: 32 }] },
          { duration: 0.9, note: 'Nobody closes him down. Big mistake.', players: { p6: { x: 38, y: 24 } } },
          { duration: 0.9, note: 'Launched — swerving, dipping, violent', ball: { x: 48, y: 8 } },
          { duration: 0.8, note: 'Top corner. The keeper never moved.', ball: { x: 46, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: old heads, two lines, zero panic.',
        opponents: [{ x: 50, y: 32 }, { x: 36, y: 40 }, { x: 64, y: 40 }, { x: 45, y: 52 }, { x: 58, y: 55 }],
        steps: [
          { duration: 1.1, note: 'Experienced heads drop into two calm lines', players: { p6: { x: 35, y: 52 }, p8: { x: 65, y: 52 }, p9: { x: 25, y: 48 }, p11: { x: 75, y: 48 }, p7: { x: 50, y: 58 } }, ball: { x: 50, y: 32 } },
          { duration: 1.0, note: 'The holder breaks up what the runners leave behind', players: { p7: { x: 45, y: 50 } }, ball: { x: 45, y: 52 } },
          { duration: 0.9, note: 'A shoulder, a foot in — and the ball is theirs', ball: { x: 44, y: 54 } },
          { duration: 0.9, note: 'Fed forward to the striker holding it up alone', ball: { x: 52, y: 36 }, players: { p10: { x: 52, y: 34 } } },
          { duration: 1.2, note: 'But if a clipped ball finds a runner past midfield…', ball: { x: 60, y: 64 }, opponents: [{ x: 50, y: 36 }, { x: 40, y: 45 }, { x: 62, y: 62 }, { x: 46, y: 56 }, { x: 58, y: 60 }] },
          { duration: 1.1, note: '…the full-back squeezes him toward the corner flag', players: { p5: { x: 68, y: 70 } } },
          { duration: 0.9, note: 'The cross comes in and both centre-backs rise', ball: { x: 50, y: 76 }, players: { p3: { x: 46, y: 75 }, p4: { x: 55, y: 75 } } },
          { duration: 0.9, note: 'Headed clear with interest', ball: { x: 52, y: 55 } },
          { duration: 1.0, note: 'And the striker holds it up so everyone can climb', players: { p10: { x: 52, y: 35 } }, ball: { x: 52, y: 38 } },
        ],
      },
    ],
  },
  'carlo-decima': {
    attack: [
      {
        intro: 'Counter-attacking at terrifying speed.',
        opponents: [{ x: 42, y: 38 }, { x: 58, y: 40 }, { x: 30, y: 50 }, { x: 52, y: 55 }, { x: 68, y: 58 }],
        steps: [
          { duration: 1.0, note: 'Won deep — and the carrier is already running', ball: { x: 40, y: 60 }, players: { p6: { x: 38, y: 58 } } },
          { duration: 1.2, note: 'Fifty metres with the ball glued to his foot', players: { p6: { x: 35, y: 38 } }, ball: { x: 34, y: 38 } },
          { duration: 1.0, note: 'The right winger flies down the flank', players: { p11: { x: 80, y: 20 } }, opponents: [{ x: 42, y: 30 }, { x: 58, y: 32 }, { x: 34, y: 40 }, { x: 52, y: 44 }, { x: 66, y: 46 }] },
          { duration: 1.0, note: 'Two more attackers flood the box', players: { p9: { x: 40, y: 12 }, p10: { x: 55, y: 12 } } },
          { duration: 1.0, note: 'Released into his stride', ball: { x: 76, y: 16 } },
          { duration: 0.9, note: 'Cut across goal, and someone arrives', ball: { x: 48, y: 5 }, players: { p9: { x: 46, y: 8 } } },
        ],
      },
      {
        intro: 'Or late in the game: everyone forward for the corner.',
        opponents: [{ x: 40, y: 9 }, { x: 50, y: 9 }, { x: 60, y: 9 }, { x: 45, y: 15 }, { x: 56, y: 15 }],
        steps: [
          { duration: 1.0, note: 'A corner, deep into stoppage time', players: { p8: { x: 96, y: 4 } }, ball: { x: 96, y: 4 } },
          { duration: 1.1, note: 'Both centre-backs march into the box', players: { p3: { x: 48, y: 16 }, p4: { x: 58, y: 16 } } },
          { duration: 1.0, note: 'A forward blocks the keeper’s path out', players: { p10: { x: 44, y: 8 } } },
          { duration: 1.0, note: 'The outswinger, flighted perfectly', ball: { x: 52, y: 10 } },
          { duration: 0.9, note: 'The captain hangs in the air', players: { p3: { x: 52, y: 8 } }, ball: { x: 52, y: 8 } },
          { duration: 0.8, note: 'The header goes in', ball: { x: 49, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: a patient block hiding a loaded spring.',
        opponents: [{ x: 50, y: 30 }, { x: 35, y: 38 }, { x: 65, y: 38 }, { x: 48, y: 50 }, { x: 60, y: 55 }],
        steps: [
          { duration: 1.1, note: 'The block sets mid-pitch; the stars save their legs', players: { p6: { x: 30, y: 48 }, p8: { x: 70, y: 48 }, p7: { x: 50, y: 52 }, p9: { x: 25, y: 25 } }, ball: { x: 50, y: 30 } },
          { duration: 1.0, note: 'The deep midfielder organises every metre of it', players: { p7: { x: 50, y: 55 } }, ball: { x: 35, y: 38 } },
          { duration: 0.9, note: 'The pass inside is stepped on and won', players: { p7: { x: 42, y: 48 } }, ball: { x: 41, y: 46 } },
          { duration: 1.0, note: 'And the spring releases instantly', ball: { x: 60, y: 32 }, players: { p11: { x: 65, y: 26 } } },
          { duration: 1.2, note: 'But if a slick combination carries them past midfield…', ball: { x: 42, y: 62 }, opponents: [{ x: 50, y: 34 }, { x: 40, y: 56 }, { x: 65, y: 42 }, { x: 44, y: 64 }, { x: 58, y: 58 }] },
          { duration: 1.1, note: '…the captain steps out to meet it, fearless as ever', players: { p3: { x: 44, y: 66 } } },
          { duration: 0.9, note: 'He wins the ball and the collision', ball: { x: 44, y: 65 } },
          { duration: 1.0, note: 'His partner mops up behind him', players: { p4: { x: 52, y: 70 } }, ball: { x: 50, y: 68 } },
          { duration: 1.0, note: 'And it is fired forward for the counter again', ball: { x: 35, y: 45 }, players: { p6: { x: 32, y: 42 } } },
        ],
      },
    ],
  },
  'cruyff-barca': {
    attack: [
      {
        intro: 'Total Football: the spare man steps out and everyone rotates.',
        opponents: [{ x: 45, y: 62 }, { x: 60, y: 56 }, { x: 32, y: 46 }, { x: 55, y: 36 }, { x: 47, y: 20 }],
        steps: [
          { duration: 1.0, note: 'The spare centre-back steps into midfield with it', players: { p3: { x: 50, y: 62 } }, ball: { x: 50, y: 64 } },
          { duration: 1.0, note: 'A triangle appears — there is always an angle', players: { p6: { x: 41, y: 52 } }, ball: { x: 41, y: 53 } },
          { duration: 1.1, note: 'Width is sacred: the winger hugs the chalk', ball: { x: 20, y: 30 }, players: { p9: { x: 19, y: 28 } } },
          { duration: 1.0, note: 'Rotation: the striker drops, the full-back overlaps', players: { p10: { x: 38, y: 28 }, p5: { x: 11, y: 30 } }, opponents: [{ x: 45, y: 50 }, { x: 55, y: 44 }, { x: 30, y: 36 }, { x: 50, y: 28 }, { x: 44, y: 16 }] },
          { duration: 1.0, note: 'One-two around the corner', ball: { x: 38, y: 26 } },
          { duration: 1.0, note: 'The striker spins and finishes', ball: { x: 48, y: 4 }, players: { p10: { x: 46, y: 9 } } },
        ],
      },
      {
        intro: 'Or a dead ball on the edge — everyone knows whose it is.',
        opponents: [{ x: 42, y: 14 }, { x: 48, y: 14 }, { x: 54, y: 14 }, { x: 60, y: 14 }, { x: 50, y: 30 }],
        steps: [
          { duration: 1.0, note: 'A free kick, twenty yards out', ball: { x: 47, y: 20 }, players: { p9: { x: 44, y: 22 } } },
          { duration: 1.1, note: 'The wall lines up. The centre-back walks up from the back.', players: { p3: { x: 45, y: 28 } } },
          { duration: 1.0, note: 'A teammate stands over it as the decoy', players: { p7: { x: 50, y: 24 } } },
          { duration: 0.9, note: 'The ball is rolled sideways', ball: { x: 45, y: 24 }, players: { p3: { x: 44, y: 26 } } },
          { duration: 0.9, note: 'And struck as hard as a human can strike it', ball: { x: 52, y: 8 } },
          { duration: 0.8, note: 'Into the top corner', ball: { x: 53, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: squeeze the pitch, and trust the keeper behind.',
        opponents: [{ x: 45, y: 30 }, { x: 58, y: 32 }, { x: 35, y: 42 }, { x: 52, y: 48 }, { x: 60, y: 58 }],
        steps: [
          { duration: 1.0, note: 'Lose it? Hunt it back immediately — the first rule', players: { p9: { x: 40, y: 28 }, p10: { x: 50, y: 30 }, p6: { x: 42, y: 40 } }, ball: { x: 45, y: 30 } },
          { duration: 1.0, note: 'The pitch is made small: everyone squeezes up', players: { p2: { x: 28, y: 55 }, p3: { x: 50, y: 52 }, p4: { x: 72, y: 55 } } },
          { duration: 1.0, note: 'The line steps forward as one — the offside trap', players: { p2: { x: 28, y: 50 }, p3: { x: 50, y: 48 }, p4: { x: 72, y: 50 } }, ball: { x: 52, y: 48 } },
          { duration: 0.9, note: 'The flag goes up, or the panicked pass is intercepted', players: { p6: { x: 45, y: 42 } }, ball: { x: 45, y: 43 } },
          { duration: 1.2, note: 'But if the ball is chipped over that trap…', ball: { x: 55, y: 62 }, opponents: [{ x: 45, y: 26 }, { x: 58, y: 58 }, { x: 35, y: 44 }, { x: 52, y: 50 }, { x: 60, y: 60 }] },
          { duration: 1.0, note: '…only three defenders remain, so they jockey and delay', players: { p2: { x: 35, y: 62 }, p3: { x: 54, y: 62 }, p4: { x: 68, y: 62 } } },
          { duration: 1.1, note: 'And the keeper sprints out as the last defender', players: { p1: { x: 52, y: 78 } } },
          { duration: 0.9, note: 'Swept away at the striker’s toe', ball: { x: 40, y: 68 }, players: { p1: { x: 50, y: 76 } } },
          { duration: 1.0, note: 'Straight back to work. The ball is theirs again.', ball: { x: 42, y: 55 } },
        ],
      },
    ],
  },
  'wenger-invincibles': {
    attack: [
      {
        intro: 'Win it, then four passes and it is in the net.',
        opponents: [{ x: 50, y: 46 }, { x: 38, y: 36 }, { x: 62, y: 32 }, { x: 45, y: 18 }, { x: 58, y: 16 }],
        steps: [
          { duration: 0.9, note: 'The duel is won in central midfield', players: { p7: { x: 43, y: 49 } }, ball: { x: 43, y: 50 } },
          { duration: 1.0, note: 'The second striker drops between the lines to link', players: { p11: { x: 60, y: 30 } }, ball: { x: 59, y: 32 } },
          { duration: 1.0, note: 'The nine drifts into the left channel — his runway', players: { p10: { x: 20, y: 20 } } },
          { duration: 1.0, note: 'The reverse ball in behind, played first time', ball: { x: 24, y: 10 } },
          { duration: 1.1, note: 'He cuts inside at full sprint', players: { p10: { x: 36, y: 8 } }, ball: { x: 37, y: 9 }, opponents: [{ x: 50, y: 34 }, { x: 40, y: 24 }, { x: 60, y: 22 }, { x: 47, y: 12 }, { x: 58, y: 11 }] },
          { duration: 0.8, note: 'Passed into the far corner, never smashed', ball: { x: 53, y: 3 } },
        ],
      },
      {
        intro: 'Or the full sweep: one-touch football, back to front.',
        opponents: [{ x: 38, y: 18 }, { x: 51, y: 18 }, { x: 64, y: 20 }, { x: 44, y: 32 }, { x: 57, y: 34 }],
        steps: [
          { duration: 1.0, note: 'Full-back and winger interchange on the left', players: { p2: { x: 20, y: 40 }, p6: { x: 28, y: 30 } }, ball: { x: 24, y: 36 } },
          { duration: 1.0, note: 'Clipped inside to the forward — one touch', ball: { x: 50, y: 28 }, players: { p11: { x: 51, y: 26 } } },
          { duration: 1.0, note: 'Around the corner for the overlapping full-back', ball: { x: 22, y: 18 }, players: { p2: { x: 20, y: 16 } }, opponents: [{ x: 36, y: 14 }, { x: 50, y: 15 }, { x: 63, y: 17 }, { x: 40, y: 26 }, { x: 55, y: 30 }] },
          { duration: 1.0, note: 'The right midfielder starts his late dart', players: { p9: { x: 62, y: 16 } } },
          { duration: 0.9, note: 'The cutback finds shirts queuing up', ball: { x: 50, y: 8 } },
          { duration: 0.8, note: 'Slid home from six yards', ball: { x: 51, y: 3 }, players: { p9: { x: 54, y: 7 } } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: a spine of iron under all that silk.',
        opponents: [{ x: 48, y: 32 }, { x: 35, y: 40 }, { x: 62, y: 40 }, { x: 50, y: 52 }, { x: 40, y: 60 }],
        steps: [
          { duration: 1.1, note: 'The two central midfielders close the middle of the pitch', players: { p7: { x: 45, y: 50 }, p8: { x: 55, y: 50 } }, ball: { x: 48, y: 32 } },
          { duration: 1.0, note: 'The centre-backs hold a high, brave line', players: { p3: { x: 40, y: 62 }, p4: { x: 60, y: 62 } }, ball: { x: 35, y: 40 } },
          { duration: 1.0, note: 'The winger is shepherded inside, into traffic', ball: { x: 42, y: 48 } },
          { duration: 0.9, note: 'One stride, one tackle, ball won', players: { p7: { x: 43, y: 50 } }, ball: { x: 44, y: 50 } },
          { duration: 1.2, note: 'But if a flick sends their striker in behind…', ball: { x: 30, y: 66 }, opponents: [{ x: 48, y: 36 }, { x: 28, y: 64 }, { x: 62, y: 44 }, { x: 50, y: 56 }, { x: 42, y: 62 }] },
          { duration: 1.1, note: '…the centre-back matches him stride for stride', players: { p3: { x: 32, y: 68 } } },
          { duration: 1.0, note: 'Forced wider with every step, angle shrinking', ball: { x: 22, y: 72 }, players: { p3: { x: 26, y: 70 } } },
          { duration: 0.9, note: 'Muscled off the ball on the touchline', ball: { x: 20, y: 74 } },
          { duration: 1.0, note: 'His partner mops up, and Arsenal break', players: { p4: { x: 32, y: 70 } }, ball: { x: 40, y: 58 } },
        ],
      },
    ],
  },
  'lucho-barca': {
    attack: [
      {
        intro: 'Get the front three the ball, then get out of the way.',
        opponents: [{ x: 40, y: 25 }, { x: 54, y: 25 }, { x: 68, y: 27 }, { x: 47, y: 40 }, { x: 60, y: 42 }],
        steps: [
          { duration: 1.0, note: 'The pivot escapes the press with one touch', ball: { x: 50, y: 55 }, players: { p7: { x: 50, y: 52 } } },
          { duration: 1.1, note: 'The right winger drops in — the magnet', players: { p11: { x: 65, y: 32 } }, ball: { x: 63, y: 34 } },
          { duration: 1.0, note: 'The full-back is already sprinting the far touchline', players: { p2: { x: 25, y: 16 } }, opponents: [{ x: 40, y: 22 }, { x: 54, y: 22 }, { x: 64, y: 28 }, { x: 47, y: 36 }, { x: 58, y: 38 }] },
          { duration: 1.1, note: 'The ball is clipped over everything into his run', ball: { x: 25, y: 12 } },
          { duration: 1.0, note: 'Cut back to the striker between the posts', ball: { x: 48, y: 6 }, players: { p10: { x: 47, y: 8 }, p9: { x: 38, y: 8 } } },
          { duration: 0.8, note: 'Finished. The third one was free too.', ball: { x: 51, y: 3 } },
        ],
      },
      {
        intro: 'Or clear the left side and let the winger go to work.',
        opponents: [{ x: 38, y: 18 }, { x: 51, y: 18 }, { x: 64, y: 20 }, { x: 30, y: 30 }, { x: 55, y: 34 }],
        steps: [
          { duration: 1.0, note: 'Found on the left, and the flank empties for him', ball: { x: 24, y: 30 }, players: { p6: { x: 32, y: 40 }, p9: { x: 22, y: 28 } } },
          { duration: 1.1, note: 'One against one. The full-back is alone.', opponents: [{ x: 38, y: 16 }, { x: 51, y: 16 }, { x: 64, y: 18 }, { x: 26, y: 24 }, { x: 55, y: 30 }] },
          { duration: 1.1, note: 'The touch inside — the defender buys the fake', players: { p9: { x: 32, y: 16 } }, ball: { x: 33, y: 17 } },
          { duration: 1.0, note: 'The striker makes the near-post dart to open space', players: { p10: { x: 42, y: 9 } } },
          { duration: 0.9, note: 'He keeps it himself — why not?', players: { p9: { x: 40, y: 9 } }, ball: { x: 41, y: 10 } },
          { duration: 0.8, note: 'Bent around the keeper into the far side', ball: { x: 54, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: the front three press, the keeper sweeps.',
        opponents: [{ x: 45, y: 20 }, { x: 58, y: 22 }, { x: 35, y: 32 }, { x: 50, y: 38 }, { x: 62, y: 45 }],
        steps: [
          { duration: 1.1, note: 'The front three press the first pass — no clean exits', players: { p9: { x: 30, y: 26 }, p10: { x: 46, y: 16 }, p11: { x: 60, y: 24 } }, ball: { x: 45, y: 20 } },
          { duration: 1.0, note: 'A midfielder jumps onto the spare man', players: { p8: { x: 60, y: 35 } }, ball: { x: 58, y: 22 } },
          { duration: 0.9, note: 'Rushed, and hooked straight out of play', ball: { x: 62, y: 18 } },
          { duration: 0.9, note: 'Their throw, deep in their own half — job done', ball: { x: 55, y: 25 } },
          { duration: 1.2, note: 'But if a long diagonal escapes the press…', ball: { x: 30, y: 58 }, opponents: [{ x: 45, y: 24 }, { x: 58, y: 26 }, { x: 28, y: 56 }, { x: 50, y: 42 }, { x: 62, y: 48 }] },
          { duration: 1.0, note: '…the converted midfielder arrives at centre-back', players: { p4: { x: 34, y: 62 } } },
          { duration: 1.0, note: 'He forces it wide, but the ball goes over him', ball: { x: 40, y: 72 } },
          { duration: 0.9, note: 'So the keeper races out as the spare defender', players: { p1: { x: 45, y: 78 } }, ball: { x: 43, y: 74 } },
          { duration: 1.0, note: 'Swept clear, and the ball is theirs again', ball: { x: 50, y: 60 }, players: { p7: { x: 50, y: 56 } } },
        ],
      },
    ],
  },
  'lucho-psg': {
    attack: [
      {
        intro: 'Press to steal high, then release the front three at once.',
        opponents: [{ x: 50, y: 10 }, { x: 33, y: 15 }, { x: 67, y: 15 }, { x: 50, y: 24 }, { x: 38, y: 30 }],
        steps: [
          { duration: 1.0, note: 'The front three trap the build-up high', players: { p9: { x: 27, y: 18 }, p10: { x: 46, y: 12 }, p11: { x: 62, y: 17 } }, ball: { x: 50, y: 10 } },
          { duration: 1.0, note: 'Forced wide — the trap tightens on the touchline', ball: { x: 33, y: 15 }, players: { p9: { x: 29, y: 15 }, p6: { x: 30, y: 28 } } },
          { duration: 0.9, note: 'Stolen, thirty metres from goal', ball: { x: 32, y: 17 } },
          { duration: 1.0, note: 'The false nine takes it between the centre-backs', ball: { x: 47, y: 13 }, players: { p10: { x: 48, y: 12 } } },
          { duration: 1.0, note: 'The far winger arrives at the back post', players: { p11: { x: 60, y: 7 } }, ball: { x: 58, y: 8 } },
          { duration: 0.8, note: 'Finished before the defence can reform', ball: { x: 51, y: 3 } },
        ],
      },
      {
        intro: 'Or through the little conductors in midfield.',
        opponents: [{ x: 40, y: 20 }, { x: 53, y: 20 }, { x: 66, y: 22 }, { x: 45, y: 34 }, { x: 58, y: 36 }],
        steps: [
          { duration: 1.0, note: 'The pivot demands it under pressure — always', ball: { x: 45, y: 45 }, players: { p6: { x: 44, y: 43 } } },
          { duration: 0.9, note: 'The wall pass, played in a phone box', ball: { x: 52, y: 40 }, players: { p7: { x: 53, y: 39 } } },
          { duration: 1.0, note: 'Two pressers beaten by two touches', ball: { x: 46, y: 34 }, players: { p6: { x: 46, y: 32 } }, opponents: [{ x: 42, y: 26 }, { x: 55, y: 26 }, { x: 66, y: 24 }, { x: 48, y: 40 }, { x: 58, y: 40 }] },
          { duration: 1.1, note: 'The left winger starts his diagonal run inside', players: { p9: { x: 35, y: 15 } } },
          { duration: 1.0, note: 'Threaded with the outside of the boot', ball: { x: 37, y: 13 } },
          { duration: 0.8, note: 'Opened up and curled home', ball: { x: 52, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: all eleven press, and the defenders recover.',
        opponents: [{ x: 50, y: 15 }, { x: 35, y: 20 }, { x: 65, y: 20 }, { x: 48, y: 30 }, { x: 58, y: 38 }],
        steps: [
          { duration: 1.2, note: 'The whole team crosses halfway to press', players: { p2: { x: 20, y: 40 }, p5: { x: 80, y: 40 }, p3: { x: 40, y: 50 }, p4: { x: 60, y: 50 }, p6: { x: 35, y: 25 }, p7: { x: 50, y: 30 }, p8: { x: 62, y: 28 } }, ball: { x: 50, y: 15 } },
          { duration: 1.0, note: 'Even the forwards lead the charge from the front', players: { p10: { x: 48, y: 12 } }, ball: { x: 35, y: 20 } },
          { duration: 0.9, note: 'Every option is shadowed before the pass exists', players: { p9: { x: 28, y: 18 }, p11: { x: 68, y: 18 } } },
          { duration: 0.9, note: 'The panicked touch is pounced on', ball: { x: 40, y: 22 }, players: { p6: { x: 38, y: 22 } } },
          { duration: 1.2, note: 'But if one long punt clears the entire press…', ball: { x: 60, y: 60 }, opponents: [{ x: 50, y: 18 }, { x: 35, y: 24 }, { x: 62, y: 58 }, { x: 48, y: 34 }, { x: 58, y: 42 }] },
          { duration: 1.1, note: '…the centre-back runs it down: calm, physical, first', players: { p4: { x: 62, y: 64 } } },
          { duration: 1.0, note: 'Shoulder to shoulder, he takes the ball cleanly', ball: { x: 62, y: 66 } },
          { duration: 0.9, note: 'His partner steps across to cover the rebound', players: { p3: { x: 52, y: 66 } }, ball: { x: 55, y: 64 } },
          { duration: 1.0, note: 'Played out short. The press resets in seconds.', ball: { x: 45, y: 55 } },
        ],
      },
    ],
  },
  'klopp-liverpool': {
    attack: [
      {
        intro: 'Gegenpressing: lose the ball, then hunt it in a pack.',
        opponents: [{ x: 36, y: 32 }, { x: 50, y: 38 }, { x: 64, y: 44 }, { x: 45, y: 54 }, { x: 60, y: 64 }],
        steps: [
          { duration: 1.0, note: 'Possession lost in the opponent half — the trigger', ball: { x: 37, y: 33 } },
          { duration: 1.2, note: 'The nearest three hunt it as a pack', players: { p9: { x: 31, y: 27 }, p6: { x: 33, y: 39 }, p2: { x: 24, y: 42 }, p10: { x: 44, y: 28 } } },
          { duration: 0.9, note: 'Won back within five seconds', ball: { x: 34, y: 36 } },
          { duration: 1.0, note: 'The first pass is vertical — always', ball: { x: 68, y: 22 }, players: { p11: { x: 70, y: 20 } } },
          { duration: 1.1, note: 'In behind at full speed — heavy metal football', players: { p11: { x: 60, y: 9 } }, ball: { x: 61, y: 10 }, opponents: [{ x: 38, y: 22 }, { x: 50, y: 26 }, { x: 62, y: 28 }, { x: 47, y: 40 }, { x: 58, y: 48 }] },
          { duration: 0.9, note: 'Turnover to goal in four passes or fewer', ball: { x: 49, y: 3 }, players: { p10: { x: 46, y: 10 } } },
        ],
      },
      {
        intro: 'Or full-back to full-back: the creators are at the back.',
        opponents: [{ x: 38, y: 16 }, { x: 51, y: 16 }, { x: 64, y: 18 }, { x: 45, y: 30 }, { x: 58, y: 32 }],
        steps: [
          { duration: 1.0, note: 'The right-back surveys it from deep', ball: { x: 80, y: 40 }, players: { p5: { x: 80, y: 38 } } },
          { duration: 1.2, note: 'The seventy-yard diagonal, flat as a laser', ball: { x: 18, y: 22 }, players: { p2: { x: 16, y: 20 } } },
          { duration: 1.0, note: 'Taken in stride on the left, no touch wasted', players: { p2: { x: 20, y: 12 } }, ball: { x: 21, y: 13 }, opponents: [{ x: 34, y: 12 }, { x: 48, y: 13 }, { x: 62, y: 15 }, { x: 42, y: 24 }, { x: 56, y: 28 }] },
          { duration: 1.0, note: 'The nine vacates the middle; a winger fills it', players: { p10: { x: 58, y: 20 }, p9: { x: 42, y: 9 } } },
          { duration: 0.9, note: 'The low cross, fizzed through the corridor', ball: { x: 42, y: 7 } },
          { duration: 0.8, note: 'First time, from full-back to full-back to net', ball: { x: 50, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: the highest line — with a keeper to match.',
        opponents: [{ x: 48, y: 25 }, { x: 35, y: 30 }, { x: 62, y: 32 }, { x: 50, y: 42 }, { x: 58, y: 52 }],
        steps: [
          { duration: 1.1, note: 'The line pushes up and squeezes the whole pitch', players: { p2: { x: 25, y: 50 }, p3: { x: 43, y: 48 }, p4: { x: 57, y: 48 }, p5: { x: 75, y: 50 } }, ball: { x: 48, y: 25 } },
          { duration: 1.0, note: 'The touchline trap: full-back plus two hunters', players: { p2: { x: 28, y: 34 }, p6: { x: 38, y: 34 }, p9: { x: 28, y: 24 } }, ball: { x: 35, y: 30 } },
          { duration: 0.9, note: 'Five seconds of fury, and the ball is won', ball: { x: 33, y: 32 } },
          { duration: 0.9, note: 'Counter-press becomes counter-attack', ball: { x: 55, y: 25 }, players: { p11: { x: 65, y: 20 } } },
          { duration: 1.2, note: 'But if a ball over the top beats that line…', ball: { x: 55, y: 62 }, opponents: [{ x: 48, y: 28 }, { x: 35, y: 34 }, { x: 57, y: 60 }, { x: 50, y: 46 }, { x: 58, y: 55 }] },
          { duration: 1.1, note: '…the centre-back glides across, never rushed', players: { p3: { x: 52, y: 62 } } },
          { duration: 1.0, note: 'He steers the runner wide with one arm', ball: { x: 68, y: 72 }, players: { p3: { x: 62, y: 68 } } },
          { duration: 1.0, note: 'And the keeper spreads himself at the near post', players: { p1: { x: 55, y: 87 } }, ball: { x: 58, y: 84 } },
          { duration: 1.0, note: 'Claimed, and thrown straight into the next attack', ball: { x: 55, y: 86 }, players: { p1: { x: 54, y: 87 } } },
        ],
      },
    ],
  },
  'zidane-undecima': {
    attack: [
      {
        intro: 'Control the middle, then release the cavalry.',
        opponents: [{ x: 44, y: 40 }, { x: 58, y: 42 }, { x: 34, y: 50 }, { x: 52, y: 56 }, { x: 66, y: 58 }],
        steps: [
          { duration: 1.0, note: 'The destroyer wins it ugly; the passer makes it clean', ball: { x: 52, y: 58 }, players: { p7: { x: 52, y: 56 } } },
          { duration: 1.0, note: 'One pass to the other metronome and the pressure dissolves', ball: { x: 66, y: 48 }, players: { p8: { x: 68, y: 46 } } },
          { duration: 1.1, note: 'The right winger attacks the channel at a gallop', players: { p11: { x: 80, y: 22 } }, ball: { x: 74, y: 30 } },
          { duration: 1.0, note: 'The striker occupies both centre-backs alone', players: { p10: { x: 50, y: 15 } }, opponents: [{ x: 46, y: 16 }, { x: 56, y: 16 }, { x: 34, y: 40 }, { x: 52, y: 44 }, { x: 66, y: 46 }] },
          { duration: 1.0, note: 'The left winger ghosts in at the far post', players: { p9: { x: 35, y: 10 } } },
          { duration: 0.9, note: 'The cross, and the header', ball: { x: 45, y: 5 }, players: { p9: { x: 43, y: 7 } } },
        ],
      },
      {
        intro: 'Or down the left, where the full-back and winger combine.',
        opponents: [{ x: 38, y: 18 }, { x: 52, y: 18 }, { x: 65, y: 20 }, { x: 32, y: 32 }, { x: 55, y: 34 }],
        steps: [
          { duration: 1.0, note: 'The left-back dances infield with the ball', players: { p2: { x: 28, y: 35 } }, ball: { x: 28, y: 36 } },
          { duration: 1.0, note: 'The one-two with the winger, at samba tempo', ball: { x: 22, y: 24 }, players: { p9: { x: 20, y: 22 } } },
          { duration: 1.0, note: 'Returned into his run — the defence is spinning', ball: { x: 30, y: 16 }, players: { p2: { x: 31, y: 15 } }, opponents: [{ x: 36, y: 14 }, { x: 50, y: 16 }, { x: 64, y: 18 }, { x: 34, y: 24 }, { x: 54, y: 30 }] },
          { duration: 1.0, note: 'The winger checks his run and waits on the spot', players: { p9: { x: 48, y: 10 } } },
          { duration: 0.9, note: 'Stood up to the back post', ball: { x: 47, y: 8 } },
          { duration: 0.8, note: 'Thumped home', ball: { x: 50, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: a compact block with the star excused.',
        opponents: [{ x: 50, y: 30 }, { x: 36, y: 36 }, { x: 64, y: 38 }, { x: 46, y: 50 }, { x: 58, y: 55 }],
        steps: [
          { duration: 1.1, note: 'The block forms; the winger stays high, saving his legs', players: { p6: { x: 30, y: 50 }, p8: { x: 70, y: 50 }, p7: { x: 50, y: 55 }, p9: { x: 25, y: 30 } }, ball: { x: 50, y: 30 } },
          { duration: 1.0, note: 'The destroyer eats whatever comes through the middle', players: { p7: { x: 48, y: 52 } }, ball: { x: 46, y: 50 } },
          { duration: 0.9, note: 'Won with a shoulder and a long leg', ball: { x: 47, y: 53 } },
          { duration: 0.9, note: 'And given straight to a midfielder to start again', ball: { x: 35, y: 48 }, players: { p6: { x: 33, y: 46 } } },
          { duration: 1.2, note: 'But if a cute flick sneaks a runner past midfield…', ball: { x: 55, y: 64 }, opponents: [{ x: 50, y: 34 }, { x: 36, y: 40 }, { x: 57, y: 62 }, { x: 46, y: 54 }, { x: 58, y: 58 }] },
          { duration: 1.1, note: '…both centre-backs close the door together', players: { p3: { x: 48, y: 68 }, p4: { x: 58, y: 68 } } },
          { duration: 0.9, note: 'The captain gets his body in the way', ball: { x: 56, y: 66 }, players: { p4: { x: 56, y: 65 } } },
          { duration: 1.0, note: 'Hacked clear by his partner — no elegance required', players: { p3: { x: 50, y: 68 } }, ball: { x: 40, y: 55 } },
          { duration: 1.0, note: 'Block reset. Again and again and again.', ball: { x: 42, y: 48 } },
        ],
      },
    ],
  },
  'zidane-madrid': {
    attack: [
      {
        intro: 'The diamond: midfield masters, then one lightning strike.',
        opponents: [{ x: 44, y: 42 }, { x: 58, y: 44 }, { x: 32, y: 52 }, { x: 52, y: 58 }, { x: 68, y: 62 }],
        steps: [
          { duration: 1.1, note: 'Pressed? The midfield simply keeps the ball', players: { p8: { x: 72, y: 54 } }, ball: { x: 72, y: 56 } },
          { duration: 1.0, note: 'The switch — from one metronome to the other', ball: { x: 28, y: 54 }, players: { p6: { x: 27, y: 53 } } },
          { duration: 1.0, note: 'The ten appears in the pocket', players: { p9: { x: 38, y: 38 } }, ball: { x: 38, y: 40 } },
          { duration: 1.2, note: 'One striker drops, the other attacks the space', players: { p11: { x: 55, y: 26 }, p10: { x: 20, y: 14 } }, opponents: [{ x: 44, y: 30 }, { x: 58, y: 32 }, { x: 34, y: 38 }, { x: 52, y: 44 }, { x: 66, y: 48 }] },
          { duration: 1.0, note: 'The ball in behind — decided in one moment', ball: { x: 24, y: 9 } },
          { duration: 1.0, note: 'Individual brilliance finishes it', ball: { x: 52, y: 4 }, players: { p10: { x: 42, y: 6 } } },
        ],
      },
      {
        intro: 'Or the set piece: a perfect delivery, a centre-back rising.',
        opponents: [{ x: 40, y: 10 }, { x: 50, y: 10 }, { x: 60, y: 10 }, { x: 45, y: 16 }, { x: 56, y: 16 }],
        steps: [
          { duration: 1.0, note: 'A corner, and the ball is placed just so', players: { p6: { x: 4, y: 4 } }, ball: { x: 4, y: 4 } },
          { duration: 1.1, note: 'The centre-backs cross their runs to lose the markers', players: { p3: { x: 44, y: 15 }, p4: { x: 56, y: 15 } } },
          { duration: 1.0, note: 'A forward screens the keeper’s route out', players: { p11: { x: 46, y: 8 } } },
          { duration: 1.0, note: 'The inswinger, dropped on a coin', ball: { x: 50, y: 9 } },
          { duration: 0.9, note: 'The captain climbs highest — he always does', players: { p3: { x: 51, y: 7 } }, ball: { x: 51, y: 7 } },
          { duration: 0.8, note: 'Powered in off the underside of the bar', ball: { x: 49, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: the diamond collapses into a sealed block.',
        opponents: [{ x: 48, y: 32 }, { x: 35, y: 40 }, { x: 62, y: 40 }, { x: 50, y: 52 }, { x: 42, y: 60 }],
        steps: [
          { duration: 1.1, note: 'The diamond collapses into a narrow block', players: { p9: { x: 50, y: 45 }, p6: { x: 32, y: 52 }, p8: { x: 68, y: 52 }, p7: { x: 50, y: 58 } }, ball: { x: 48, y: 32 } },
          { duration: 1.0, note: 'Full-backs tuck in; the middle stays sealed', players: { p2: { x: 25, y: 62 }, p5: { x: 75, y: 62 } }, ball: { x: 35, y: 40 } },
          { duration: 1.0, note: 'They pass around it and get nowhere', ball: { x: 62, y: 40 } },
          { duration: 0.9, note: 'The anchor wins it back. He always does.', players: { p7: { x: 58, y: 50 } }, ball: { x: 58, y: 48 } },
          { duration: 1.2, note: 'But if a give-and-go slips through the seam…', ball: { x: 58, y: 64 }, opponents: [{ x: 48, y: 36 }, { x: 35, y: 44 }, { x: 60, y: 62 }, { x: 50, y: 56 }, { x: 44, y: 62 }] },
          { duration: 1.1, note: '…the centre-back recovers with those impossible strides', players: { p4: { x: 60, y: 68 } } },
          { duration: 0.9, note: 'He gets a toe in as the shot is struck', ball: { x: 58, y: 70 } },
          { duration: 1.0, note: 'Deflected wide by the covering defender', players: { p3: { x: 52, y: 70 } }, ball: { x: 70, y: 74 } },
          { duration: 1.0, note: 'Survived — and one pass makes them lethal again', ball: { x: 40, y: 58 }, players: { p10: { x: 30, y: 40 } } },
        ],
      },
    ],
  },
  'arteta-arsenal-24': {
    attack: [
      {
        intro: 'Build with a back three, then attack the space the winger has held open.',
        opponents: [{ x: 34, y: 22 }, { x: 50, y: 20 }, { x: 66, y: 22 }, { x: 42, y: 40 }, { x: 58, y: 40 }],
        steps: [
          { duration: 1, note: 'The left-back steps inside into midfield, making a back three', players: { p2: { x: 38, y: 62 } }, ball: { x: 50, y: 74 } },
          { duration: 1.1, note: 'That extra body in the centre drags an opponent out of position', ball: { x: 38, y: 60 }, opponents: [{ x: 34, y: 22 }, { x: 50, y: 20 }, { x: 66, y: 22 }, { x: 40, y: 48 }, { x: 58, y: 40 }] },
          { duration: 1.1, note: 'The switch goes to the winger, who has not moved off the touchline', players: { p11: { x: 92, y: 42 } }, ball: { x: 90, y: 44 } },
          { duration: 1.2, note: 'One-against-one, and he attacks the space inside the full-back', players: { p11: { x: 78, y: 24 } }, ball: { x: 79, y: 25 } },
          { duration: 1, note: 'The striker attacks the near post, the far winger the back post', players: { p10: { x: 46, y: 12 }, p9: { x: 30, y: 16 } } },
          { duration: 0.9, note: 'Cut back to the edge of the box instead of a hopeful cross', players: { p8: { x: 52, y: 22 } }, ball: { x: 50, y: 18 } },
        ],
      },
      {
        intro: 'The other route: a rehearsed corner, treated as a chance in itself.',
        opponents: [{ x: 40, y: 12 }, { x: 50, y: 10 }, { x: 60, y: 12 }, { x: 44, y: 18 }, { x: 56, y: 18 }],
        steps: [
          { duration: 1, note: 'Everyone gathers on the edge of the six-yard box', players: { p3: { x: 46, y: 20 }, p4: { x: 54, y: 20 }, p10: { x: 50, y: 16 } }, ball: { x: 98, y: 4 } },
          { duration: 1.1, note: 'A blocker holds off the marker so a runner can come free', players: { p8: { x: 42, y: 16 } } },
          { duration: 1.1, note: 'The delivery is flat and fast towards the near post', ball: { x: 58, y: 8 } },
          { duration: 1, note: 'The centre-back attacks it at full speed', players: { p4: { x: 57, y: 9 } } },
          { duration: 0.9, note: 'Flicked on across the face of goal', players: { p3: { x: 46, y: 8 } }, ball: { x: 48, y: 5 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'When it works: press the pass back and win the ball high.',
        opponents: [{ x: 50, y: 78 }, { x: 36, y: 66 }, { x: 64, y: 66 }, { x: 50, y: 56 }, { x: 50, y: 40 }],
        steps: [
          { duration: 1, note: 'The pass goes backwards — that is the trigger', ball: { x: 50, y: 74 } },
          { duration: 1, note: 'The striker presses the ball and blocks the pass back inside', players: { p10: { x: 50, y: 62 } } },
          { duration: 1.1, note: 'The wingers close the outside so the only ball is down the line', players: { p9: { x: 30, y: 58 }, p11: { x: 70, y: 58 } } },
          { duration: 1.1, note: 'The midfield steps up together and the defence follows', players: { p6: { x: 40, y: 50 }, p7: { x: 50, y: 48 }, p8: { x: 60, y: 50 }, p3: { x: 44, y: 44 }, p4: { x: 56, y: 44 } } },
          { duration: 0.9, note: 'The pass is forced, intercepted, and the attack starts high', ball: { x: 56, y: 50 } },
        ],
      },
      {
        intro: 'If it does not: they play through the press and the defence has to cover.',
        opponents: [{ x: 50, y: 70 }, { x: 36, y: 60 }, { x: 64, y: 60 }, { x: 50, y: 50 }, { x: 50, y: 34 }],
        steps: [
          { duration: 1, note: 'The press is beaten with one pass through the middle', ball: { x: 50, y: 52 } },
          { duration: 1.1, note: 'A runner goes beyond the last line', opponents: [{ x: 50, y: 62 }, { x: 36, y: 56 }, { x: 64, y: 56 }, { x: 50, y: 40 }, { x: 48, y: 22 }] },
          { duration: 1.1, note: 'The centre-backs turn and race back rather than reaching in', players: { p3: { x: 46, y: 30 }, p4: { x: 54, y: 28 } } },
          { duration: 1.1, note: 'One shepherds him wide, away from the middle', players: { p4: { x: 58, y: 22 } }, ball: { x: 52, y: 24 } },
          { duration: 0.9, note: 'The angle is closed and the shot is blocked behind', players: { p3: { x: 55, y: 16 } }, ball: { x: 60, y: 14 } },
        ],
      },
    ],
  },
  'emery-sevilla-16': {
    attack: [
      {
        intro: 'The double pivot holds so everyone in front can go.',
        opponents: [{ x: 36, y: 24 }, { x: 50, y: 22 }, { x: 64, y: 24 }, { x: 42, y: 42 }, { x: 58, y: 42 }],
        steps: [
          { duration: 1, note: 'One of the two holders drops in to collect from the defence', players: { p6: { x: 44, y: 64 } }, ball: { x: 44, y: 62 } },
          { duration: 1.1, note: 'The full-backs push high, knowing two players are covering behind', players: { p2: { x: 12, y: 44 }, p5: { x: 88, y: 44 } } },
          { duration: 1.1, note: 'The ball goes wide early to isolate the winger', players: { p10: { x: 84, y: 34 } }, ball: { x: 88, y: 42 } },
          { duration: 1.2, note: 'Two players attack the same flank to make it two against one', players: { p5: { x: 92, y: 28 } }, ball: { x: 90, y: 30 } },
          { duration: 1, note: 'The ten arrives late at the top of the box', players: { p9: { x: 52, y: 22 } } },
          { duration: 0.9, note: 'Pulled back for the runner rather than crossed to the striker', ball: { x: 54, y: 20 } },
        ],
      },
      {
        intro: 'The other route: win it back high and go straight for goal.',
        opponents: [{ x: 44, y: 46 }, { x: 56, y: 46 }, { x: 50, y: 60 }, { x: 36, y: 34 }, { x: 64, y: 34 }],
        steps: [
          { duration: 0.9, note: 'The press traps them near their own box', players: { p11: { x: 50, y: 52 } }, ball: { x: 50, y: 58 } },
          { duration: 1, note: 'The ball is won by the nearest holder', players: { p7: { x: 52, y: 48 } }, ball: { x: 52, y: 50 } },
          { duration: 1.1, note: 'First pass forward, no square balls', players: { p9: { x: 56, y: 28 } }, ball: { x: 56, y: 30 } },
          { duration: 1.1, note: 'The striker peels off the last defender', players: { p11: { x: 44, y: 16 } }, opponents: [{ x: 44, y: 24 }, { x: 56, y: 24 }, { x: 50, y: 40 }, { x: 36, y: 30 }, { x: 64, y: 30 }] },
          { duration: 0.9, note: 'Slid through the gap between the centre-backs', ball: { x: 46, y: 12 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'When it works: press in a burst and force the mistake.',
        opponents: [{ x: 50, y: 76 }, { x: 34, y: 64 }, { x: 66, y: 64 }, { x: 50, y: 54 }, { x: 50, y: 38 }],
        steps: [
          { duration: 1, note: 'The team waits, compact, rather than pressing constantly', players: { p8: { x: 34, y: 52 }, p10: { x: 66, y: 52 } } },
          { duration: 1, note: 'A heavy touch is the signal to go', ball: { x: 48, y: 70 } },
          { duration: 1.1, note: 'Three players close the ball at once', players: { p11: { x: 48, y: 64 }, p9: { x: 44, y: 58 }, p7: { x: 54, y: 56 } } },
          { duration: 1.1, note: 'The two holders cut every inside pass', players: { p6: { x: 42, y: 52 } } },
          { duration: 0.9, note: 'The clearance is hurried and headed back into their half', ball: { x: 50, y: 44 } },
        ],
      },
      {
        intro: 'If it does not: the burst is beaten and the block has to re-form.',
        opponents: [{ x: 50, y: 68 }, { x: 34, y: 58 }, { x: 66, y: 58 }, { x: 50, y: 46 }, { x: 50, y: 30 }],
        steps: [
          { duration: 1, note: 'One pass takes three players out of the game', ball: { x: 54, y: 46 } },
          { duration: 1.1, note: 'Everyone sprints back to get behind the ball', players: { p11: { x: 50, y: 44 }, p9: { x: 50, y: 40 }, p8: { x: 34, y: 40 }, p10: { x: 66, y: 40 } } },
          { duration: 1.1, note: 'The back four drops as one and stays narrow', players: { p2: { x: 30, y: 30 }, p3: { x: 43, y: 28 }, p4: { x: 57, y: 28 }, p5: { x: 70, y: 30 } } },
          { duration: 1.1, note: 'The cross comes in with nobody free in the middle', ball: { x: 74, y: 18 } },
          { duration: 0.9, note: 'Headed clear by the near centre-back', players: { p4: { x: 54, y: 20 } }, ball: { x: 46, y: 34 } },
        ],
      },
    ],
  },
  'emery-villa-24': {
    attack: [
      {
        intro: 'Win it high with the trap, then go straight at them.',
        opponents: [{ x: 40, y: 52 }, { x: 60, y: 52 }, { x: 50, y: 62 }, { x: 34, y: 40 }, { x: 66, y: 40 }],
        steps: [
          { duration: 1, note: 'The line is pushed up near halfway, squeezing the pitch', players: { p2: { x: 20, y: 46 }, p3: { x: 42, y: 44 }, p4: { x: 58, y: 44 }, p5: { x: 80, y: 46 } } },
          { duration: 1, note: 'They step out together and the runner is caught offside', ball: { x: 50, y: 50 }, opponents: [{ x: 40, y: 40 }, { x: 60, y: 40 }, { x: 50, y: 58 }, { x: 34, y: 36 }, { x: 66, y: 36 }] },
          { duration: 1.1, note: 'From the free kick the ball goes forward immediately', players: { p8: { x: 54, y: 34 } }, ball: { x: 54, y: 32 } },
          { duration: 1.1, note: 'The striker holds it up while the second one runs beyond', players: { p10: { x: 48, y: 24 }, p11: { x: 62, y: 16 } } },
          { duration: 0.9, note: 'Released in behind before the defence can reset', ball: { x: 62, y: 14 } },
        ],
      },
      {
        intro: 'The other route: the winger goes outside and crosses early.',
        opponents: [{ x: 36, y: 20 }, { x: 50, y: 18 }, { x: 64, y: 20 }, { x: 44, y: 38 }, { x: 58, y: 38 }],
        steps: [
          { duration: 1, note: 'The ball is worked wide to the right midfielder', players: { p9: { x: 84, y: 38 } }, ball: { x: 84, y: 40 } },
          { duration: 1.1, note: 'The full-back overlaps outside him', players: { p5: { x: 92, y: 30 } }, ball: { x: 90, y: 32 } },
          { duration: 1.1, note: 'Both strikers attack the box, near post and far', players: { p10: { x: 44, y: 12 }, p11: { x: 58, y: 12 } } },
          { duration: 1, note: 'The cross is early and behind the defence', ball: { x: 52, y: 8 } },
          { duration: 0.9, note: 'Met first at the near post', players: { p10: { x: 45, y: 8 } }, ball: { x: 46, y: 5 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'When it works: the trap springs and the run is cut off.',
        opponents: [{ x: 50, y: 70 }, { x: 34, y: 60 }, { x: 66, y: 60 }, { x: 50, y: 50 }, { x: 50, y: 34 }],
        steps: [
          { duration: 1, note: 'The back four holds a line far higher than usual', players: { p2: { x: 22, y: 44 }, p3: { x: 42, y: 42 }, p4: { x: 58, y: 42 }, p5: { x: 78, y: 44 } } },
          { duration: 1, note: 'Their forward drops off, looking for the pass in behind', opponents: [{ x: 50, y: 64 }, { x: 34, y: 56 }, { x: 66, y: 56 }, { x: 50, y: 46 }, { x: 50, y: 38 }] },
          { duration: 1.1, note: 'As the pass is struck, the whole line steps forward together', players: { p2: { x: 22, y: 40 }, p3: { x: 42, y: 38 }, p4: { x: 58, y: 38 }, p5: { x: 78, y: 40 } }, ball: { x: 50, y: 40 } },
          { duration: 1, note: 'The runner is left the wrong side of the line', opponents: [{ x: 50, y: 64 }, { x: 34, y: 56 }, { x: 66, y: 56 }, { x: 50, y: 46 }, { x: 50, y: 30 }] },
          { duration: 0.9, note: 'Offside, and the whole team moves up again', ball: { x: 50, y: 44 } },
        ],
      },
      {
        intro: 'If it does not: one runner times it right and the space is enormous.',
        opponents: [{ x: 50, y: 62 }, { x: 34, y: 54 }, { x: 66, y: 54 }, { x: 50, y: 44 }, { x: 50, y: 34 }],
        steps: [
          { duration: 1, note: 'This time the run is timed off the last shoulder', ball: { x: 50, y: 42 }, opponents: [{ x: 50, y: 62 }, { x: 34, y: 54 }, { x: 66, y: 54 }, { x: 50, y: 44 }, { x: 52, y: 30 }] },
          { duration: 1.1, note: 'The pass goes through and the line is beaten', ball: { x: 54, y: 24 } },
          { duration: 1.1, note: 'The centre-backs turn and chase with the whole pitch behind them', players: { p3: { x: 46, y: 26 }, p4: { x: 56, y: 22 } } },
          { duration: 1.1, note: 'The keeper comes a long way out to shorten the angle', players: { p1: { x: 52, y: 18 } } },
          { duration: 0.9, note: 'Smothered outside the box before the shot', ball: { x: 53, y: 17 }, opponents: [{ x: 50, y: 62 }, { x: 34, y: 54 }, { x: 66, y: 54 }, { x: 50, y: 44 }, { x: 54, y: 20 }] },
        ],
      },
    ],
  },
  'xabi-leverkusen-24': {
    attack: [
      {
        intro: 'Circulate patiently until someone steps out of shape.',
        opponents: [{ x: 38, y: 26 }, { x: 50, y: 24 }, { x: 62, y: 26 }, { x: 44, y: 44 }, { x: 56, y: 44 }],
        steps: [
          { duration: 1.1, note: 'The three at the back pass across, in no hurry at all', players: { p2: { x: 32, y: 66 } }, ball: { x: 34, y: 66 } },
          { duration: 1.1, note: 'A centre-back carries the ball forward himself', players: { p2: { x: 34, y: 52 } }, ball: { x: 34, y: 50 }, opponents: [{ x: 38, y: 26 }, { x: 50, y: 24 }, { x: 62, y: 26 }, { x: 40, y: 40 }, { x: 56, y: 44 }] },
          { duration: 1.1, note: 'That drags a marker out and opens the pocket inside', players: { p9: { x: 44, y: 34 } }, ball: { x: 44, y: 32 } },
          { duration: 1.1, note: 'The wing-backs are already high on both touchlines', players: { p5: { x: 8, y: 30 }, p8: { x: 92, y: 30 } } },
          { duration: 1, note: 'Released down the left, where the wing-back is alone', ball: { x: 10, y: 26 } },
          { duration: 0.9, note: 'Cut back to the ten arriving at the penalty spot', players: { p10: { x: 50, y: 18 } }, ball: { x: 48, y: 16 } },
        ],
      },
      {
        intro: 'The other route: the late goal that decided so many matches.',
        opponents: [{ x: 40, y: 14 }, { x: 50, y: 12 }, { x: 60, y: 14 }, { x: 44, y: 24 }, { x: 56, y: 24 }],
        steps: [
          { duration: 1, note: 'Deep into stoppage time, the centre-backs join the attack', players: { p3: { x: 50, y: 30 }, p4: { x: 62, y: 32 } } },
          { duration: 1.1, note: 'The ball is worked wide with everyone in the box', players: { p8: { x: 92, y: 24 } }, ball: { x: 90, y: 24 } },
          { duration: 1.1, note: 'The cross is hung up towards the far post', ball: { x: 40, y: 10 } },
          { duration: 1, note: 'It is nodded back across rather than at goal', players: { p3: { x: 48, y: 14 } }, ball: { x: 52, y: 12 } },
          { duration: 0.9, note: 'Bundled in from close range', players: { p11: { x: 50, y: 8 } }, ball: { x: 50, y: 4 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'When it works: the back three squeezes and the ball is turned over.',
        opponents: [{ x: 50, y: 74 }, { x: 36, y: 62 }, { x: 64, y: 62 }, { x: 50, y: 52 }, { x: 50, y: 36 }],
        steps: [
          { duration: 1, note: 'The midfield four sits flat and narrow', players: { p6: { x: 44, y: 50 }, p7: { x: 56, y: 50 } } },
          { duration: 1.1, note: 'The two tens block the passes into midfield', players: { p9: { x: 44, y: 58 }, p10: { x: 56, y: 58 } } },
          { duration: 1.1, note: 'Play is forced wide, which is where they want it', ball: { x: 78, y: 58 }, opponents: [{ x: 50, y: 74 }, { x: 36, y: 62 }, { x: 78, y: 56 }, { x: 50, y: 52 }, { x: 50, y: 36 }] },
          { duration: 1.1, note: 'The wing-back and the outside centre-back trap him on the line', players: { p8: { x: 82, y: 52 }, p4: { x: 70, y: 44 } } },
          { duration: 0.9, note: 'The ball is won and played straight inside', ball: { x: 62, y: 46 } },
        ],
      },
      {
        intro: 'If it does not: the switch beats the shift and the far side is open.',
        opponents: [{ x: 50, y: 66 }, { x: 36, y: 56 }, { x: 72, y: 52 }, { x: 50, y: 46 }, { x: 50, y: 32 }],
        steps: [
          { duration: 1, note: 'The whole shape has shifted to one side of the pitch', players: { p5: { x: 40, y: 46 }, p6: { x: 52, y: 46 }, p7: { x: 64, y: 46 }, p8: { x: 76, y: 46 } } },
          { duration: 1.1, note: 'A long diagonal finds the free man on the other flank', ball: { x: 14, y: 40 }, opponents: [{ x: 50, y: 66 }, { x: 14, y: 38 }, { x: 72, y: 52 }, { x: 50, y: 46 }, { x: 50, y: 32 }] },
          { duration: 1.1, note: 'The wing-back cannot get back in time', players: { p5: { x: 30, y: 40 } } },
          { duration: 1.1, note: 'The back three slides across and the middle one covers', players: { p2: { x: 30, y: 24 }, p3: { x: 44, y: 22 }, p4: { x: 58, y: 24 } }, ball: { x: 22, y: 24 } },
          { duration: 0.9, note: 'The cross is cut out at the near post', players: { p2: { x: 36, y: 16 } }, ball: { x: 40, y: 16 } },
        ],
      },
    ],
  },
  'amorim-sporting-24': {
    attack: [
      {
        intro: 'The same movements every week, run without thinking.',
        opponents: [{ x: 38, y: 24 }, { x: 50, y: 22 }, { x: 62, y: 24 }, { x: 44, y: 42 }, { x: 56, y: 42 }],
        steps: [
          { duration: 1, note: 'The back three splits wide and the keeper joins the build-up', players: { p2: { x: 24, y: 68 }, p4: { x: 76, y: 68 } }, ball: { x: 50, y: 78 } },
          { duration: 1.1, note: 'Both wing-backs are already at the halfway line', players: { p5: { x: 8, y: 46 }, p8: { x: 92, y: 46 } } },
          { duration: 1.1, note: 'The inside forwards tuck in narrow, leaving the flanks clear', players: { p9: { x: 38, y: 26 }, p11: { x: 62, y: 26 } } },
          { duration: 1.1, note: 'The pass goes into the striker with his back to goal', players: { p10: { x: 50, y: 28 } }, ball: { x: 50, y: 30 } },
          { duration: 1, note: 'He lays it off and spins in behind immediately', players: { p10: { x: 54, y: 14 } }, ball: { x: 40, y: 30 } },
          { duration: 0.9, note: 'Threaded through for the run', ball: { x: 55, y: 12 } },
        ],
      },
      {
        intro: 'The other route: win it and go direct to the striker.',
        opponents: [{ x: 44, y: 44 }, { x: 56, y: 44 }, { x: 50, y: 56 }, { x: 36, y: 32 }, { x: 64, y: 32 }],
        steps: [
          { duration: 1, note: 'The ball is won in midfield by the holder', players: { p6: { x: 50, y: 46 } }, ball: { x: 50, y: 48 } },
          { duration: 1.1, note: 'The striker is already running before the pass is played', players: { p10: { x: 52, y: 26 } } },
          { duration: 1.1, note: 'One pass over the top rather than a build-up', ball: { x: 54, y: 24 } },
          { duration: 1.1, note: 'He drives at the last defender with support arriving wide', players: { p10: { x: 52, y: 14 }, p11: { x: 72, y: 16 } }, ball: { x: 53, y: 15 } },
          { duration: 0.9, note: 'Finished across the keeper', ball: { x: 48, y: 4 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'When it works: the block stays narrow and the ball is forced wide.',
        opponents: [{ x: 50, y: 74 }, { x: 36, y: 62 }, { x: 64, y: 62 }, { x: 50, y: 52 }, { x: 50, y: 36 }],
        steps: [
          { duration: 1, note: 'Everyone shuffles into a compact central block', players: { p9: { x: 42, y: 44 }, p11: { x: 58, y: 44 }, p6: { x: 44, y: 52 }, p7: { x: 56, y: 52 } } },
          { duration: 1.1, note: 'The middle is shut, so the only pass is outside', ball: { x: 76, y: 60 } },
          { duration: 1.1, note: 'The wing-back goes to meet him rather than dropping off', players: { p8: { x: 80, y: 54 } } },
          { duration: 1.1, note: 'The back three shifts across to cover behind', players: { p2: { x: 38, y: 40 }, p3: { x: 52, y: 38 }, p4: { x: 66, y: 40 } } },
          { duration: 0.9, note: 'The cross is blocked and the ball runs out for a throw', ball: { x: 88, y: 46 } },
        ],
      },
      {
        intro: 'If it does not: the wing-back is beaten and the back three is exposed.',
        opponents: [{ x: 50, y: 66 }, { x: 36, y: 56 }, { x: 78, y: 52 }, { x: 50, y: 46 }, { x: 50, y: 30 }],
        steps: [
          { duration: 1, note: 'The winger goes past the wing-back on the outside', ball: { x: 84, y: 40 }, opponents: [{ x: 50, y: 66 }, { x: 36, y: 56 }, { x: 84, y: 40 }, { x: 50, y: 46 }, { x: 50, y: 30 }] },
          { duration: 1.1, note: 'Only three defenders remain against the players in the box', players: { p8: { x: 84, y: 52 } } },
          { duration: 1.1, note: 'The outside centre-back steps out to close the cross', players: { p4: { x: 72, y: 30 } } },
          { duration: 1.1, note: 'The other two hold the middle rather than following the ball', players: { p2: { x: 40, y: 20 }, p3: { x: 52, y: 18 } }, ball: { x: 60, y: 20 } },
          { duration: 0.9, note: 'The keeper claims it ahead of the runner', players: { p1: { x: 50, y: 12 } }, ball: { x: 50, y: 10 } },
        ],
      },
    ],
  },
  'flick-bayern-20': {
    attack: [
      {
        intro: 'Everything pushed forward, and the opponent pinned in.',
        opponents: [{ x: 40, y: 16 }, { x: 50, y: 14 }, { x: 60, y: 16 }, { x: 44, y: 30 }, { x: 56, y: 30 }],
        steps: [
          { duration: 1, note: 'The defensive line sits on the halfway line, the keeper well outside his box', players: { p1: { x: 50, y: 62 }, p3: { x: 44, y: 46 }, p4: { x: 56, y: 46 } } },
          { duration: 1.1, note: 'The left-back attacks like a winger down the outside', players: { p2: { x: 10, y: 26 } }, ball: { x: 12, y: 28 } },
          { duration: 1.1, note: 'The wingers come inside to attack the box, not the touchline', players: { p8: { x: 38, y: 16 }, p10: { x: 62, y: 16 } } },
          { duration: 1.1, note: 'The ten drifts into the space the centre-backs have left', players: { p9: { x: 52, y: 22 } } },
          { duration: 1, note: 'Squared low across the six-yard box', ball: { x: 46, y: 8 } },
          { duration: 0.9, note: 'Tapped in by the striker arriving at the near post', players: { p11: { x: 48, y: 7 } }, ball: { x: 48, y: 4 } },
        ],
      },
      {
        intro: 'The other route: win it back instantly and score before they breathe.',
        opponents: [{ x: 44, y: 34 }, { x: 56, y: 34 }, { x: 50, y: 46 }, { x: 36, y: 24 }, { x: 64, y: 24 }],
        steps: [
          { duration: 0.9, note: 'Possession is lost near their box', ball: { x: 50, y: 36 } },
          { duration: 1, note: 'Three players surround the ball within two seconds', players: { p9: { x: 48, y: 34 }, p6: { x: 54, y: 38 }, p8: { x: 42, y: 32 } } },
          { duration: 1, note: 'It is won back immediately, ten yards from where it was lost', ball: { x: 48, y: 32 } },
          { duration: 1.1, note: 'The defence has not had time to reset', opponents: [{ x: 44, y: 26 }, { x: 56, y: 26 }, { x: 50, y: 40 }, { x: 36, y: 22 }, { x: 64, y: 22 }] },
          { duration: 0.9, note: 'Struck first time from the edge of the box', ball: { x: 50, y: 6 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'When it works: the press arrives before the pass can.',
        opponents: [{ x: 50, y: 82 }, { x: 34, y: 72 }, { x: 66, y: 72 }, { x: 50, y: 62 }, { x: 50, y: 44 }],
        steps: [
          { duration: 1, note: 'The striker presses the goalkeeper alone', players: { p11: { x: 50, y: 76 } }, ball: { x: 50, y: 84 } },
          { duration: 1, note: 'The wingers cut the passes to both full-backs', players: { p8: { x: 34, y: 68 }, p10: { x: 66, y: 68 } } },
          { duration: 1.1, note: 'The midfield follows them up the pitch, keeping the lines short', players: { p6: { x: 44, y: 60 }, p7: { x: 56, y: 60 }, p9: { x: 50, y: 66 } } },
          { duration: 1.1, note: 'The defence steps to halfway and the keeper sweeps behind', players: { p3: { x: 44, y: 44 }, p4: { x: 56, y: 44 }, p1: { x: 50, y: 58 } } },
          { duration: 0.9, note: 'The goalkeeper is forced long and the header is won', ball: { x: 50, y: 48 } },
        ],
      },
      {
        intro: 'If it does not: one pass clears the press and the space behind is huge.',
        opponents: [{ x: 50, y: 78 }, { x: 34, y: 68 }, { x: 66, y: 68 }, { x: 50, y: 58 }, { x: 50, y: 40 }],
        steps: [
          { duration: 1, note: 'The keeper finds a forward between the lines', ball: { x: 50, y: 56 } },
          { duration: 1.1, note: 'He turns, and there is half a pitch of grass behind the defence', opponents: [{ x: 50, y: 78 }, { x: 34, y: 68 }, { x: 66, y: 68 }, { x: 50, y: 52 }, { x: 50, y: 30 }] },
          { duration: 1.1, note: 'The keeper is already sprinting out of his area', players: { p1: { x: 50, y: 40 } } },
          { duration: 1.1, note: 'He meets the ball outside the box, as a defender would', players: { p1: { x: 50, y: 34 } }, ball: { x: 50, y: 34 } },
          { duration: 0.9, note: 'Cleared first time, and the line pushes straight back up', players: { p1: { x: 50, y: 58 } }, ball: { x: 30, y: 56 } },
        ],
      },
    ],
  },
  'simeone-atleti-14': {
    attack: [
      {
        intro: 'Concede the ball, win it back, and go at once.',
        opponents: [{ x: 40, y: 44 }, { x: 60, y: 44 }, { x: 50, y: 56 }, { x: 34, y: 30 }, { x: 66, y: 30 }],
        steps: [
          { duration: 1, note: 'Two banks of four sit deep and let them come', players: { p6: { x: 30, y: 56 }, p7: { x: 44, y: 56 }, p8: { x: 56, y: 56 }, p9: { x: 70, y: 56 } } },
          { duration: 1, note: 'The ball is won by a midfielder in his own half', ball: { x: 46, y: 58 } },
          { duration: 1.1, note: 'The first pass is forward into the striker', players: { p10: { x: 48, y: 32 } }, ball: { x: 48, y: 34 } },
          { duration: 1.1, note: 'He holds it up while the second striker runs beyond', players: { p11: { x: 62, y: 20 } } },
          { duration: 1, note: 'The wide midfielder sprints fifty yards to support', players: { p9: { x: 78, y: 26 } } },
          { duration: 0.9, note: 'Laid into the run and finished across goal', ball: { x: 60, y: 12 } },
        ],
      },
      {
        intro: 'The other route: a corner, worked exactly as rehearsed.',
        opponents: [{ x: 42, y: 12 }, { x: 50, y: 10 }, { x: 58, y: 12 }, { x: 46, y: 18 }, { x: 54, y: 18 }],
        steps: [
          { duration: 1, note: 'The centre-backs come up for the set piece', players: { p3: { x: 46, y: 22 }, p4: { x: 54, y: 22 } }, ball: { x: 2, y: 4 } },
          { duration: 1.1, note: 'They gather deliberately at the back post', players: { p3: { x: 62, y: 16 }, p4: { x: 66, y: 14 } } },
          { duration: 1.1, note: 'The delivery is aimed beyond everyone', ball: { x: 66, y: 10 } },
          { duration: 1, note: 'The captain attacks it with a running jump', players: { p4: { x: 64, y: 10 } } },
          { duration: 0.9, note: 'Headed back across the keeper and in', ball: { x: 48, y: 4 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'When it works: two banks of four and no way through.',
        opponents: [{ x: 50, y: 62 }, { x: 34, y: 52 }, { x: 66, y: 52 }, { x: 50, y: 42 }, { x: 50, y: 28 }],
        steps: [
          { duration: 1, note: 'The two lines sit narrow, barely twenty yards apart', players: { p6: { x: 32, y: 50 }, p7: { x: 44, y: 50 }, p8: { x: 56, y: 50 }, p9: { x: 68, y: 50 } } },
          { duration: 1.1, note: 'The strikers screen the pass into midfield', players: { p10: { x: 44, y: 58 }, p11: { x: 56, y: 58 } } },
          { duration: 1.1, note: 'Every pass sideways is allowed; every pass inside is not', ball: { x: 72, y: 50 } },
          { duration: 1.1, note: 'The whole block slides across as one unit', players: { p6: { x: 44, y: 50 }, p7: { x: 56, y: 50 }, p8: { x: 68, y: 50 }, p9: { x: 80, y: 50 }, p5: { x: 78, y: 38 } } },
          { duration: 0.9, note: 'The cross is headed away by a centre-back who never left the middle', ball: { x: 44, y: 40 } },
        ],
      },
      {
        intro: 'If it does not: someone slips inside and the block collapses onto him.',
        opponents: [{ x: 50, y: 54 }, { x: 34, y: 46 }, { x: 66, y: 46 }, { x: 50, y: 38 }, { x: 50, y: 26 }],
        steps: [
          { duration: 1, note: 'A pass finally splits the two lines', ball: { x: 50, y: 44 }, opponents: [{ x: 50, y: 54 }, { x: 34, y: 46 }, { x: 66, y: 46 }, { x: 50, y: 42 }, { x: 50, y: 26 }] },
          { duration: 1.1, note: 'Two midfielders turn and close him down together', players: { p7: { x: 48, y: 42 }, p8: { x: 54, y: 42 } } },
          { duration: 1.1, note: 'The back four does not step: it drops and stays compact', players: { p2: { x: 30, y: 26 }, p3: { x: 44, y: 24 }, p4: { x: 56, y: 24 }, p5: { x: 70, y: 26 } } },
          { duration: 1.1, note: 'The shot comes from distance, with bodies in the way', ball: { x: 50, y: 30 } },
          { duration: 0.9, note: 'Blocked, and the ball is hacked clear without ceremony', ball: { x: 26, y: 48 } },
        ],
      },
    ],
  },
  'kompany-bayern-25': {
    attack: [
      {
        intro: 'Keep the ball high and let the front three interchange.',
        opponents: [{ x: 38, y: 20 }, { x: 50, y: 18 }, { x: 62, y: 20 }, { x: 44, y: 36 }, { x: 56, y: 36 }],
        steps: [
          { duration: 1, note: 'Possession is used to pin them in their own half', players: { p3: { x: 44, y: 48 }, p4: { x: 56, y: 48 } }, ball: { x: 50, y: 50 } },
          { duration: 1.1, note: 'The ten drops into the pocket and the winger goes past him', players: { p9: { x: 50, y: 30 }, p10: { x: 74, y: 22 } } },
          { duration: 1.1, note: 'The pass is vertical the moment it is on', ball: { x: 50, y: 28 } },
          { duration: 1.1, note: 'The striker pulls the centre-backs one way, the winger runs the other', players: { p11: { x: 40, y: 14 } }, opponents: [{ x: 40, y: 16 }, { x: 52, y: 14 }, { x: 62, y: 20 }, { x: 44, y: 30 }, { x: 56, y: 30 }] },
          { duration: 1, note: 'Slipped between the full-back and the centre-back', ball: { x: 70, y: 14 } },
          { duration: 0.9, note: 'Cut back for the striker at the penalty spot', players: { p11: { x: 50, y: 11 } }, ball: { x: 50, y: 10 } },
        ],
      },
      {
        intro: 'The other route: the striker holds it and everyone runs past him.',
        opponents: [{ x: 40, y: 24 }, { x: 50, y: 22 }, { x: 60, y: 24 }, { x: 44, y: 40 }, { x: 56, y: 40 }],
        steps: [
          { duration: 1, note: 'The ball goes long into the striker with his back to goal', players: { p11: { x: 50, y: 30 } }, ball: { x: 50, y: 32 } },
          { duration: 1.1, note: 'He shields it while the two wide players sprint beyond', players: { p8: { x: 30, y: 20 }, p10: { x: 70, y: 20 } } },
          { duration: 1.1, note: 'Laid off to the ten arriving at pace', players: { p9: { x: 54, y: 32 } }, ball: { x: 54, y: 34 } },
          { duration: 1.1, note: 'First time out to the right, into the space behind the full-back', ball: { x: 74, y: 18 } },
          { duration: 0.9, note: 'Squared back for the striker, who never stopped running', players: { p11: { x: 50, y: 9 } }, ball: { x: 50, y: 8 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'When it works: press high and take the ball back at once.',
        opponents: [{ x: 50, y: 80 }, { x: 34, y: 70 }, { x: 66, y: 70 }, { x: 50, y: 60 }, { x: 50, y: 44 }],
        steps: [
          { duration: 1, note: 'The striker curves his run to cut the pass across the back', players: { p11: { x: 46, y: 74 } }, ball: { x: 50, y: 82 } },
          { duration: 1, note: 'The ten steps onto their holding midfielder', players: { p9: { x: 50, y: 64 } } },
          { duration: 1.1, note: 'The wide players push on so nobody is free out wide', players: { p8: { x: 32, y: 66 }, p10: { x: 68, y: 66 } } },
          { duration: 1.1, note: 'The defence stays high, keeping the team in one short block', players: { p3: { x: 44, y: 46 }, p4: { x: 56, y: 46 } } },
          { duration: 0.9, note: 'The pass is cut out thirty yards from their goal', ball: { x: 40, y: 64 } },
        ],
      },
      {
        intro: 'If it does not: they break the line and the high line is punished.',
        opponents: [{ x: 50, y: 74 }, { x: 34, y: 64 }, { x: 66, y: 64 }, { x: 50, y: 54 }, { x: 50, y: 40 }],
        steps: [
          { duration: 1, note: 'A first-time pass takes out the front two', ball: { x: 50, y: 56 } },
          { duration: 1.1, note: 'Their forward runs into the space behind the defence', opponents: [{ x: 50, y: 74 }, { x: 34, y: 64 }, { x: 66, y: 64 }, { x: 50, y: 50 }, { x: 52, y: 28 }] },
          { duration: 1.1, note: 'The full-back tucks in to become an extra centre-back', players: { p2: { x: 38, y: 30 } } },
          { duration: 1.1, note: 'The centre-back forces him away from goal', players: { p4: { x: 58, y: 24 } }, ball: { x: 56, y: 24 } },
          { duration: 0.9, note: 'The angle is gone and the keeper saves at his near post', players: { p1: { x: 55, y: 10 } }, ball: { x: 60, y: 10 } },
        ],
      },
    ],
  },
  'tuchel-psg-20': {
    attack: [
      {
        intro: 'Free the front three and let the midfield do the rest.',
        opponents: [{ x: 38, y: 22 }, { x: 50, y: 20 }, { x: 62, y: 22 }, { x: 44, y: 40 }, { x: 56, y: 40 }],
        steps: [
          { duration: 1, note: 'The centre-back steps into midfield to add a passer', players: { p7: { x: 50, y: 56 } }, ball: { x: 50, y: 58 } },
          { duration: 1.1, note: 'The front three stay high and do not come back to help', players: { p9: { x: 26, y: 22 }, p10: { x: 50, y: 18 }, p11: { x: 74, y: 22 } } },
          { duration: 1.1, note: 'The pass finds the left forward between the lines', players: { p9: { x: 30, y: 28 } }, ball: { x: 30, y: 30 } },
          { duration: 1.2, note: 'He drives inside, drawing two defenders towards him', players: { p9: { x: 42, y: 22 } }, ball: { x: 43, y: 23 }, opponents: [{ x: 40, y: 22 }, { x: 48, y: 22 }, { x: 62, y: 22 }, { x: 44, y: 34 }, { x: 56, y: 40 }] },
          { duration: 1, note: 'The striker has already gone the other way', players: { p10: { x: 62, y: 12 } } },
          { duration: 0.9, note: 'Threaded into the gap the two defenders left', ball: { x: 62, y: 10 } },
        ],
      },
      {
        intro: 'The other route: break at speed the instant the ball is won.',
        opponents: [{ x: 44, y: 40 }, { x: 56, y: 40 }, { x: 50, y: 52 }, { x: 36, y: 28 }, { x: 64, y: 28 }],
        steps: [
          { duration: 0.9, note: 'The midfield wins it back deep', players: { p8: { x: 50, y: 52 } }, ball: { x: 50, y: 54 } },
          { duration: 1, note: 'The forwards are already running, having stayed high', players: { p10: { x: 50, y: 24 }, p11: { x: 70, y: 26 } } },
          { duration: 1.1, note: 'One pass upfield and the defence is in a foot race', ball: { x: 52, y: 26 } },
          { duration: 1.1, note: 'The striker takes it in his stride and pulls wide', players: { p10: { x: 62, y: 14 } }, ball: { x: 62, y: 13 } },
          { duration: 0.9, note: 'Rolled back to the far forward arriving unmarked', players: { p9: { x: 40, y: 10 } }, ball: { x: 42, y: 8 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'When it works: the midfield three covers for the forwards.',
        opponents: [{ x: 50, y: 72 }, { x: 34, y: 62 }, { x: 66, y: 62 }, { x: 50, y: 52 }, { x: 50, y: 36 }],
        steps: [
          { duration: 1, note: 'The front three stay high rather than tracking back', players: { p9: { x: 30, y: 40 }, p10: { x: 50, y: 36 }, p11: { x: 70, y: 40 } } },
          { duration: 1.1, note: 'That leaves three midfielders to cover the whole width', players: { p6: { x: 36, y: 52 }, p7: { x: 50, y: 54 }, p8: { x: 64, y: 52 } } },
          { duration: 1.1, note: 'They shuffle across together rather than chasing the ball', players: { p6: { x: 46, y: 52 }, p7: { x: 60, y: 54 }, p8: { x: 74, y: 52 } }, ball: { x: 70, y: 56 } },
          { duration: 1.1, note: 'The full-back holds his position instead of diving in', players: { p5: { x: 80, y: 44 } } },
          { duration: 0.9, note: 'The ball is won and given straight to the forwards', ball: { x: 62, y: 44 } },
        ],
      },
      {
        intro: 'If it does not: the midfield is outnumbered and the back four is alone.',
        opponents: [{ x: 50, y: 64 }, { x: 34, y: 54 }, { x: 66, y: 54 }, { x: 50, y: 44 }, { x: 50, y: 32 }],
        steps: [
          { duration: 1, note: 'They commit an extra man into midfield', ball: { x: 50, y: 46 }, opponents: [{ x: 50, y: 64 }, { x: 34, y: 54 }, { x: 66, y: 54 }, { x: 46, y: 44 }, { x: 56, y: 42 }] },
          { duration: 1.1, note: 'Three against four, and the pass goes through', ball: { x: 56, y: 32 } },
          { duration: 1.1, note: 'The back four has to defend the counter on its own', players: { p2: { x: 28, y: 28 }, p3: { x: 44, y: 26 }, p4: { x: 56, y: 26 }, p5: { x: 72, y: 28 } } },
          { duration: 1.1, note: 'The nearest centre-back steps out and the others cover behind him', players: { p4: { x: 58, y: 20 }, p3: { x: 46, y: 22 } } },
          { duration: 0.9, note: 'The tackle is made just outside the box', ball: { x: 58, y: 20 } },
        ],
      },
    ],
  },
  'tuchel-chelsea-21': {
    attack: [
      {
        intro: 'Patient in the middle, then one runner goes beyond.',
        opponents: [{ x: 38, y: 24 }, { x: 50, y: 22 }, { x: 62, y: 24 }, { x: 44, y: 42 }, { x: 56, y: 42 }],
        steps: [
          { duration: 1.1, note: 'The back three and the two holders pass among themselves', players: { p6: { x: 44, y: 58 } }, ball: { x: 44, y: 60 } },
          { duration: 1.1, note: 'The wing-backs stretch the pitch on both touchlines', players: { p5: { x: 8, y: 36 }, p8: { x: 92, y: 36 } } },
          { duration: 1.1, note: 'The two forwards stay narrow, in the space between their lines', players: { p9: { x: 44, y: 30 }, p10: { x: 56, y: 30 } } },
          { duration: 1.1, note: 'The pass goes into one of them, who turns immediately', ball: { x: 56, y: 30 } },
          { duration: 1, note: 'The striker runs beyond the last defender the moment he turns', players: { p11: { x: 58, y: 14 } } },
          { duration: 0.9, note: 'Released in behind and finished low', ball: { x: 56, y: 8 } },
        ],
      },
      {
        intro: 'The other route: the wing-back arrives from deep to cross.',
        opponents: [{ x: 38, y: 18 }, { x: 50, y: 16 }, { x: 62, y: 18 }, { x: 44, y: 34 }, { x: 56, y: 34 }],
        steps: [
          { duration: 1, note: 'The ball is switched to the right wing-back', players: { p8: { x: 92, y: 34 } }, ball: { x: 90, y: 34 } },
          { duration: 1.1, note: 'He carries it forward with nobody tracking him', players: { p8: { x: 88, y: 20 } }, ball: { x: 87, y: 21 } },
          { duration: 1.1, note: 'The striker attacks the near post, a forward the penalty spot', players: { p11: { x: 44, y: 10 }, p10: { x: 52, y: 16 } } },
          { duration: 1, note: 'The cross is driven low across the six-yard box', ball: { x: 50, y: 8 } },
          { duration: 0.9, note: 'Turned in first time at the near post', ball: { x: 46, y: 4 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'When it works: nothing goes through the middle at all.',
        opponents: [{ x: 50, y: 74 }, { x: 36, y: 62 }, { x: 64, y: 62 }, { x: 50, y: 52 }, { x: 50, y: 36 }],
        steps: [
          { duration: 1, note: 'Three centre-backs and two holders fill the centre', players: { p6: { x: 44, y: 48 }, p7: { x: 56, y: 48 } } },
          { duration: 1.1, note: 'The two forwards drop in to screen the passes', players: { p9: { x: 44, y: 56 }, p10: { x: 56, y: 56 } } },
          { duration: 1.1, note: 'There is no pass inside, so it goes sideways again', ball: { x: 34, y: 60 } },
          { duration: 1.1, note: 'The wing-back steps out to meet it and the block shifts across', players: { p5: { x: 26, y: 52 }, p2: { x: 36, y: 40 }, p3: { x: 50, y: 38 }, p4: { x: 62, y: 40 } } },
          { duration: 0.9, note: 'Won cleanly, and nothing has come near the goal', ball: { x: 40, y: 46 } },
        ],
      },
      {
        intro: 'If it does not: a runner gets between the wing-back and the defence.',
        opponents: [{ x: 50, y: 66 }, { x: 36, y: 56 }, { x: 64, y: 56 }, { x: 50, y: 46 }, { x: 50, y: 32 }],
        steps: [
          { duration: 1, note: 'A ball is clipped into the channel outside the back three', ball: { x: 74, y: 34 }, opponents: [{ x: 50, y: 66 }, { x: 36, y: 56 }, { x: 74, y: 32 }, { x: 50, y: 46 }, { x: 50, y: 32 }] },
          { duration: 1.1, note: 'The wing-back is caught too high to recover', players: { p8: { x: 84, y: 44 } } },
          { duration: 1.1, note: 'The outside centre-back goes with him instead of waiting', players: { p4: { x: 70, y: 26 } } },
          { duration: 1.1, note: 'The other two shift across and cover the middle', players: { p2: { x: 38, y: 22 }, p3: { x: 52, y: 20 } }, ball: { x: 66, y: 22 } },
          { duration: 0.9, note: 'Forced wide, and the cross is headed away', ball: { x: 46, y: 26 } },
        ],
      },
    ],
  },
};
