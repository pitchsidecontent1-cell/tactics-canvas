// ---------------------------------------------------------------------------
// The match game's model.
//
// The game is meant to be about reading a shape, not picking the biggest
// number off a list, so three things follow from that:
//
//   • Your style decides WHICH moves you have, not how likely the same moves
//     are. A possession side can play a third man round the corner and cannot
//     hit it long; a direct side can go over the top and cannot patiently
//     recycle. Changing style changes the toolkit.
//
//   • A move is only on when the pitch allows it. Switching play needs them
//     loaded on one side; a ball in behind needs their line to be high; the
//     channel needs a gap between their defenders. When a move is off, the
//     panel says which of those is missing — that is the coaching.
//
//   • Teams keep their shape and move as a unit. The whole structure slides to
//     sit a set distance behind the ball, so when you carry into their half
//     your forwards go with you instead of being left behind.
//
// Offside is enforced. It is what makes a high line both a weapon and a risk,
// and it is the reason 'squeeze the line' is worth choosing.
//
// Everything is in pitch percentages. Home defends y = 100 and attacks towards
// y = 0; away is the mirror.
// ---------------------------------------------------------------------------

import type { Position } from './pitch-types';
import { type Attributes, type SquadEntry, baseAttributes, edge } from './squad';

export type Side = 'home' | 'away';

export type Player = {
  id: string;
  side: Side;
  role: string;
  number: number;
  /** The real man, when the side is a manager's XI rather than a bare shape. */
  name?: string;
  /** What he is good at. The app assigns these — see squad.ts. */
  attributes: Attributes;
  /** Where this player stands with the ball on the halfway line. */
  base: Position;
  /** Where they are now, once the shape has moved. */
  spot: Position;
  /** How he was moving on the last beat, so that turning round costs him time
   *  the way it costs a real player. Only set by a real beat of the match. */
  momentum?: Position;
};

export const clamp = (value: number, low: number, high: number) =>
  Math.max(low, Math.min(high, value));

const attackDirOf = (side: Side) => (side === 'home' ? -1 : 1);

/** Distance from a point to the segment between two others. */
function distanceToLane(point: Position, from: Position, to: Position): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - from.x, point.y - from.y);
  const t = clamp(((point.x - from.x) * dx + (point.y - from.y) * dy) / lengthSquared, 0, 1);
  return Math.hypot(point.x - (from.x + t * dx), point.y - (from.y + t * dy));
}

const gapBetween = (a: Position, b: Position) => Math.hypot(a.x - b.x, a.y - b.y);

// ---------------------------------------------------------------------------
// Naming the positions
// ---------------------------------------------------------------------------

const DEF_ROLES: Record<number, string[]> = {
  2: ['LCB', 'RCB'],
  3: ['LCB', 'CB', 'RCB'],
  4: ['LB', 'LCB', 'RCB', 'RB'],
  5: ['LWB', 'LCB', 'CB', 'RCB', 'RWB'],
};
const HOLD_ROLES: Record<number, string[]> = {
  1: ['DM'],
  2: ['LDM', 'RDM'],
  3: ['LDM', 'DM', 'RDM'],
};
const MID_ROLES: Record<number, string[]> = {
  1: ['CM'],
  2: ['LCM', 'RCM'],
  3: ['LCM', 'CM', 'RCM'],
  4: ['LM', 'LCM', 'RCM', 'RM'],
  5: ['LM', 'LCM', 'CM', 'RCM', 'RM'],
};
const ATT_MID_ROLES: Record<number, string[]> = {
  1: ['AM'],
  2: ['LAM', 'RAM'],
  3: ['LAM', 'AM', 'RAM'],
};
const FWD_ROLES: Record<number, string[]> = {
  1: ['ST'],
  2: ['LST', 'RST'],
  3: ['LW', 'ST', 'RW'],
  4: ['LW', 'LST', 'RST', 'RW'],
};

export const ROLE_NAMES: Record<string, string> = {
  GK: 'keeper',
  LB: 'left-back',
  RB: 'right-back',
  CB: 'centre-back',
  LCB: 'left centre-back',
  RCB: 'right centre-back',
  LWB: 'left wing-back',
  RWB: 'right wing-back',
  DM: 'holding midfielder',
  LDM: 'left holder',
  RDM: 'right holder',
  CM: 'central midfielder',
  LCM: 'left centre-mid',
  RCM: 'right centre-mid',
  LM: 'left midfielder',
  RM: 'right midfielder',
  AM: 'number ten',
  LAM: 'left ten',
  RAM: 'right ten',
  ST: 'striker',
  LST: 'left striker',
  RST: 'right striker',
  LW: 'left winger',
  RW: 'right winger',
};

const ROLE_NUMBERS: Record<string, number> = {
  GK: 1, RB: 2, RWB: 2, LB: 3, LWB: 3, LCB: 4, CB: 5, RCB: 5,
  DM: 6, LDM: 6, RDM: 4, RM: 7, RW: 7, CM: 8, LCM: 8, RCM: 6,
  ST: 9, LST: 9, RST: 10, AM: 10, LAM: 10, RAM: 7, LM: 11, LW: 11,
};

export const roleName = (role: string) => ROLE_NAMES[role] ?? role;

/** What to call him: the real man if we know him, otherwise his position. */
export const playerName = (player: Player) => player.name ?? roleName(player.role);

const isForward = (role: string) => /^(ST|LST|RST|LW|RW)$/.test(role);
const isWide = (role: string) => /^(LB|RB|LWB|RWB|LM|RM|LW|RW)$/.test(role);

// ---------------------------------------------------------------------------
// What the attributes actually do
//
// Each of the five has to change something you can see on the pitch, or it is
// decoration on a card. In order:
//
//   passing    the carrier's — scales what the ball he plays costs
//   touch      the receiver's — taking it in cleanly is the other half of a pass
//   pace       the runner's — a quick man gets further past their line, and the
//              ball in behind costs less to hit
//   tackling   the DEFENDER's — a body near the ball or in the passing lane
//              counts for more or less depending on whose body it is. This is
//              the one that makes "my man was right there" mean something
//   finishing  the shooter's, weighed against the keeper's shot-stopping
//
// Nothing here is worth more than about a quarter either way, so a great
// player tilts a move without deciding it. The tactics still decide it.
// ---------------------------------------------------------------------------

/** Below 1 for a good player, above 1 for a poor one, since these scale risk. */
const quality = (value: number, weight: number) => 1 - edge(value) * weight;

/** How much of a body a defender is. An ordinary one counts exactly 1, so a
 *  side of plain footballers plays exactly as it did before attributes. */
const bite = (player: Player) => 1 + edge(player.attributes.tackling) * 0.45;

/** The moves that are won by running, where the receiver's pace is the thing. */
const RUNNING_MOVES = new Set<string>(['overTop', 'channel', 'counter']);

/** Balls that travel, and so have no business being played from the centre
 *  spot with all twenty-two men in their own half. */
const KICK_OFF_BANNED: ActionId[] = ['overTop', 'channel', 'counter', 'clear'];

/**
 * How far in front of himself a man can actually be sent.
 *
 * A ball in behind is aimed at the grass past their back line — but if the
 * runner is forty yards short of that line, forty yards is what he has to
 * cover, and he was simply placed there because the man meeting the ball is
 * put where the ball is. That is the teleporting: not a bug in the drawing,
 * a ball played somewhere nobody could get to and a model that assumed he got
 * there anyway. So the pass is cut back to a distance he could sprint onto.
 */
const dashOf = (runner: Player) => 8 + runner.attributes.pace * 0.5;

function reachable(runner: Player, target: Position, dir: number): Position {
  const gain = (target.y - runner.spot.y) * dir;
  const dash = dashOf(runner);
  if (gain <= dash) return target;
  return { x: target.x, y: runner.spot.y + dir * dash };
}

/**
 * Who to send in behind. Not simply whoever is furthest forward — of the men
 * high enough to make the run, you send the quickest, because that is what
 * anyone would actually do. Without this the ball went to whichever forward
 * happened to be first in the list and Mbappé stood watching.
 */
/** The furthest you can sensibly pick a man out with a ball in behind. Past
 *  this it stops being a pass and becomes a punt. */
const IN_BEHIND_RANGE = 38;

function fastestUpThere(
  mates: Player[],
  ahead: (player: Player) => number,
  /** Where it would be played from, so a man on the far side of the pitch is
   *  not chosen for a ball nobody could hit. Capping only how far the RUNNER
   *  has to sprint left the BALL travelling fifty yards to a man standing
   *  still — which is the long ball the whole of this was meant to stop. */
  from?: Position,
): Player {
  const inRange = from
    ? mates.filter((player) => gapBetween(player.spot, from) <= IN_BEHIND_RANGE)
    : mates;
  const pool = inRange.length ? inRange : mates;
  return [...pool]
    .sort((a, b) => ahead(b) - ahead(a))
    .slice(0, 3)
    .sort((a, b) => b.attributes.pace - a.attributes.pace)[0];
}

function rolesForRow(count: number, row: number, rows: number): string[] {
  const fallback = Array.from({ length: count }, () => 'CM');
  if (row === 0) return DEF_ROLES[count] ?? fallback;
  if (row === rows - 1) return FWD_ROLES[count] ?? fallback;
  const middles = rows - 2;
  const index = row - 1;
  if (middles > 1 && index === 0 && count <= 3) return HOLD_ROLES[count] ?? fallback;
  if (middles > 1 && index === middles - 1 && count <= 3) return ATT_MID_ROLES[count] ?? fallback;
  return MID_ROLES[count] ?? fallback;
}

/**
 * The base shape: back line at 84, front line at 48, keeper at 94.
 *
 * Pass a squad and it fields those men instead of anonymous shirts — the XI
 * arrays are written keeper-first, then each line left to right, which is the
 * same order this lays a shape out in, so index i is the man for position i.
 */
export function buildTeam(shape: number[], side: Side, squad: SquadEntry[] = []): Player[] {
  const players: Player[] = [];
  const used = new Set<number>();
  const add = (role: string, x: number, y: number) => {
    const entry = squad[players.length];
    let number = entry?.number ?? ROLE_NUMBERS[role] ?? 12;
    while (used.has(number)) number += 1;
    used.add(number);
    const base = side === 'home' ? { x, y } : { x: 100 - x, y: 100 - y };
    players.push({
      id: `${side}-${players.length + 1}`,
      side,
      role,
      number,
      name: entry?.name,
      // The position he is filling, with whatever he was famous for on top.
      attributes: { ...baseAttributes(role), ...entry?.standout },
      base,
      spot: { ...base },
    });
  };
  add('GK', 50, 94);
  shape.forEach((count, row) => {
    const y = 84 - (row * 36) / Math.max(shape.length - 1, 1);
    const width = count >= 5 ? 76 : count === 4 ? 68 : count === 3 ? 56 : 40;
    const roles = rolesForRow(count, row, shape.length);
    for (let index = 0; index < count; index += 1) {
      const x = count === 1 ? 50 : 50 - width / 2 + (width * index) / (count - 1);
      add(roles[index] ?? 'CM', x, y);
    }
  });
  return players.slice(0, 11);
}

