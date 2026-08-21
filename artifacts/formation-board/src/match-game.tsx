// ---------------------------------------------------------------------------
// Match mode: a game about reading a shape.
//
// The panel never offers the same list twice over. Your style decides which
// moves you own at all, and the pitch decides which of those are on right now
// — switching play needs them loaded on one side, a ball in behind needs their
// line to be high. Moves that are off stay on screen with the reason they are
// off, because that reason is the thing worth learning.
//
// You never see their stance written down on hard. You see their shape move,
// and you work it out. Easy spells it out and shows the odds.
//
// The clock only counts while the ball is travelling, so reading the pitch is
// free and the sixty seconds are sixty seconds of football.
// ---------------------------------------------------------------------------

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  BookOpen,
  Crosshair,
  Flag,
  Play,
  RotateCcw,
  Timer,
  Trophy,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { FORMATIONS, type Formation } from "./formations";
import { TUTORIAL, TUTORIAL_DONE, type MatchEvent } from "./tutorial-content";
import type { Position } from "./pitch-types";
import {
  type ActionId,
  type Move,
  type Player,
  type Side,
  type StanceId,
  STANCES,
  STYLES,
  type StyleId,
  type DrawnMove,
  type Settling,
  settlingPlan,
  type BlockId,
  BLOCKS,
  AIM_RADIUS,
  challengesFor,
  curlIsWorthIt,
  aiChoose,
  aimGap,
  aimsAtGoal,
  blockById,
  zoneOf,
  aiStance,
  availableMoves,
  buildTeam,
  canShoot,
  clamp,
  drawMove,
  kickOffShape,
  kickOffTaker,
  looseBall,
  nearestTo,
  offsideLineOf,
  playerName,
  distanceToGoal,
  toneFor,
  reshape,
  shotChance,
  stanceBiteFor,
  stanceById,
  styleById,
  styleForShape,
} from "./match-model";
import {
  type Dugout,
  DUGOUTS,
  type SquadEntry,
  dugoutById,
  dugoutLabel,
  squadForEra,
  stanceForManager,
  styleForManager,
} from "./squad";

/**
 * A side is either a bare shape or somebody's actual team. Picking Sacchi's
 * Milan gets you their shape, their eleven — names, numbers and all — and the
 * way Sacchi's sides played, on and off the ball.
 */
type SideChoice =
  | { kind: "formation"; formation: Formation }
  | { kind: "dugout"; dugout: Dugout };

const shapeOf = (choice: SideChoice) =>
  choice.kind === "formation"
    ? choice.formation.shape
    : choice.dugout.era.shape;

const squadOf = (choice: SideChoice): SquadEntry[] =>
  choice.kind === "formation" ? [] : squadForEra(choice.dugout.era);

/** What to call this side on screen. */
const sideName = (choice: SideChoice) =>
  choice.kind === "formation"
    ? choice.formation.name
    : `${choice.dugout.era.club} ${choice.dugout.era.years}`;

/** How this side plays with the ball. A shape can only suggest it; a manager
 *  decides it, which is why the two 4-2-3-1s in the list are not the same team. */
const styleOf = (choice: SideChoice): StyleId =>
  choice.kind === "formation"
    ? styleForShape(choice.formation.shape)
    : styleForManager(choice.dugout.manager.name);

/** How they set up without it, when there is a manager to have an opinion. */
const stanceOf = (choice: SideChoice): StanceId | null =>
  choice.kind === "formation"
    ? null
    : stanceForManager(choice.dugout.manager.name);

/** The line the panel uses to describe who you are up against. */
const sideBlurb = (choice: SideChoice) =>
  choice.kind === "formation"
    ? `${choice.formation.name}, ${styleForShape(choice.formation.shape)}`
    : `${choice.dugout.manager.name}'s ${choice.dugout.era.club}, ${styleOf(choice)} — ` +
      `${stanceById(stanceForManager(choice.dugout.manager.name)).name.toLowerCase()} without it`;

const FIRST_SHAPE: SideChoice = { kind: "formation", formation: FORMATIONS[0] };
const SECOND_SHAPE: SideChoice = {
  kind: "formation",
  formation: FORMATIONS[1],
};

const MATCH_SECONDS = 60;
/** The most the half can run past its mark while waiting for a natural break. */
const HALF_ADDED_SECONDS = 5;
/** When the first half is up, in milliseconds of football played. */
const HALF_MS = (MATCH_SECONDS / 2) * 1000;

// You should be able to watch a ball travel and watch men run after it, and
// none of that reads if a beat is over before your eye has found the ball.
// But a beat also has to be a beat of FOOTBALL: seven units of grass is about
// seven metres, and taking the best part of two seconds over it is a jog, not
// a player running. These were set when a beat covered twice the ground it
// does now, and leaving them there is what made the game drag.
const MOVE_MS = 1100;
const SHOT_MS = 800;
const SETTLE_MS = 600;
/** A held beat when defending, so committing the shape and seeing what they
 *  do with it are two moments rather than one. */
const REVEAL_MS = 520;

/** How long each beat of play after a pass lands takes. How MANY of them there
 *  are is the model's call — see settlingPlan — because a ball into space and
 *  a ball into a crowded box are not the same event. */
const SETTLE_BEAT_MS = 620;

/** How long you get to send a man on after he has taken the ball down.
 *  Long enough to see it and react to it, short enough that the game does
 *  not stop dead every time somebody controls a pass. */
const RUN_ON_MS = 1500;

/**
 * The catchment around a player is measured off his marker as it is actually
 * drawn, rather than fixed in pitch units.
 *
 * A marker is clamp(13px, 1.75vw, 20px) across, so on a desktop it is about
 * 3.7% of the pitch's width and on a phone nearer 6% — any single figure in
 * pitch units is therefore the wrong size on one of them by nearly a factor of
 * two. Measuring keeps the target the man himself wherever you are playing.
 *
 * The floors are in real pixels, because a finger is the same size on every
 * screen even when the marker is not. The coarse-pointer floor is what makes
 * this playable on a phone; it can never grow the halo on a mouse, where the
 * marker is already bigger than the floor.
 */
const TOUCH_FLOOR_PX = 19;
const MOUSE_FLOOR_PX = 11;
/** Starting a drag is a shade more forgiving than finishing one: missing the
 *  start leaves you with nothing at all, while missing the end still gives you
 *  a run with the ball. */
const GRAB_MARGIN = 1.15;

/** The pitch is drawn 100 wide by 150 tall, so anything measured in pitch
 *  percentages has to have its y stretched by this to be drawn on top of it.
 *  Curves are measured and drawn in that stretched space, or a bend drawn
 *  across the pitch and the same bend drawn up it come out different depths. */
const VIEW_TALL = 1.5;

// How much of a bent drag actually comes off as curl.
//
// A drag is a hand moving, and a hand moving is never a clean arc: it wanders,
// it overshoots, and it changes its mind halfway to the target. Tracing it
// exactly turned every one of those into a banana — the ball left the boot
// sideways. So what the drag asks for is read rather than copied: a bit of
// wander is nothing at all, the rest is halved, and no ball may bend further
// than a ball can bend.
/** Stray below this is a hand wobbling, not a curl being asked for. */
const CURL_DEAD = 3;
/** How much of the rest is honoured. Half of what you draw is plenty. */
const CURL_DAMP = 0.5;
/** The most a control point may be pushed out, as a share of the flight. The
 *  arc peaks half way out to it, so this is a ball bending an eighth of its
 *  own length off the straight — a proper whipped one, and no more. */
const CURL_SPAN = 0.24;

/** What the drag actually asked for, once the wobble is discounted: signed,
 *  in viewBox units, and the one number both the arrow and the flight use. */
const curlOf = (bend: number) =>
  Math.abs(bend) < CURL_DEAD
    ? 0
    : Math.sign(bend) * (Math.abs(bend) - CURL_DEAD) * CURL_DAMP;

/** How hard a drag was curved, 0 (straight) to 1 (whipped), for pricing it. */
const curveOf = (bend: number) => clamp(Math.abs(curlOf(bend)) / 10, 0, 1);
/** How much curl counts as deliberate. The model uses the same figure to
 *  decide whether a ball was bent, so the arrow you see and the odds you are
 *  quoted always agree. */
const CURL_MIN = 0.15;

/** Near enough to where you sent him to call the run made, after which the
 *  order is spent and he is back in the game. */
const ARRIVED = 3;

/** The listed moves that leave the ground. A ball over the top should look
 *  like one — arcing over them rather than sliding through them — whichever
 *  side hit it, and whether it came off a list or off your own finger. */
const IN_THE_AIR = new Set<ActionId>(["overTop", "channel", "clear", "cross"]);

/**
 * How long it takes a team to get somewhere, in milliseconds. Used both for
 * the CSS transition and for how long the game waits, so what you see and what
 * the model thinks happened are the same event rather than two guesses.
 */
const travelTime = (distance: number) => clamp(320 + distance * 34, 420, 1300);

/**
 * How long the BALL takes to cover its own distance.
 *
 * It used to inherit the players' figure, which is worked out from how far the
 * furthest man has to run — so a fifty-yard pass with everybody already in
 * position crossed the pitch in four hundred milliseconds, quicker than a
 * short one played while the team scrambled. The ball is not a player and its
 * timing is its own: long balls hang, short ones are over quickly, and neither
 * has anything to do with how much running is going on around it.
 */
const ballTime = (distance: number) => clamp(240 + distance * 15, 300, 1000);
/** How the ball gets under way and settles. Kept the same as the transition on
 *  .match-slot.is-ball, because a bent ball is animated instead of transitioned
 *  and the two have to be indistinguishable apart from the line they take. */
const BALL_EASING = "cubic-bezier(0.3, 0.5, 0.35, 1)";
/** A phase has to end somehow if they simply never give it away. */
const MAX_PHASE_BEATS = 9;
/** How many times one passage can stop to let you re-set the shape. The
 *  last-ditch block against a shot is separate and always available once. */
const MAX_RESETS = 2;

/**
 * Who actually goes for the ball under each style. This is the substance of
 * the choice — you are not moving the team into a formation, you are deciding
 * how many of them leave it to challenge, and what that leaves behind.
 */
const CHALLENGE: Record<StanceId, string> = {
  press: "Three go at the man on it",
  narrow: "Two close the middle down",
  squeeze: "Two step up, the line goes with them",
  drop: "Nobody dives in — hold the shape",
  trap: "Nobody goes near it — the line steps twenty yards",
  man: "Everybody goes with a man, all over the pitch",
};

/** What each shape means as a last-ditch act, rather than as a shape. */
const LAST_DITCH: Record<StanceId, string> = {
  press: "Close him down before he can pick his spot",
  squeeze: "Step out and hope the flag goes up",
  narrow: "Cut the angle down and show him wide",
  drop: "Get bodies in front of it and block",
  trap: "Everybody steps, all at once, and appeals",
  man: "Get touch-tight and make him beat you",
};
const CENTRE: Position = { x: 50, y: 50 };

type Difficulty = "easy" | "hard";
// 'defending' is a whole passage of their play running out in front of you,
// from the moment you commit your shape to the moment possession changes.
// 'recover' is the phase pausing to hand you back control, either because they
// have played through your shape or because they are about to shoot.
type Stage =
  | "setup"
  | "choose"
  | "defending"
  | "recover"
  | "moving"
  | "halftime"
  | "fulltime";

/** Why the phase stopped and gave you the ball back to think about. */
type RecoverReason = "bypassed" | "shot";

