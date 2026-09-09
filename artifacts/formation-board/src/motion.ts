// ---------------------------------------------------------------------------
// Continuous motion.
//
// The game is played in beats and that is deliberate: a beat is the unit of
// decision, and the tutorial teaches it. What was wrong was not the beat, it
// was that a beat RESOLVED as a jump. Positions were assigned straight into
// React state once per beat and a CSS transition eased each player from where
// he was to where he now was — accelerating from a standstill and stopping
// dead, once per beat, with everybody frozen for the remaining 42% of it.
//
// So this file separates two things that were tangled:
//
//   the MODEL decides, in beats: reshape() says where a player is trying to
//   get to, and that is unchanged and still runs headless with no renderer.
//
//   this ENGINE moves him there, continuously: he has a velocity, he
//   accelerates, he can only turn so fast, and he is drawn wherever he
//   actually is on any given frame.
//
// Fixed timestep so behaviour is identical at 30, 60 and 144Hz; rendering
// interpolates between the last two sim states by whatever fraction of a step
// is left over. Nothing in here touches the DOM or React — the caller does the
// drawing, so the whole thing is testable and the harness runs it headless.
// ---------------------------------------------------------------------------

export type Vec = { x: number; y: number };

/** The sim runs at a fixed rate whatever the display does. */
export const STEP_MS = 1000 / 60;
/**
 * The most time one frame may contribute. A backgrounded tab hands back a
 * delta of minutes; without this the accumulator would try to catch up in one
 * frame and lock the page solid.
 */
const MAX_FRAME_MS = 250;

// --- the pitch is not square, and everything downstream depended on it ------
//
// Positions run 0..100 in both axes, but the pitch they are drawn on is 68m
// wide and 105m long. So a unit sideways is 0.68m and a unit up the pitch is
// 1.05m, and any speed expressed "in units" silently meant two different
// speeds depending which way the man happened to be running: a top speed of
// 9.5 units/s was 10.0 m/s up the pitch and 6.5 m/s across it. The same
// confusion priced every pass, because a distance in units is not a distance.
//
// So the engine works in METRES. Positions stay in units, because that is what
// the pitch is drawn in, and the conversion happens at the one place they are
// integrated.
export const M_PER_X = 0.68;
export const M_PER_Y = 1.05;

/** The real distance between two spots, in metres. The one length in the game. */
export const metresBetween = (a: Vec, b: Vec) =>
  Math.hypot((a.x - b.x) * M_PER_X, (a.y - b.y) * M_PER_Y);

/** A unit-space offset as it really is, in metres. */
const toMetres = (dx: number, dy: number): Vec => ({
  x: dx * M_PER_X,
  y: dy * M_PER_Y,
});

// --- how a footballer moves, in metres per second ---------------------------
/**
 * Top speed. A professional tops out near 9 m/s flat out and spends almost
 * none of a match there; 8 as a base across the eleven, spread by pace, puts a
 * sprint the length of the pitch at about twelve seconds, which is what it
 * takes.
 */
const BASE_TOP_SPEED = 8;
/**
 * Acceleration, and this is the one that was badly wrong. It used to be 22
 * units/s², which is 23 m/s² — call it two and a third g. Every player reached
 * top speed in 0.43 seconds from a standing start. That is not a footballer,
 * it is a projectile, and it is a large part of why the movement read as
 * twitchy: every change of target was very nearly an instant change of
 * velocity. A human sprinter manages 3 to 4.
 */
const BASE_ACCEL = 3.6;
/**
 * And how hard he pulls up. Deliberately not the same number: you can stop a
 * good deal faster than you can get going, which is the whole reason a player
 * can check his run at all. Using one figure for both made every man overrun
 * everywhere he was sent.
 */
const BASE_BRAKE = 7.2;

/**
 * How fast a given player runs, in metres per second.
 *
 * Exported because it is not only the engine's business any more: working out
 * whether a man can reach a loose ball before an opponent, or where a pass
 * into his stride should be hit, is the same question about the same number.
 * Two definitions of how fast somebody runs would be two different games.
 */