// ---------------------------------------------------------------------------
// Styles: these decide the toolkit, not the odds
// ---------------------------------------------------------------------------

export type StyleId = 'possession' | 'direct' | 'pragmatic';

export type Style = {
  id: StyleId;
  name: string;
  blurb: string;
  /** How far UP the pitch from the ball the team plays when it has the ball.
   *  A side in possession has to have bodies past it or there is nothing
   *  forward to give it to. */
  push: number;
  /** How far goal-side of the ball it sits when it does not have the ball. */
  behind: number;
  /** How much of the way to that position the team actually travels. */
  follow: number;
  /** Positive pulls the wide players wider, negative tucks them in. */
  spread: number;
};

export const STYLES: Style[] = [
  {
    id: 'possession',
    name: 'Possession',
    blurb: 'Short, patient, always an angle. Nothing hit long.',
    push: 12,
    behind: 20,
    follow: 0.82,
    spread: 0.24,
  },
  {
    id: 'direct',
    name: 'Direct',
    blurb: 'Forward at every chance. Nothing patient.',
    push: 18,
    behind: 14,
    follow: 0.95,
    spread: 0.08,
  },
  {
    id: 'pragmatic',
    name: 'Pragmatic',
    blurb: 'Sit in, stay compact, break when it is on.',
    push: 4,
    behind: 28,
    follow: 0.62,
    spread: -0.08,
  },
];

export const styleById = (id: StyleId) => STYLES.find((style) => style.id === id) ?? STYLES[0];

export type StanceId = 'press' | 'squeeze' | 'narrow' | 'drop' | 'trap' | 'man';

export type Stance = {
  id: StanceId;
  name: string;
  /** What this shuts down. */
  stops: string;
  /** What it hands over in exchange. */
  concedes: string;
};

export const STANCES: Stance[] = [
  { id: 'press', name: 'Press the ball', stops: 'their short build-up', concedes: 'the space in behind' },
  { id: 'trap', name: 'Spring the offside trap', stops: 'anything played in behind', concedes: 'everything to feet in front of it' },
  { id: 'squeeze', name: 'Squeeze the line', stops: 'balls over the top', concedes: 'room in front of you' },
  { id: 'narrow', name: 'Protect the middle', stops: 'everything central', concedes: 'the flanks and crosses' },
  { id: 'man', name: 'Pick up the runners', stops: 'anyone arriving unmarked', concedes: 'one against one all over the pitch' },
  { id: 'drop', name: 'Drop into a block', stops: 'runs in behind and crosses', concedes: 'the whole midfield' },
];

export const stanceById = (id: StanceId) => STANCES.find((stance) => stance.id === id) ?? STANCES[1];

// ---------------------------------------------------------------------------
// Where you defend, and what is on offer once the ball gets there
// ---------------------------------------------------------------------------

export type BlockId = 'high' | 'mid' | 'low';

export type Block = {
  id: BlockId;
  name: string;
  blurb: string;
  /** How far from your own goal the team is willing to defend, as a y for the
   *  home side. The away side's is mirrored. */
  line: number;
};

/**
 * The standing decision about how far up the pitch you defend, taken once
 * rather than every time they win the ball. It is the frame every other
 * defensive choice sits inside: pressing out of a low block is a different
 * act from pressing out of a high one.
 */
export const BLOCKS: Block[] = [
  {
    id: 'high',
    name: 'High block',
    blurb: 'Defend on halfway and squeeze the game into their half. Nothing behind you but grass.',
    line: 44,
  },
  {
    id: 'mid',
    name: 'Mid block',
    blurb: 'Hold the middle third, stay compact, pick your moment to go.',
    line: 62,
  },
  {
    id: 'low',
    name: 'Low block',
    blurb: 'Sit in front of your own box and make them play through you.',
    line: 78,
  },
];

export const blockById = (id: BlockId) => BLOCKS.find((block) => block.id === id) ?? BLOCKS[1];

/** Which part of the pitch the ball is in, from your point of view. */
export type Zone = 'high' | 'middle' | 'deep';

export function zoneOf(ball: Position, side: Side): Zone {
  // Home defends y = 100, so a big y is near its own goal.
  const towardsOwnGoal = side === 'home' ? ball.y : 100 - ball.y;
  if (towardsOwnGoal < 40) return 'high';
  if (towardsOwnGoal < 68) return 'middle';
  return 'deep';
}

export type Challenge = { id: StanceId; name: string; note: string };

/**
 * What each block lets you do about the ball.
 *
 * The block you have chosen is the frame, so the options come from it: an
 * offside trap belongs to a side already defending on halfway and is not on
 * offer to one sitting in front of its own box, while picking men up
 * individually is a thing you do in a crowded penalty area rather than forty
 * yards from your own goal. The lists overlap on purpose — pressing the ball
 * is available from any of them, because it always is — but each block has
 * something the others do not.
 */
const CHALLENGES: Record<BlockId, Challenge[]> = {
  high: [
    { id: 'press', name: 'Win it back now', note: 'Swarm the man on it before they are out' },
    { id: 'trap', name: 'Spring the offside trap', note: 'Step up as one and raise the flag' },
    { id: 'squeeze', name: 'Hold the line high', note: 'Stay up and keep the game in their half' },
    { id: 'narrow', name: 'Screen the middle', note: 'Cut the pass inside and make them go round' },
    { id: 'drop', name: 'Drop off and re-set', note: 'Give up the ground, get your shape back' },
  ],
  mid: [
    { id: 'press', name: 'Press the ball', note: 'Go at the man on it' },
    { id: 'trap', name: 'Step out and catch them', note: 'The line goes on the pass — a trap in midfield' },
    { id: 'squeeze', name: 'Squeeze the line', note: 'Step up together and compress the space' },
    { id: 'narrow', name: 'Protect the middle', note: 'Force it wide, keep the centre shut' },
    { id: 'drop', name: 'Sit off', note: 'Hold shape, let them come onto you' },
  ],
  low: [
    { id: 'press', name: 'Go and meet him', note: 'Out of the block at the man on it' },
    { id: 'man', name: 'Pick up the runners', note: 'Everyone marked, nobody arriving free' },
    { id: 'narrow', name: 'Shut the middle', note: 'Fill the centre, make them go round the outside' },
    { id: 'drop', name: 'Hold the two banks', note: 'No gaps, no space between the lines' },
  ],
};

/** Things that stop meaning anything once the ball is on your own goal. You
 *  cannot play a line offside when they are already six yards out. */
const NOT_IN_YOUR_BOX: StanceId[] = ['trap', 'squeeze'];

/** What the same choice is called when they are in on your goal, where every
 *  one of these is about the six-yard box rather than about the pitch. */
const IN_YOUR_BOX: Partial<Record<StanceId, Challenge>> = {
  press: { id: 'press', name: 'Close him down', note: 'Get out to him before he can shoot' },
  narrow: { id: 'narrow', name: 'Bodies in the box', note: 'Fill the middle, block the shot' },
  man: { id: 'man', name: 'Pick everyone up', note: 'Mark the runners, nobody free at the back post' },
  drop: { id: 'drop', name: 'Everyone behind the ball', note: 'Two banks, no gaps, no space to work in' },
};

/**
 * The choices on offer: what your block allows, minus anything the ball being
 * where it is has made nonsense of.
 */
export function challengesFor(block: BlockId, zone: Zone): Challenge[] {
  const list = CHALLENGES[block];
  if (zone !== 'deep') return list;
  const inTheBox = list
    .filter((challenge) => !NOT_IN_YOUR_BOX.includes(challenge.id))
    .map((challenge) => IN_YOUR_BOX[challenge.id] ?? challenge);
  // Whatever the block says, there is always something to do about a ball in
  // your own box.
  return inTheBox.length >= 2
    ? inTheBox
    : [IN_YOUR_BOX.press!, IN_YOUR_BOX.narrow!, IN_YOUR_BOX.drop!];
}

// ---------------------------------------------------------------------------
// Movement: the shape travels as one
// ---------------------------------------------------------------------------

/**
 * What each defensive style actually asks of the players.
 *
 * `men` is how many go and challenge for the ball, `pull` is how far towards
 * it they commit, and `support` is the shuffle everyone else makes to cover
 * the ground behind them. This is the difference between the four choices:
 * a press throws three bodies at the man on the ball and leaves gaps, a block
 * sends nobody and keeps its shape in front of the goal.
 */
/**
 * How many men are allowed to stay up the pitch while the rest get goal-side.
 *
 * Defending is not about getting to the ball, it is about getting between the
 * ball and your own goal — so everybody who is not left up as an outlet heads
 * for the right side of it. How many you leave up there is the difference
 * between a press that keeps two forwards on their centre-halves and a block
 * that has all eleven behind the ball.
 */
const UPFRONT: Record<StanceId, number> = {
  press: 2,
  trap: 2,
  squeeze: 1,
  narrow: 1,
  man: 1,
  drop: 0,
};

/** How far goal-side of the ball a defender wants to be. Level with it is not
 *  goal-side; a couple of yards the right side of it is. */
const GOAL_SIDE = 3;

/**
 * How tightly each stance picks men up.
 *
 * This is what makes moving your players do something to theirs, and it was
 * simply missing: defenders held a zone around the ball and took not the
 * slightest notice of who was standing in it. So a run could never drag a
 * marker anywhere, and the only way to make space was to wait for the shape to
 * drift — which is not how space is made in football at all.
 *
 * A marking defender follows the man he has picked up. Pull a striker wide and
 * his centre-half goes with him, and the middle opens. That is the mechanic:
 * you create room for one player by moving a different one.
 */
const MARKING: Record<StanceId, number> = {
  // Every man picked up, all over the pitch. Drag one defender out and the
  // hole he leaves is enormous — the old flaw in man-marking, now playable.
  man: 0.6,
  press: 0.32,
  narrow: 0.28,
  squeeze: 0.24,
  drop: 0.2,
  // A trap is a line holding its shape. It does not follow anybody anywhere.
  trap: 0.08,
};

/** How far from his own patch a defender will go to pick somebody up. */
const MARK_RANGE = 26;

const CHASE: Record<StanceId, { men: number; pull: number; support: number }> = {
  // `pull` used to be the fraction of the way to the ball a challenger got in
  // a beat — which meant a man twenty-five units away closed to fifteen, then
  // to nine, and never actually arrived. Nobody was ever closed down. He now
  // goes for the ball properly and stepToward is what limits him, which is the
  // right place for the limit: his legs, not his intent.
  press: { men: 3, pull: 0.95, support: 0.3 },
  narrow: { men: 2, pull: 0.8, support: 0.24 },
  squeeze: { men: 2, pull: 0.7, support: 0.16 },
  drop: { men: 1, pull: 0.6, support: 0.08 },
  // Nobody goes to the ball at all. The line steps, together, and waits for
  // the flag — that is the entire act.
  trap: { men: 0, pull: 0, support: 0.05 },
  // Everybody goes with somebody. No swarm around the ball, but the whole
  // team moves with the play instead of holding a shape behind it.
  man: { men: 4, pull: 0.75, support: 0.34 },
};