/** A pitch drawn to the real proportions — 68m by 105m, goals 7.32m wide. */
function PitchLines() {
  return (
    <svg className="match-lines" viewBox="0 0 100 150" aria-hidden="true">
      <defs>
        <pattern
          id="goal-net"
          width="2.6"
          height="2.6"
          patternUnits="userSpaceOnUse"
        >
          <path className="goal-mesh" d="M0 0 L2.6 2.6 M2.6 0 L0 2.6" />
        </pattern>
      </defs>
      <rect className="pitch-line" x="1" y="1" width="98" height="148" />
      <line className="pitch-line" x1="1" y1="75" x2="99" y2="75" />
      <circle className="pitch-line" cx="50" cy="75" r="13" />
      <circle className="pitch-dot" cx="50" cy="75" r="0.7" />
      <rect className="pitch-line" x="20.3" y="1" width="59.4" height="23.6" />
      <rect className="pitch-line" x="36.5" y="1" width="27" height="7.9" />
      <circle className="pitch-dot" cx="50" cy="16.7" r="0.7" />
      <path className="pitch-line" d="M39.7 24.6 A13 13 0 0 0 60.3 24.6" />
      <rect
        className="pitch-line"
        x="20.3"
        y="125.4"
        width="59.4"
        height="23.6"
      />
      <rect className="pitch-line" x="36.5" y="142.1" width="27" height="7.9" />
      <circle className="pitch-dot" cx="50" cy="133.3" r="0.7" />
      <path className="pitch-line" d="M39.7 125.4 A13 13 0 0 1 60.3 125.4" />
      <path
        className="pitch-line"
        d="M1 3.5 A2.5 2.5 0 0 1 3.5 1 M96.5 1 A2.5 2.5 0 0 1 99 3.5 M1 146.5 A2.5 2.5 0 0 0 3.5 149 M96.5 149 A2.5 2.5 0 0 0 99 146.5"
      />
      {/* Goals stand outside the goal line and are far narrower than the
          six-yard box behind them — 10.8 units against the box's 27. */}
      <rect className="goal-back" x="44.6" y="-3" width="10.8" height="4" />
      <rect
        className="goal-net-panel"
        x="44.6"
        y="-3"
        width="10.8"
        height="4"
      />
      <rect className="goal-frame" x="44.6" y="-3" width="10.8" height="4" />
      <rect className="goal-back" x="44.6" y="149" width="10.8" height="4" />
      <rect
        className="goal-net-panel"
        x="44.6"
        y="149"
        width="10.8"
        height="4"
      />
      <rect className="goal-frame" x="44.6" y="149" width="10.8" height="4" />
    </svg>
  );
}

/**
 * Which way, and how far, a drag curved away from the straight line between
 * where it started and where it is now — the point of the path that strayed
 * furthest, with the sign telling us which side it strayed to.
 *
 * The sign is the whole point: draw the arrow bending left and the ball bends
 * left, draw it bending right and it bends right. The board's own arrows have
 * always worked this way and a ball over the top should too.
 */
function bendOf(from: Position, to: Position, path: Position[]): number {
  // Measured in the same stretched space the arc is drawn in, so the number
  // that comes out can be handed straight to the drawing without a fudge.
  const x1 = from.x;
  const y1 = from.y * VIEW_TALL;
  const dx = to.x - x1;
  const dy = to.y * VIEW_TALL - y1;
  const length = Math.hypot(dx, dy);
  if (length < 9) return 0;
  let worst = 0;
  for (const point of path) {
    const ax = point.x - x1;
    const ay = point.y * VIEW_TALL - y1;
    const along = (ax * dx + ay * dy) / length;
    // Only the middle of the drag can bend; the ends are pinned to the line.
    if (along < length * 0.15 || along > length * 0.85) continue;
    // Signed stray along the normal the arc is BOWED along — (-dy, dx). It
    // used to be measured along the opposite normal, which is why every ball
    // came out bending the mirror image of the arrow that was drawn: curl it
    // right and it swung left. The sign is the whole point of measuring it.
    const side = (-dy * ax + dx * ay) / length;
    if (Math.abs(side) > Math.abs(worst)) worst = side;
  }
  // A quadratic's apex sits halfway to its control point, so the control has
  // to go twice as far out for the drawn curve to pass through the drag.
  return worst * 2;
}

/**
 * How far out to push a quadratic's control point, in viewBox units — the one
 * definition of what a curve looks like, shared by the arrow being drawn and
 * by the flight of the ball afterwards, so the ball goes where the arrow said.
 *
 * A lofted ball always shows SOME arc, or it does not read as being in the air
 * at all. But the side it arcs to is yours: any perceptible curve in the drag
 * picks the side, and the token bow is the floor rather than a replacement, so
 * a gentle curl looks gentle and a whipped one looks whipped.
 */
function bowOf(bend: number, lofted: boolean, length: number): number {
  const token = lofted ? Math.min(length * 0.22, 20) : 0;
  const asked = curlOf(bend);
  const drawn =
    Math.abs(asked) < 0.5
      ? token
      : Math.sign(asked) * Math.max(Math.abs(asked), token);
  // A long ball bends further than a short one, so the ceiling is a share of
  // the flight rather than a fixed number of units — and never below the token
  // arc, or a ball in the air would stop looking like one.
  const most = Math.max(token, length * CURL_SPAN);
  return clamp(drawn, -most, most);
}

/**
 * The flight itself, as a run of points along the very curve the arrow drew.
 *
 * The ball used to slide from A to B in a straight line however hard you had
 * bent the arrow, so a curled shot looked like a mis-drawn straight one. These
 * are pitch percentages, ready to be handed to the marker's transform.
 */
function flightPoints(
  from: Position,
  to: Position,
  bend: number,
  lofted: boolean,
  steps = 24,
): Position[] {
  const x1 = from.x;
  const y1 = from.y * VIEW_TALL;
  const x2 = to.x;
  const y2 = to.y * VIEW_TALL;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  const bow = bowOf(bend, lofted, length);
  const cx = (x1 + x2) / 2 - (dy / length) * bow;
  const cy = (y1 + y2) / 2 + (dx / length) * bow;
  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps;
    const away = 1 - t;
    return {
      x: away * away * x1 + 2 * away * t * cx + t * t * x2,
      y: (away * away * y1 + 2 * away * t * cy + t * t * y2) / VIEW_TALL,
    };
  });
}

type Drag = {
  fromId: string;
  from: Position;
  to: Position;
  rightButton: boolean;
  /** Signed sideways stray of the drag path — the side the ball bends. */
  bend: number;
  /** Every point the drag has passed through, to measure that stray from. */
  path: Position[];
  lofted: boolean;
  shooting: boolean;
};

/**
 * One flight of the ball: where from, where to, whether it was in the air, and
 * how hard it was bent. A fresh object every time the ball is played, so the
 * animation knows a new flight has started even when it repeats a pass.
 */
type Flight = {
  from: Position;
  to: Position;
  bend: number;
  lofted: boolean;
};

/** When a drawn run happens: on the spot, or timed with the pass. */
type RunTiming = "now" | "onPass";

type Run = { to: Position; when: RunTiming };

/**
 * What a drag from the man on the ball means. Desktop can say it with the
 * mouse button, but a phone has one kind of touch, so the same three choices
 * are on screen as buttons and a right-drag simply overrides them.
 */
type DragIntent = "ground" | "air" | "shot";