/**
 * Attributes run 1 to 20, the way the rest of the app writes them — a centre
 * half's pace is 10, a winger's is 17. This read them as if they ran to a
 * hundred, so every player in the game came out between 6.85 and 7.05 m/s: a
 * three per cent spread across all twenty-two, keeper included. Nobody was
 * quick, nobody was slow, and a winger could not beat a centre half for pace
 * because there was nothing to beat him by. It is a large part of why they all
 * moved as one.
 */
export const topSpeedFor = (pace = 10) =>
  BASE_TOP_SPEED * (0.8 + (clamp(pace, 1, 20) / 20) * 0.4);

/** Radians per second. A footballer does not pivot on the spot. */
const TURN_RATE = 4.5;
/** How close before he starts putting the brakes on, in metres. */
const ARRIVE_RADIUS = 2.5;
/** How close two players get before they start shouldering apart, in metres. */
const SHOULDER = 1.9;
/** And how quickly they may drift apart doing it, in metres per second. */
const SEPARATE_SPEED = 1.5;
/** Near enough to call it standing still, in metres per second. */
const AT_REST = 0.3;

/**
 * How long a man takes to notice and go, in seconds.
 *
 * Not a cosmetic touch. Every player was handed a new target on the same
 * frame and set off on the same frame, so twenty-two men started and stopped
 * in perfect unison once a beat — which is a formation being redrawn however
 * smoothly you interpolate it. Real reaction plus the moment it takes to read
 * what has happened is a couple of hundred milliseconds, and it differs per
 * man, which is all it takes for a shape to look like people rather than a
 * mechanism.
 */
const REACT_MIN = 0.12;
const REACT_SPAN = 0.26;

/**
 * How far a man gets in `seconds`, starting from a standstill — and how long
 * he takes to cover `metres`. Each is the other read backwards.
 *
 * These matter far more than they look. Anything that asks "can he get there
 * in time" — where to hit a pass, who wins a loose ball — used to answer it
 * with distance ÷ top speed, which is a man who is already at full pelt and
 * has been since before you asked. With acceleration at its old 23 m/s² that
 * was very nearly true, so the error hid. At a real 3.6 it does not hide at
 * all: over one second a footballer covers about 1.8m from standing, not the
 * 8m that dividing by top speed claims. Every pass would be hit four metres
 * beyond its receiver and every defender would look like he could reach
 * anything.
 *
 * Both include his reaction, because the clock starts when the ball is struck,
 * not when he has noticed.
 */
export function reachIn(seconds: number, topSpeed: number, reaction = REACT_MIN): number {
  const going = Math.max(0, seconds - reaction);
  const toTop = topSpeed / BASE_ACCEL;
  if (going <= toTop) return 0.5 * BASE_ACCEL * going * going;
  return topSpeed * going - (topSpeed * topSpeed) / (2 * BASE_ACCEL);
}

/**
 * How much ground a man covers in `seconds`, given how fast he is already
 * going and how fast he can ever go.
 *
 * This exists so the MODEL and the ENGINE cannot disagree about it, which they
 * badly did. The model had its own figure — a flat allowance in pitch units,
 * tuned by eye back when acceleration was six times what a human manages — and
 * it let a player travel about 12 units in a beat. The engine, running a real
 * 3.6 m/s² from a standing start, could carry him under two. So every beat the
 * model moved everybody several times further than the engine could take them,
 * and the side you actually watched was permanently strung out behind the
 * shape it was trying to hold. It never once looked like a formation.
 *
 * Now there is one answer, and both of them ask it.
 */
export function coverIn(seconds: number, topSpeed: number, entrySpeed = 0): number {
  const going = Math.max(0, seconds);
  const v0 = Math.max(0, Math.min(entrySpeed, topSpeed));
  const toTop = (topSpeed - v0) / BASE_ACCEL;
  if (going <= toTop) return v0 * going + 0.5 * BASE_ACCEL * going * going;
  return (
    v0 * toTop +
    0.5 * BASE_ACCEL * toTop * toTop +
    topSpeed * (going - toTop)
  );
}