/**
 * How a side in possession offers the ball.
 *
 * `men` come inside passing range of it and `range` is how close that is.
 * Without this the team in possession kept its shape and left the man on the
 * ball with nobody within thirty yards — which is not a team attacking, it is
 * eleven players standing on a diagram. A supporter closes to the range and no
 * further: he is offering an angle, not standing on the carrier's toes.
 */
const SUPPORT: Record<StyleId, { men: number; range: number; pull: number }> = {
  possession: { men: 4, range: 12, pull: 1 },
  direct: { men: 3, range: 16, pull: 0.85 },
  pragmatic: { men: 3, range: 14, pull: 0.9 },
};

/**
 * How far up the pitch each stance moves the line, in pitch units. The trap
 * steps further than anything else because that is the whole of it: the line
 * goes, the second-last man goes with it, and the offside line the referee is
 * judging moves twenty yards up the pitch.
 */
const STANCE_STEP: Record<StanceId, number> = {
  press: 14,
  trap: 20,
  squeeze: 7,
  man: 4,
  narrow: 0,
  drop: -14,
};

/**
 * How far a player can get in one beat, and what turning round costs him.
 *
 * A beat is a second or so of football and the pitch is 105 metres long, so
 * ten units of y is about seven metres. The old figure — eight units plus, in
 * any direction, from a standing start — had centre-halves covering ground at
 * better than a world-class sprint while facing the wrong way, which is why a
 * recovering defence looked like it was being put back rather than running
 * back. A top-end sprinter now covers about nine units in a beat and an
 * ordinary one nearer six, and none of that is available to a man who has to
 * stop, turn and set off again.
 */
const RECOVERY_BASE = 3.2;
const RECOVERY_PACE = 0.32;

function stepToward(player: Player, target: Position): Position {
  const dx = target.x - player.spot.x;
  const dy = target.y - player.spot.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.001) return target;
  const ux = dx / distance;
  const uy = dy / distance;

  // Was he already going this way? A man carrying his momentum keeps nearly
  // all of it; a man who has to turn through 180 degrees spends most of the
  // beat doing exactly that. This is the difference between a defence that
  // flows back and one that snaps into place.
  const was = player.momentum;
  const speed = was ? Math.hypot(was.x, was.y) : 0;
  let turn = 0.78; // a standing start: he has to get going first
  if (was && speed > 0.6) {
    const carriedOn = (was.x * ux + was.y * uy) / speed; // 1 same way, -1 straight back
    turn = 0.42 + 0.58 * clamp((carriedOn + 1) / 2, 0, 1) ** 0.7;
  }

  const reach = (RECOVERY_BASE + player.attributes.pace * RECOVERY_PACE) * turn;
  if (distance <= reach) return target;
  return { x: player.spot.x + ux * reach, y: player.spot.y + uy * reach };
}

/** Put a player somewhere, remembering how he got there. Only a real beat of
 *  the match leaves momentum behind — a preview is a question about where the
 *  shape would be, not a moment of anybody running. */
const moved = (player: Player, spot: Position, live: boolean): Player => ({
  ...player,
  spot,
  momentum: live ? { x: spot.x - player.spot.x, y: spot.y - player.spot.y } : undefined,
});

/**
 * Slides the whole team so its centre of gravity sits a set distance behind
 * the ball, preserving the gaps between the lines. This is why your forwards
 * come with you when you carry the ball forward instead of being left behind,
 * and why a defending side visibly retreats as you advance.
 */
export function reshape(
  team: Player[],
  ball: Position,
  style: Style,
  hasBall: boolean,
  stance: StanceId | null = null,
  pinned: Record<string, Position> = {},
  /** The opposition's second-last man. Attackers hold this line instead of
   *  drifting past it, because a forward who stands offside for the whole
   *  match is not a forward — he is a spectator with a flag against him. A
   *  run you draw yourself still overrides it: timing a run past the line is
   *  your decision to make, not the shape's. */
  holdLine: number | null = null,
  /** Cap on how far anybody can travel in this one beat. Without it a player
   *  simply appears wherever the shape says he belongs, which is why the game
   *  looked like a formation resetting rather than a team running. */
  stepped = false,
  /** Whoever is on the ball. He is always exactly where the ball is — that is
   *  what being on it means — while everybody else, run orders included, still
   *  has to run to where you have sent them. */
  onBallId: string | null = null,
  /** How far up the pitch this side is willing to defend. */
  block: BlockId | null = null,
  /** The other side, as they stand. Without the ball, this is who your players
   *  pick up — and it is the whole reason moving one of your men can move one
   *  of theirs. */
  opponents: Player[] = [],
): Player[] {
  const side = team[0]?.side ?? 'home';
  const dir = attackDirOf(side);
  const outfield = team.filter((player) => player.role !== 'GK');
  const baseCentre = outfield.reduce((total, player) => total + player.base.y, 0) / outfield.length;

  // With the ball, the team's centre of gravity sits UP the pitch from it, so
  // there is always somebody past the ball to play forward to. Without it, the
  // centre sits goal-side of the ball instead, between it and your own net.
  let desired = hasBall ? ball.y + dir * style.push : ball.y - dir * style.behind;

  // The block height is how far from your own goal you are willing to defend,
  // but it can only ever be a ceiling. You cannot hold a high line while the
  // ball is in your own six-yard box: once they are past it, the team defends
  // where the ball is. This is why a low block used to leave players strung
  // out across the pitch with the ball sitting in front of the net.
  if (!hasBall && block) {
    const wall = side === 'home' ? blockById(block).line : 100 - blockById(block).line;
    const goalSideOfBall = ball.y - dir * 6;
    desired =
      side === 'home'
        ? Math.max(wall, goalSideOfBall)
        : Math.min(wall, goalSideOfBall);
  }

  // A defensive stance physically moves the line, so the user can see what the
  // other side has committed to rather than being told.
  //
  // This has to come AFTER the block, not before it. It used to be the other
  // way round, and the block clause overwrites `desired` outright — so the
  // moment a block was set, every stance produced exactly the same line and
  // choosing one changed nothing about where anybody stood. A trap out of a
  // low block still steps up; it just steps up from deeper.
  if (!hasBall && stance) {
    desired += dir * STANCE_STEP[stance];
    // `desired` is the whole team's centre of gravity, and a side spans some
    // thirty-five units front to back — so for the BACK LINE to step up level
    // with the ball, the centre has to finish a good way past it. This is the
    // limit on that: far enough for a trap to be a trap, not so far that the
    // eleven of them end up in front of the man they are marking.
    const level = ball.y + dir * 16;
    desired = side === 'home' ? Math.max(desired, level) : Math.min(desired, level);
  }
  desired = side === 'home' ? clamp(desired, 24, 88) : clamp(desired, 12, 76);
  const shift = (desired - baseCentre) * style.follow;

  // Whoever is nearest the ball comes and offers it. Ranked off their BASE
  // rather than where they happen to be standing, so the same men keep the job
  // from beat to beat instead of the whole side taking turns lurching at it.
  const support = SUPPORT[style.id];
  const ranked = [...outfield].sort(
    (a, b) => gapBetween(a.base, ball) - gapBetween(b.base, ball),
  );
  const helpers = new Set(ranked.slice(0, support.men).map((player) => player.id));
  // Protecting the middle is a lateral instruction, so it shows as one.
  const narrowing = !hasBall && stance === 'narrow' ? 0.35 : 0;

  // Without the ball, the men nearest it go and challenge for it. Which men,
  // and how hard they go, is the whole of what a defensive style means: a
  // press sends three at the man on the ball, a block sends nobody and keeps
  // its shape. This is what you are choosing when you pick a style — not a
  // formation for everybody to slide into.
  const chase = !hasBall && stance ? CHASE[stance] : null;

  // How much trouble you are in. Nought out by halfway, one when the ball is
  // on your own goal line. Defending a cross in your six-yard box is not the
  // moment to be holding a tidy shape thirty yards wide, so the whole team
  // collapses towards the ball as this rises.
  const ownGoal = side === 'home' ? 100 : 0;
  const danger = hasBall ? 0 : clamp(1 - Math.abs(ball.y - ownGoal) / 38, 0, 1);
  const byBall = [...outfield].sort(
    (a, b) => gapBetween(a.spot, ball) - gapBetween(b.spot, ball),
  );
  const challengers = new Set(chase ? byBall.slice(0, chase.men).map((p) => p.id) : []);

  // The men left up the pitch as an outlet. Everybody else is expected to be
  // the right side of the ball — you do not defend from in front of it.
  // Most advanced first. `dir` is the way this side attacks, so the men
  // furthest up the pitch are the ones whose base sits furthest along it.
  const byAdvanced = [...outfield].sort((a, b) => (a.base.y - b.base.y) * -dir);
  const stayUp = new Set(
    !hasBall && stance ? byAdvanced.slice(0, UPFRONT[stance]).map((p) => p.id) : [],
  );
  /** Where a defender should be relative to the ball: goal-side of it. */
  const goalSideY = ball.y - dir * GOAL_SIDE;

  // Who has picked up whom.
  //
  // Worked out from where each defender's patch is rather than from where he
  // has drifted to, so the same centre-half keeps the same centre-forward from
  // beat to beat instead of the whole back line swapping men every time
  // somebody moves. Deepest defenders choose first, so the back line takes the
  // most advanced attackers and the midfield picks up what is left.
  const marks: Record<string, Player> = {};
  if (!hasBall && stance && opponents.length) {
    const threats = [...opponents]
      .filter((player) => player.role !== 'GK')
      .sort((a, b) => (b.spot.y - a.spot.y) * -dir);
    const picked = new Set<string>();
    const pickers = [...outfield].sort((a, b) => (b.base.y - a.base.y) * -dir);
    for (const picker of pickers) {
      if (challengers.has(picker.id)) continue;
      const patch = { x: picker.base.x, y: picker.base.y + shift };
      let closest: Player | null = null;
      let nearest = MARK_RANGE;
      for (const threat of threats) {
        if (picked.has(threat.id)) continue;
        const away = gapBetween(threat.spot, patch);
        if (away < nearest) {
          nearest = away;
          closest = threat;
        }
      }
      if (closest) {
        picked.add(closest.id);
        marks[picker.id] = closest;
      }
    }
  }

  return team.map((player) => {
    const pin = pinned[player.id];
    if (pin) {
      const spot = { x: clamp(pin.x, 4, 96), y: clamp(pin.y, 5, 95) };
      const instant = !stepped || player.id === onBallId;
      return moved(player, instant ? spot : stepToward(player, spot), stepped);
    }
    if (player.role === 'GK') {
      // He comes off his line with the rest of them, or a high line leaves him
      // stranded forty yards behind his own defence. He has legs like anybody
      // else, though — leaving him unstepped had the keeper covering fourteen
      // units in a beat while his defenders managed seven.
      const line = side === 'home' ? 94 : 6;
      const post = { x: 50 + (ball.x - 50) * 0.18, y: clamp(line + shift * 0.4, 4, 96) };
      return moved(player, stepped ? stepToward(player, post) : post, stepped);
    }
    let x =
      player.base.x +
      (ball.x - 50) * 0.3 +
      (player.base.x - 50) * (style.spread - narrowing);
    let y = player.base.y + shift;
    if (hasBall && helpers.has(player.id)) {
      // Close to within passing range and stop there. Pulling him a flat
      // fraction of the way in left him thirty yards off when he started far
      // out, and standing on the carrier when he started near.
      const dx = ball.x - x;
      const dy = ball.y - y;
      const out = Math.hypot(dx, dy);
      if (out > support.range) {
        const close = ((out - support.range) / out) * support.pull;
        x += dx * close;
        y += dy * close;
      }
    }
    // Going after it. The challengers head for the man on the ball — but for a
    // point just goal-side of him, not for the ball itself, so they arrive in
    // front of him rather than alongside or trailing behind. Everybody else
    // shuffles a little way across to cover the ground they have left.
    if (chase) {
      const pull = challengers.has(player.id) ? chase.pull : chase.support;
      x += (ball.x - x) * pull;
      y += ((challengers.has(player.id) ? goalSideY : ball.y) - y) * pull;
    }
    // Picking his man up. Goal-side of him and a stride off — you mark a man
    // by standing between him and the goal, not by standing on his feet. Move
    // that man and this defender goes with him, and wherever he was standing
    // is now space for somebody else.
    const mark = marks[player.id];
    if (mark && stance) {
      const tight = MARKING[stance];
      x += (mark.spot.x - x) * tight;
      y += (mark.spot.y - dir * 3 - y) * tight;
    }
    // Under the cosh, everybody squeezes in around the ball and the goal.
    // Sideways first — a defence in its own box is narrow, not spread — and
    // then goal-side, so nobody is left stranded up the pitch.
    if (danger > 0) {
      const goalMouth = 50 + (ball.x - 50) * 0.45;
      x += (goalMouth - x) * danger * 0.6;
      // Squeezing towards the ball, but never past it: a defender in his own
      // box gets tight to the man on it, he does not run round in front of him.
      const wasGoalSide = (y - goalSideY) * -dir >= 0;
      const tighter = y + (ball.y - y) * danger * 0.32;
      const wouldOverrun = (tighter - goalSideY) * -dir < 0;
      y = wasGoalSide && wouldOverrun ? goalSideY : tighter;
    }
    // Nobody defends from in front of the ball.
    //
    // Anyone caught the wrong side of it — bar the one or two left up as an
    // outlet — turns and gets back between it and his own goal. This has to be
    // the LAST word on where he stands, or the squeeze above drags him back in
    // front of the ball again, which is what it was doing. Partway rather than
    // all the way, so the team keeps its depth instead of forming a single line
    // across the ball, and stepToward still caps what he can do in one beat.
    if (chase && !stayUp.has(player.id)) {
      // `back` points at his own goal: +1 for the side defending the big
      // numbers, -1 for the other.
      const back = -dir;
      const shortfall = (goalSideY - y) * back;
      // A yard or two in front of it is ordinary defensive shape — a midfielder
      // closing from the side is not a man out of the game. This is for the
      // ones genuinely stranded up the pitch.
      if (shortfall > 4) {
        // Goal-side, and the further in front of it he was caught the deeper
        // he ends up — so the team gets back in layers rather than forming one
        // line across the ball.
        const wanted = goalSideY + back * Math.min(shortfall * 0.3, 11);
        // Fading out as the ball reaches your own box, where there is no grass
        // left to be goal-side in and the squeeze above is doing the work
        // anyway. Without this the whole team piled onto one line on the edge
        // of the six-yard box.
        y += (wanted - y) * (1 - danger * 0.75);
      }
    }
    // Stay onside. Only bites in their half — you cannot be offside in your
    // own — and never drags anybody backwards out of it.
    if (hasBall && holdLine !== null) {
      y = dir < 0 ? Math.max(y, Math.min(holdLine, 50)) : Math.min(y, Math.max(holdLine, 50));
    }
    const target = { x: clamp(x, 4, 96), y: clamp(y, 6, 94) };
    return moved(player, stepped ? stepToward(player, target) : target, stepped);
  });
}

