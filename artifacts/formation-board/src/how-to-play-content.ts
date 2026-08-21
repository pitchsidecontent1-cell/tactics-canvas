// ---------------------------------------------------------------------------
// How to play: the controls, and what the game is asking of you.
//
// Copy only — no UI code. The rule for everything in here is that it has to be
// TRUE of the game as it actually behaves, not as it was once designed to. If
// you change a control in match-game.tsx or a law in match-model.ts, this file
// is where the change has to be written down as well.
//
// Section ids are stable: the contents list and the deep links from the match
// screen scroll to them.
// ---------------------------------------------------------------------------

/** One thing you can do, and what the game does about it. */
export type Control = {
  /** The action, in the imperative — 'Drag from the man on the ball'. */
  action: string;
  /** What that gets you. */
  result: string;
  /** The detail that stops it being a nasty surprise later. */
  note?: string;
};

export type HowToSection = {
  /** Stable anchor id — the contents list scrolls to it. */
  id: string;
  title: string;
  blurb: string;
  controls?: Control[];
  points?: string[];
};

export const HOW_TO_PLAY: HowToSection[] = [
  {
    id: 'the-idea',
    title: 'What you are actually doing',
    blurb:
      'You are not controlling a player. You are the manager on the touchline: you decide what your side tries, and then you watch whether it comes off.',
    points: [
      'A match is sixty seconds of football. The clock only runs while the ball is in play — you can stare at the pitch for as long as you like between decisions and it costs you nothing.',
      'Every move has a price. The panel tells you what is on, what it is worth, and what is not on right now and why.',
      'Nothing happens that you did not ask for. If a man is running with the ball, it is because you told him to.',
      'You pick both sides. Any of the 29 shapes, or any of the 41 manager eras with their real XI.',
    ],
  },
  {
    id: 'setting-up',
    title: 'Before kick-off',
    blurb: 'Two shapes, one difficulty, and a whistle.',
    controls: [
      {
        action: 'Your side / Their side',
        result: 'Pick a formation, or a manager’s era — Sacchi’s Milan, Guardiola’s Barcelona, Klopp’s Liverpool.',
        note: 'An era brings the real XI and the way that manager played, on and off the ball.',
      },
      {
        action: 'Easy',
        result: 'Odds on every option, their shape named, and the flag warned about before you play it.',
      },
      {
        action: 'Hard',
        result: 'No numbers. Read their shape yourself, and watch the offside line yourself.',
      },
      { action: 'Kick off', result: 'Starts the match. You have the ball first.' },
    ],
  },
  {
    id: 'on-the-ball',
    title: 'With the ball: the panel',
    blurb:
      'The man on the ball has a ring round him. Everything in the panel is about him.',
    controls: [
      {
        action: 'Your style — Possession, Direct, Pragmatic',
        result: 'Decides which moves you are offered at all, and how your team stands when you have it.',
        note: 'A possession side is never offered a ball over the top. That is the point of choosing.',
      },
      {
        action: 'Click a listed move',
        result: 'Plays it. The number beside it is the chance of losing the ball doing it.',
      },
      {
        action: 'Shoot',
        result: 'Hits it from where he stands, straight. Only shown when he is in range.',
        note: 'The line underneath tells you whether bending it would be worth more than hitting it straight.',
      },
      {
        action: 'Not on right now',
        result: 'The moves you cannot play, and the football reason why not.',
      },
    ],
  },
  {
    id: 'drawing',
    title: 'With the ball: drawing it yourself',
    blurb:
      'The listed moves are suggestions. Drawing is the real control — you can play the ball anywhere, to anyone, at any range.',
    controls: [
      {
        action: 'Drag from the man on the ball onto a team-mate',
        result: 'A pass to him. Your keeper counts — a ball back to him is a normal pass.',
      },
      {
        action: 'Drag from the man on the ball into open grass',
        result: 'He takes it there himself. Finish on a man and it is a pass; finish on grass and he runs with it.',
        note: 'The target is the marker itself and a touch either side, so aim at the man rather than near him.',
      },
      {
        action: 'Drag so the arrow finishes on their goal',
        result: 'A shot, from wherever he is standing. Thirty-five yards out is a bad idea, not an impossible one.',
      },
      {
        action: 'Right-drag (mouse)',
        result: 'Puts the ball in the air, over the top of them, whatever the on-screen choice says.',
      },
      {
        action: 'In the air / Along the ground / Shoot',
        result: 'The same three choices for anyone without a right button. Touch included.',
      },
      {
        action: 'Draw the arrow bending',
        result: 'Bends the ball. Curl it round the wall, or bring it back from a tight angle.',
        note:
          'Curl is not free. It beats bodies in the way and a narrow angle; with the goal gaping it is a flourish, and flourishes miss.',
      },
    ],
  },
  {
    id: 'runs',
    title: 'Sending men on runs',
    blurb: 'You can move anybody, not just the man on the ball.',
    controls: [
      { action: 'Drag from any other player', result: 'Sends him there.' },
      {
        action: 'Goes when the ball does',
        result:
          'He holds his position and sets off as you play it — so he is onside when the ball leaves, and you can pass into the space ahead of him.',
        note: 'This is how you beat an offside trap.',
      },
      {
        action: 'Goes now',
        result: 'He moves immediately. Use it to drag a marker out of position before the ball is played.',
      },
      { action: 'Tap a player', result: 'Cancels the run you gave him.' },
      {
        action: 'A run lasts one play',
        result:
          'He makes it, and then he is back in the game whether the ball came or not. Nobody stands on a patch of grass all afternoon.',
      },
    ],
  },
  {
    id: 'making-space',
    title: 'Making space',
    blurb:
      'This is the part worth learning. Their defenders pick your players up — so you make room for one man by moving a different one.',
    points: [
      'Pull a striker to the touchline and the defender marking him goes with him. Where he was standing is now space.',
      'The space you have made is for somebody else. Move the man, then play the ball through the hole he left.',
      'How much they follow depends on what they are doing. Man-marking follows you everywhere; a low block barely moves; an offside trap holds its line and ignores you completely.',
      'A ball played into a gap with nobody in the lane is the cheapest pass in the game. That is what a through ball is: not a hard pass, a well-made one.',
      'Time the run with the ball and he is onside as it leaves. Send him early and he is offside when it does.',
    ],
  },
  {
    id: 'running-on',
    title: 'Driving at them',
    blurb:
      'A pass arriving is the start of a move, not the end of one — but only if you say so.',
    points: [
      'When a pass lands and the man taking it has grass in front of him, a prompt appears: Go on!',
      'Click it — or anywhere on the pitch — and he drives at them for a beat or two.',
      'Ignore it and he stops, looks up, and the ball is back with you. Nothing happens on its own.',
      'It only appears when there is somewhere to go. Land in a crowd and he has to hold it, and you will be told so.',
    ],
  },
  {
    id: 'off-the-ball',
    title: 'Without the ball',
    blurb:
      'You do not chase the ball yourself. You decide how your team goes about winning it back, and the passage plays out.',
    controls: [
      {
        action: 'How high you defend — High, Mid, Low block',
        result: 'A standing decision about where your team defends. It frames everything else.',
        note:
          'It is a ceiling, not a rule. You cannot hold a high line while the ball is in your own six-yard box — once they are past it, your side defends where the ball is.',
      },
      {
        action: 'Pick a challenge',
        result:
          'How your side goes at it for this passage. What is on the list depends on your block and on where the ball is.',
        note: 'An offside trap belongs to a high or mid block. Nobody plays a line offside on their own goal line.',
      },
      {
        action: 'Change it while they have it',
        result:
          'You are not locked in. Switch mid-passage and it takes effect on the next beat — at the cost of the run back into the new shape.',
      },
      {
        action: 'Re-set the shape',
        result: 'When they play through you, the passage stops and you get to choose again.',
      },
      {
        action: 'Last chance',
        result:
          'When a man is through on goal you get one go at stopping it. What you pick is what prices the shot.',
      },
    ],
  },
  {
    id: 'challenges',
    title: 'The six ways of defending',
    blurb: 'Each one stops something and hands over something else. There is no safe choice.',
    points: [
      'Press the ball — three go at the man on it. Murders their short build-up; the space in behind is theirs.',
      'Spring the offside trap — nobody goes near the ball, the line steps twenty yards as one. The specialist against anything played in behind, and it gives away everything to feet.',
      'Squeeze the line — step up together and compress the game. Balls over the top run into it; there is room in front of it.',
      'Protect the middle — everything central dies. The flanks and the crosses are yours to concede.',
      'Pick up the runners — every man marked, nobody arriving free. Every duel on the pitch is now one against one, so anyone who can beat his man is through.',
      'Drop into a block — nobody dives in. Nothing gets in behind and crosses have no room; you can have the whole midfield.',
    ],
  },
  {
    id: 'the-laws',
    title: 'The laws, as this game plays them',
    blurb: 'The things that will otherwise catch you out.',
    points: [
      'Offside is judged where the receiver is standing as the ball leaves — which is exactly why timing a run beats a high line.',
      'A kick-off has to be played. You cannot run with it from the spot, and neither side can launch it — everybody is in their own half, so there is nothing to run onto.',
      'Neither whistle cuts a move dead. At the half, and again at the end, the clock stops on its mark and a +count starts beside it — the whistle then waits for the ball to change hands, or five seconds, whichever comes first.',
      'That added time is added, not borrowed. None of it comes out of the second half, which is a full half however long the first one overran, and the last attack of the match is allowed to finish.',
      'The clock is stopped whenever it is your turn to think. It only runs while the ball is travelling.',
      'End it here forfeits on the spot, if you have seen enough.',
    ],
  },
  {
    id: 'reading-it',
    title: 'Reading the pitch',
    blurb: 'What the markers are telling you.',
    points: [
      'The ring is the man on the ball. The dashed arrow is a run that has not gone yet.',
      'Nobody teleports. A player covers about seven units of grass in a beat, less if he has to turn round — which is why losing your shape costs you, and why a man in behind stays in behind.',
      'Watch their second-last defender. That is the offside line, and it moves when they change shape.',
      'On easy, every option carries its price. On hard you are reading the same picture without the numbers.',
    ],
  },
];