export function timeToCover(metres: number, topSpeed: number, reaction = REACT_MIN): number {
  if (metres <= 0) return 0;
  const runUp = (topSpeed * topSpeed) / (2 * BASE_ACCEL);
  if (metres <= runUp) return reaction + Math.sqrt((2 * metres) / BASE_ACCEL);
  return reaction + topSpeed / BASE_ACCEL + (metres - runUp) / topSpeed;
}

/**
 * One player's own version of a movement figure: partly what he is good at,
 * partly just him. `spread` is how far either side of the base it may land.
 */
function quirk(id: string, pace: number, spread: number): number {
  const fromPace = (clamp(pace, 1, 20) - 10) / 10; // -0.9..+1.0 around average
  const fromHim = seedOf(id) - 0.5; // -0.5..+0.5, stable for this man
  return 1 + clamp(fromPace * 0.7 + fromHim * 0.9, -1, 1) * spread;
}

/** A stable number in 0..1 for an id, so a man's reactions are his own. */
function seedOf(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

// --- and how a ball moves ---------------------------------------------------
//
// It used to be solved backwards: a flight time was picked by eye, and the
// launch speed worked out so the ball would land exactly then. That made the
// ball travel three to five times faster than the players — a 25m pass arrived
// in 0.62s — which is why it beat everybody to everything, and why the tester
// said the ball was too quick for the men.
//
// Now it is the other way round, which is also the way round it works on
// grass: the ball leaves the boot at a speed, friction takes it off, and how
// long it takes to arrive is whatever falls out of that.

/** Grass, per second. Through the air there is far less of it — the point of
 *  going over the top is that the ball keeps its pace. */
const BALL_DRAG = 0.30;
const LOFTED_DRAG = 0.16;

/** How hard a pass of this length, in metres, is struck. */
export function launchSpeed(metres: number, lofted: boolean): number {
  const k = lofted ? LOFTED_DRAG : BALL_DRAG;
  const struck = lofted
    ? Math.min(36, 15 + metres * 0.40)
    : Math.min(34, 13 + metres * 0.38);
  // A ball rolling out under friction covers at most v0/k. Never hit one so
  // softly it stops short of where it was aimed: the model has already priced
  // whether the pass comes off, and a ball dying halfway would be that penalty
  // charged twice.
  return Math.max(struck, metres * k * 1.35);
}

/**
 * How long a ball takes to cover a distance, in seconds.
 *
 * Speed decays as v0·e^(-kt), so the ground covered by time T is
 * v0·(1-e^(-kT))/k. Inverting that for T is the honest arrival time.
 */
export function flightSeconds(metres: number, lofted: boolean): number {
  if (metres <= 0.01) return 0.05;
  const k = lofted ? LOFTED_DRAG : BALL_DRAG;
  const v0 = launchSpeed(metres, lofted);
  return -Math.log(Math.max(0.02, 1 - (metres * k) / v0)) / k;
}

const len = (v: Vec) => Math.hypot(v.x, v.y);
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
/** Shortest signed angle from a to b. */
const angleTo = (a: number, b: number) => {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
};

/** A ball in the air or along the ground, on the line it was played on. */
export type Flight = {
  from: Vec;
  control: Vec;
  to: Vec;
  /** How far along, 0 to 1. */
  t: number;
  /** Metres per second, bleeding off as it runs. */
  speed: number;
  /** How far it has travelled, in metres. */
  gone: number;
  /** The whole length of the flight, in metres. */
  length: number;
  lofted: boolean;
};

export type Body = {
  id: string;
  kind: 'player' | 'ball';
  /** In pitch units, because that is what the pitch is drawn in. */
  at: Vec;
  /** Where it was one sim step ago, so rendering can interpolate. */
  was: Vec;
  /** In METRES per second. */
  vel: Vec;
  /** Where it is trying to get to. A ball in flight steers for nothing. */
  target: Vec | null;
  /** A target he has been given but has not reacted to yet. */
  pending: Vec | null;
  /** Seconds left before he does. */
  wait: number;
  /** How long this particular man takes to react. */
  reaction: number;
  /** Which way it is facing, in radians. Drawn as a lean. */
  heading: number;
  topSpeed: number;
  accel: number;
  /** How hard he pulls up, and how sharply he turns. His own. */
  brake: number;
  turn: number;
  flight: Flight | null;
};

const bezier = (f: Flight, t: number): Vec => {
  const away = 1 - t;
  return {
    x: away * away * f.from.x + 2 * away * t * f.control.x + t * t * f.to.x,
    y: away * away * f.from.y + 2 * away * t * f.control.y + t * t * f.to.y,
  };
};

export class Motion {
  private bodies = new Map<string, Body>();

  /** Left-over time not yet simulated, as a fraction of one step. */
  private carry = 0;

  /** Adds a body, or leaves an existing one where it is. */
  place(id: string, kind: Body['kind'], at: Vec, pace = 60): Body {
    const found = this.bodies.get(id);
    if (found) return found;
    const body: Body = {
      id,
      kind,
      at: { ...at },
      was: { ...at },
      vel: { x: 0, y: 0 },
      target: null,
      pending: null,
      wait: 0,
      reaction: kind === 'ball' ? 0 : REACT_MIN + seedOf(id) * REACT_SPAN,
      heading: kind === 'ball' ? 0 : Math.PI / 2,
      topSpeed: kind === 'ball' ? 0 : topSpeedFor(pace),
      // How he runs, not just how fast.
      //
      // Only top speed varied before, by about a fifth across the squad, and
      // everything else — how hard he gets going, how hard he pulls up, how
      // sharply he turns — was one number shared by all twenty-two. So they
      // all set off the same, arrived the same and stopped the same, and the
      // pitch read as one mechanism with eleven copies on each side rather
      // than as people. These spread it, and the seed gives two men with the
      // same attributes their own slight difference anyway.
      accel: kind === 'ball' ? 0 : BASE_ACCEL * quirk(id, pace, 0.34),
      brake: kind === 'ball' ? 0 : BASE_BRAKE * quirk(id + 'b', pace, 0.26),
      turn: kind === 'ball' ? 0 : TURN_RATE * quirk(id + 't', pace, 0.3),
      flight: null,
    };
    this.bodies.set(id, body);
    return body;
  }

  get(id: string) {
    return this.bodies.get(id);
  }

  /** Where a body actually is this instant. The one answer to that question. */
  at(id: string): Vec | null {
    const body = this.bodies.get(id);
    return body ? { ...body.at } : null;
  }

  /** Everything currently on the pitch. */
  all() {
    return this.bodies.values();
  }

  /** Forget anyone no longer in the game — a restart rebuilds both teams. */
  keepOnly(ids: Set<string>) {
    for (const id of [...this.bodies.keys()]) {
      if (!ids.has(id)) this.bodies.delete(id);
    }
  }

  /**
   * Tell a player where he is trying to get to. He runs there himself, after
   * taking his own moment to react — see REACT_MIN. A target that is barely
   * different from the one he already has is not news and does not restart
   * that clock, or he would spend the match hesitating.
   */
  aim(id: string, target: Vec, pace?: number) {
    const body = this.bodies.get(id);
    if (!body) return;
    if (pace !== undefined) body.topSpeed = topSpeedFor(pace);
    const now = body.pending ?? body.target;
    if (now && metresBetween(now, target) < 0.4) {
      if (body.pending) body.pending = { ...target };
      else body.target = { ...target };
      return;
    }
    body.pending = { ...target };
    body.wait = body.reaction;
  }

  /** Put a body exactly where it is told, killing its momentum. For restarts
   *  and half time, where nobody is meant to be seen running. */
  snap(id: string, at: Vec) {
    const body = this.bodies.get(id);
    if (!body) return;
    body.at = { ...at };
    body.was = { ...at };
    body.vel = { x: 0, y: 0 };
    body.target = null;
    body.pending = null;
    body.wait = 0;
    body.flight = null;
  }

  /**
   * Kick the ball. It leaves on a velocity along the line it was played, runs,
   * slows under friction, and arrives when it arrives — it is not attached to
   * anybody while it is travelling, which is the whole point: a ball that
   * occupies space over time is a ball something can be done about.
   */
  kick(from: Vec, to: Vec, bow = 0, lofted = false) {
    const ball = this.bodies.get('ball');
    if (!ball) return;
    // The bow is drawn in view space, where y is stretched by 1.5 — it has to
    // be worked out there so the flight follows the arrow that was drawn.
    const dx = to.x - from.x;
    const dy = (to.y - from.y) * 1.5;
    const straight = Math.hypot(dx, dy) || 1;
    const control = {
      x: (from.x + to.x) / 2 - (dy / straight) * bow,
      y: (from.y + to.y) / 2 + ((dx / straight) * bow) / 1.5,
    };
    const length = Math.max(0.5, metresBetween(from, to));
    ball.flight = {
      from: { ...from },
      control,
      to: { ...to },
      t: 0,
      speed: launchSpeed(length, lofted),
      gone: 0,
      length,
      lofted,
    };
    ball.at = { ...from };
    ball.was = { ...from };
    ball.vel = { x: 0, y: 0 };
    ball.target = null;
    ball.pending = null;
  }

  /** Where the ball is now, and whether it is still travelling. An
   *  interception is a defender being near the ball mid-flight. */
  ballNow(): { at: Vec; inFlight: boolean } | null {
    const ball = this.bodies.get('ball');
    if (!ball) return null;
    return { at: { ...ball.at }, inFlight: ball.flight !== null };
  }

  private stepBody(body: Body, dt: number) {
    body.was = { ...body.at };

    if (body.flight) {
      const f = body.flight;
      f.speed -= f.speed * (f.lofted ? LOFTED_DRAG : BALL_DRAG) * dt;
      f.gone += f.speed * dt;
      f.t = f.gone / f.length;
      if (f.t >= 1) {
        body.at = { ...f.to };
        body.flight = null;
        body.vel = { x: 0, y: 0 };
        return;
      }
      const next = bezier(f, f.t);
      body.vel = toMetres((next.x - body.at.x) / dt, (next.y - body.at.y) / dt);
      body.at = next;
      return;
    }

    // He has been told where to go but has not reacted yet.
    if (body.pending) {
      body.wait -= dt;
      if (body.wait <= 0) {
        body.target = body.pending;
        body.pending = null;
      }
    }

    if (body.kind === 'ball' || !body.target) {
      // Coast to a stop rather than stopping dead.
      body.vel = { x: body.vel.x * (1 - 3 * dt), y: body.vel.y * (1 - 3 * dt) };
      body.at = {
        x: body.at.x + (body.vel.x / M_PER_X) * dt,
        y: body.at.y + (body.vel.y / M_PER_Y) * dt,
      };
      return;
    }

    // Everything from here is in metres and metres per second.
    const to = toMetres(body.target.x - body.at.x, body.target.y - body.at.y);
    const away = len(to);
    if (away < 0.3 && len(body.vel) < AT_REST) {
      body.vel = { x: 0, y: 0 };
      body.at = { ...body.target };
      return;
    }

    // Arrive: go as fast as he could still pull up from in the ground he has
    // left, and no faster.
    //
    // It used to run flat out until the last 2.5 metres and only then start
    // slowing. From 8 m/s, pulling up takes nearly nine metres — so he sailed
    // straight past the spot he was sent to, turned round, and came back, on
    // every run, all game. That is what reads as too much momentum: not
    // players who feel heavy, players who cannot stop where they were going.
    //
    // Working back from the braking distance instead means he is already
    // slowing when he needs to be, and settles onto the spot rather than
    // swinging around it.
    const stoppable = Math.sqrt(2 * body.brake * Math.max(0, away - 0.2));
    const wanted = Math.min(body.topSpeed, Math.max(stoppable, away * 2));
    const want = { x: (to.x / (away || 1)) * wanted, y: (to.y / (away || 1)) * wanted };

    // He cannot swap direction instantly — turn the velocity toward where he
    // wants to go at a limited rate, so he arcs round rather than pivoting.
    const speed = len(body.vel);
    if (speed > 0.4) {
      const facing = Math.atan2(body.vel.y, body.vel.x);
      const desired = Math.atan2(want.y, want.x);
      const turn = clamp(angleTo(facing, desired), -body.turn * dt, body.turn * dt);
      const now = facing + turn;
      body.vel = { x: Math.cos(now) * speed, y: Math.sin(now) * speed };
    }

    // Then change speed along it — but stopping is not accelerating backwards.
    // A footballer gets going at about 3.6 m/s² and pulls up at roughly twice
    // that, which is why he can check, turn and go again at all.
    const push = { x: want.x - body.vel.x, y: want.y - body.vel.y };
    const pushLen = len(push) || 1;
    const rate = len(want) < len(body.vel) ? body.brake : body.accel;
    const step = Math.min(rate * dt, pushLen);
    body.vel = {
      x: body.vel.x + (push.x / pushLen) * step,
      y: body.vel.y + (push.y / pushLen) * step,
    };

    const now = len(body.vel);
    if (now > body.topSpeed) {
      body.vel = {
        x: (body.vel.x / now) * body.topSpeed,
        y: (body.vel.y / now) * body.topSpeed,
      };
    }

    body.at = {
      x: body.at.x + (body.vel.x / M_PER_X) * dt,
      y: body.at.y + (body.vel.y / M_PER_Y) * dt,
    };
    if (len(body.vel) > 0.6) body.heading = Math.atan2(body.vel.y, body.vel.x);
  }

  /**
   * Two players cannot stand in the same place.
   *
   * Nothing ever stopped them. The shape is worked out per player, so two men
   * sent to nearly the same patch of grass simply overlapped — one marker
   * drawn on top of another, which reads as a player having vanished. Real
   * footballers avoid each other without thinking about it, so this is a
   * gentle shove rather than a physics collision: enough that they never
   * merge, not enough to knock anybody off the position he was sent to.
   */
  private separate(dt: number) {
    const players = [...this.bodies.values()].filter((b) => b.kind === 'player');
    for (let i = 0; i < players.length; i += 1) {
      for (let j = i + 1; j < players.length; j += 1) {
        const a = players[i];
        const b = players[j];
        const dx = (b.at.x - a.at.x) * M_PER_X;
        const dy = (b.at.y - a.at.y) * M_PER_Y;
        const apart = Math.hypot(dx, dy);
        if (apart >= SHOULDER || apart === 0) continue;
        // A rate, not a snap.
        //
        // This used to move each of them half the overlap outright, every
        // step — up to 0.7m in a sixtieth of a second, which is forty metres a
        // second of pure teleport. Their steering then pulled them straight
        // back in, and the two fought each other sixty times a second. That is
        // the bobble, and it showed up worst on a long ball wide because that
        // is when the whole side slides across and crowds together.
        //
        // Capping it as a speed means it can only ever be a shoulder-nudge,
        // and it loses cleanly to a man who genuinely wants to be somewhere.
        const push = Math.min((SHOULDER - apart) * 0.5, SEPARATE_SPEED * dt);
        const ux = (dx / apart) * push;
        const uy = (dy / apart) * push;
        a.at = { x: a.at.x - ux / M_PER_X, y: a.at.y - uy / M_PER_Y };
        b.at = { x: b.at.x + ux / M_PER_X, y: b.at.y + uy / M_PER_Y };
      }
    }
  }

  /** One fixed step. Exposed so a test can run the engine without a clock. */
  step(dt = STEP_MS / 1000) {
    for (const body of this.bodies.values()) this.stepBody(body, dt);
    this.separate(dt);
  }

  /**
   * Advance by however long the last frame took, in whole fixed steps, and
   * return the left-over fraction for the renderer to interpolate by.
   */
  advance(elapsedMs: number): number {
    this.carry += Math.min(elapsedMs, MAX_FRAME_MS);
    let steps = 0;
    while (this.carry >= STEP_MS && steps < 16) {
      this.step();
      this.carry -= STEP_MS;
      steps += 1;
    }
    return this.carry / STEP_MS;
  }

  /** Where to draw a body this frame: between its last two sim states. */
  drawAt(body: Body, alpha: number): Vec {
    return {
      x: body.was.x + (body.at.x - body.was.x) * alpha,
      y: body.was.y + (body.at.y - body.was.y) * alpha,
    };
  }
}