/**
 * The kick-off, played by the laws: both teams inside their own half, nobody
 * but the taker within the centre circle, and the ball on the spot.
 */
export function kickOffShape(team: Player[], side: Side, taking: boolean): Player[] {
  const ownHalf = (y: number) => (side === 'home' ? Math.max(y, 53) : Math.min(y, 47));
  const placed = team.map((player) => ({
    ...player,
    spot: { x: player.base.x, y: ownHalf(player.base.y) },
  }));
  // Push anyone loitering in the circle out of it.
  const cleared = placed.map((player) => {
    const distance = gapBetween(player.spot, { x: 50, y: 50 });
    if (distance >= 12) return player;
    const back = side === 'home' ? 1 : -1;
    return { ...player, spot: { x: player.spot.x, y: player.spot.y + back * (12 - distance) } };
  });
  if (!taking) return cleared;
  const taker = cleared
    .filter((player) => player.role !== 'GK')
    .reduce((closest, player) =>
      gapBetween(player.spot, { x: 50, y: 50 }) < gapBetween(closest.spot, { x: 50, y: 50 })
        ? player
        : closest,
    );
  return cleared.map((player) =>
    player.id === taker.id ? { ...player, spot: { x: 50, y: 50 } } : player,
  );
}

export const kickOffTaker = (team: Player[]) =>
  team
    .filter((player) => player.role !== 'GK')
    .reduce((closest, player) =>
      gapBetween(player.spot, { x: 50, y: 50 }) < gapBetween(closest.spot, { x: 50, y: 50 })
        ? player
        : closest,
    );

export const nearestTo = (spot: Position, team: Player[]) =>
  team.reduce((closest, player) =>
    gapBetween(player.spot, spot) < gapBetween(closest.spot, spot) ? player : closest,
  );

/** Near enough to actually put a foot in. Roughly fifteen metres. */
export const TACKLE_RANGE = 16;

/**
 * Who ends up with a ball that has just been given away.
 *
 * A misplaced pass is not the same thing as being tackled. If the nearest
 * opponent is halfway across the pitch he has not won anything — the ball is
 * simply loose, and whoever is genuinely closest gets there first, which is
 * usually one of your own. Handing every failed pass straight to the other
 * side made them look like they were teleporting in from twenty yards.
 */
export function looseBall(
  spot: Position,
  opponents: Player[],
  own: Player[],
): { player: Player; turnedOver: boolean; gap: number } {
  const theirs = nearestTo(spot, opponents);
  const ours = nearestTo(spot, own);
  const theirGap = gapBetween(theirs.spot, spot);
  const ourGap = gapBetween(ours.spot, spot);
  // Somebody close enough to have taken it off you: that is a turnover.
  if (theirGap <= TACKLE_RANGE && theirGap <= ourGap) {
    return { player: theirs, turnedOver: true, gap: theirGap };
  }
  // Nobody near it, or one of yours is nearer: it is a scramble, and the
  // closest man wins it whichever shirt he is wearing.
  if (ourGap < theirGap) return { player: ours, turnedOver: false, gap: ourGap };
  return { player: theirs, turnedOver: true, gap: theirGap };
}

// ---------------------------------------------------------------------------
// Reading the pitch
// ---------------------------------------------------------------------------

export type Read = {
  /** How high the opposition's deepest outfield line is playing. */
  lineY: number;
  /** True when that line is up the pitch and there is grass behind it. */
  highLine: boolean;
  /** Space between their back line and the one in front of it. */
  betweenLines: number;
  /** Opponents on the ball's side of the pitch, and on the far side. */
  ballSide: number;
  farSide: number;
  /** Opponents within tackling distance of the man on the ball. */
  pressure: number;
  /** The same men, weighed by how good at winning it they actually are. */
  pressureBite: number;
  /** The widest gap between two adjacent defenders — the channel. */
  channel: number;
  /** Your players already in their box. */
  inTheBox: number;
  /** The second-last opponent, which is what offside is measured from. */
  offsideLine: number;
};

export function readPitch(carrier: Player, team: Player[], opponents: Player[]): Read {
  const side = carrier.side;
  const dir = attackDirOf(side);
  const outfield = opponents.filter((player) => player.role !== 'GK');
  // Sorted from their own goal outwards, so the first four are the back line
  // rather than their forwards. Home attacks towards y = 0, so the side it is
  // facing defends the small numbers.
  const byDepth = [...outfield].sort((a, b) => (dir < 0 ? a.spot.y - b.spot.y : b.spot.y - a.spot.y));
  const lineY = byDepth[0]?.spot.y ?? 50;
  const backFour = byDepth.slice(0, 4);
  const across = [...backFour].sort((a, b) => a.spot.x - b.spot.x);
  let channel = 0;
  for (let index = 1; index < across.length; index += 1) {
    channel = Math.max(channel, across[index].spot.x - across[index - 1].spot.x);
  }
  const backAverage = backFour.reduce((total, p) => total + p.spot.y, 0) / (backFour.length || 1);
  const rest = byDepth.slice(4);
  const restAverage = rest.length
    ? rest.reduce((total, p) => total + p.spot.y, 0) / rest.length
    : backAverage;
  const ballIsLeft = carrier.spot.x < 50;
  const allY = opponents.map((p) => p.spot.y).sort((a, b) => (dir < 0 ? a - b : b - a));
  // Genuinely closing him down, not merely on the same part of the pitch.
  // Thirteen units counted half the centre circle as pressure.
  const closing = outfield.filter((p) => gapBetween(p.spot, carrier.spot) < 9);

  return {
    lineY,
    // Their line is high when it has come out past its own third.
    highLine: dir < 0 ? lineY > 42 : lineY < 58,
    betweenLines: Math.abs(restAverage - backAverage),
    ballSide: outfield.filter((p) => (p.spot.x < 50) === ballIsLeft).length,
    farSide: outfield.filter((p) => (p.spot.x < 50) !== ballIsLeft).length,
    pressure: closing.length,
    pressureBite: closing.reduce((total, p) => total + bite(p), 0),
    channel,
    inTheBox: team.filter(
      (p) => p.id !== carrier.id && (dir < 0 ? p.spot.y < 20 : p.spot.y > 80),
    ).length,
    offsideLine: allY[1] ?? 50,
  };
}

/**
 * The second-last opponent, which is what offside is measured from. Pulled out
 * of readPitch so the shape code can use the same line the referee does.
 */
export function offsideLineOf(opponents: Player[], side: Side): number {
  const dir = attackDirOf(side);
  const all = opponents.map((player) => player.spot.y).sort((a, b) => (dir < 0 ? a - b : b - a));
  return all[1] ?? 50;
}

/** Beyond the second-last opponent, in their half, is offside. */
export function isOffside(spot: Position, side: Side, offsideLine: number): boolean {
  const dir = attackDirOf(side);
  const inTheirHalf = dir < 0 ? spot.y < 50 : spot.y > 50;
  if (!inTheirHalf) return false;
  return dir < 0 ? spot.y < offsideLine : spot.y > offsideLine;
}

