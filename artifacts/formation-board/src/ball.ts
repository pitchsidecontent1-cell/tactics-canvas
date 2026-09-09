// ---------------------------------------------------------------------------
// The ball, and who is actually near enough to have it.
//
// This exists because possession used to be ASSIGNED. A pass was priced, a
// die was rolled, and the ball together with the right to play it was handed
// to whoever the model had nominated — regardless of whether that man was
// anywhere near where the ball came down. He was moved there afterwards. On
// screen that reads exactly as it sounds: a ball played to nobody, collected
// by a player who arrives second, and an opposition that seems to pass
// through positions rather than through people.
//
// So two rules live here, and every possession change in the game goes
// through them:
//
//   a ball is somewhere.  Controlled by a named player, in flight between two
//   points, or lying loose on the grass. It is never in two of those at once
//   and it is never nowhere.
//
//   somebody has to reach it.  Whoever gets to it first gets it, where first
//   is measured in seconds — the ground he has to cover divided by how fast
//   he can cover it — from where the players ACTUALLY are, not from where the
//   model has decided they will be by the end of the beat.
//
// Nothing in here touches React or the DOM, so the balance harness runs it
// headless and the same rule decides both teams' possession.
// ---------------------------------------------------------------------------

import type { Position } from "./pitch-types";
import type { Player } from "./match-model";
import {
  flightSeconds,
  metresBetween,
  reachIn,
  timeToCover,
  topSpeedFor,
} from "./motion";

/** Close enough to take the ball down without breaking stride, in metres. */
export const CONTROL_RANGE = 2.2;

/**
 * How long a man is allowed to be arriving before it stops counting as him
 * getting there. Football is full of balls collected on the stretch; it is not
 * full of balls collected four seconds after they stopped rolling.
 */
export const REACH_SECONDS = 1.4;

/**
 * And how long somebody will chase one that nobody is near. A ball squirting
 * away from a challenge with everybody facing the wrong way is not instantly
 * anybody's; it runs, and somebody eventually gets after it.
 */
export const LOOSE_SECONDS = 4;

export type BallState =
  /** On somebody's foot. */
  | { kind: "controlled"; by: string; at: Position }
  /** Nobody's, lying where it stopped. */
  | { kind: "loose"; at: Position }
  /** Travelling, and belonging to nobody until it lands. */
  | {
      kind: "inFlight";
      from: Position;
      to: Position;
      /** Who struck it, and who it was meant for. Either may be nobody. */
      struckBy: string | null;
      meantFor: string | null;
      bend: number;
      lofted: boolean;
    };

/** Where the ball is, or is going. */
export const ballAt = (state: BallState): Position =>
  state.kind === "inFlight" ? state.to : state.at;

/** Who has it, if anybody does. In flight, nobody does — that is the point. */
export const ballCarrier = (state: BallState): string | null =>
  state.kind === "controlled" ? state.by : null;

/** Every length in this file is in metres, because every one of them is
 *  divided by a speed in metres per second. */
const gap = metresBetween;

/** One man's claim on a ball: how far he has to go, and how long that takes. */
export type Reach = { player: Player; seconds: number; gap: number };

/** How long this player needs to get to a spot, from where he is standing. */
export const reachTime = (player: Player, at: Position): Reach => {
  const away = gap(player.spot, at);
  return {
    player,
    gap: away,
    // The last stride or so is free: you do not have to stand on a ball to
    // play it, you have to be able to stretch out a foot. Everything before
    // that he has to run, from a standstill — see timeToCover. Dividing by top
    // speed instead would make every defender able to reach anything.
    seconds: timeToCover(
      Math.max(0, away - CONTROL_RANGE),
      topSpeedFor(player.attributes.pace),
    ),
  };
};

/** Whoever of these gets there first, or nobody if none of them can. */
export function firstTo(
  at: Position,
  runners: Player[],
  within = REACH_SECONDS,
): Reach | null {
  let best: Reach | null = null;
  for (const player of runners) {
    const reach = reachTime(player, at);
    if (reach.seconds > within) continue;
    if (!best || reach.seconds < best.seconds) best = reach;
  }
  return best;
}

export type Contest = {
  player: Player;
  turnedOver: boolean;
  seconds: number;
  gap: number;
  /** How far clear he was, in seconds. Zero when nobody else could reach it. */
  clearBy: number;
};

/**
 * Who comes away with a ball nobody controls.
 *
 * Both sides race for it on the same terms and the winner is simply the man
 * who arrives first. `null` means what it says: it is on the floor and nobody
 * is close enough to claim it, which is a thing that happens in football and
 * used to be impossible here — the old rule handed it to the nearest player on
 * the pitch however far away he was standing.
 */
export function contestFor(
  at: Position,
  theirs: Player[],
  ours: Player[],
  within = REACH_SECONDS,
): Contest | null {
  const them = firstTo(at, theirs, within);
  const us = firstTo(at, ours, within);
  if (!them && !us) return null;
  const turnedOver = !us || (!!them && them.seconds < us.seconds);
  const won = (turnedOver ? them : us) as Reach;
  const lost = turnedOver ? us : them;
  return {
    player: won.player,
    turnedOver,
    seconds: won.seconds,
    gap: won.gap,
    clearBy: lost ? lost.seconds - won.seconds : within,
  };
}

/**
 * Where a pass to a man's feet should actually be hit.
 *
 * The model says where he is going. If you hit the ball there, the ball wins
 * the race to it every time — it travels several times faster than he does —
 * and arrives at an empty patch of grass he then jogs onto. So instead: find
 * the point on his run where the two of them get there together, by guessing
 * and correcting a few times. It converges quickly because moving the target
 * closer shortens the flight, which moves it closer again.
 *
 * The result is a pass played into his stride, which is both what a footballer
 * does and what stops the ball arriving before its receiver.
 */
export function meetPoint(
  from: Position,
  runner: Player,
  runningTo: Position,
  lofted = false,
): Position {
  const legX = runningTo.x - runner.spot.x;
  const legY = runningTo.y - runner.spot.y;
  // His run, in metres — the same units as his speed, which is the whole
  // reason this now works rather than nearly working.
  const leg = gap(runner.spot, runningTo);
  if (leg < 0.4) return { ...runningTo };
  const speed = topSpeedFor(runner.attributes.pace);
  let guess = { ...runningTo };
  for (let round = 0; round < 4; round += 1) {
    const flight = flightSeconds(gap(from, guess), lofted);
    // How far he ACTUALLY gets in that time: he has to notice, and then he has
    // to accelerate. A flat fraction of top speed was the same optimism in
    // cheaper clothing and it put the ball metres past him.
    const covered = Math.min(leg, reachIn(flight, speed));
    const along = covered / leg;
    guess = { x: runner.spot.x + legX * along, y: runner.spot.y + legY * along };
  }
  return guess;
}