function MatchPitch({
  ball,
  flight,
  ballMs,
  home,
  away,
  carrierId,
  targetId,
  celebrating,
  runs,
  drag,
  pitchRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  ball: Position;
  /** The flight the ball is on now, or null before the first one. */
  flight: Flight | null;
  /** How long that flight takes, matching the transition it replaces. */
  ballMs: number;
  home: Player[];
  away: Player[];
  carrierId: string | null;
  targetId: string | null;
  celebrating: boolean;
  runs: Record<string, Run>;
  drag: Drag | null;
  pitchRef: React.RefObject<HTMLDivElement | null>;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
}) {
  // Marker positions are percentages; the viewBox is 150 tall, so drawing on
  // top of them means scaling y by 1.5 and leaving x alone.
  const vx = (value: number) => value;
  const vy = (value: number) => value * VIEW_TALL;
  // A ball in the air is drawn as an arc, so it reads as going over them
  // rather than through them.
  // `bend` is how far the drag strayed from a straight line, and which side it
  // strayed to. Curl the drag left and the ball bends left; curl it right and
  // it bends right. A straight drag keeps the default bow so a lofted ball
  // still reads as going over people rather than through them.
  const arcPath = (
    from: Position,
    to: Position,
    bend: number,
    lofted = true,
  ) => {
    const x1 = vx(from.x);
    const y1 = vy(from.y);
    const x2 = vx(to.x);
    const y2 = vy(to.y);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy) || 1;
    // Exactly the bow the ball will fly along — one definition, so the arrow
    // is a promise about the flight rather than a decoration next to it.
    const bow = bowOf(bend, lofted, length);
    const cx = (x1 + x2) / 2 - (dy / length) * bow;
    const cy = (y1 + y2) / 2 + (dx / length) * bow;
    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  };
  // The ball flies the line that was drawn.
  //
  // Its marker is moved by a CSS transition, and a transition is a straight
  // line between two points — it cannot be anything else. So a bent ball is
  // animated over the top of it, along the very same quadratic the arrow was
  // drawn with. The transition has to be switched off while that runs: a
  // transition beats an animation in the cascade and would otherwise drag the
  // ball straight through the middle of its own arc.
  const ballRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const marker = ballRef.current;
    if (!marker || !flight || typeof marker.animate !== "function") return;
    const dx = flight.to.x - flight.from.x;
    const dy = (flight.to.y - flight.from.y) * VIEW_TALL;
    const length = Math.hypot(dx, dy);
    const bow = bowOf(flight.bend, flight.lofted, length);
    // A straight ball is exactly what the transition already does, and doing
    // it twice is how you get a stutter.
    if (length < 2 || Math.abs(bow) < 1.5) return;
    const flown = marker.animate(
      flightPoints(flight.from, flight.to, flight.bend, flight.lofted).map(
        (point) => ({ transform: `translate(${point.x}%, ${point.y}%)` }),
      ),
      // The same duration and the same easing as the transition it stands in
      // for (see .match-slot.is-ball), so a curled ball and a straight one are
      // hit with the same weight.
      { duration: ballMs, easing: BALL_EASING, fill: "none" },
    );
    marker.style.transition = "none";
    const land = () => {
      marker.style.transition = "";
    };
    flown.addEventListener("finish", land);
    flown.addEventListener("cancel", land);
    return () => flown.cancel();
  }, [flight, ballMs]);

  type RunArrow = {
    id: string;
    from: Position;
    to: Position;
    waiting: boolean;
  };
  const runArrows = Object.entries(runs)
    .map(([id, run]) => {
      const player = home.find((entry) => entry.id === id);
      // A run timed to the pass is drawn from where he is standing to where he
      // will go, dashed, so you can see it is a plan rather than a position.
      return player
        ? { id, from: player.spot, to: run.to, waiting: run.when === "onPass" }
        : null;
    })
    .filter((entry): entry is RunArrow => entry !== null);

  const marker = (player: Player) => (
    <div
      className="match-slot"
      key={player.id}
      style={{ transform: `translate(${player.spot.x}%, ${player.spot.y}%)` }}
    >
      {markerFace(player)}
    </div>
  );

  const markerFace = (player: Player) => (
    <div
      className={[
        "match-marker",
        player.side === "home" ? "is-home" : "is-away",
        player.id === carrierId ? "is-carrier" : "",
        player.id === targetId ? "is-target" : "",
        runs[player.id] ? "is-running" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-testid={`marker-${player.id}`}
      title={player.name ? `${player.name} (${player.number})` : undefined}
    >
      {player.number}
      {player.name && <span className="match-marker-name">{player.name}</span>}
    </div>
  );
  return (
    <div
      className={`match-pitch ${celebrating ? "is-celebrating" : ""}`}
      data-testid="match-pitch"
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      ref={pitchRef}
    >
      <PitchLines />
      {away.map(marker)}
      {home.map(marker)}
      <svg className="match-arrows" viewBox="0 0 100 150" aria-hidden="true">
        <defs>
          <marker
            id="run-head"
            markerWidth="6"
            markerHeight="6"
            refX="4.6"
            refY="3"
            orient="auto"
          >
            <path className="run-head" d="M0 0 L5 3 L0 6 Z" />
          </marker>
          <marker
            id="drag-head"
            markerWidth="6"
            markerHeight="6"
            refX="4.6"
            refY="3"
            orient="auto"
          >
            <path className="drag-head" d="M0 0 L5 3 L0 6 Z" />
          </marker>
        </defs>
        {runArrows.map((arrow) => (
          <line
            className={`match-run ${arrow.waiting ? "is-waiting" : ""}`}
            key={arrow.id}
            markerEnd="url(#run-head)"
            x1={vx(arrow.from.x)}
            x2={vx(arrow.to.x)}
            y1={vy(arrow.from.y)}
            y2={vy(arrow.to.y)}
          />
        ))}
        {/* A ball in the air is always drawn as an arc. So is anything you
            have deliberately bent, in the air or not — a curled shot drew as a
            dead straight line, which is why bending one looked like it did
            nothing whatever the panel said about it. */}
        {/* Drawn at exactly the point the curl starts counting, so what you
            see and what the panel prices are the same thing. */}
        {drag &&
          (drag.lofted || curveOf(drag.bend) > CURL_MIN ? (
            <path
              className={`match-drag ${drag.lofted ? "is-lofted" : "is-curled"}`}
              d={arcPath(drag.from, drag.to, drag.bend, drag.lofted)}
              markerEnd="url(#drag-head)"
            />
          ) : (
            <line
              className="match-drag"
              markerEnd="url(#drag-head)"
              x1={vx(drag.from.x)}
              x2={vx(drag.to.x)}
              y1={vy(drag.from.y)}
              y2={vy(drag.to.y)}
            />
          ))}
      </svg>
      <div
        className="match-slot is-ball"
        ref={ballRef}
        style={{ transform: `translate(${ball.x}%, ${ball.y}%)` }}
      >
        <div className="match-ball" data-testid="match-ball" />
      </div>
    </div>
  );
}

/**
 * The match. In tutorial mode a coach sits in the panel, watches what you do
 * on the real pitch, and moves on when you have done it — nothing about the
 * game itself changes, which is the point: you learn the game, not a demo of
 * the game.
 */
export default function MatchGame({
  tutorial = false,
}: {
  tutorial?: boolean;
}) {
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);
  stepRef.current = step;
  /** One goal is given, so a learner sees what scoring looks like. Once. */
  const scoredInTutorialRef = useRef(false);

  /** Tell the coach something happened. Free when there is no coach. */
  const emit = (event: MatchEvent) => {
    if (!tutorial) return;
    const current = TUTORIAL[stepRef.current];
    if (current && current.done(event)) setStep((at) => at + 1);
  };
  const [, navigate] = useLocation();
  /** Out of the tutorial and into a real match. Nobody is ever held in it: the
   *  way out is on screen from the first step. */
  const leaveTutorial = () => navigate("/match");
  const [stage, setStage] = useState<Stage>("setup");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [homeSide, setHomeSide] = useState<SideChoice>(FIRST_SHAPE);
  const [awaySide, setAwaySide] = useState<SideChoice>(SECOND_SHAPE);
  // Your shape is separate from who you are, so a half-time switch reshuffles
  // the same eleven men rather than fetching a different team.
  const [homeShape, setHomeShape] = useState<number[]>(FORMATIONS[0].shape);
  const [styleId, setStyleId] = useState<StyleId>("possession");
  /** How far up the pitch you are willing to defend. A standing decision, not
   *  a per-phase one — it is the frame the phase choices sit inside. */
  const [blockId, setBlockId] = useState<BlockId>("mid");
  const [home, setHome] = useState<Player[]>(() =>
    kickOffShape(buildTeam(FORMATIONS[0].shape, "home"), "home", false),
  );
  const [away, setAway] = useState<Player[]>(() =>
    kickOffShape(buildTeam(FORMATIONS[1].shape, "away"), "away", false),
  );
  const [possession, setPossession] = useState<Side>("home");
  const [carrierId, setCarrierId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [ball, setBall] = useState<Position>(CENTRE);
  /** Which part of the pitch the ball is in, from your goal's point of view. */
  const ballZone = useMemo(() => zoneOf(ball, "home"), [ball]);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [secondsLeft, setSecondsLeft] = useState(MATCH_SECONDS);
  const [commentary, setCommentary] = useState(
    "Pick both shapes, then kick off.",
  );
  const [theirStance, setTheirStance] = useState<StanceId>("squeeze");
  const [justWon, setJustWon] = useState(false);
  const [hadHalfTime, setHadHalfTime] = useState(false);
  /** The clock has passed the half but the whistle has not gone yet. */
  const [addedOn, setAddedOn] = useState(false);
  /** How much added time has been played, in seconds. Shown on the clock the
   *  way a fourth official holds the board up, and counting up as it is
   *  played — including past the five, which is what really happens. */
  const [addedSeconds, setAddedSeconds] = useState(0);
  /** The added time as it stood when the whistle went, or null while it is
   *  still being played. Freezing it is what hands the second half back its
   *  full length instead of docking it whatever the first half overran by. */
  const addedFrozenRef = useRef<number | null>(null);
  /** The catchment around a player, in pitch-width units, measured off his
   *  marker — see TOUCH_FLOOR_PX. */
  const [aimUnits, setAimUnits] = useState(AIM_RADIUS);
  /** Who had the ball when it passed, so a change of hands can end the half. */
  const halfMarkRef = useRef<Side | null>(null);
  /** The same at the end of the ninety. Null until the clock runs out. */
  const endMarkRef = useRef<Side | null>(null);
  const [forfeited, setForfeited] = useState(false);
  /** What happened, beat by beat, during the passage they are playing now. */
  const [phaseLog, setPhaseLog] = useState<string[]>([]);
  /** How long the current run across the pitch should take to animate. */
  const [travelMs, setTravelMs] = useState(1100);
  /** How long the ball itself should take over its current flight. */
  const [ballMs, setBallMs] = useState(600);
  const ballWasRef = useRef<Position>(CENTRE);
  /** The flight it is on, so the marker can be sent along the drawn curve
   *  rather than sliding straight through it. */
  const [flight, setFlight] = useState<Flight | null>(null);

  /** Move the ball, timing the flight off how far IT travels. `bend` is what
   *  the drag measured, in the same units the arrow was drawn with. */
  const playBall = (spot: Position, bend = 0, lofted = false) => {
    const was = ballWasRef.current;
    setBallMs(ballTime(Math.hypot(spot.x - was.x, spot.y - was.y)));
    ballWasRef.current = spot;
    setFlight({ from: was, to: spot, bend, lofted });
    setBall(spot);
  };
  /** Set while the phase is paused waiting for you to react. */
  const [recover, setRecover] = useState<{
    reason: RecoverReason;
    on: string;
  } | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  // Runs the user has drawn for their own players. These override the shape
  // the style would otherwise put them in, and survive until they are cleared
  // or possession changes hands.
  //
  // `when` is the difference between standing in a position and timing a run
  // into it. 'now' puts him there immediately — which is what you want to drag
  // a defender across to cover. 'onPass' holds him where he is and sends him
  // the instant the ball is played, which is how you attack a high line
  // without the flag going up: at the moment of the pass he is still onside.
  const [runs, setRuns] = useState<Record<string, Run>>({});
  const [runTiming, setRunTiming] = useState<RunTiming>("onPass");
  /** Whose name is on the run-on prompt, or null when the window is shut. */
  const [runOn, setRunOn] = useState<string | null>(null);
  const runOnOpenRef = useRef(false);
  const runOnGoRef = useRef<(() => void) | null>(null);
  const [dragIntent, setDragIntent] = useState<DragIntent>("ground");
  const [drag, setDrag] = useState<Drag | null>(null);

  /** Only the runs that are on the pitch right now. */
  const heldRuns = useMemo(() => {
    const held: Record<string, Position> = {};
    for (const [id, run] of Object.entries(runs))
      if (run.when === "now") held[id] = run.to;
    return held;
  }, [runs]);

  /** Every run, including the delayed ones — used once the ball is away. */
  const releasedRuns = useMemo(() => {
    const all: Record<string, Position> = {};
    for (const [id, run] of Object.entries(runs)) all[id] = run.to;
    return all;
  }, [runs]);

  const timersRef = useRef<number[]>([]);
  const usedRef = useRef(0);
  const movingSinceRef = useRef(0);
  const pitchRef = useRef<HTMLDivElement>(null);
  /** True between a restart and the first touch, when the laws pin the shape. */
  const atKickOffRef = useRef(false);
  /** How a paused phase picks up again once you have chosen your response. */
  const recoverRef = useRef<((stance: StanceId) => void) | null>(null);
  /** A change of challenge asked for mid-passage, picked up on the next beat.
   *  The running phase reads this rather than React state, because it lives in
   *  a chain of timers that never sees a re-render. */
  const switchRef = useRef<StanceId | null>(null);
  /** The last ball they played, kept for the whole match. Resetting it each
   *  passage left the opening ball of every one of them unpenalised, which
   *  is exactly the ball the user sees — so they opened every single
   *  passage, and every kick-off, by hitting it long. */
  const lastPlayedRef = useRef<ActionId | undefined>(undefined);

  const style = styleById(styleId);
  const theirStyle = styleById(styleOf(awaySide));
  const theirLean = stanceOf(awaySide);
  const awayShape = shapeOf(awaySide);
  const homeSquad = useMemo(() => squadOf(homeSide), [homeSide]);
  const awaySquad = useMemo(() => squadOf(awaySide), [awaySide]);
  const sharp = difficulty === "hard";
  const showOdds = difficulty === "easy";

  /** Their next shape without the ball, leaning on their manager's habit. */
  const nextTheirStance = useCallback(
    () => aiStance(awayShape, sharp, styleId, null, theirLean),
    [awayShape, sharp, styleId, theirLean],
  );

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  // Before kick-off the board shows a legal kick-off: both sides in their own
  // half, nobody but the taker inside the circle.
  useEffect(() => {
    if (stage !== "setup") return;
    setHome(
      kickOffShape(buildTeam(homeShape, "home", homeSquad), "home", false),
    );
    setAway(
      kickOffShape(buildTeam(awayShape, "away", awaySquad), "away", false),
    );
    ballWasRef.current = CENTRE;
    setBall(CENTRE);
    setCarrierId(null);
    setTargetId(null);
  }, [stage, homeShape, homeSquad, awayShape, awaySquad]);

  /**
   * Split the football played so far into clock time and added time.
   *
   * Added time is ADDED, the way it is in a real match. It used to come out of
   * the sixty: the half ran on past its mark and every second of it was a
   * second the second half never got, so a scrappy first half quietly robbed
   * you of the end of the game. Now the clock simply holds at the half while
   * the added seconds tick up beside it, and the second half is a full half
   * whatever happened before the whistle.
   *
   * Once the whistle has gone the amount is frozen, so from the restart every
   * millisecond comes off the clock again.
   */
  const showClock = useCallback((used: number) => {
    const atHalf = addedFrozenRef.current ?? Math.max(0, used - HALF_MS);
    // Football played, added time taken back out of it.
    const clockMs = used - atHalf;
    // And the same again at the end: once the sixty are gone the clock stops
    // on 0:00 and whatever is played after it is added time.
    const atEnd = Math.max(0, clockMs - MATCH_SECONDS * 1000);
    // The two never overlap, so one board does for both.
    setAddedSeconds((hadHalfTimeRef.current ? atEnd : atHalf) / 1000);
    setSecondsLeft(Math.max(0, MATCH_SECONDS - clockMs / 1000));
  }, []);

  // The clock runs only while the ball is travelling — which includes the
  // whole of one of their passages, because you have already committed your
  // shape and the ball is very much in play for all of it.
  useEffect(() => {
    if (stage !== "moving" && stage !== "defending") return undefined;
    movingSinceRef.current = Date.now();
    const tick = window.setInterval(() => {
      showClock(usedRef.current + (Date.now() - movingSinceRef.current));
    }, 100);
    return () => {
      window.clearInterval(tick);
      usedRef.current += Date.now() - movingSinceRef.current;
      showClock(usedRef.current);
    };
  }, [stage, showClock]);

  // The clock reaching zero does not end the match any more than it ends the
  // half — it starts added time. Same rule at both ends of the game: whoever
  // has the ball as it passes is what the whistle is waiting on.
  useEffect(() => {
    if (
      secondsLeft > 0 ||
      stage === "setup" ||
      stage === "fulltime" ||
      endMarkRef.current !== null
    )
      return;
    endMarkRef.current = possession;
    setAddedOn(true);
  }, [secondsLeft, stage, possession]);

  // The final whistle, blown the way the half is: at the first break in play
  // once the added seconds are up, or the moment the ball changes hands.
  // Nobody's last attack gets cut off halfway through it.
  useEffect(() => {
    if (stage !== "choose" || endMarkRef.current === null) return;
    const turnedOver = possession !== endMarkRef.current;
    if (!turnedOver && addedSeconds < HALF_ADDED_SECONDS) return;
    clearTimers();
    setCelebrating(false);
    setAddedOn(false);
    setStage("fulltime");
    setCommentary(
      turnedOver
        ? "The ball changes hands, and that is full time."
        : "Full time, at the end of the added seconds.",
    );
  }, [stage, possession, addedSeconds, clearTimers]);

  // Added time is a cap on the passage that is running, so the beat loops need
  // the clock as it stands rather than as it was last rendered. Both of these
  // mirror state that is already there; nothing reads them during render.
  const secondsLeftRef = useRef(MATCH_SECONDS);
  secondsLeftRef.current = secondsLeft;
  const hadHalfTimeRef = useRef(false);
  hadHalfTimeRef.current = hadHalfTime;
  const addedSecondsRef = useRef(0);
  addedSecondsRef.current = addedSeconds;

  /** The five seconds of added time are up and the whistle — for the half or
   *  for the match — is waiting on a break in play, so the passage running now
   *  should end at the beat it is on. */
  const halfIsUp = () => {
    if (addedSecondsRef.current < HALF_ADDED_SECONDS) return false;
    const waitingOnTheHalf =
      !hadHalfTimeRef.current && halfMarkRef.current !== null;
    return waitingOnTheHalf || endMarkRef.current !== null;
  };

  // The clock reaching the half does not end it — it starts added time. Who
  // has the ball at that moment is what the whistle is then waiting on, so it
  // is caught here, the instant the clock passes, whatever else is going on.
  useEffect(() => {
    if (
      hadHalfTime ||
      halfMarkRef.current !== null ||
      secondsLeft > MATCH_SECONDS / 2
    )
      return;
    halfMarkRef.current = possession;
    setAddedOn(true);
  }, [secondsLeft, hadHalfTime, possession]);

  // The whistle at the half.
  //
  // Blowing it on the mark cut moves dead halfway through, so it waits for a
  // sensible moment the way a referee does: the half ends the first time the
  // ball changes hands, or when five seconds of added time have gone,
  // whichever comes first. The clock is stopped between beats either way, so
  // there is all the time in the world to change the shape.
  useEffect(() => {
    if (stage !== "choose" || hadHalfTime || halfMarkRef.current === null)
      return;
    const turnedOver = possession !== halfMarkRef.current;
    const addedGone = addedSeconds >= HALF_ADDED_SECONDS;
    if (!turnedOver && !addedGone) return;
    clearTimers();
    // Whatever the added time came to, that is what it came to — and none of
    // it is coming out of the second half.
    addedFrozenRef.current = Math.max(0, usedRef.current - HALF_MS);
    setHadHalfTime(true);
    setAddedOn(false);
    setStage("halftime");
    setCommentary(
      turnedOver
        ? "The ball changes hands and that is the half. Change what you like — they kick off."
        : "Half time, once the added time was up. Change what you like — they kick off.",
    );
  }, [stage, hadHalfTime, addedSeconds, possession, clearTimers]);

  const carrier = useMemo(
    () => [...home, ...away].find((player) => player.id === carrierId) ?? null,
    [home, away, carrierId],
  );

  const moveSet = useMemo(() => {
    if (stage !== "choose" || possession !== "home" || !carrier) return null;
    return availableMoves(
      carrier,
      home,
      away,
      style,
      theirStance,
      justWon,
      atKickOffRef.current,
    );
  }, [stage, possession, carrier, home, away, style, theirStance, justWon]);

  const shootable = Boolean(
    stage === "choose" &&
    possession === "home" &&
    carrier &&
    canShoot(carrier.spot, "home"),
  );

  // Measure the marker, and re-measure whenever the window changes size, so
  // the catchment tracks whatever the pitch has actually been laid out at.
  useEffect(() => {
    const measure = () => {
      const pitch = pitchRef.current;
      const marker = pitch?.querySelector(".match-marker");
      if (!pitch || !marker) return;
      const width = pitch.getBoundingClientRect().width;
      const markerPx = marker.getBoundingClientRect().width;
      if (!width || !markerPx) return;
      const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
      const wantPx = Math.max(
        markerPx * 0.8,
        coarse ? TOUCH_FLOOR_PX : MOUSE_FLOOR_PX,
      );
      setAimUnits(clamp((wantPx / width) * 100, 2, 9));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [stage]);

  /**
   * How good a sight of goal this actually is, in words. "In range" covers
   * everything from a tap-in to a hopeful drive from thirty yards, and telling
   * a hard-mode player only that they are in range is not a read, it is a
   * shrug — so the wording carries the distance and who is standing in the way.
   */
  const sightOfGoal = useMemo(() => {
    if (!carrier || !shootable)
      return { chance: 0, read: "", curl: "", tone: "risky" as const };
    const chance = shotChance(carrier.spot, "home", away, carrier);
    const yards = Math.round(distanceToGoal(carrier.spot, "home"));
    const read =
      chance >= 0.42
        ? `${playerName(carrier)} has the goal at his mercy`
        : chance >= 0.28
          ? `A real chance, ${yards} out`
          : chance >= 0.16
            ? `Half a sight of it, ${yards} out`
            : `A long way out — ${yards}, and bodies in front of him`;
    // Whether it is worth bending, said before you decide rather than after.
    // The button hits it straight; a curled one has to be drawn.
    const worth = curlIsWorthIt(carrier.spot, "home", away);
    const bent = shotChance(carrier.spot, "home", away, carrier, 1);
    const curl =
      worth > 0.45
        ? `Draw it with a curve and it bends round them — ${Math.round(bent * 100)}% instead of ${Math.round(chance * 100)}%.`
        : worth > 0.25
          ? "A curl would help a little from there. Draw the arrow bending."
          : "Nothing to bend it round from there — hit it straight.";
    return { chance, read, curl, tone: toneFor(1 - chance) };
  }, [carrier, shootable, away]);

  /** Both teams take up their shape; whoever is on the ball stays on it.
   *  `released` is true once the ball is travelling, which is when the runs
   *  that were timed to the pass finally go. */
  const applyShapes = (
    spot: Position,
    holder: Side,
    onBall: string | null,
    stance: StanceId,
    released = false,
    from?: { home: Player[]; away: Player[] },
    /**
     * How much of this is a real beat of the match, where players can only
     * cover so much ground.
     *
     *   false        — a preview. Nobody is limited; we only want the shape.
     *   true         — a beat. Everybody runs, nobody teleports.
     *   'defenders'  — you have just given an order. The man you sent takes up
     *                  his position at once, because you asked him to and it
     *                  should feel like it; the side reacting to him has to
     *                  run, because reacting takes time.
     */
    stepped: boolean | "defenders" = false,
  ) => {
    // Whoever has the ball is the one giving the orders; the other side is
    // the one reacting to them.
    const holderStepped = stepped === true;
    const chaserStepped = stepped === true || stepped === "defenders";
    const homeStepped = holder === "home" ? holderStepped : chaserStepped;
    const awayStepped = holder === "away" ? holderStepped : chaserStepped;
    const fromHome = from?.home ?? home;
    const fromAway = from?.away ?? away;
    const pin = onBall ? { [onBall]: spot } : {};
    // Runs you draw while they have the ball are positions to take up, not
    // runs to time — you are not passing to anybody. So when defending they
    // all apply at once and stay applied for the whole phase.
    const all = released || holder === "away" ? releasedRuns : heldRuns;
    // A run is an instruction, not a leash.
    //
    // Once he has got to where you sent him the order is spent, and he rejoins
    // the shape like everybody else. Without this a man you moved once stood
    // on that exact blade of grass for the rest of the match while the game
    // went on around him — pinned by an order he had already carried out.
    //
    // Dropping it here rather than from state on purpose: the pin simply stops
    // applying, so he flows back into the shape over the next beat instead of
    // being snapped there by a re-render.
    const orders: Record<string, Position> = {};
    for (const [id, to] of Object.entries(all)) {
      const man = fromHome.find((player) => player.id === id);
      if (man && Math.hypot(man.spot.x - to.x, man.spot.y - to.y) < ARRIVED)
        continue;
      orders[id] = to;
    }
    // Each side holds the other's offside line, measured before anybody moves.
    const homeHold = offsideLineOf(fromAway, "home");
    const awayHold = offsideLineOf(fromHome, "away");
    // Your drawn runs apply whether you have the ball or not, so a defender
    // can be pulled across to cover a run you think is coming. The man on the
    // ball still beats his own run order — he is where the ball is.
    const nextHome = reshape(
      fromHome,
      spot,
      style,
      holder === "home",
      holder === "home" ? null : stance,
      holder === "home" ? { ...orders, ...pin } : orders,
      homeHold,
      homeStepped,
      holder === "home" ? onBall : null,
      holder === "home" ? null : blockId,
      // Who your men are picking up, when they are the ones without it.
      fromAway,
    );
    const nextAway = reshape(
      fromAway,
      spot,
      theirStyle,
      holder === "away",
      holder === "away" ? null : stance,
      holder === "away" ? pin : {},
      awayHold,
      awayStepped,
      holder === "away" ? onBall : null,
      null,
      // Defenders mark where the attackers ARE, not where they were a
      // beat ago. Handing them the previous shape meant a run you drew
      // never dragged anybody: your man moved, and the man supposed to
      // be picking him up reacted to a picture that no longer existed.
      holder === "home" ? nextHome : fromHome,
    );
    setHome(nextHome);
    setAway(nextAway);
    // Let the animation last exactly as long as the furthest man's run, so a
    // player who has forty yards to make up is visibly still running while a
    // player who has shuffled five is already standing still.
    if (stepped) {
      const furthest = Math.max(
        ...nextHome.map((player) => {
          const was = fromHome.find((entry) => entry.id === player.id);
          return was
            ? Math.hypot(player.spot.x - was.spot.x, player.spot.y - was.spot.y)
            : 0;
        }),
      );
      setTravelMs(travelTime(furthest));
    }
    return { nextHome, nextAway };
  };

  const settle = (
    next: Player,
    holder: Side,
    wonIt: boolean,
    stance: StanceId,
    /** Where everybody actually is. Without this the step limit is measured
     *  from whatever the last RENDER held — which, inside a timer fired after
     *  the ball has already moved, is the shape from before the move. Players
     *  then took their one step from the wrong starting point and arrived
     *  somewhere twenty units from where they were standing, which is exactly
     *  the flying-into-position this is all meant to stop. */
    from?: { home: Player[]; away: Player[] },
  ) => {
    // Stepped like every other beat: settling after a move is still players
    // running, not the formation being redrawn.
    applyShapes(next.spot, holder, next.id, stance, true, from, true);
    // A run order lasts one play. Not until he gets there, not until you
    // cancel it — one play.
    //
    // Keeping them alive was pinning men to a patch of grass for the rest of
    // the match: the ones sent somewhere they could never quite reach, and the
    // ones who made the run and never got the ball, both stood there while the
    // game carried on without them. A run is a thing you do for a moment of
    // the match, and if it does not come off you get back in the game.
    setRuns((current) => (Object.keys(current).length ? {} : current));
    playBall(next.spot);
    setCarrierId(next.id);
    setTargetId(null);
    setPossession(holder);
    setJustWon(wonIt);
  };

  const restart = (holder: Side) => {
    const freshHome = kickOffShape(
      buildTeam(homeShape, "home", homeSquad),
      "home",
      holder === "home",
    );
    const freshAway = kickOffShape(
      buildTeam(awayShape, "away", awaySquad),
      "away",
      holder === "away",
    );
    setHome(freshHome);
    setAway(freshAway);
    ballWasRef.current = CENTRE;
    setBall(CENTRE);
    setCarrierId(kickOffTaker(holder === "home" ? freshHome : freshAway).id);
    setTargetId(null);
    setPossession(holder);
    setJustWon(false);
    setRuns({});
    // Both sides are standing in a legal kick-off and must be left there until
    // the ball is actually played. Without this the run-order effect below
    // fired on the cleared runs and reshaped everyone around the centre spot,
    // which put five of your players in their half before the whistle.
    atKickOffRef.current = true;
    setTheirStance(nextTheirStance());
  };

  const kickOff = () => {
    clearTimers();
    usedRef.current = 0;
    setSecondsLeft(MATCH_SECONDS);
    setAddedSeconds(0);
    addedFrozenRef.current = null;
    setScore({ home: 0, away: 0 });
    setCelebrating(false);
    setHadHalfTime(false);
    setAddedOn(false);
    halfMarkRef.current = null;
    endMarkRef.current = null;
    setForfeited(false);
    setRuns({});
    restart("home");
    setStage("choose");
    setCommentary("Your ball. Read them, then pick.");
    emit({ kind: "kickOff" });
  };

  /** One move of the ball, with both teams shifting around it. */
  const runMove = (
    endsOn: Player,
    spot: Position,
    risk: number,
    holder: Side,
    stance: StanceId,
    offside: boolean,
    lines: { going: string; lost: string; kept: string },
    /** How hard the ball was bent, when it was one you drew yourself. */
    bend = 0,
    lofted = false,
  ) => {
    setStage("moving");
    setTargetId(endsOn.id);
    // The ball is away, so the kick-off no longer pins anybody and the runs
    // that were timed to the pass go now — which is the point of timing them.
    atKickOffRef.current = false;
    const { nextHome, nextAway } = applyShapes(
      spot,
      holder,
      endsOn.id,
      stance,
      true,
      undefined,
      true,
    );
    playBall(spot, bend, lofted);
    setCommentary(lines.going);

    timersRef.current.push(
      window.setTimeout(() => {
        const failed = offside || Math.random() < risk;
        if (failed) {
          const nextStance = nextTheirStance();
          const theirs = holder === "home" ? nextAway : nextHome;
          const ours = holder === "home" ? nextHome : nextAway;
          // Offside is always their ball. Everything else is a contest, and a
          // pass that simply went astray with nobody near it is a loose ball
          // rather than a tackle by somebody thirty yards away.
          const scramble = offside
            ? { player: nearestTo(spot, theirs), turnedOver: true }
            : looseBall(spot, theirs, ours);
          const winnerSide: Side = scramble.turnedOver
            ? holder === "home"
              ? "away"
              : "home"
            : holder;
          settle(scramble.player, winnerSide, scramble.turnedOver, nextStance, {
            home: nextHome,
            away: nextAway,
          });
          setTheirStance(nextStance);
          setCommentary(
            offside
              ? "Flag is up. Offside."
              : scramble.turnedOver
                ? lines.lost
                : `Loose, but ${playerName(scramble.player)} gets there first.`,
          );
        } else {
          const arrived = (holder === "home" ? nextHome : nextAway).find(
            (p) => p.id === endsOn.id,
          ) ?? { ...endsOn, spot };
          const nextStance = nextTheirStance();
          settle(arrived, holder, false, nextStance, {
            home: nextHome,
            away: nextAway,
          });
          setTheirStance(nextStance);
          setCommentary(lines.kept);
          // The ball has arrived, but the game has not stopped. Play runs on
          // before you get another say: he takes a touch, they get back at him,
          // and only then — and only if there is anywhere to go — can he do
          // something with it. It carries on from the shape the ball has just
          // arrived into, not from the one it left.
          runSettlingBeats(arrived, spot, holder, nextStance, lines.kept, {
            home: nextHome,
            away: nextAway,
          });
          return;
        }
        setStage("choose");
      }, MOVE_MS),
    );
  };

  /**
   * The beats after a pass lands.
   *
   * A pass arriving is not the end of a move, it is the start of one. The man
   * receiving it needs a beat to take a touch and look up — which is exactly
   * the beat their defenders use to get back at him — and then, if he has
   * anywhere to go, a couple of beats where he can carry it before the picture
   * closes again.
   *
   * How many beats that is depends on what he has landed in, not on a fixed
   * count. In behind them with grass ahead, the move runs on. Into a crowded
   * box with eight bodies round him there is nothing to run into, so it is one
   * beat: he holds it, everyone else moves and shows for it, and the ball is
   * straight back with you to pick the next one.
   *
   * Nobody covers more than a stride or two in any one of them, so what you
   * watch is a team flowing back into shape rather than a formation being
   * redrawn between still frames.
   */
  const runSettlingBeats = (
    receiver: Player,
    spot: Position,
    holder: Side,
    stance: StanceId,
    kept: string,
    live0: { home: Player[]; away: Player[] },
  ) => {
    setStage("moving");
    let live = live0;
    let ball = spot;
    let carrier = receiver;

    const beat = (index: number, plan: Settling) => {
      const first = index === 0;
      // The first beat is the touch: he stays put while everyone else runs.
      // After that he pushes forward as far as the room in front of him — and
      // his legs — actually allow.
      let went = 0;
      if (!first) {
        const dir = holder === "home" ? -1 : 1;
        const to = clamp(ball.y + dir * plan.carry, 5, 95);
        went = Math.abs(to - ball.y);
        ball = { x: ball.x, y: to };
      }
      const shaped = applyShapes(
        ball,
        holder,
        carrier.id,
        stance,
        true,
        live,
        true,
      );
      live = { home: shaped.nextHome, away: shaped.nextAway };
      carrier =
        (holder === "home" ? shaped.nextHome : shaped.nextAway).find(
          (p) => p.id === carrier.id,
        ) ?? carrier;
      playBall(ball);
      setCarrierId(carrier.id);
      const room = plan.beats > 1;
      setCommentary(
        first
          ? room
            ? `${kept} ${playerName(carrier)} takes a touch…`
            : `${kept} ${playerName(carrier)} has nowhere to go — he has to hold it.`
          : went < 1.5
            ? `${playerName(carrier)} is stood up — he shields it…`
            : `${playerName(carrier)} carries it on…`,
      );
      // How many beats this is was settled when the ball arrived: they get to
      // run back at him, and that is the price of the touch, not a reason for
      // the move to be called off. How FAR he goes in each one is re-read,
      // though — if they have closed the space he slows up and holds it rather
      // than running into them, and the beat belongs to everyone else moving.
      const next = settlingPlan(
        carrier,
        holder === "home" ? live.away : live.home,
      );
      const carryOn = () => beat(index + 1, { ...plan, carry: next.carry });
      const handOver = () => {
        setCommentary(kept);
        setStage("choose");
      };
      const more = index + 1 < plan.beats && !halfIsUp();

      // Their move runs itself.
      if (holder === "away") {
        timersRef.current.push(
          window.setTimeout(more ? carryOn : handOver, SETTLE_BEAT_MS),
        );
        return;
      }

      // Yours does not. A man who takes the ball down with grass in front of
      // him gets a moment where you can send him — and if you do not take it,
      // he stops and the ball is back with you. This is the whole difference
      // between him running off on his own, which was maddening, and you
      // telling him to go, which is the game.
      if (!more) {
        timersRef.current.push(window.setTimeout(handOver, SETTLE_BEAT_MS));
        return;
      }
      runOnGoRef.current = carryOn;
      runOnOpenRef.current = true;
      setRunOn(playerName(carrier));
      timersRef.current.push(
        window.setTimeout(() => {
          if (!runOnOpenRef.current) return;
          runOnOpenRef.current = false;
          runOnGoRef.current = null;
          setRunOn(null);
          handOver();
        }, RUN_ON_MS),
      );
    };
    beat(0, settlingPlan(receiver, holder === "home" ? live.away : live.home));
  };

  const runShot = (chance: number, holder: Side, bend = 0) => {
    setStage("moving");
    setTargetId(null);
    // Your first shot in the tutorial goes in.
    //
    // Not because the game is soft, but because being shown what scoring
    // looks like — the net, the celebration, the restart — is part of being
    // taught the game. From the second one on it is priced like everything
    // else, and you will miss plenty.
    const gift = tutorial && holder === "home" && !scoredInTutorialRef.current;
    if (gift) scoredInTutorialRef.current = true;
    const scored = gift || Math.random() < chance;
    const net = {
      x: 50,
      y: holder === "home" ? (scored ? -2 : 4) : scored ? 102 : 96,
    };
    playBall(net, bend);
    setCommentary(holder === "home" ? "Shot away…" : "They shoot…");

    timersRef.current.push(
      window.setTimeout(() => {
        if (scored) {
          setScore((current) => ({
            ...current,
            [holder]: current[holder] + 1,
          }));
          setCelebrating(true);
          setCommentary(
            holder === "home" ? "In the net. Yours." : "They score.",
          );
        } else {
          setCommentary(holder === "home" ? "Saved." : "Your keeper holds it.");
        }
      }, SHOT_MS),
    );

    timersRef.current.push(
      window.setTimeout(() => {
        setCelebrating(false);
        if (scored) {
          restart(holder === "home" ? "away" : "home");
          setCommentary(
            holder === "home" ? "They kick off." : "Your ball from the middle.",
          );
        } else {
          const keeperSide: Side = holder === "home" ? "away" : "home";
          const team = keeperSide === "home" ? home : away;
          const keeper = team.find((player) => player.role === "GK") ?? team[0];
          const nextStance = nextTheirStance();
          settle(keeper, keeperSide, false, nextStance);
          if (keeperSide === "home") setTheirStance(nextStance);
          setCommentary(
            keeperSide === "home"
              ? "Your keeper plays it out."
              : "They restart.",
          );
        }
        setStage("choose");
      }, SHOT_MS + SETTLE_MS),
    );
  };

  // A run drawn for right now should be on the pitch the moment it is drawn,
  // not held over until the next pass. reshape() always works from each
  // player's base spot, so re-running it here cannot make the shape drift.
  //
  // Only YOUR side, though. This used to reshape both, unstepped — and because
  // settling after a move clears spent runs, the effect fired on every single
  // turnover and flung the opposition across the pitch into their block in one
  // frame. Redrawing your own orders is not a beat of the match and must not
  // move a single one of their players.
  useEffect(() => {
    if (stage !== "choose" || !carrierId || atKickOffRef.current) return;
    applyShapes(
      ball,
      possession,
      carrierId,
      theirStance,
      false,
      undefined,
      "defenders",
    );
    // Only the run orders should trigger this; everything else already
    // reshapes as part of playing a move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runs]);

  /** Turns a pointer position into pitch percentages. */

  const toPitch = (
    event: React.PointerEvent<HTMLDivElement>,
  ): Position | null => {
    const box = pitchRef.current?.getBoundingClientRect();
    if (!box) return null;
    return {
      x: clamp(((event.clientX - box.left) / box.width) * 100, 0, 100),
      y: clamp(((event.clientY - box.top) / box.height) * 100, 0, 100),
    };
  };

  // Starting a drag needs an actual player under the pointer. This used to
  // share the pass-aiming radius, which is deliberately forgiving about where
  // an arrow ENDS — using it for where an arrow BEGINS meant you could start
  // drawing from open grass a good distance from anybody.
  const nearestOwn = (spot: Position) =>
    home
      .map((player) => ({ player, distance: aimGap(player.spot, spot) }))
      .filter((entry) => entry.distance < aimUnits * GRAB_MARGIN)
      .sort((a, b) => a.distance - b.distance)[0]?.player ?? null;

  /** What this drag means, given the button used and the on-screen choice. */
  const readIntent = (
    rightButton: boolean,
    to: Position,
  ): { lofted: boolean; shooting: boolean } => {
    // An arrow drawn at their goal is a shot whatever else was selected —
    // nobody aims at the net meaning to pass. Otherwise the right button, or
    // the on-screen choice for anyone without one, decides ground or air.
    if (aimsAtGoal(to, "home")) return { lofted: false, shooting: true };
    if (rightButton) return { lofted: true, shooting: false };
    return { lofted: dragIntent === "air", shooting: dragIntent === "shot" };
  };

  /** Send him. Called by a click anywhere on the pitch while the window is
   *  open, or by the prompt in the panel. */
  const sendHimOn = () => {
    const go = runOnGoRef.current;
    if (!go) return;
    emit({ kind: "ranOn" });
    runOnGoRef.current = null;
    runOnOpenRef.current = false;
    setRunOn(null);
    // Cancel the timer that would otherwise hand the ball back underneath him.
    clearTimers();
    go();
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // A click on the pitch while he is looking up is you telling him to go.
    if (runOnOpenRef.current) {
      sendHimOn();
      return;
    }
    if (stage !== "choose") return;
    const spot = toPitch(event);
    if (!spot) return;
    const player = nearestOwn(spot);
    if (!player) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      fromId: player.id,
      from: player.spot,
      to: spot,
      rightButton: event.button === 2,
      bend: 0,
      path: [spot],
      ...readIntent(event.button === 2, spot),
    });
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const spot = toPitch(event);
    if (!spot) return;
    // Keep the WHOLE path, not the first sixty points of it.
    //
    // The cap stopped recording once the buffer was full, and a deliberate
    // curl is drawn slowly — so the sixty points were all spent on the first
    // inch of the drag, the bend was measured from a straight opening, and
    // every curled ball came out straight. Decimating instead halves the count
    // when it gets long and keeps the shape of what was actually drawn.
    const grown = [...drag.path, spot];
    const path =
      grown.length > 120 ? grown.filter((_, index) => index % 2 === 0) : grown;
    // Re-read as it moves: dragging towards the net turns a pass into a shot
    // under the finger, and the preview line says so before you let go.
    setDrag({
      ...drag,
      to: spot,
      path,
      bend: bendOf(drag.from, spot, path),
      ...readIntent(drag.rightButton, spot),
    });
  };

  const onPointerUp = () => {
    if (!drag) return;
    const finished = drag;
    setDrag(null);
    const travelled = Math.hypot(
      finished.to.x - finished.from.x,
      finished.to.y - finished.from.y,
    );
    // A tap rather than a drag clears that player's run order.
    if (travelled < 4) {
      setRuns((current) => {
        if (!(finished.fromId in current)) return current;
        const next = { ...current };
        delete next[finished.fromId];
        return next;
      });
      return;
    }
    if (finished.fromId === carrierId && possession === "home" && carrier) {
      const move = drawMove(
        carrier,
        finished.to,
        home,
        away,
        theirStance,
        finished.lofted,
        finished.shooting,
        aimableRuns,
        atKickOffRef.current,
        aimUnits,
        curveOf(finished.bend),
      );
      if (!move) return;
      emit({
        kind: "drawn",
        drew: move.kind,
        lofted: move.lofted,
        curved: curveOf(finished.bend) > CURL_MIN,
        // A pass aimed at the end of a run you had drawn — which is the thing
        // the tutorial is trying to teach, so it has to be told apart from an
        // ordinary ball to a man standing still.
        ontoRun: Boolean(move.receiver && aimableRuns[move.receiver.id]),
      });
      if (move.kind === "shot") {
        atKickOffRef.current = false;
        // The ball leaves on the bend that was drawn, whatever it does after.
        runShot(1 - move.risk, "home", finished.bend);
        return;
      }
      runMove(
        move.receiver ?? carrier,
        move.spot,
        move.risk,
        "home",
        theirStance,
        move.offside,
        {
          going: `${move.label}…`,
          lost: move.lofted ? "Overhit. They have it." : "Gone. They have it.",
          kept: "That came off.",
        },
        finished.bend,
        move.lofted,
      );
      return;
    }
    emit({ kind: "run", when: runTiming });
    setRuns((current) => ({
      ...current,
      [finished.fromId]: {
        to: { x: clamp(finished.to.x, 5, 95), y: clamp(finished.to.y, 5, 95) },
        when: runTiming,
      },
    }));
  };

  /**
   * Every run you have drawn, as somewhere the ball can be aimed. A run is an
   * instruction about where a man is going, so an arrow that finishes on the
   * end of one is a pass to him — whether he has set off yet or not.
   */
  const aimableRuns = useMemo(() => {
    const aims: Record<string, Position> = {};
    for (const [id, run] of Object.entries(runs)) aims[id] = run.to;
    return aims;
  }, [runs]);

  /** What the arrow being dragged would actually do, shown while dragging. */
  const dragPreview: DrawnMove | null =
    drag && drag.fromId === carrierId && possession === "home" && carrier
      ? drawMove(
          carrier,
          drag.to,
          home,
          away,
          theirStance,
          drag.lofted,
          drag.shooting,
          aimableRuns,
          atKickOffRef.current,
          aimUnits,
          curveOf(drag.bend),
        )
      : null;

  const playMove = (move: Move) => {
    if (stage !== "choose" || possession !== "home") return;
    emit({ kind: "move", id: move.id });
    runMove(
      move.endsOn,
      move.spot,
      move.risk,
      "home",
      theirStance,
      move.offside,
      {
        going: `${move.name}…`,
        lost: "Gone. They have it.",
        kept: "That is on. Keep going.",
      },
      0,
      IN_THE_AIR.has(move.id),
    );
  };

  const playShot = () => {
    if (!shootable || !carrier) return;
    runShot(shotChance(carrier.spot, "home", away, carrier), "home");
  };

  /**
   * Defending is a phase, not a beat.
   *
   * You set your side up once — a way of defending, plus wherever you have
   * dragged your players — and then the whole passage plays out in front of
   * you until you win it back, they shoot, or they run it out of play. You
   * cannot change your mind halfway through, and that is the point: a defence
   * is a shape you commit to and live with, and one beat at a time gave you
   * neither the commitment nor anything to read.
   *
   * It is also what makes defending predictable. Any single beat is a roll of
   * the dice, but over four or five of them the right read wins the ball back
   * about two times in three and the wrong read almost never does — so the
   * choice, not the dice, is what decides the phase.
   */
  const runDefensivePhase = (stance: StanceId) => {
    if (
      (stage !== "choose" && stage !== "recover") ||
      possession !== "away" ||
      !carrier
    )
      return;
    clearTimers();
    setStage("defending");
    setTheirStance(stance);
    setPhaseLog([]);
    setCommentary(`You ${stanceById(stance).name.toLowerCase()}. Let it play.`);

    // The phase carries its own copy of the pitch forward. Reading it back out
    // of React state between timers would give us whatever the last render
    // happened to have, which is not the same thing.
    let liveHome = home;
    let liveAway = away;
    let liveCarrier: Player = carrier;
    let liveBall = ball;

    /**
     * Take up the shape you have just chosen, and give the players the time it
     * actually takes to get there before the ball moves again.
     *
     * This is the difference between defending and being bailed out. Dropping
     * from a high press into a low block is forty yards of running for eight
     * men, and while they are doing it the ball is live and the clock is
     * going. Snapping everyone into position the instant you clicked made a
     * block free, which it is not.
     */
    const recoverInto = (next: StanceId, then: () => void) => {
      const before = liveHome;
      const shaped = applyShapes(
        liveBall,
        "away",
        liveCarrier.id,
        next,
        true,
        { home: liveHome, away: liveAway },
        true,
      );
      liveHome = shaped.nextHome;
      liveAway = shaped.nextAway;
      const furthest = Math.max(
        ...liveHome.map((player) => {
          const was = before.find((entry) => entry.id === player.id);
          return was
            ? Math.hypot(player.spot.x - was.spot.x, player.spot.y - was.spot.y)
            : 0;
        }),
      );
      timersRef.current.push(window.setTimeout(then, travelTime(furthest)));
    };
    // The shape can be changed mid-phase, but only when they have beaten it.
    let liveStance = stance;
    let brokenThrough = 0;
    // Re-setting the shape mid-phase and throwing a body in front of a shot
    // are budgeted separately. They have to be: the last-ditch block is the
    // one that decides whether you concede, so it can never be used up by
    // having already re-set the shape earlier in the same passage.
    let resets = 0;

    let lastDitchUsed = false;
    let beats = 0;

    const say = (line: string) => setPhaseLog((current) => [...current, line]);

    const finish = (line: string, keeperCollects: boolean) => {
      if (keeperCollects) {
        const keeper =
          liveHome.find((player) => player.role === "GK") ?? liveHome[0];
        settle(keeper, "home", true, liveStance, {
          home: liveHome,
          away: liveAway,
        });
      }
      setCommentary(line);
      setRecover(null);
      setStage("choose");
    };

    /**
     * Hand control back. Committing to a shape does not mean standing still
     * and watching them walk through it — when they beat it you get to react,
     * and when they are through on goal you get one last go at stopping it.
     */
    const handBack = (reason: RecoverReason, resume: () => void) => {
      recoverRef.current = (next) => {
        liveStance = next;
        setTheirStance(next);
        setRecover(null);
        setStage("defending");
        // Changing the shape mid-passage still costs the run back into it.
        // A last-ditch block is instinct rather than a re-organisation, so
        // that one happens where the players already are.
        if (reason === "shot") resume();
        else recoverInto(next, resume);
      };
      setRecover({ reason, on: playerName(liveCarrier) });
      setStage("recover");
      setCommentary(
        reason === "shot"
          ? `${playerName(liveCarrier)} is through. Last chance.`
          : "They have got through your shape. Re-set.",
      );
    };

    const takeShot = (chance: number) => {
      // Your last-ditch choice is what prices it — this is the difference
      // between conceding and getting a body in the way.
      const block =
        liveStance === "drop"
          ? 0.55
          : liveStance === "narrow"
            ? 0.68
            : liveStance === "press"
              ? 0.78
              : 0.95;
      say(`${playerName(liveCarrier)} shoots.`);
      setStage("moving");
      runShot(Math.min(0.72, chance * block), "away");
    };

    const beat = () => {
      beats += 1;
      if (beats > MAX_PHASE_BEATS) {
        finish("They run it into touch. Your ball.", true);
        return;
      }
      // Whatever you have switched to since the last beat takes effect now.
      //
      // Committing a shape and then watching six of their plays go by with no
      // say in any of them is not defending, it is spectating — and it was the
      // single biggest reason the game stopped feeling like yours. You can now
      // change how your side goes about it on any beat of the passage, and it
      // costs what changing it should cost: the run back into the new shape.
      if (switchRef.current && switchRef.current !== liveStance) {
        const next = switchRef.current;
        liveStance = next;
        setTheirStance(next);
        say(`You switch to ${stanceById(next).name.toLowerCase()}.`);
        switchRef.current = null;
        recoverInto(next, beat);
        return;
      }
      switchRef.current = null;
      // The added five are up. The whistle goes at the end of this beat rather
      // than in the middle of one — the half is not allowed to run on forever
      // just because they have kept the ball.
      if (halfIsUp()) {
        finish("The referee has his whistle to his lips…", false);
        return;
      }

      // A kick-off is a kick-off for them too.
      const theirKickOff = atKickOffRef.current;
      const choice = aiChoose(
        liveCarrier,
        liveAway,
        liveHome,
        theirStyle,
        false,
        sharp,
        lastPlayedRef.current,
        theirKickOff,
      );
      if (choice.kind === "shoot") {
        // You always get one go at stopping a shot in a given passage.
        if (!lastDitchUsed) {
          lastDitchUsed = true;
          handBack("shot", () => takeShot(choice.chance));
          return;
        }
        takeShot(choice.chance);
        return;
      }

      // Their move was chosen blind; your shape is what prices it.
      const priced = availableMoves(
        liveCarrier,
        liveAway,
        liveHome,
        theirStyle,
        liveStance,
        false,
        theirKickOff,
      ).moves.find((move) => move.id === choice.move.id);
      const move = priced ?? choice.move;
      lastPlayedRef.current = move.id;
      // The ball is away, so the kick-off no longer pins anybody.
      atKickOffRef.current = false;
      const bite = stanceBiteFor(liveStance, move.id);
      const shape = stanceById(liveStance).name.toLowerCase();

      setTargetId(move.endsOn.id);
      const shaped = applyShapes(
        move.spot,
        "away",
        move.endsOn.id,
        liveStance,
        true,
        { home: liveHome, away: liveAway },
        true,
      );
      liveHome = shaped.nextHome;
      liveAway = shaped.nextAway;
      liveBall = move.spot;
      playBall(move.spot, 0, IN_THE_AIR.has(move.id));

      timersRef.current.push(
        window.setTimeout(() => {
          const failed = move.offside || Math.random() < move.risk;
          if (failed) {
            // Same rule the other way round: one of yours has to actually be
            // near it to have won it back.
            const scramble = move.offside
              ? { player: nearestTo(liveBall, liveHome), turnedOver: true }
              : looseBall(liveBall, liveHome, liveAway);
            if (!scramble.turnedOver) {
              // It got away from them but nobody of yours was close either.
              liveCarrier = scramble.player;
              setCarrierId(liveCarrier.id);
              say(`${move.name} — loose, but they scramble it back.`);
              beat();
              return;
            }
            settle(scramble.player, "home", true, liveStance, {
              home: liveHome,
              away: liveAway,
            });
            say(
              move.offside
                ? "Flag is up. Offside — your ball."
                : `${move.name} — your ${shape} got them.`,
            );
            finish(
              move.offside
                ? "Offside. Your ball."
                : `Won back by ${playerName(scramble.player)}. Your ball.`,
              false,
            );
            return;
          }
          const arrived = liveHome
            .concat(liveAway)
            .find((p) => p.id === move.endsOn.id);
          liveCarrier = arrived ?? { ...move.endsOn, spot: move.spot };
          setCarrierId(liveCarrier.id);
          say(
            bite < 0.12
              ? `${move.name} — your ${shape} was never going to reach that.`
              : `${move.name} — through you.`,
          );
          // Two beats in a row through your shape means it is not working.
          // Rather than watching it happen a third time, you get to re-set.
          brokenThrough += 1;
          if (brokenThrough >= 2 && resets < MAX_RESETS) {
            brokenThrough = 0;
            resets += 1;
            handBack("bypassed", beat);
            return;
          }
          beat();
        }, MOVE_MS),
      );
    };

    // Your side takes up the shape first and the ball waits for them to get
    // there — you can watch them run back — and only then does play restart.
    recoverInto(stance, beat);
  };

  const live =
    stage === "choose" ||
    stage === "moving" ||
    stage === "defending" ||
    stage === "recover";
  const clock = `0:${String(Math.ceil(secondsLeft)).padStart(2, "0")}`;

  return (
    <main className="match-shell">
      <header className="match-topbar">
        <div className="match-topbar-left">
          <button
            className="match-back"
            data-testid="button-match-back"
            onClick={() => navigate("/")}
            type="button"
          >
            <ArrowLeft size={15} />
            Back to the board
          </button>
          <button
            className="match-back"
            data-testid="button-how-to-play"
            onClick={() => navigate("/how-to-play")}
            type="button"
          >
            <BookOpen size={15} />
            How to play
          </button>
        </div>
        <div className="match-scoreline" data-testid="match-scoreline">
          <span className="match-team is-home">You</span>
          <strong>
            {score.home} – {score.away}
          </strong>
          <span className="match-team is-away">Them</span>
        </div>
        <div className="match-topbar-right">
          {live && (
            <button
              className="match-forfeit"
              data-testid="button-forfeit"
              onClick={() => {
                clearTimers();
                setCelebrating(false);
                setDrag(null);
                // Whatever was added stays added, so winding the clock to the
                // end really does read 0:00 rather than the half.
                addedFrozenRef.current =
                  addedFrozenRef.current ?? Math.max(0, usedRef.current - HALF_MS);
                usedRef.current = MATCH_SECONDS * 1000 + addedFrozenRef.current;
                setSecondsLeft(0);
                setForfeited(true);
                setStage("fulltime");
                setCommentary("You blew the whistle early.");
              }}
              type="button"
            >
              <Flag size={14} />
              End it here
            </button>
          )}
          <div
            className={`match-clock ${secondsLeft <= 10 && live ? "is-urgent" : ""}`}
            data-testid="match-clock"
          >
            <Timer size={15} />
            {clock}
            {/* The board goes up. The clock itself holds at the half, because
                none of this is coming out of the second half — what ticks is
                the added time, and it is allowed to run past the five, which
                is what happens on a Saturday. */}
            {addedOn && live && (
              <span
                className="match-clock-added"
                data-testid="match-added-time"
                title={`Added time — ${HALF_ADDED_SECONDS} added, and the whistle goes at the next change of hands`}
              >
                +{Math.max(1, Math.ceil(addedSeconds))}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="match-body">
        {/* The travel time rides down as an inherited variable, so the CSS
            transition lasts exactly as long as the run the model just made. */}
        <div
          className="match-stage"
          style={
            {
              "--travel": `${travelMs}ms`,
              "--ball-travel": `${ballMs}ms`,
            } as CSSProperties
          }
        >
          <MatchPitch
            away={away}
            ball={ball}
            ballMs={ballMs}
            carrierId={carrierId}
            celebrating={celebrating}
            drag={drag}
            flight={flight}
            home={home}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            pitchRef={pitchRef}
            runs={runs}
            targetId={targetId}
          />
        </div>

        <aside className="match-panel" data-testid="match-panel">
          {/* The coach. Sits above everything else because it is the one thing
              on screen you are being asked to act on. */}
          {tutorial && (
            <div className="match-coach" data-testid="match-coach">
              {step < TUTORIAL.length ? (
                <>
                  <div className="match-coach-head">
                    <span className="match-coach-chapter">
                      {TUTORIAL[step].chapter}
                    </span>
                    <span className="match-coach-count">
                      {step + 1} of {TUTORIAL.length}
                    </span>
                    {/* The way out, in the corner, from the first step on:
                        the tutorial starts itself, so it has to be plainly
                        escapable or it is something being done to you. */}
                    <button
                      className="match-coach-out"
                      data-testid="button-coach-out"
                      onClick={leaveTutorial}
                      title="Skip the tutorial"
                      type="button"
                    >
                      Skip
                      <X size={12} />
                    </button>
                  </div>
                  <strong>{TUTORIAL[step].title}</strong>
                  <p className="match-coach-ask">{TUTORIAL[step].ask}</p>
                  {/* Being told to shoot while they have the ball is how a
                      tutorial loses somebody. Say so instead. */}
                  {stage !== "setup" &&
                    TUTORIAL[step].needs !== "any" &&
                    (TUTORIAL[step].needs === "ball") !==
                      (possession === "home") && (
                      <p className="match-coach-wait">
                        {TUTORIAL[step].needs === "ball"
                          ? "Not yet — you need the ball back first. Win it, and this will be here."
                          : "This one is for when they have it. Play on, and it will come round."}
                      </p>
                    )}
                  <p className="match-coach-why">{TUTORIAL[step].why}</p>
                  <div className="match-coach-feet">
                    <button
                      className="match-coach-skip"
                      data-testid="button-coach-skip"
                      onClick={() => setStep((at) => at + 1)}
                      type="button"
                    >
                      Skip this one
                    </button>
                    <button
                      className="match-coach-skip"
                      data-testid="button-coach-quit"
                      onClick={leaveTutorial}
                      type="button"
                    >
                      Skip the tutorial
                    </button>
                  </div>
                  <div
                    className="match-coach-bar"
                    style={{
                      ["--done" as string]: `${(step / TUTORIAL.length) * 100}%`,
                    }}
                  />
                </>
              ) : (
                <>
                  <strong>{TUTORIAL_DONE.title}</strong>
                  {TUTORIAL_DONE.lines.map((line) => (
                    <p className="match-coach-why" key={line}>
                      {line}
                    </p>
                  ))}
                  <div className="match-coach-feet">
                    <button
                      className="match-coach-skip"
                      data-testid="button-coach-done"
                      onClick={() => navigate("/match")}
                      type="button"
                    >
                      Play a proper match
                    </button>
                    <button
                      className="match-coach-skip"
                      data-testid="button-coach-again"
                      onClick={() => setStep(0)}
                      type="button"
                    >
                      Go through it again
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <p
            className="match-commentary"
            data-testid="match-commentary"
            aria-live="polite"
          >
            {commentary}
          </p>

          {/* He has taken it down and looked up. Send him, or he stops. */}
          {runOn && (
            <button
              className="match-run-on"
              data-testid="button-run-on"
              onClick={sendHimOn}
              type="button"
            >
              <strong>Go on, {runOn}!</strong>
              <span>Click here or anywhere on the pitch to drive at them</span>
            </button>
          )}

          {stage === "setup" && (
            <div className="match-setup">
              <SidePicker
                label="Your side"
                onSelect={(next) => {
                  setHomeSide(next);
                  setHomeShape(shapeOf(next));
                  // Take on their manager's way of playing as a starting point.
                  // You can still change it — that is the whole game.
                  if (next.kind === "dugout") setStyleId(styleOf(next));
                }}
                testId="home"
                value={homeSide}
              />
              <SidePicker
                label="Their side"
                onSelect={setAwaySide}
                testId="away"
                value={awaySide}
              />
              <p className="match-hint is-read" data-testid="match-their-side">
                You face {sideBlurb(awaySide)}.
              </p>
              <div className="match-field">
                <span>Difficulty</span>
                <div className="match-style-row">
                  {(["easy", "hard"] as Difficulty[]).map((level) => (
                    <button
                      className={`match-style ${difficulty === level ? "is-active" : ""}`}
                      data-testid={`button-difficulty-${level}`}
                      key={level}
                      onClick={() => setDifficulty(level)}
                      type="button"
                    >
                      {level === "easy" ? "Easy" : "Hard"}
                    </button>
                  ))}
                </div>
                <p className="match-hint">
                  {difficulty === "easy"
                    ? "Odds shown, their shape named, and the flag warned about."
                    : "No numbers. Read their shape yourself, and watch the offside line."}
                </p>
              </div>
              <button
                className="match-primary"
                data-testid="button-kick-off"
                onClick={kickOff}
                type="button"
              >
                <Play size={15} />
                Kick off
              </button>
            </div>
          )}

          {live && (
            <div className="match-styles" data-testid="match-styles">
              <div className="match-choices-title">
                Your style — it decides what you can do
              </div>
              <div className="match-style-row">
                {STYLES.map((option) => (
                  <button
                    className={`match-style ${styleId === option.id ? "is-active" : ""}`}
                    data-testid={`button-style-${option.id}`}
                    key={option.id}
                    onClick={() => setStyleId(option.id)}
                    type="button"
                  >
                    {option.name}
                  </button>
                ))}
              </div>
              <p className="match-hint">{style.blurb}</p>
              {showOdds && possession === "home" && (
                <p
                  className="match-hint is-read"
                  data-testid="match-their-stance"
                >
                  They are set up to stop {stanceById(theirStance).stops}, and
                  conceding {stanceById(theirStance).concedes}.
                </p>
              )}
            </div>
          )}

          {stage === "choose" &&
            possession === "home" &&
            carrier &&
            moveSet && (
              <div className="match-choices" data-testid="match-choices">
                <div className="match-choices-title">
                  On the ball: {playerName(carrier)} ({carrier.number})
                </div>
                {shootable && (
                  <button
                    className={`match-choice is-shot is-${sightOfGoal.tone}`}
                    data-testid="button-shoot"
                    onClick={playShot}
                    type="button"
                  >
                    <strong>
                      <Crosshair size={14} /> Shoot
                    </strong>
                    {/* Being in range is not the same as it being on, and hard
                      mode still has to say which — otherwise every hopeful
                      effort from thirty yards looks like a chance. */}
                    <span>
                      {sightOfGoal.read}
                      {showOdds
                        ? ` · ${Math.round(sightOfGoal.chance * 100)}% of going in`
                        : ""}
                    </span>
                    {/* The button hits it straight. Bending it is something you
                      have to draw, so the panel has to say when that is on. */}
                    <span className="match-curl">{sightOfGoal.curl}</span>
                  </button>
                )}
                {moveSet.moves.map((move) => (
                  <button
                    className={`match-choice is-${move.tone} ${move.offside && showOdds ? "is-offside" : ""}`}
                    data-testid={`button-move-${move.id}`}
                    key={move.id}
                    onClick={() => playMove(move)}
                    type="button"
                  >
                    <strong>{move.name}</strong>
                    <span>
                      {move.offside && showOdds && (
                        <>
                          <Flag size={11} /> he is beyond the last man ·{" "}
                        </>
                      )}
                      {move.read}
                      {showOdds
                        ? ` · ${Math.round(move.risk * 100)}% to lose it`
                        : ""}
                    </span>
                  </button>
                ))}
                {moveSet.blocked.length > 0 && (
                  <div className="match-blocked" data-testid="match-blocked">
                    <div className="match-choices-title">Not on right now</div>
                    {moveSet.blocked.map((item) => (
                      <div className="match-blocked-item" key={item.id}>
                        <strong>{item.name}</strong>
                        <span>{item.why}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          {stage === "choose" && possession === "away" && (
            <div className="match-choices" data-testid="match-choices-defend">
              <div className="match-choices-title">
                They have it. Set your side up, then let it play.
              </div>
              <p className="match-hint">
                Pick how you defend and drag anyone you want moved. The whole
                passage plays out from there — you get the ball back, or you do
                not.
                {showOdds && (
                  <>
                    {" "}
                    They play <strong>{styleOf(awaySide)}</strong>, so
                    {theirStyle.id === "possession" &&
                      " they will work it short through the middle."}
                    {theirStyle.id === "direct" &&
                      " they will go over the top and into the channels."}
                    {theirStyle.id === "pragmatic" &&
                      " they will sit in, then break and cross."}
                  </>
                )}
              </p>
              {/* Where you defend is a standing decision; it frames everything
                  below it and does not change from one passage to the next
                  unless you change it. */}
              <div className="match-field">
                <span>How high you defend</span>
                <div className="match-style-row">
                  {BLOCKS.map((option) => (
                    <button
                      className={`match-style ${blockId === option.id ? "is-active" : ""}`}
                      data-testid={`button-block-${option.id}`}
                      key={option.id}
                      onClick={() => {
                        setBlockId(option.id);
                        emit({ kind: "block", id: option.id });
                      }}
                      type="button"
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
                <p className="match-hint">{blockById(blockId).blurb}</p>
              </div>

              <div className="match-choices-title">
                {ballZone === "high"
                  ? "They are playing out from the back"
                  : ballZone === "middle"
                    ? "They have it in midfield"
                    : "They are in on your goal"}
              </div>
              {challengesFor(blockId, ballZone).map((challenge) => (
                <button
                  className="match-choice"
                  data-testid={`button-defend-${challenge.id}`}
                  key={challenge.id}
                  onClick={() => {
                    emit({ kind: "challenge", id: challenge.id });
                    runDefensivePhase(challenge.id);
                  }}
                  type="button"
                >
                  <strong>{challenge.name}</strong>
                  <span>
                    {challenge.note} · {CHALLENGE[challenge.id]}
                  </span>
                </button>
              ))}
            </div>
          )}

          {(stage === "defending" || stage === "recover") && (
            <div className="match-choices" data-testid="match-phase">
              <div className="match-choices-title">
                {stanceById(theirStance).name} — letting it play
              </div>
              <ol className="match-phase-log">
                {phaseLog.map((line, index) => (
                  <li key={`${index}-${line}`}>{line}</li>
                ))}
              </ol>
              {/* The passage is theirs, but the shape is still yours. Changing
                  it here takes effect on the next beat and costs the run back
                  into it — you are not paused, you are managing. */}
              {stage === "defending" && (
                <div className="match-field match-switch">
                  <span>Change it while they have it</span>
                  <div className="match-style-row is-wrap">
                    {challengesFor(blockId, ballZone).map((challenge) => (
                      <button
                        className={`match-style ${theirStance === challenge.id ? "is-active" : ""}`}
                        data-testid={`button-switch-${challenge.id}`}
                        key={challenge.id}
                        onClick={() => {
                          emit({ kind: "switch", id: challenge.id });
                          switchRef.current = challenge.id;
                          setCommentary(
                            `${challenge.name} — on the next beat.`,
                          );
                        }}
                        type="button"
                      >
                        {challenge.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {stage === "recover" && recover && (
            <div
              className="match-choices is-urgent"
              data-testid="match-recover"
            >
              <div className="match-choices-title">
                {recover.reason === "shot"
                  ? `${recover.on} is through on goal — how do you stop it?`
                  : "They have played through you. Re-set the shape."}
              </div>
              {STANCES.map((stance) => (
                <button
                  className="match-choice"
                  data-testid={`button-recover-${stance.id}`}
                  key={stance.id}
                  onClick={() => recoverRef.current?.(stance.id)}
                  type="button"
                >
                  <strong>
                    {recover.reason === "shot"
                      ? LAST_DITCH[stance.id]
                      : stance.name}
                  </strong>
                  <span>
                    {recover.reason === "shot"
                      ? stanceById(stance.id).stops
                      : `Stops ${stance.stops} · concedes ${stance.concedes}`}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Drawing arrows is for when you have the ball. While they have it
              you are picking how the team goes after it, not passing to
              anybody, so none of this belongs on screen. */}
          {live && possession === "home" && (
            <div className="match-draw" data-testid="match-draw">
              <div className="match-choices-title">Your own instructions</div>
              <p className="match-hint">
                Drag from any player to send him there. Drag from the man on the
                ball to play it — to anyone, at any range, or{" "}
                <strong>at their goal to shoot from where he stands</strong>.
                Tap a player to cancel his run.
              </p>

              <div className="match-field">
                <span>A drag from the man on the ball</span>
                <div className="match-style-row">
                  {(
                    [
                      ["ground", "Along the ground"],
                      ["air", "In the air"],
                      ["shot", "Shoot"],
                    ] as [DragIntent, string][]
                  ).map(([id, label]) => (
                    <button
                      className={`match-style ${dragIntent === id ? "is-active" : ""}`}
                      data-testid={`button-intent-${id}`}
                      key={id}
                      onClick={() => setDragIntent(id)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="match-hint">
                  On a mouse, right-drag puts it in the air whatever is picked
                  here. Aiming at their goal is always a shot.
                </p>
              </div>

              <div className="match-field">
                <span>A run you draw</span>
                <div className="match-style-row">
                  {(
                    [
                      ["onPass", "Goes when the ball does"],
                      ["now", "Goes now"],
                    ] as [RunTiming, string][]
                  ).map(([id, label]) => (
                    <button
                      className={`match-style ${runTiming === id ? "is-active" : ""}`}
                      data-testid={`button-timing-${id}`}
                      key={id}
                      onClick={() => setRunTiming(id)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="match-hint">
                  {runTiming === "onPass"
                    ? "He holds his position and goes as you play it, so he is onside when the ball leaves — and you can pass into the space ahead of him."
                    : "He goes there straight away. Use it to pull a man across before the ball is played."}
                </p>
              </div>

              {dragPreview && (
                <p
                  className={`match-hint is-read ${dragPreview.kind === "shot" ? "is-shot-read" : ""}`}
                  data-testid="match-drag-preview"
                >
                  {dragPreview.label} — {dragPreview.read}
                  {dragPreview.offside && showOdds ? " · offside" : ""}
                  {showOdds
                    ? dragPreview.kind === "shot"
                      ? ` · ${Math.round((1 - dragPreview.risk) * 100)}% of going in`
                      : ` · ${Math.round(dragPreview.risk * 100)}% to lose it`
                    : ""}
                </p>
              )}
              {Object.keys(runs).length > 0 && (
                <button
                  className="match-secondary"
                  data-testid="button-clear-runs"
                  onClick={() => setRuns({})}
                  type="button"
                >
                  Clear {Object.keys(runs).length} run
                  {Object.keys(runs).length > 1 ? "s" : ""}
                </button>
              )}
            </div>
          )}

          {stage === "halftime" && (
            <div className="match-setup" data-testid="match-halftime">
              <div className="match-choices-title">The team talk</div>
              {/* Shape only — the same eleven come back out, rearranged. */}
              <ShapePicker
                label="Your shape for the second half"
                onSelect={(next) => setHomeShape(next.shape)}
                shape={homeShape}
                testId="home-half"
              />
              <div className="match-field">
                <span>Your style</span>
                <div className="match-style-row">
                  {STYLES.map((option) => (
                    <button
                      className={`match-style ${styleId === option.id ? "is-active" : ""}`}
                      data-testid={`button-halftime-style-${option.id}`}
                      key={option.id}
                      onClick={() => setStyleId(option.id)}
                      type="button"
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
                <p className="match-hint">{style.blurb}</p>
              </div>
              <p className="match-hint is-read">
                You are up against {sideBlurb(awaySide)}.
              </p>
              <button
                className="match-primary"
                data-testid="button-second-half"
                onClick={() => {
                  setRuns({});
                  restart("away");
                  setStage("choose");
                  setCommentary("Second half. They have it.");
                }}
                type="button"
              >
                <Play size={15} />
                Second half
              </button>
            </div>
          )}

          {(stage === "moving" || stage === "defending") && (
            <p className="match-waiting" data-testid="match-waiting">
              Ball in play…
            </p>
          )}

          {stage === "fulltime" && (
            <div className="match-fulltime" data-testid="match-fulltime">
              <Trophy size={20} />
              <strong>
                {score.home > score.away
                  ? "You win."
                  : score.home < score.away
                    ? "They win."
                    : "A draw."}
              </strong>
              <span>
                {score.home} – {score.away}
                {forfeited
                  ? ", with the whistle blown early."
                  : " in sixty seconds of football."}
              </span>
              <button
                className="match-primary"
                data-testid="button-play-again"
                onClick={kickOff}
                type="button"
              >
                <RotateCcw size={15} />
                Play again
              </button>
              <button
                className="match-secondary"
                data-testid="button-change-shapes"
                onClick={() => {
                  clearTimers();
                  usedRef.current = 0;
                  setSecondsLeft(MATCH_SECONDS);
                  setAddedSeconds(0);
                  addedFrozenRef.current = null;
                  endMarkRef.current = null;
                  setStage("setup");
                  setCommentary("Pick both shapes, then kick off.");
                }}
                type="button"
              >
                Change the shapes
              </button>
            </div>
          )}

          {live && (
            <div className="match-live-shapes">
              <span>
                You <strong>{sideName(homeSide)}</strong>
              </span>
              <span>
                Them <strong>{sideName(awaySide)}</strong>
              </span>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

/**
 * One list, two kinds of side: the plain shapes on top, then every real team
 * the app knows. Options are tagged `f:` or `d:` so the value says which.
 */
function SidePicker({
  label,
  onSelect,
  testId,
  value,
}: {
  label: string;
  onSelect: (choice: SideChoice) => void;
  testId: string;
  value: SideChoice;
}) {
  const current =
    value.kind === "formation"
      ? `f:${value.formation.name}`
      : `d:${value.dugout.era.id}`;
  return (
    <label className="match-field">
      <span>{label}</span>
      <select
        data-testid={`select-side-${testId}`}
        onChange={(event) => {
          const [kind, key] = [
            event.target.value.slice(0, 1),
            event.target.value.slice(2),
          ];
          if (kind === "f") {
            const formation = FORMATIONS.find((entry) => entry.name === key);
            if (formation) onSelect({ kind: "formation", formation });
            return;
          }
          const dugout = dugoutById(key);
          if (dugout) onSelect({ kind: "dugout", dugout });
        }}
        value={current}
      >
        <optgroup label="A shape">
          {FORMATIONS.map((formation) => (
            <option key={formation.name} value={`f:${formation.name}`}>
              {formation.name} — {formation.subtitle}
            </option>
          ))}
        </optgroup>
        <optgroup label="A manager's side">
          {DUGOUTS.map((entry) => (
            <option key={entry.era.id} value={`d:${entry.era.id}`}>
              {dugoutLabel(entry)} ({entry.era.formation})
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  );
}

/** Shape only, for half time: the same eleven, arranged differently. */
function ShapePicker({
  label,
  onSelect,
  shape,
  testId,
}: {
  label: string;
  onSelect: (formation: Formation) => void;
  shape: number[];
  testId: string;
}) {
  const current =
    FORMATIONS.find(
      (formation) => formation.shape.join("-") === shape.join("-"),
    )?.name ?? FORMATIONS[0].name;
  return (
    <label className="match-field">
      <span>{label}</span>
      <select
        data-testid={`select-formation-${testId}`}
        onChange={(event) => {
          const next = FORMATIONS.find(
            (formation) => formation.name === event.target.value,
          );
          if (next) onSelect(next);
        }}
        value={current}
      >
        {FORMATIONS.map((formation) => (
          <option key={formation.name} value={formation.name}>
            {formation.name} — {formation.subtitle}
          </option>
        ))}
      </select>
    </label>
  );
}