// ---------------------------------------------------------------------------
// The moves themselves
// ---------------------------------------------------------------------------

export type ActionId =
  | 'outBack'
  | 'shortForward'
  | 'thirdMan'
  | 'switchPlay'
  | 'overTop'
  | 'driveAt'
  | 'channel'
  | 'cross'
  | 'clear'
  | 'counter'
  | 'shoot';

export type Tone = 'safe' | 'tight' | 'risky';

export const toneFor = (risk: number): Tone =>
  risk < 0.16 ? 'safe' : risk < 0.34 ? 'tight' : 'risky';

export type Move = {
  id: ActionId;
  name: string;
  /** Why this is on, in football terms rather than numbers. */
  read: string;
  endsOn: Player;
  spot: Position;
  risk: number;
  tone: Tone;
  offside: boolean;
};

export type Blocked = { id: ActionId; name: string; why: string };

export type MoveSet = { moves: Move[]; blocked: Blocked[]; read: Read };

const STYLE_ACTIONS: Record<StyleId, ActionId[]> = {
  possession: ['outBack', 'shortForward', 'thirdMan', 'switchPlay'],
  // Even a side that wants to go forward has to be able to go backwards.
  // Without it a direct team had no way of recycling at all, so when nothing
  // was on it launched the ball anyway — every single time.
  direct: ['outBack', 'shortForward', 'thirdMan', 'overTop', 'driveAt', 'channel', 'cross'],
  pragmatic: ['outBack', 'shortForward', 'clear', 'switchPlay', 'counter', 'cross'],
};

/** The balls that travel. How much a style fancies one is most of what makes
 *  a direct side look different from a patient one. */
const LONG_MOVES = new Set<ActionId>(['overTop', 'channel', 'clear', 'switchPlay', 'counter']);
const LONG_TASTE: Record<StyleId, number> = {
  possession: 0.4,
  direct: 1,
  pragmatic: 0.7,
};

/** How far in front a side likes to look for a pass. Forty was far too long
 *  for a move called "work it short": a direct side had no pass in its whole
 *  repertoire under forty yards, so every single thing it did was a long
 *  ball whatever the scoring said. */
const SHORT_RANGE: Record<StyleId, number> = {
  possession: 20,
  direct: 28,
  pragmatic: 24,
};

const ACTION_NAMES: Record<ActionId, string> = {
  outBack: 'Play out from the back',
  shortForward: 'Work it short into midfield',
  thirdMan: 'Third man round the corner',
  switchPlay: 'Switch it to the far side',
  overTop: 'Ball in behind their line',
  driveAt: 'Drive at them',
  channel: 'Into the channel',
  cross: 'Get to the byline and cross',
  clear: 'Clear your lines',
  counter: 'Break at speed',
  shoot: 'Shoot',
};

/**
 * How much a defensive stance bites on each kind of move — the chance it is
 * cut out on top of whatever the move risks on its own.
 *
 * These numbers are deliberately large. Reading the play right is supposed to
 * win the ball back roughly a third to a half of the time; reading it wrong is
 * supposed to cost you almost nothing. Small penalties made every stance feel
 * identical, which is the same as having no stance at all.
 */
const STANCE_BITE: Record<StanceId, Partial<Record<ActionId, number>>> = {
  // Getting after the man on it. Murders short build-up and anyone trying to
  // run with it; useless against a ball hit over your head.
  press: {
    outBack: 0.17,
    shortForward: 0.22,
    driveAt: 0.22,
    thirdMan: 0.08,
    switchPlay: 0.08,
    channel: 0.06,
    cross: 0.09,
    counter: 0.06,
    clear: 0.03,
    overTop: 0.02,
  },
  // Holding a high line. Everything played in behind runs into it; everything
  // played in front of it is free. A ball over the top into a squeezed line
  // should be the wrong call, not a coin toss you always lose — beating an
  // offside trap is a normal part of football, so this sits well under half.
  squeeze: {
    overTop: 0.3,
    channel: 0.26,
    counter: 0.26,
    clear: 0.24,
    cross: 0.12,
    driveAt: 0.09,
    thirdMan: 0.05,
    switchPlay: 0.05,
    shortForward: 0.04,
    outBack: 0.02,
  },
  // Everybody in the middle. Central combinations die; the flanks are yours.
  narrow: {
    thirdMan: 0.26,
    shortForward: 0.21,
    channel: 0.2,
    driveAt: 0.17,
    counter: 0.11,
    clear: 0.08,
    overTop: 0.08,
    outBack: 0.05,
    cross: 0.04,
    switchPlay: 0.02,
  },
  // Everyone behind the ball. Nothing gets in behind and crosses have no
  // room; you can have the whole midfield in exchange.
  drop: {
    overTop: 0.28,
    counter: 0.25,
    cross: 0.22,
    channel: 0.18,
    clear: 0.15,
    thirdMan: 0.06,
    shortForward: 0.05,
    driveAt: 0.03,
    switchPlay: 0.03,
    outBack: 0.02,
  },
  // The trap. It is the specialist against a ball in behind — more so than a
  // squeezed line, which is only compact — and in exchange it hands over
  // literally everything played to feet, because nobody is going near the man
  // on the ball. Get it right and the flag goes up. Get it wrong and there is
  // nobody between them and your keeper.
  trap: {
    overTop: 0.42,
    channel: 0.34,
    counter: 0.3,
    clear: 0.26,
    cross: 0.1,
    thirdMan: 0.06,
    switchPlay: 0.04,
    shortForward: 0.02,
    outBack: 0.01,
    driveAt: 0.01,
  },
  // Every man picked up. Combination play dies — the third man is marked
  // before he arrives — but every duel on the pitch is now one against one,
  // so anyone who can beat his man is through, and that is the old flaw in
  // man-marking rather than a bug.
  man: {
    thirdMan: 0.3,
    shortForward: 0.24,
    outBack: 0.18,
    cross: 0.16,
    counter: 0.14,
    channel: 0.12,
    switchPlay: 0.1,
    overTop: 0.1,
    clear: 0.06,
    driveAt: 0.02,
  },
};

function stancePenalty(id: ActionId, stance: StanceId | null): number {
  if (!stance) return 0;
  return STANCE_BITE[stance][id] ?? 0.06;
}

/** How much a stance was ever going to trouble a given move. Used to explain
 *  to the user why the shape they picked did or did not work. */
export const stanceBiteFor = (stance: StanceId, id: ActionId) => STANCE_BITE[stance][id] ?? 0.06;


const inLane = (from: Position, to: Position, opponents: Player[]) =>
  opponents.filter((opponent) => distanceToLane(opponent.spot, from, to) < 7.5);

/** How many bodies are in the lane — the number the panel tells you about. */
function laneBlockers(from: Position, to: Position, opponents: Player[]): number {
  return inLane(from, to, opponents).length;
}

/** The same bodies, weighed by whose they are. Kanté in the lane is not the
 *  same obstacle as a winger tracking back, and this is where that shows. */
function laneBite(from: Position, to: Position, opponents: Player[]): number {
  return inLane(from, to, opponents).reduce((total, opponent) => total + bite(opponent), 0);
}

/**
 * How much of a contest this actually is — the multiplier a defensive stance
 * gets. The ceiling sits above 1 deliberately: if it capped there, a crowded
 * lane would saturate it and the difference between Baresi standing in the way
 * and a winger standing in the way would vanish exactly where it matters most.
 */
const contestAround = (pressure: number, inTheWay: number) =>
  clamp(0.18 + pressure * 0.22 + inTheWay * 0.26, 0.15, 1.3);

