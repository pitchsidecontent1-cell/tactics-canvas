// ---------------------------------------------------------------------------
// The rules of the game, as the first thing anybody sees.
//
// Distinct from how-to-play-content.ts on purpose. That file is the CONTROLS —
// what a drag does, what the right button does, where to click. This one is
// the LAWS: how long a match is, when the clock runs, what offside means here,
// what prices a shot. Controls are looked up mid-match; rules are read once
// before you start, which is why this is a page you land on rather than a
// panel you open.
//
// Everything here has to be true of the game as it actually behaves. If a law
// changes in match-model.ts, it changes here in the same commit.
// ---------------------------------------------------------------------------

export type RuleSection = {
  /** Stable anchor id. */
  id: string;
  title: string;
  /** The rule in one line, before any of the detail. */
  blurb: string;
  points: string[];
};

export const RULES: RuleSection[] = [
  {
    id: 'what-you-are',
    title: 'You are the manager',
    blurb:
      'You never control a player. You decide what your side tries, and then you watch whether it comes off.',
    points: [
      'You pick both sides before kick-off — any of the 29 shapes, or any of the 41 manager eras with their real XI.',
      'Easy shows you the odds on every option and names their shape. Hard shows you neither: you read the pitch yourself.',
      'Nothing happens that you did not ask for. If a man is running with the ball, it is because you told him to.',
    ],
  },
  {
    id: 'the-clock',
    title: 'A match is sixty seconds',
    blurb:
      'Sixty seconds of football, in two halves of thirty — and the clock only runs while the ball is actually travelling.',
    points: [
      'Thinking is free. The clock is stopped whenever it is your turn to decide, so you can stare at the pitch for as long as you like.',
      'At the half the clock stops on its mark and up to five seconds are added beside it. Added time is added, never taken out of the second half.',
      'The same happens at the end. Neither whistle cuts a move dead: it waits for the ball to change hands, or for the added seconds to run out.',
      'Most goals when the whistle goes wins it. End it here forfeits on the spot if you have seen enough.',
    ],
  },
  {
    id: 'in-possession',
    title: 'With the ball',
    blurb:
      'Football happens a beat at a time. Every ball you play has a price, and the game tells you what it is.',
    points: [
      'Your style — possession, direct or pragmatic — decides which moves you are offered at all. A possession side is never offered a ball over the top.',
      'The number beside each move is the chance of losing the ball playing it. Play it and the dice are rolled once.',
      'You are not limited to the list: you can draw any ball yourself, to anyone, at any range, including back to your own keeper.',
      'A pass arriving is the start of a move, not the end of one — but the man on it only drives forward if you tell him to.',
      'Lose it and the passage ends there. They have the ball, and you are defending.',
    ],
  },
  {
    id: 'out-of-possession',
    title: 'Without the ball',
    blurb:
      'You do not chase the ball. You set your side up, commit to it, and live with the passage that follows.',
    points: [
      'How high you defend — high, mid or low block — is a standing decision. It is a ceiling, not a rule: once they are in your box, your side defends where the ball is.',
      'Then you pick how to go at it for this passage. Each way stops something and hands over something else; there is no safe answer, only a read.',
      'You are not locked in. Switching mid-passage takes effect on the next beat, at the cost of the run back into the new shape.',
      'When a man is through on goal you get one go at stopping it, and what you pick is what prices the shot.',
    ],
  },
  {
    id: 'the-laws',
    title: 'The laws, as this game plays them',
    blurb: 'The three that will otherwise catch you out.',
    points: [
      'Offside is judged where the receiver is standing at the moment the ball leaves — which is exactly why timing a run beats a high line.',
      'A kick-off has to be played. Nobody can run with it from the spot and neither side can launch it, because everybody is in their own half.',
      'Nobody teleports. A player covers about seven units of grass in a beat and less if he has to turn round, which is why losing your shape costs you.',
    ],
  },
  {
    id: 'shooting',
    title: 'Shooting',
    blurb:
      'You can shoot from anywhere. Thirty-five yards out with three men in the way is a bad idea rather than an impossible one.',
    points: [
      'What prices a shot: how far out he is, how tight the angle, how many bodies are in the lane, who is hitting it and who is in goal.',
      'Bending it round them beats a wall and brings the ball back from a tight angle. With the goal gaping it is a flourish, and flourishes miss.',
      'On Easy the panel tells you the chance before you commit, and whether curling it would be worth more than hitting it straight.',
    ],
  },
];
