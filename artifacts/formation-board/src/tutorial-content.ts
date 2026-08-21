// ---------------------------------------------------------------------------
// The tutorial: twelve things to do, in the order that makes them make sense.
//
// It is a coach standing next to you during a real match, not a scripted demo.
// Nothing here fakes the game — every step waits for you to actually do the
// thing on a live pitch, against a side that is genuinely trying to stop you.
//
// The shape of a step is deliberate:
//
//   ask    — the one thing to do, in the imperative, short enough to hold in
//            your head while you look at the pitch
//   why    — what it is FOR. A tutorial that teaches inputs without teaching
//            football teaches nothing worth knowing.
//   awaits — the match event that counts as having done it
//
// A step you cannot do right now (you cannot shoot from your own box) is
// skippable, always. Being stuck is worse than missing one.
// ---------------------------------------------------------------------------

/** What the match tells the tutorial has happened. */
export type MatchEventKind =
  | 'kickOff'
  | 'move'
  | 'drawn'
  | 'run'
  | 'ranOn'
  | 'block'
  | 'challenge'
  | 'switch'
  | 'goal';

export type MatchEvent = {
  kind: MatchEventKind;
  /** The move or stance id, where there is one. */
  id?: string;
  /** For a drawn move: what it turned out to be. */
  drew?: 'pass' | 'carry' | 'shot';
  lofted?: boolean;
  curved?: boolean;
  /** A pass aimed at the end of a run you had drawn. */
  ontoRun?: boolean;
  /** For a run: whether it was timed to the pass. */
  when?: 'now' | 'onPass';
};

/** Which half of the game a step belongs to, so the coach can say "not yet"
 *  instead of leaving you staring at an instruction you cannot follow. */
export type Needs = 'ball' | 'defending' | 'any';

export type TutorialStep = {
  id: string;
  needs: Needs;
  /** Which part of the game this belongs to, shown as a chapter marker. */
  chapter: string;
  title: string;
  ask: string;
  why: string;
  /** True when this event completes the step. */
  done: (event: MatchEvent) => boolean;
};