export function availableMoves(
  carrier: Player,
  team: Player[],
  opponents: Player[],
  style: Style,
  stance: StanceId | null,
  justWon: boolean,
  /** A kick-off must be played, not carried: the laws say the ball has to be
   *  passed and move before anybody can run with it. */
  atKickOff = false,
): MoveSet {
  const side = carrier.side;
  const dir = attackDirOf(side);
  const read = readPitch(carrier, team, opponents);
  const mates = team.filter((player) => player.id !== carrier.id && player.role !== 'GK');
  const keeper = team.find((player) => player.role === 'GK');
  // Positive when the player is further up the pitch than the man on the ball.
  // Home attacks towards y = 0, so 'further up' is a smaller number there.
  const ahead = (player: Player) => (player.spot.y - carrier.spot.y) * dir;
  const moves: Move[] = [];
  const blocked: Blocked[] = [];
  const allowed = new Set<ActionId>(STYLE_ACTIONS[style.id]);

  const add = (id: ActionId, endsOn: Player, spot: Position, baseRisk: number, readLine: string) => {
    // A stance is only worth what the players carrying it out can reach. They
    // can be pressing all they like: if nobody is near the man on the ball and
    // nobody is in the lane, the pass is not in any danger. Without this, a
    // free ball back to your own centre-back cost a third of the time.
    const inTheWay = laneBite(carrier.spot, spot, opponents);
    const contest = contestAround(read.pressureBite, inTheWay);
    // Who plays it, who takes it in, and — on a ball played into space — who
    // is chasing it. These scale the whole cost rather than the base alone:
    // beating a press is exactly what a great passer is for, so his quality
    // has to count for most where the pressure is highest.
    const played =
      id === 'driveAt'
        ? quality(carrier.attributes.pace, 0.24) * quality(carrier.attributes.touch, 0.16)
        : quality(carrier.attributes.passing, 0.34);
    const taken = id === 'driveAt' ? 1 : quality(endsOn.attributes.touch, 0.2);
    const chased = RUNNING_MOVES.has(id) ? quality(endsOn.attributes.pace, 0.32) : 1;
    const risk = clamp(
      (baseRisk + stancePenalty(id, stance) * contest) * played * taken * chased,
      0.03,
      0.72,
    );
    moves.push({
      id,
      name: ACTION_NAMES[id],
      read: readLine,
      endsOn,
      spot,
      risk,
      tone: toneFor(risk),
      // Judged on where the man receiving it is standing when it is played,
      // which is what a linesman is actually looking at. You cannot be offside
      // running with it yourself.
      offside: id !== 'driveAt' && isOffside(endsOn.spot, side, read.offsideLine),
    });
  };
  const block = (id: ActionId, why: string) => blocked.push({ id, name: ACTION_NAMES[id], why });

  // Nothing gets launched from the centre spot. Everybody is in their own half
  // at a kick-off, so there is nothing to run onto — and a side that opens
  // every restart by hitting it sixty yards is not playing football, it is
  // performing a tic. It has to be played into the side first.
  if (atKickOff) {
    for (const id of KICK_OFF_BANNED) {
      if (allowed.delete(id)) block(id, 'not from a kick-off — play it into the side first');
    }
  }

  if (allowed.has('outBack')) {
    const behind = [...mates, ...(keeper ? [keeper] : [])]
      .filter((player) => ahead(player) < -4)
      .sort((a, b) => gapBetween(a.spot, carrier.spot) - gapBetween(b.spot, carrier.spot))[0];
    if (behind) add('outBack', behind, behind.spot, 0.02, `${playerName(behind)} is free behind you`);
    else block('outBack', 'nobody is behind you to give it to');
  }

  if (allowed.has('shortForward')) {
    // Not just the man next to you. Anyone you could realistically pick out is
    // a candidate; the furthest one forward wins, and distance shows up in
    // what it costs rather than in whether it is offered at all.
    // Sorting purely by who is furthest forward made every "short" ball a
    // fifty-yard one, so a possession side and a direct side played exactly
    // the same pass. Distance past what the style is looking for now counts
    // against a man, which is what makes one team knock it about and another
    // hit the front.
    const want = SHORT_RANGE[style.id];
    const value = (player: Player) =>
      ahead(player) - Math.max(0, gapBetween(player.spot, carrier.spot) - want) * 1.5;
    const option = mates
      .filter((player) => ahead(player) > 4 && gapBetween(player.spot, carrier.spot) < 52)
      .sort((a, b) => value(b) - value(a))[0];
    if (option) {
      const blockers = laneBlockers(carrier.spot, option.spot, opponents);
      // A pass nobody is anywhere near should almost never go astray. What
      // costs you is a body in the lane or a man on your shoulder — not the
      // act of passing.
      const range = gapBetween(carrier.spot, option.spot);
      add(
        'shortForward',
        option,
        option.spot,
        0.03 + blockers * 0.07 + read.pressure * 0.04 + Math.max(0, range - 32) * 0.004,
        blockers
          ? `${blockers} in the lane to ${playerName(option)}`
          : read.pressure
            ? `${read.pressure} on you, but ${playerName(option)} is free`
            : `${playerName(option)} is free, nobody near you`,
      );
    } else block('shortForward', 'nobody has come short in front of you');
  }

  if (allowed.has('thirdMan')) {
    const near = mates
      .filter((player) => gapBetween(player.spot, carrier.spot) < 34)
      .sort((a, b) => gapBetween(a.spot, carrier.spot) - gapBetween(b.spot, carrier.spot));
    if (near.length < 2) block('thirdMan', 'you need two team-mates close enough to combine');
    else if (read.betweenLines >= 22) block('thirdMan', 'their lines are too far apart to play round');
    else {
      const receiver = near.slice(0, 3).sort((a, b) => ahead(b) - ahead(a))[0];
      add('thirdMan', receiver, receiver.spot, 0.05, 'They are compact — bounce it off and go round them');
    }
  }

  if (allowed.has('switchPlay')) {
    const farSide = mates
      .filter((player) => (player.spot.x < 50) !== (carrier.spot.x < 50))
      .sort((a, b) => Math.abs(b.spot.x - carrier.spot.x) - Math.abs(a.spot.x - carrier.spot.x))[0];
    if (read.ballSide - read.farSide < 2) {
      block('switchPlay', 'they are evenly spread — no free side to switch to');
    } else if (!farSide) {
      block('switchPlay', 'you have nobody on the far side');
    } else {
      add('switchPlay', farSide, farSide.spot, 0.05, `${read.ballSide} of them here, ${read.farSide} over there`);
    }
  }

  if (allowed.has('overTop')) {
    if (!read.highLine) block('overTop', 'they are sitting too deep — nothing behind them');
    else {
      const runner = fastestUpThere(mates, ahead, carrier.spot);
      // A quick man gets further past their line before it can turn, so the
      // ball is played that much further beyond it — you can see the difference
      // between sending Mbappé and sending a centre-half.
      const beyond = 3 + runner.attributes.pace * 0.4;
      const aim = { x: clamp(runner.spot.x, 12, 88), y: clamp(read.lineY + dir * beyond, 4, 96) };
      const target = reachable(runner, aim, dir);
      add('overTop', runner, target, 0.1, `Their line is high — grass behind it for ${playerName(runner)}`);
    }
  }

  if (allowed.has('driveAt') && atKickOff) {
    block('driveAt', 'you cannot run with it from a kick-off — it has to be played');
  } else if (allowed.has('driveAt')) {
    if (read.pressure > 1) block('driveAt', `${read.pressure} of them around you — no room to run`);
    else {
      const target = { x: carrier.spot.x, y: clamp(carrier.spot.y + dir * 13, 5, 95) };
      add(
        'driveAt',
        carrier,
        target,
        0.05 + read.pressure * 0.15,
        read.pressure ? 'One man to beat' : 'Nobody within reach of you',
      );
    }
  }

  if (allowed.has('channel')) {
    if (read.channel < 24) block('channel', 'their back line has no gap in it');
    else {
      const forwards = mates.filter((p) => isForward(p.role));
      const runner = fastestUpThere(forwards.length ? forwards : mates, ahead, carrier.spot);
      const through = 2 + runner.attributes.pace * 0.34;
      const aim = { x: clamp(runner.spot.x, 12, 88), y: clamp(read.lineY + dir * through, 5, 95) };
      const target = reachable(runner, aim, dir);
      add('channel', runner, target, 0.1, `A ${Math.round(read.channel)}-yard gap for ${playerName(runner)}`);
    }
  }

  if (allowed.has('cross')) {
    const wide = mates
      .filter((player) => isWide(player.role) && ahead(player) > -8)
      .sort((a, b) => Math.abs(b.spot.x - 50) - Math.abs(a.spot.x - 50))[0];
    // Whoever has got himself into the box, nearest the middle of the goal.
    const inBox = mates
      .filter((player) => (dir < 0 ? player.spot.y < 20 : player.spot.y > 80))
      .sort((a, b) => Math.abs(a.spot.x - 50) - Math.abs(b.spot.x - 50));
    if (!wide) block('cross', 'you have nobody wide and high enough');
    else if (!inBox.length) block('cross', 'no bodies in the box to aim at');
    else {
      // The delivery, not the run up to it. This move used to end with the man
      // on the ball standing on the byline, which is the one place on the
      // pitch you cannot score from — so a low block could never be broken.
      const attacker = inBox[0];
      const target = {
        x: clamp(attacker.spot.x, 36, 64),
        y: clamp(read.lineY + dir * 4, 4, 96),
      };
      add(
        'cross',
        attacker,
        target,
        0.12,
        `${playerName(wide)} to the byline, ${playerName(attacker)} attacking it`,
      );
    }
  }

  if (allowed.has('clear')) {
    const target = [...mates].sort((a, b) => ahead(b) - ahead(a))[0];
    add('clear', target, target.spot, 0.45, 'Get rid of it and reset — no risk to your own goal');
  }

  if (allowed.has('counter')) {
    if (!justWon) block('counter', 'only on in the moment you win it back');
    else {
      const runner = fastestUpThere(mates, ahead, carrier.spot);
      const burst = 10 + runner.attributes.pace * 0.5;
      const target = { x: clamp(runner.spot.x, 10, 90), y: clamp(runner.spot.y + dir * burst, 5, 95) };
      add('counter', runner, target, 0.08, `They are still coming forward — ${playerName(runner)} goes now`);

    }
  }

  return { moves, blocked, read };
}

// ---------------------------------------------------------------------------
// Moves the user draws for themselves
//
// The listed moves are suggestions, not the whole game. Dragging an arrow from
// the man on the ball plays whatever you want instead, priced by exactly the
// same rules — distance, how vertical it is, who is standing in the lane, and
// what the other side has committed to. Dragging from anyone else sends that
// player on a run, which changes what exists next beat.
// ---------------------------------------------------------------------------

/** The longest ball anyone can pick out — a keeper to a centre-forward is
 *  about eighty units, and there is no reason to forbid it. Distance is what
 *  it costs, not a wall you cannot pass through. */
export const MAX_DRAWN_PASS = 88;
/** The furthest a player can carry it in one go. */
export const MAX_CARRY = 17;
/**
 * The pitch is half again as long as it is wide, so a unit of y is a smaller
 * step across the screen than a unit of x. Anything judged by what the eye
 * sees rather than by football distance has to say so, or a catchment meant to
 * be the size of a player comes out as a tall oval half again too big.
 */
export const PITCH_STRETCH = 1.5;
export const aimGap = (a: Position, b: Position) =>
  Math.hypot(a.x - b.x, (a.y - b.y) * PITCH_STRETCH);

/**
 * How near an arrow has to end to count as being meant for that player, in
 * units of the pitch's width.
 *
 * This is his own marker and a touch either side. It used to be eleven units —
 * a catchment several times the size of the man himself — so every arrow drawn
 * into the grass beside somebody was read as a pass to him and there was no
 * way to dribble into a gap at all. Finish on a man and it is a pass; finish
 * on grass and he takes it there himself. That is the whole rule.
 */
export const AIM_RADIUS = 3.2;
/** How far off the line of the arrow a man can be and still be who you meant. */
const AIM_CORRIDOR = 8;

/**
 * Who this arrow is meant for.
 *
 * You aim a pass by dragging TOWARDS somebody, not by landing exactly on him.
 * Requiring the endpoint to finish within a few units of a marker meant that
 * stopping short, overshooting, or aiming at a man who was about to move all
 * failed to find a receiver — and the move then fell through to "run with it",
 * so the ball got dribbled when a pass was plainly intended.
 *
 * So: anyone sitting near the end of the arrow wins outright, and failing that
 * anyone lying along its line, in front of the man on the ball, is who you
 * meant. Only if the arrow points at genuinely empty grass is there nobody.
 */
function pickReceiver(
  carrier: Player,
  target: Position,
  team: Player[],
  runningTo: Record<string, Position>,
  lofted: boolean,
  /** The size of a marker as it is actually drawn, in pitch-width units. The
   *  view measures it, because a marker on a phone is not the same fraction of
   *  the pitch as one on a desktop and the catchment has to be the man. */
  aim = AIM_RADIUS,
): Player | null {
  const dx = target.x - carrier.spot.x;
  const dy = target.y - carrier.spot.y;
  const length = Math.hypot(dx, dy);
  if (length < 1) return null;

  const ux = dx / length;
  const uy = dy / length;

  const candidates = team
    // The keeper included. He is a team-mate with feet, and a ball back to him
    // is one of the most ordinary passes in football — but he was filtered out
    // of every drawn pass, so an arrow at your own keeper found nobody at all
    // and the ball was either dribbled or simply not played.
    .filter((player) => player.id !== carrier.id)
    .map((player) => {
      // If he is timing a run, you are aiming at where he is going.
      const aim = runningTo[player.id] ?? player.spot;
      const ax = aim.x - carrier.spot.x;
      const ay = aim.y - carrier.spot.y;
      // Measured against the LINE the arrow points along, not the little
      // segment you happened to stop drawing at. Clamping to the segment meant
      // a man further down the same line read as far away, so stopping short
      // of him found nobody and the ball got dribbled instead of passed.
      const reach = ax * ux + ay * uy;
      const offLine = Math.abs(ax * uy - ay * ux);
      // How near the arrow finished to him is a question about the picture on
      // the screen, so it is measured the way the screen measures.
      return { player, aim, reach, offLine, along: reach / length, atEnd: aimGap(aim, target) };
    });

  // If the arrow finishes on the end of a run you have drawn, that is who it
  // is for — no question. You told him to go there and then played the ball
  // there, which is a pass into his path, not the man on the ball setting off
  // on a dribble because nobody happened to be standing on that grass yet.
  const ontoARun = candidates
    .filter((entry) => runningTo[entry.player.id] && entry.atEnd < aim * 1.4)
    .sort((a, b) => a.atEnd - b.atEnd)[0];
  if (ontoARun) return ontoARun.player;

  // Landed on him: that is unambiguous.
  const direct = candidates
    .filter((entry) => entry.atEnd < aim)
    .sort((a, b) => a.atEnd - b.atEnd)[0];
  if (direct) return direct.player;

  // Everything below here is aiming AT somebody rather than landing on him,
  // and along the ground that is only ever the right reading of an arrow too
  // long to be a dribble. Inside carrying range an arrow into space means
  // exactly what it looks like, and the corridor is what used to steal it.
  // A ball in the air is never a dribble, so it keeps the corridor at any
  // length — you are picking out an area, not a pair of feet.
  if (!lofted && length <= MAX_CARRY) return null;

  // Otherwise the man the arrow points at: in front of the passer, close to
  // its line, and within reach of how far you actually drew. A ball in the air
  // gets a wider corridor because it is aimed at an area, not at a pair of feet.
  const corridor = lofted ? AIM_CORRIDOR * 1.5 : AIM_CORRIDOR;
  const pointed = candidates
    .filter(
      (entry) =>
        entry.along > 0.3 &&
        entry.along < 2.6 &&
        entry.offLine < corridor &&
        // A short prod cannot mean a man forty units further down the line.
        entry.reach < length + MAX_CARRY * 2,
    )
    .sort((a, b) => a.offLine - b.offLine)[0];
  return pointed?.player ?? null;
}

/**
 * Is this arrow actually aimed at the net?
 *
 * It has to finish ON the goal, not merely somewhere near it. This used to be
 * a 22-unit circle around the goal mouth, which swallowed the whole penalty
 * area — so every ball played into the box became a shot and you could not
 * pass in the final third at all. The goal is 10.8 units wide, so 9 either
 * side of the middle plus a few units past the line is a generous target for
 * a finger and still unmistakably the net.
 */
const GOAL_HALF_WIDTH = 9;
const GOAL_DEPTH = 5;

export const aimsAtGoal = (target: Position, side: Side) => {
  const line = goalLine(side);
  const behindTheLine = side === 'home' ? target.y <= line + GOAL_DEPTH : target.y >= line - GOAL_DEPTH;
  return behindTheLine && Math.abs(target.x - 50) <= GOAL_HALF_WIDTH;
};


// ---------------------------------------------------------------------------
// What happens after a pass lands
// ---------------------------------------------------------------------------

/**
 * How much room the man on the ball has in front of him: 1 is clean through
 * with the pitch opening up ahead, 0 is hemmed in with bodies all round him.
 *
 * Two separate things close a player down and they are not the same. Men
 * standing between him and the goal take away somewhere to run to; men stood
 * on top of him take away the time to do it. A striker with three defenders
 * twenty units ahead can still drive at them. The same striker with two of
 * them at his shoulder cannot do anything but hold it.
 */
export function roomAhead(carrier: Player, opponents: Player[]): number {
  const dir = attackDirOf(carrier.side);
  let ahead = 0;
  let tight = 0;
  for (const man of opponents) {
    if (man.role === 'GK') continue;
    const gap = gapBetween(man.spot, carrier.spot);
    if (gap < 8) tight += 1 - gap / 8;
    // Goal-side of him, near enough to be in the way, and in his lane rather
    // than over on the far touchline.
    const infront = (man.spot.y - carrier.spot.y) * dir;
    if (infront > -3 && infront < 26 && Math.abs(man.spot.x - carrier.spot.x) < 20) {
      ahead += 1 - Math.min(gap, 26) / 32;
    }
  }
  return clamp(1 - ahead * 0.42 - tight * 0.5, 0, 1);
}

/** How the beats after a pass should run: how many, and how far he takes it
 *  in each one. */
export type Settling = { beats: number; carry: number; room: number };

/**
 * A pass arriving is the start of a move, not the end of one — but how much
 * of a move depends entirely on what he has landed in.
 *
 * Played in behind with grass ahead, the whole thing runs on: a beat to gather
 * it while they scramble back, then two more going at them. Played into a box
 * with eight men in it there is nothing to run into, so he holds it and the
 * beat belongs to everybody else — they move, they show for it, and the ball
 * comes straight back to you to pick the next one. A fixed count of three
 * meant a man in a crowd put his head down and dribbled into it, which is not
 * a thing footballers do.
 */
export function settlingPlan(carrier: Player, opponents: Player[]): Settling {
  const room = roomAhead(carrier, opponents);
  // A man running onto a ball in behind is at a full sprint with nobody to
  // beat, and should cover ground like it — more than a defender turning and
  // chasing him, which is the whole point of getting in behind. Hemmed in, the
  // same figure scales down to a shift of the feet.
  const legs = 4 + carrier.attributes.pace * 0.34;
  return {
    beats: room > 0.58 ? 3 : room > 0.28 ? 2 : 1,
    carry: legs * (0.1 + room * 0.9),
    room,
  };
}

export type DrawnMove = {
  kind: 'pass' | 'carry' | 'shot';
  lofted: boolean;
  receiver: Player | null;
  spot: Position;
  risk: number;
  tone: Tone;
  offside: boolean;
  label: string;
  /** Why it costs what it costs, in football terms. */
  read: string;
};

/**
 * A move the user drew. Along the ground, anyone standing in the lane can put
 * a foot in and that is the main thing that costs you. In the air, the lane
 * does not matter at all — the ball goes over them — but it is harder to
 * control, costs more the further it travels, and runs into a squeezed line.
 * That trade is the whole reason for having both.
 */
export function drawMove(
  carrier: Player,
  target: Position,
  team: Player[],
  opponents: Player[],
  stance: StanceId | null,
  lofted: boolean,
  shooting = false,
  /** Where team-mates are about to run, for runs timed to the pass. The ball
   *  is played into that space, but offside is judged from where the man is
   *  standing when it leaves the boot — which is what the law actually says,
   *  and what makes timing a run the way past a high line. */
  runningTo: Record<string, Position> = {},
  /** A kick-off has to be passed, so no carrying it away from the spot. */
  atKickOff = false,
  /** The catchment around a player, as the view has measured his marker. */
  aim = AIM_RADIUS,
  /** How hard the drag curved, 0 to 1. A whipped ball bends round the lane;
   *  a whipped shot bends round the wall. */
  curve = 0,
): DrawnMove | null {
  const side = carrier.side;
  const dir = attackDirOf(side);
  const read = readPitch(carrier, team, opponents);

  // An arrow drawn at their goal is a shot, from wherever he happens to be
  // standing. Thirty-five yards and three men in the way is a bad idea rather
  // than an impossible one, and the panel says which.
  if (shooting) {
    const chance = shotChance(carrier.spot, side, opponents, carrier, curve);
    const straight = shotChance(carrier.spot, side, opponents, carrier, 0);
    const yards = Math.round(distanceToGoal(carrier.spot, side));
    // Whether bending it helped is a thing the panel should say out loud, in
    // both directions — a curled shot from a daft position is worse than a
    // straight one and you should be able to see that before you let go.
    const curled = curve > 0.15;
    const helped = chance - straight;
    return {
      kind: 'shot',
      lofted,
      receiver: null,
      spot: { x: 50, y: goalLine(side) },
      // A shot is not a turnover the way a pass is: this is the chance of it
      // NOT going in, and the panel words it the right way round.
      risk: 1 - chance,
      tone: toneFor(1 - chance),
      offside: false,
      label: curled ? `${playerName(carrier)} bends it` : `${playerName(carrier)} shoots`,
      read: curled
        ? helped > 0.03
          ? `Whipped round them from ${yards} — that is the way to hit this one`
          : helped < -0.02
            ? `Bending it from ${yards} when the straight one was on`
            : `Curled from ${yards}, and it makes little odds from there`
        : chance >= 0.42
          ? `${yards} out, and the goal at his mercy`
          : chance >= 0.28
            ? `A real chance, ${yards} out`
            : chance >= 0.16
              ? `Half a sight of it, ${yards} out`
              : `A long way out — ${yards}, and bodies in front of him`,
    };
  }

  const receiver = pickReceiver(carrier, target, team, runningTo, lofted, aim);

  if (receiver) {
    // If he is timing a run, the ball goes into the space he is running into.
    const meetsAt = runningTo[receiver.id] ?? receiver.spot;
    const running = Boolean(runningTo[receiver.id]);
    const distance = gapBetween(carrier.spot, meetsAt);
    if (distance > MAX_DRAWN_PASS) return null;
    const gained = (meetsAt.y - carrier.spot.y) * dir;
    const forward = Math.max(0, gained);
    const backward = gained < -6;
    const blockers = lofted ? 0 : laneBlockers(carrier.spot, meetsAt, opponents);
    // What the defending shape thinks it is dealing with.
    const facing: ActionId = lofted ? 'overTop' : distance >= 34 ? 'switchPlay' : 'shortForward';
    // A ball in the air bent round the covering man is the hardest one there
    // is to defend, and the hardest one to hit. Whipping it is a passing skill
    // rather than a strength one, so a good passer gets far more out of the
    // trade than a centre-half launching it.
    const whip = lofted ? clamp(curve, 0, 1) : 0;
    const base = lofted
      ? 0.09 + distance * 0.0032 + read.pressure * 0.03 + whip * 0.06
      : 0.02 +
        distance * (backward ? 0.0008 : 0.0018) +
        forward * 0.002 +
        blockers * 0.08 +
        read.pressure * 0.04;
    // Same rule as the listed moves: a stance only bites where they can
    // actually get at it — and less of it reaches a ball bending away from it.
    const contest =
      contestAround(read.pressureBite, lofted ? 0 : laneBite(carrier.spot, meetsAt, opponents)) *
      (1 - whip * 0.32);
    // A ball in the air asks more of the man taking it in than one on the deck.
    const played = quality(carrier.attributes.passing, 0.34 + whip * 0.22);
    const taken = quality(receiver.attributes.touch, lofted ? 0.28 : 0.2);
    const risk = clamp(
      (base + stancePenalty(facing, stance) * contest) * played * taken,
      0.03,
      0.72,
    );
    return {
      kind: 'pass',
      lofted,
      receiver,
      spot: meetsAt,
      risk,
      tone: toneFor(risk),
      // Judged where he is standing as it is played, not where he ends up.
      offside: isOffside(receiver.spot, side, read.offsideLine),
      label: running
        ? `${playerName(receiver)} runs onto it`
        : lofted
          ? whip > 0.15
            ? `Bent over the top to ${playerName(receiver)}`
            : `Lofted to ${playerName(receiver)}`
          : `Ball to ${playerName(receiver)}`,
      read: running
        ? whip > 0.15
          ? 'Bent into the space he is running into — onside as it goes'
          : !blockers && forward > 12
            ? 'Straight through the gap, and he is running onto it'
            : 'Played into the space he is running into — onside as it goes'
        : lofted
          ? whip > 0.15
            ? 'Whipped round the covering man'
            : 'Over the top of them'
          : blockers
            ? `${blockers} in the lane`
            : backward
              ? 'Backwards into space'
              : read.pressure
                ? `${read.pressure} on you, but the lane is clear`
                : 'Nobody in the way',
    };
  }

  // Nobody at all to aim at, so this is a run with the ball into that space.
  //
  // A ball hit in the air is never this. If you have picked the sky and there
  // is nobody out there, the answer is that the pass is not on — not that the
  // man puts his head down and dribbles, which is what used to happen and is
  // the opposite of what anyone drawing a lofted arrow meant.
  if (lofted) return null;
  // Nor can you dribble a kick-off. It has to be played to somebody first.
  if (atKickOff) return null;
  const reach = Math.min(gapBetween(carrier.spot, target), MAX_CARRY);
  if (reach < 3) return null;
  const angle = Math.atan2(target.y - carrier.spot.y, target.x - carrier.spot.x);
  const spot = {
    x: clamp(carrier.spot.x + Math.cos(angle) * reach, 5, 95),
    y: clamp(carrier.spot.y + Math.sin(angle) * reach, 5, 95),
  };
  const carryContest = contestAround(read.pressureBite * 1.15, 0);
  const legs = quality(carrier.attributes.pace, 0.24) * quality(carrier.attributes.touch, 0.16);
  const risk = clamp(
    (0.04 + read.pressureBite * 0.13 + (reach / MAX_CARRY) * 0.04 +
      stancePenalty('driveAt', stance) * carryContest) * legs,
    0.03,
    0.72,
  );

  return {
    kind: 'carry',
    lofted: false,
    receiver: null,
    spot,
    risk,
    tone: toneFor(risk),
    offside: false,
    label: 'Take it into that space',
    read: read.pressure ? `${read.pressure} of them close by` : 'Room to run into',
  };
}