export const TUTORIAL: TutorialStep[] = [
  {
    id: 'kick-off',
    needs: 'any',
    chapter: 'The basics',
    title: 'Get the game going',
    ask: 'Press Kick off.',
    why:
      'You are the manager, not a player. The clock only runs while the ball is in play, so from here on you can think for as long as you like between decisions — it costs you nothing.',
    done: (e) => e.kind === 'kickOff',
  },
  {
    id: 'listed-move',
    needs: 'ball',
    chapter: 'The basics',
    title: 'Play one from the list',
    ask: 'Click any of the moves in the panel.',
    why:
      'These are what your style allows. The number beside each one is the chance of losing the ball doing it — the game never hides the price from you on Easy.',
    done: (e) => e.kind === 'move',
  },
  {
    id: 'draw-pass',
    needs: 'ball',
    chapter: 'With the ball',
    title: 'Draw a pass yourself',
    ask: 'Drag from the man with the ring round him onto a team-mate.',
    why:
      'The list is a suggestion. Drawing is the real control: you can play the ball to anyone, at any range, including back to your own keeper.',
    done: (e) => e.kind === 'drawn' && e.drew === 'pass',
  },
  {
    id: 'carry',
    needs: 'ball',
    chapter: 'With the ball',
    title: 'Take it into space',
    ask: 'Drag from the man on the ball into empty grass instead of onto a player.',
    why:
      'Finish the arrow on a man and it is a pass. Finish it on grass and he takes it there himself. That one rule is the whole of the difference.',
    done: (e) => e.kind === 'drawn' && e.drew === 'carry',
  },
  {
    id: 'run',
    needs: 'any',
    chapter: 'Making space',
    title: 'Move somebody without the ball',
    ask: 'Drag from any other player to send him somewhere.',
    why:
      'You can move anyone, not just the man on it. Tap a player to cancel a run you have given him.',
    done: (e) => e.kind === 'run',
  },
  {
    id: 'drag-a-marker',
    needs: 'any',
    chapter: 'Making space',
    title: 'Pull a defender out of position',
    ask: 'Send a forward out towards the touchline, and watch their defence.',
    why:
      'Their players pick yours up. Move a man and his marker goes with him — so the way you make room in the middle is by dragging somebody out of it. This is the most useful thing in the game.',
    done: (e) => e.kind === 'run',
  },
  {
    id: 'timed-run',
    needs: 'ball',
    chapter: 'Making space',
    title: 'Play someone in behind',
    ask:
      'With "Goes when the ball does" selected, draw a run in behind their defence — then pass to where he is going, not to where he is.',
    why:
      'He holds his position and sets off as you play it, so he is onside when the ball leaves. That is how you beat a high line, and it is the whole point of the timing switch.',
    done: (e) => e.kind === 'drawn' && Boolean(e.ontoRun),
  },
  {
    id: 'run-on',
    needs: 'ball',
    chapter: 'With the ball',
    title: 'Send him on',
    ask: 'When a pass lands and the prompt says "Go on!", click it.',
    why:
      'Nothing runs with the ball unless you say so. Take the prompt and he drives at them; ignore it and he stops and looks up. It only appears when he actually has somewhere to go.',
    done: (e) => e.kind === 'ranOn',
  },
  {
    id: 'shoot',
    needs: 'ball',
    chapter: 'Finishing',
    title: 'Have a go',
    ask: 'Drag from the man on the ball so the arrow finishes on their goal.',
    why:
      'You can shoot from anywhere. Thirty-five yards out with three men in the way is a bad idea rather than an impossible one, and the panel will tell you which. This one goes in wherever you hit it from — after that you are on your own.',
    done: (e) => e.kind === 'drawn' && e.drew === 'shot',
  },
  {
    id: 'curl',
    needs: 'ball',
    chapter: 'Finishing',
    title: 'Bend one',
    ask: 'Shoot again, but curve the arrow as you drag it.',
    why:
      'Curl takes the ball round bodies and brings it back from a tight angle. With the goal gaping it is a flourish, and flourishes miss — the panel says which it is before you let go.',
    done: (e) => e.kind === 'drawn' && e.drew === 'shot' && Boolean(e.curved),
  },
  {
    id: 'block',
    needs: 'defending',
    chapter: 'Without the ball',
    title: 'Decide where you defend',
    ask: 'When they win it, pick a block height — High, Mid or Low.',
    why:
      'A standing decision that frames everything else. It is a ceiling, not a rule: once they are in your box, your side defends where the ball is whatever you picked.',
    done: (e) => e.kind === 'block',
  },
  {
    id: 'challenge',
    needs: 'defending',
    chapter: 'Without the ball',
    title: 'Choose how to go about it',
    ask: 'Pick a challenge and let the passage play.',
    why:
      'Each one stops something and hands over something else. Press and the space in behind is theirs; drop off and they can have the midfield. There is no safe answer, only a read.',
    done: (e) => e.kind === 'challenge',
  },
  {
    id: 'switch',
    needs: 'defending',
    chapter: 'Without the ball',
    title: 'Change it while it is happening',
    ask: 'During their passage, pick a different challenge from "Change it while they have it".',
    why:
      'You are not locked in for the passage. Switching takes effect on the next beat and costs your side the run back into the new shape — which is exactly what it should cost.',
    done: (e) => e.kind === 'switch',
  },
];

/** Shown once the last step is done. */
export const TUTORIAL_DONE = {
  title: 'That is the game',
  lines: [
    'Everything else is football. Pick a shape you fancy, pick one for them, and read what is in front of you.',
    'How to play, at the foot of the panel, has all of this as a reference if you need to look something up mid-match.',
  ],
};