// ---------------------------------------------------------------------------
// Shooting
// ---------------------------------------------------------------------------


export const goalLine = (side: Side) => (side === 'home' ? 0 : 100);

/**
 * The pitch is 68 metres across and 105 long, so a unit of x is about
 * two-thirds of a unit of y in real distance. Measuring a shot's range without
 * that made every wide chance read as half again further out than it really
 * is, which pinned anything from a tight angle at the 2% floor — and a shot
 * you cannot price is a shot you cannot bend round anybody either.
 */
const X_TO_Y = 0.65;

export const distanceToGoal = (spot: Position, side: Side) =>
  Math.hypot((spot.x - 50) * X_TO_Y, spot.y - goalLine(side));

export const canShoot = (spot: Position, side: Side) => distanceToGoal(spot, side) < 32;

/**
 * What bending it is worth from here, 0 to 1.
 *
 * Curl is not a free upgrade — it is an answer to a specific problem. Bodies
 * in the way give it something to go round, and a tight angle gives it
 * something to come back from; those are the situations where whipping it is
 * the right call. With the goal gaping in front of you it is a flourish, and
 * flourishes miss.
 */
export function curlIsWorthIt(spot: Position, side: Side, opponents: Player[]): number {
  const mouth = { x: 50, y: goalLine(side) };
  const blockers = Math.min(
    3,
    opponents.filter(
      (opponent) => opponent.role !== 'GK' && distanceToLane(opponent.spot, spot, mouth) < 5.5,
    ).length,
  );
  const angle = Math.min(1, Math.abs(spot.x - 50) / 26);
  return clamp((blockers / 3) * 0.6 + angle * 0.4, 0, 1);
}

export function shotChance(
  spot: Position,
  side: Side,
  opponents: Player[],
  shooter?: Player,
  /** How hard the shot was drawn to curve, 0 (straight) to 1 (whipped). */
  curve = 0,
): number {
  const mouth = { x: 50, y: goalLine(side) };
  // Bodies genuinely in the way. Capped, because a packed six-yard box should
  // make a chance hard rather than arithmetically impossible — without the cap
  // every shot against a low block priced at the 2% floor, so nobody could
  // ever score against one.
  const blockers = Math.min(
    3,
    opponents.filter(
      (opponent) => opponent.role !== 'GK' && distanceToLane(opponent.spot, spot, mouth) < 5.5,
    ).length,
  );
  const keeper = opponents.find((opponent) => opponent.role === 'GK');
  // A finisher gets more out of the same sight of goal; a good keeper takes it
  // straight back off him. A centre-half who has wandered up gets neither.
  const strike = shooter ? 1 + edge(shooter.attributes.finishing) * 0.35 : 1;
  const save = keeper ? 1 - edge(keeper.attributes.tackling) * 0.3 : 1;
  // Bending it round them. Whipping a ball is a passing skill as much as a
  // finishing one, so that is what prices how well it comes off; whether it
  // was worth attempting at all is down to what is in front of him.
  const technique = shooter ? 1 + edge(shooter.attributes.passing) * 0.5 : 1;
  const worthIt = curlIsWorthIt(spot, side, opponents);
  const curl = curve > 0 ? 1 + curve * (worthIt * 0.55 * technique - 0.18) : 1;
  // Curl takes it round bodies, so they stop being the wall they were, and it
  // brings the ball back across from a tight angle — which is the single thing
  // bending a shot is actually for.
  const inTheWay = blockers * 0.07 * (1 - curve * 0.45);
  const angle = Math.abs(spot.x - 50) * 0.007 * (1 - curve * 0.5);
  return clamp(
    (0.66 - distanceToGoal(spot, side) * 0.019 - angle - inTheWay) * strike * save * curl,
    0.02,
    0.78,
  );
}

// ---------------------------------------------------------------------------
// What the opponent does
// ---------------------------------------------------------------------------

/** The style a shape naturally plays, so the opponent behaves like its team. */
export function styleForShape(shape: number[]): StyleId {
  const back = shape[0] ?? 4;
  const front = shape[shape.length - 1] ?? 2;
  const middle = shape.slice(1, -1).reduce((total, line) => total + line, 0);
  if (back >= 5) return 'pragmatic';
  if (middle >= 4) return 'possession';
  if (front >= 2) return 'direct';
  return 'possession';
}

export type AiChoice = { kind: 'shoot'; chance: number } | { kind: 'move'; move: Move };

export function aiChoose(
  carrier: Player,
  team: Player[],
  opponents: Player[],
  style: Style,
  justWon: boolean,
  sharp: boolean,
  /** What they played last time, so they do not knock the same ball over and
   *  over. A passage of play is a sequence, not the same decision repeated. */
  last?: ActionId,
  /** A kick-off is a kick-off for them too — it gets played into the side. */
  atKickOff = false,
): AiChoice {
  if (canShoot(carrier.spot, carrier.side)) {
    const chance = shotChance(carrier.spot, carrier.side, opponents, carrier);
    if (chance > (sharp ? 0.16 : 0.26)) return { kind: 'shoot', chance };
  }
  // It does not know the stance it is about to run into — that is the read.
  const { moves } = availableMoves(carrier, team, opponents, style, null, justWon, atKickOff);
  const legal = moves.filter((move) => !move.offside);
  const pool = legal.length ? legal : moves;
  if (!pool.length) {
    return { kind: 'shoot', chance: shotChance(carrier.spot, carrier.side, opponents, carrier) };
  }
  const dir = attackDirOf(carrier.side);
  const best = pool
    .map((move) => {
      const gain = (move.spot.y - carrier.spot.y) * dir;
      // Ground counts, but with diminishing returns. Scoring it flat meant
      // forty yards was worth exactly twice twenty, so the longest ball on the
      // board won every single time and they hit it long on every play. A
      // forty-yard ball is a better move than a twenty-yard one; it is not
      // twice the move.
      const ground = Math.sign(gain) * Math.sqrt(Math.abs(gain)) * 4.5;
      const taste = LONG_MOVES.has(move.id) ? LONG_TASTE[style.id] : 1;
      // There is always something in keeping it. A side with nothing on should
      // go back and come again rather than launching it and hoping — which is
      // also what stops the ball living in one corner of the pitch.
      // ...but keeping it by going backwards is worth a good deal less than
      // keeping it while going forward, or a side that only wants the ball
      // safe passes it back to its own defence all afternoon.
      const keep = (1 - move.risk) * (gain < -3 ? 3.5 : 9);
      // And not the same ball twice running — nor a second long one straight
      // after the first. One team hitting it forty yards on every touch is not
      // a style, it is a tic, and penalising only the identical action was not
      // enough to stop it: they simply alternated between two different long
      // balls. After one, anything that travels has to be clearly better than
      // the alternative to get played.
      const again = move.id === last ? -7 : 0;
      const twiceLong = last && LONG_MOVES.has(last) && LONG_MOVES.has(move.id) ? -11 : 0;
      // Distance is a cost in its own right, not merely a chance of losing it.
      // Without this a forty-yard ball that got you thirty yards up the pitch
      // always beat a fifteen-yard one that got you twenty, so the longest
      // option on the board won by default — which is what "they hit it long
      // every single time" actually was.
      const stretch = -Math.max(0, gapBetween(carrier.spot, move.spot) - 24) * 0.9;
      return {
        move,
        score:
          ground * taste +
          keep +
          again +
          twiceLong +
          stretch -
          move.risk * (sharp ? 22 : 28) +
          Math.random() * (sharp ? 5 : 12),
      };
    })
    .sort((a, b) => b.score - a.score)[0];

  return { kind: 'move', move: best.move };
}

/**
 * Which stance the opponent takes when you have it. A sharp one covers the
 * side you keep going down and the style you keep playing; a soft one just
 * plays what its own shape suggests.
 */
export function aiStance(
  shape: number[],
  sharp: boolean,
  yourStyle: StyleId,
  yourSide: 'left' | 'right' | null,
  lean: StanceId | null = null,
): StanceId {
  // A real manager has a way of defending and mostly sticks to it. Simeone
  // drops, Sacchi squeezes, Klopp presses — so their side goes to it more
  // often than not, and a sharp one still departs from it to hurt you.
  if (lean && Math.random() < (sharp ? 0.45 : 0.7)) return lean;
  if (sharp) {
    if (yourStyle === 'possession') return Math.random() < 0.65 ? 'press' : 'narrow';
    if (yourStyle === 'direct') return Math.random() < 0.65 ? 'squeeze' : 'drop';
    if (yourSide) return 'narrow';
    return 'drop';
  }
  const back = shape[0] ?? 4;
  const front = shape[shape.length - 1] ?? 2;
  const pool: StanceId[] = ['squeeze'];
  if (front >= 3) pool.push('press');
  if (back >= 5) pool.push('drop', 'narrow');
  if (back === 4) pool.push('press', 'narrow');
  pool.push('drop');
  return pool[Math.floor(Math.random() * pool.length)];
}
