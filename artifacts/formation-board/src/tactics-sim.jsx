import { useRef, useEffect, useState, useCallback } from "react";

/* ============================================================
   PITCH — all sim maths in metres, real dimensions
   ============================================================ */
const PITCH_L = 105;
const PITCH_W = 68;
const GOAL_TOP = 29.85;
const GOAL_BOT = 38.15;   // a touch wider than a real 7.32m goal
const BOX_D = 16.5;
const BOX_HALF = 20.16;
const HOME = 0;
const AWAY = 1;

const FIXED_DT = 1 / 120;
const MAX_STEPS = 8;
/* How much faster the match clock runs than real time. A ninety-minute match
   now takes nine real minutes rather than six.

   This is the single most consequential number in the file and it had been
   set for pace over quality. Every player's decision timer runs in REAL
   seconds — a touch, a look, a pass all take what they take — so compressing
   ninety minutes harder means each of those occupies more of the match. At 15
   a routine first touch was a quarter of a minute of football, sides managed
   279 passes where a real one manages 900, and the whole thing had the
   frantic quality of a game played at double speed, because it was.

   At 10 the same code produces 414 passes, 1.3 offsides and — without one
   further change — exactly 2.8 goals a match, which is the real figure. Most
   of the last several sessions spent chasing goals and goalless matches was
   really chasing this. */
const CLOCK_SCALE = 10;
const HALF_LENGTH = 45 * 60;   // clock seconds in a half
/* How long the referee will wait for a moment to blow. Ninety clock-seconds
   is a minute and a half of added time, which is about right and, more to the
   point, is short enough that a match cannot run on forever if play never
   settles. */
const ADDED_TIME_CAP = 90;
const RESTART_TIME = 2.2;      // every set piece takes this long to be taken
/* How long a keeper takes to get up, look up, and pick a pass. The laws give
   him six seconds; no situation in here needs to reach that. */
const GK_SETTLE = 1.25;
const KICK_ADVANCE = 5.0;      // seconds a patient side takes to work forward
const GRAVITY = 9.81;
const CROSSBAR = 2.72;
/* How far the net runs back behind the goal line, and how much dead ground
   is drawn beyond each end. Neither is part of play — the pitch is still
   PITCH_L long and every rule below measures from the goal line. They exist
   so the netting can be drawn at full depth and a ball crossing the line can
   be watched into it rather than vanishing at the moment it counts. */
const GOAL_DEPTH = 2.0;
const BEHIND_GOAL = 3.6;
const HEAD_HEIGHT = 2.25;      // highest a player can reach without a keeper's hands
/* Above this a ball has to be headed; below it he can get something else on
   it. It was 1.1m, which is thigh height — a ball at waist was being nodded
   when a real player takes it on his chest or brings it down with his knee.
   Chest height is about where the choice actually is. */
const CONTROL_HEIGHT = 1.35;
const CLAIM_HEIGHT = 3.05;     // hands up, he reaches above any header

/* How far a defender can stick a leg out at a ball rolling past him, and how
   often the stab comes off. Wider than the radius at which he could actually
   control it, which is the point — see updateBall.

   The odds are not optional. The reach test runs every physics step, so a
   ball crossing a band this wide is inside it for twenty consecutive ticks;
   a per-tick roll of any size is a certainty, and a bare radius with no roll
   at all took pass completion from 77% to 47% in one edit. So each defender
   gets one attempt, then a cooldown, and the attempt can miss. */
const INTERCEPT_REACH = 1.45;
const INTERCEPT_ODDS = 0.5;
const INTERCEPT_CD = 0.45;

const MAX_SPEED = 7.4;
/* Flat out. The gap over MAX_SPEED was seven per cent, which is not a sprint,
   it is a slightly brisker jog — nobody ever pulled away from anybody. */
const SPRINT_SPEED = 9.1;
const CARRY_SPEED = 6.5;
const GK_SPEED = 5.4;
/* A dive is a fall, not a sprint. At 12.5 he covered six metres inside a
   twelve-metre shot's flight — wider than the half of the goal he had to
   defend — so where he started barely mattered and a man through on goal was
   saved 82% of the time. */
const DIVE_SPEED = 8.5;        // a keeper throwing himself at it
const SHAPE_SPEED = 4.6;
const ACCEL = 13;

/* ============================================================
   TEAM INSTRUCTIONS
   ============================================================ */

/* Build up ---------------------------------------------------- */
/* `dwell` is how long a player stands on the ball before deciding what to do
   with it, and it is the main thing setting how many passes a match contains.

   The clock is a CLOCK_SCALE time-lapse: ninety minutes of scoreline inside
   six minutes of play. Every count in the match — goals, shots, corners,
   fouls — was tuned to reach a realistic ninety-minute total in that six
   minutes, so all of them happen fifteen times more often per second of play
   than they do in football. Deliberation was the one thing left at real
   speed. A man taking a real second over each pass inside a six minute match
   can only ever produce a sixth of a real match's passing, which is exactly
   where the 144 came from.

   These are the same values scaled to sit in the same time-lapse as the rest
   of the match. It cannot go the whole way — a pass still has to physically
   cross the grass, and no amount of quick thinking compresses that — so the
   ceiling here is somewhere around 400, not 900. See the harness README. */
const TEMPO = {
  1: { label: "Slow", dwell: 0.57, backward: 3, passSpeed: 0.78, urgency: 0.7, move: 0.88 },
  2: { label: "Normal", dwell: 0.30, backward: 9, passSpeed: 1.0, urgency: 1.0, move: 1.0 },
  3: { label: "Fast", dwell: 0.13, backward: 16, passSpeed: 1.28, urgency: 1.4, move: 1.1 },
};
const RANGE = {
  1: { label: "Short", max: 24, free: 15 },
  2: { label: "Mixed", max: 42, free: 26 },
  3: { label: "Direct", max: 62, free: 40 },
};
/* Whether the side surges forward the moment the game restarts, or takes
   a few seconds to work into shape first. */
const KICKOFF_STYLE = {
  patient: { label: "Patient", patient: true },
  direct: { label: "Direct", patient: false },
};

const MENTALITY = {
  defensive: { label: "Defensive", push: 0.45, risk: 0.70, join: 0.68, retain: 1.7 },
  balanced: { label: "Balanced", push: 1.0, risk: 1.0, join: 0.60, retain: 1.0 },
  attacking: { label: "Attacking", push: 1.6, risk: 1.4, join: 0.46, retain: 0.55 },
};

/* Attacking --------------------------------------------------- */
const PASS_FREQ = {
  1: { label: "Low", bias: -5 },      // keep it, run with it
  2: { label: "Normal", bias: 0 },
  3: { label: "High", bias: 6 },      // move it early
};
const CROSS_FREQ = {
  1: { label: "Low", boxBonus: 4, wideDrive: 0.55 },
  2: { label: "Normal", boxBonus: 13, wideDrive: 1.0 },
  3: { label: "High", boxBonus: 26, wideDrive: 1.5 },
};
/* `base` is tested once per decision, so it looks like it should scale with
   the dwell timer. It was tried: cutting it 45% moved the shot count by half
   a shot a match. Almost nothing here comes from `base` — the volume is the
   unconditional close-range branch in decide(), which fires whenever a man
   has a sight of goal inside fourteen metres and does not consult this table
   at all. That is issue 1, and it is not this table's fault. */
const SHOOT_FREQ = {
  1: { label: "Low", base: 0.13, range: 26 },
  2: { label: "Normal", base: 0.18, range: 30 },
  3: { label: "High", base: 0.29, range: 35 },
};
const WIDTHS = {
  narrow: { label: "Narrow", spread: 0.72 },
  balanced: { label: "Balanced", spread: 1.0 },
  wide: { label: "Wide", spread: 1.26 },
};
/* How often a player will try to beat his man with a trick, and how often
   it comes off. A failed one either loses the ball or draws a foul. */
const FLAIR = {
  1: { label: "Low", rate: 0.22, success: 0.46 },
  2: { label: "Normal", rate: 0.7, success: 0.52 },
  3: { label: "High", rate: 1.7, success: 0.58 },
};

const SHAPE = {
  organised: { label: "Organised", roam: 0 },
  free: { label: "Free", roam: 1 },
};

/* Skill moves. Which one a player pulls off is decided when the move comes
   off, and it is worked out entirely in the drawing — see skillOffset() below
   the RENDER banner. The simulation's positions are never touched by it, so a
   croqueta cannot change where anybody actually is; it changes where he is
   drawn while he does it. Durations are in real seconds, not clock seconds. */
/* Lengthened from the first pass at these. Half a second is about fifteen
   frames of a move whose whole amplitude was a metre — long enough to happen
   and far too short to read as anything. */
const SKILL_MOVES = {
  croqueta: 0.75,     // knocked from one foot to the other and away
  elastico: 0.85,     // pushed out one way, snapped back the other
  roulette: 1.05,     // full spin over the ball
  stepover: 0.9,      // body round the ball and gone
  chop: 0.6,          // cut hard across it
  dragback: 0.8,      // pulled back under the foot, then away
  nutmeg: 0.65,       // ball straight through, man round the outside
  cruyff: 0.9,        // dragged behind the standing leg and turned out
  rollover: 0.8,      // rolled across the body with the sole and back
};
const SKILL_NAMES = Object.keys(SKILL_MOVES);

/* How long the ring flourish behind a completed move stays on screen. */
const SHOWBOAT_TIME = 0.9;

/* Only offered when attacking width is Wide. Wide forwards hold the touchline,
   take their man on, and either stand a cross up or cut inside to shoot.
   Full-backs overlap outside them on an attacking mentality. */
const WING_PLAY = {
  off: { label: "Off", on: false },
  on: { label: "On", on: true },
};
const WING_FOCUS = {
  cross: { label: "Cross", cutIn: false },   // reach the byline and put it in
  cutIn: { label: "Cut in", cutIn: true },   // come inside onto the other foot
};
const OVERLAP = {
  off: { label: "Off", on: false },
  on: { label: "Overlap", on: true },
};

/* ---- Set piece instructions ---- */
const THROW_STYLE = {
  short: { label: "Short", long: false },
  long: { label: "Long", long: true },
};
const CORNER_STYLE = {
  near: { label: "Near post", short: false, near: true },
  far: { label: "Far post", short: false, near: false },
  short: { label: "Short", short: true, near: false },
};
const FREE_KICK_STYLE = {
  shoot: { label: "Shoot", mode: "shoot" },
  cross: { label: "Cross", mode: "cross" },
  short: { label: "Short", mode: "short" },
};
const GOAL_KICK_STYLE = {
  short: { label: "Play out", long: false },
  long: { label: "Go long", long: true },
};

/* Defending --------------------------------------------------- */
const BLOCKS = {
  high: { label: "High", line: 11, engage: 105 },
  mid: { label: "Mid", line: 0, engage: 62 },
  low: { label: "Low", line: -8, engage: 34 },
};
const PRESSURE = {
  1: { label: "Low", pressers: 1, reach: 0.7, compress: 0.19 },
  2: { label: "Normal", pressers: 2, reach: 1.0, compress: 0.11 },
  3: { label: "High", pressers: 3, reach: 1.4, compress: 0.05 },
};
/* commit    — challenges attempted per second while in range
   foulOnFail — share of mistimed challenges that become fouls
   A missed challenge leaves the defender beaten and the carrier goes past.

   `commit` is a rate per second of being in range, and quicker ball movement
   cut how much of a match anybody spends in range of a man on the ball. The
   rate has to come up to keep the same number of challenges — and so the same
   number of fouls — in a match that moves the ball faster. Doubled, alongside
   the shorter recovery cooldowns in contest(). Fouls are the sim's worst
   number against reality and the brief says raise them carefully, so this is
   sized to restore what the tempo change took away, not to chase the real 21. */
const AGGRESSION = {
  1: { label: "Low", commit: 4.0, foulOnFail: 0.20 },
  2: { label: "Normal", commit: 9.0, foulOnFail: 0.34 },
  3: { label: "High", commit: 16.0, foulOnFail: 0.46 },
};
const DEF_WIDTH = {
  1: { label: "Narrow", spread: 0.70 },
  2: { label: "Balanced", spread: 0.95 },
  3: { label: "Wide", spread: 1.18 },
};
const LINE = {
  trap: { label: "Offside trap", push: 4 },
  cover: { label: "Cover", push: -5 },
};

const DEFAULT_TACTICS = {
  tempo: 2, range: 2, mentality: "balanced", kickoffStyle: "patient",
  passFreq: 2, crossFreq: 2, shootFreq: 2, width: "balanced", shape: "organised", flair: 2,
  wingPlay: "off", wingFocus: "cross", overlap: "off",
  throwStyle: "short", cornerStyle: "near", freeKickStyle: "shoot", goalKickStyle: "short",
  block: "mid", pressure: 2, aggression: 2, defWidth: 2, line: "cover",
};

/* ============================================================
   FORMATIONS — d = depth from own goal (0..1), w = across (0..1)
   ============================================================ */
const FORMATIONS = {
  "4-3-3": [
    { n: 1, d: 0.035, w: 0.5, gk: true },
    { n: 2, d: 0.22, w: 0.86 }, { n: 5, d: 0.17, w: 0.63 },
    { n: 4, d: 0.17, w: 0.37 }, { n: 3, d: 0.22, w: 0.14 },
    { n: 6, d: 0.36, w: 0.5 }, { n: 8, d: 0.46, w: 0.68 }, { n: 10, d: 0.46, w: 0.32 },
    { n: 7, d: 0.62, w: 0.89 }, { n: 9, d: 0.69, w: 0.5 }, { n: 11, d: 0.62, w: 0.11 },
  ],
  "4-4-2": [
    { n: 1, d: 0.035, w: 0.5, gk: true },
    { n: 2, d: 0.22, w: 0.86 }, { n: 5, d: 0.17, w: 0.63 },
    { n: 4, d: 0.17, w: 0.37 }, { n: 3, d: 0.22, w: 0.14 },
    { n: 7, d: 0.45, w: 0.87 }, { n: 8, d: 0.40, w: 0.60 },
    { n: 6, d: 0.40, w: 0.40 }, { n: 11, d: 0.45, w: 0.13 },
    { n: 9, d: 0.69, w: 0.58 }, { n: 10, d: 0.69, w: 0.42 },
  ],
  "4-2-3-1": [
    { n: 1, d: 0.035, w: 0.5, gk: true },
    { n: 2, d: 0.22, w: 0.86 }, { n: 5, d: 0.17, w: 0.63 },
    { n: 4, d: 0.17, w: 0.37 }, { n: 3, d: 0.22, w: 0.14 },
    { n: 6, d: 0.33, w: 0.61 }, { n: 8, d: 0.33, w: 0.39 },
    { n: 7, d: 0.59, w: 0.87 }, { n: 10, d: 0.55, w: 0.5 }, { n: 11, d: 0.59, w: 0.13 },
    { n: 9, d: 0.71, w: 0.5 },
  ],
  "3-5-2": [
    { n: 1, d: 0.035, w: 0.5, gk: true },
    { n: 2, d: 0.18, w: 0.70 }, { n: 5, d: 0.15, w: 0.5 }, { n: 4, d: 0.18, w: 0.30 },
    { n: 7, d: 0.44, w: 0.93 }, { n: 8, d: 0.42, w: 0.63 }, { n: 6, d: 0.35, w: 0.5 },
    { n: 10, d: 0.47, w: 0.37 }, { n: 3, d: 0.44, w: 0.07 },
    { n: 9, d: 0.68, w: 0.58 }, { n: 11, d: 0.68, w: 0.42 },
  ],
  "5-3-2": [
    { n: 1, d: 0.035, w: 0.5, gk: true },
    { n: 2, d: 0.28, w: 0.91 }, { n: 5, d: 0.16, w: 0.69 }, { n: 4, d: 0.13, w: 0.5 },
    { n: 6, d: 0.16, w: 0.31 }, { n: 3, d: 0.28, w: 0.09 },
    { n: 8, d: 0.43, w: 0.66 }, { n: 10, d: 0.46, w: 0.5 }, { n: 7, d: 0.43, w: 0.34 },
    { n: 9, d: 0.66, w: 0.58 }, { n: 11, d: 0.66, w: 0.42 },
  ],
};

const C = {
  bg: "#0A0F12", panel: "#121A1F", line: "#22303A",
  turf: "#14322A", turfAlt: "#173829", chalk: "rgba(233,244,238,0.28)",
  runOff: "#102A22",
  home: "#FF5A3C", away: "#49A6FF", ball: "#FFFFFF",
  homeGk: "#3FBF6A", awayGk: "#F2D23C",
  text: "#E6EDF2", muted: "#7C8F9B",
};

/* ============================================================
   HELPERS
   ============================================================ */
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const attackDir = (team) => (team === HOME ? 1 : -1);
const goalXFor = (team) => (team === HOME ? PITCH_L : 0);
const ownGoalX = (team) => (team === HOME ? 0 : PITCH_L);
const other = (team) => (team === HOME ? AWAY : HOME);

/* Nearest point outside the penalty area that `team` defends. Used to clear
   the box at a goal kick, which the laws require. */
function pushOutOfBox(team, x, y) {
  const g = ownGoalX(team);
  const dir = attackDir(team);
  const outX = g + dir * (BOX_D + 1.5);
  const sideY = y > PITCH_W / 2 ? PITCH_W / 2 + BOX_HALF + 1.5 : PITCH_W / 2 - BOX_HALF - 1.5;
  return Math.abs(outX - x) <= Math.abs(sideY - y)
    ? { x: outX, y }
    : { x, y: clamp(sideY, 1.5, PITCH_W - 1.5) };
}

function inBoxOf(team, x, y) {
  // is (x,y) inside the penalty area that `team` defends?
  const g = ownGoalX(team);
  return Math.abs(x - g) < BOX_D && Math.abs(y - PITCH_W / 2) < BOX_HALF;
}

/* What a player is good at, from where he plays. A number 10 is not a
   defender and a keeper is not a finisher — the slot decides the profile. */
function attributesFor(slot) {
  const d = slot.d;
  const wide = Math.abs(slot.w - 0.5) * 2;
  if (slot.gk) {
    return { shoot: 0.35, pass: 0.80, pace: 0.80, tackle: 0.55, aerial: 1.15, keep: 1.0 };
  }
  if (d < 0.32) {                              // back line
    return {
      shoot: 0.62, pass: 0.88, pace: wide > 0.55 ? 1.06 : 0.94,
      tackle: 1.18, aerial: wide > 0.55 ? 0.98 : 1.15, keep: 0,
    };
  }
  if (d < 0.55) {                              // midfield
    return { shoot: 0.95, pass: 1.12, pace: 1.0, tackle: 1.02, aerial: 0.98, keep: 0 };
  }
  return {                                     // front line
    shoot: 1.18, pass: 0.96, pace: wide > 0.55 ? 1.10 : 1.04,
    tackle: 0.80, aerial: wide > 0.55 ? 0.92 : 1.10, keep: 0,
  };
}

function buildTeam(key, team) {
  return FORMATIONS[key].map((s, i) => {
    const bx = team === HOME ? s.d * PITCH_L : PITCH_L - s.d * PITCH_L;
    const by = team === HOME ? s.w * PITCH_W : PITCH_W - s.w * PITCH_W;
    return {
      num: s.n, team, gk: !!s.gk, depth: s.d, att: attributesFor(s),
      bx, by, x: bx, y: by, vx: 0, vy: 0,
      // Looking the way he attacks until something turns him. `face` is the
      // body — where he is running. `look` is the head, which is on the ball.
      face: team === HOME ? 0 : Math.PI,
      look: team === HOME ? 0 : Math.PI,
      sees: true,
      // Offset by side as well as by player. Sharing it meant home player i
      // and away player i drifted in lockstep for the whole match.
      phase: i * 1.37 + team * 2.09,
      lunge: 0, beaten: 0, lungeCd: 0, flairCd: 0, burst: 0, showboat: 0, dive: 0, diveErr: 0, offHold: 0, straying: 0, claim: 0,
      skill: null, skillT: 0, skillDur: 0,
      running: 0, runCd: 0, oneTwo: 0, oneTwoTo: null,
      // A keeper with it in his hands; a man off the ground; a man who has
      // decided to take his marker on; a decoy run pulling a marker away.
      holding: 0, jump: 0, taking: 0, takeCd: 0, stabCd: 0, slide: 0,
      late: 0, lateCd: 0,
      // Looking around rather than at the ball. See updateVision.
      scan: 0, scanCd: 0, scanTo: 0, scanFresh: 0,
      // Where his legs are. `stride` accumulates with distance travelled so
      // the feet alternate at walking or sprinting cadence on their own;
      // `kick` is a foot swung through the ball.
      stride: 0, kick: 0, kickFoot: 1,
      // A keeper's commitment when he rushes out — see assignTargets.
      advFor: null, advErr: 0,
      pull: 0, pullCd: 0, pullX: 0, pullY: 0,
    };
  });
}

/* ============================================================
   MATCH STATE
   ============================================================ */
function createMatch(homeKey, awayKey) {
  const m = {
    players: [...buildTeam(homeKey, HOME), ...buildTeam(awayKey, AWAY)],
    ball: { x: PITCH_L / 2, y: PITCH_W / 2, z: 0, vx: 0, vy: 0, vz: 0, spin: 0 },
    tactics: [{ ...DEFAULT_TACTICS }, { ...DEFAULT_TACTICS }],
    carrier: null,
    inFlight: false,
    passer: null,
    intendedRx: null,
    passCooldown: 0,
    offsideFlag: false,
    mustPass: false,
    mustShoot: false,
    deadBall: false,
    setPieceLoft: false,
    setPieceAim: null,
    throwGrace: 0,
    fromThrow: false,
    fromKickoff: false,
    scramble: false,
    scorers: [],
    shooter: null,
    kickAdvance: 0,
    penaltyWait: 0,
    lastTouch: HOME,
    possession: HOME,
    score: [0, 0],
    shots: [0, 0],
    onTarget: [0, 0],
    xg: [0, 0],
    xa: [0, 0],
    assistBy: null,
    shotBy: null,
    intent: null,
    fouls: [0, 0],
    offsides: [0, 0],
    corners: [0, 0],
    cornerRun: 0,
    cornerRunTeam: null,
    possTicks: [0, 0],
    clock: 0,
    half: 1,
    added: 0,
    firstKick: HOME,
    decide: 0.4,
    hold: 0,
    carryTime: 0,
    lastCarrier: null,
    carryLead: 1.25,
    passVia: 'open',
    /* How the ball was last played, and by whom. The back-pass law turns on
       exactly this: a keeper may not handle a ball deliberately KICKED to him
       by a team-mate, but may handle one headed, chested or kneed back. */
    touchKind: 'kick',
    airVia: null,
    airStat: { clear: 0, cross: 0, header: 0, shot: 0, gk: 0, ground: 0 },
    shotVia: 'open',
    // Diagnostic only — the features the last shot's xG was computed from.
    xgFeat: null,
    shotFeat: null,
    /* Every shot gets a number, and a goal records which one scored it. The
       fitter has no other way to tie the two together: a goal can arrive
       several ticks after the shot that caused it, with another shot in
       between, and crediting "the most recent shot" then credits the wrong
       one. Diagnostic only. */
    shotSeq: 0,
    goalShot: -1,
    delivery: null,
    setPiece: null,
    taker: null,
    restart: 0,
    flash: 0,
    event: "",
    eventTimer: 0,
    over: false,
    settle: 0,
    morph: 0,
    trail: [],
    /* Where the ball was going when it left play, kept purely so it can be
       drawn carrying on past the line — into the net, or wide of the post —
       instead of teleporting to the restart the instant it counts. Nothing
       reads it but the renderer. */
    ghost: null,
    ghostT: 0,
  };
  // A coin toss, not a fixture. Possession is counted in ticks, so handing the
  // home side the opening kick-off of every single match is a small standing
  // advantage rather than a neutral starting condition.
  m.firstKick = Math.random() < 0.5 ? HOME : AWAY;
  kickoff(m, m.firstKick);
  return m;
}

function announce(m, text) {
  m.event = text;
  m.eventTimer = 2.6;
}

/* Where a player legally stands for a kick-off: inside their own half,
   and only the kicking side's forwards within the centre circle. */
function kickoffSpot(p, kickingTeam) {
  const dir = attackDir(p.team);
  const mayEnterCircle = p.team === kickingTeam && p.depth > 0.55;
  const limit = PITCH_L / 2 - dir * (mayEnterCircle ? 2.0 : 10.2);
  return {
    x: p.team === HOME ? Math.min(p.bx, limit) : Math.max(p.bx, limit),
    y: p.by,
  };
}

/* Is the match waiting on a kick-off? */
function kickoffPending(m) {
  return m.restart > 0 && m.setPiece && m.setPiece.type === "kickoff";
}

/* Put everyone straight into kick-off shape. Used when a formation or an
   instruction changes before the ball is in play — the teams should already
   be lined up when the whistle goes, not jogging across the pitch. */
function snapKickoffPositions(m) {
  const team = m.setPiece ? m.setPiece.team : m.possession;
  for (const p of m.players) {
    const q = kickoffSpot(p, team);
    p.x = q.x; p.y = q.y;
    p.vx = 0; p.vy = 0;
    p.lunge = 0; p.beaten = 0; p.lungeCd = 0;
    p.face = attackDir(p.team) > 0 ? 0 : Math.PI;   // lined up facing the right way
    p.look = p.face; p.sees = true;
  }
  if (m.taker) {
    m.taker.x = PITCH_L / 2 - attackDir(m.taker.team) * 1.4;
    m.taker.y = PITCH_W / 2;
  }
}

function kickoff(m, team) {
  // Positions are set, not steered — a forward is 20m from a legal
  // kick-off position and could never walk there inside the restart.
  m.players.forEach((p) => {
    const q = kickoffSpot(p, team);
    p.x = q.x; p.y = q.y;
    p.vx = 0; p.vy = 0;
    p.lunge = 0; p.beaten = 0; p.lungeCd = 0;
    // Same reason as awardSetPiece: these timers do not run while the ball is
    // dead, so anything left set here is frozen on screen for the whole
    // restart. A goal is a restart like any other, and the scorer was still
    // mid-flourish on the halfway line.
    p.skill = null; p.skillT = 0; p.skillDur = 0;
    p.showboat = 0; p.jump = 0;
    p.taking = 0; p.pull = 0; p.late = 0; p.slide = 0;
    p.running = 0; p.runCd = 0;
    p.oneTwo = 0; p.oneTwoTo = null;
    p.dive = 0; p.claim = 0; p.holding = 0; p.stabCd = 0;
    p.face = attackDir(p.team) > 0 ? 0 : Math.PI;   // lined up facing the right way
    p.look = p.face; p.sees = true;
  });
  m.ball.x = PITCH_L / 2; m.ball.y = PITCH_W / 2;
  m.ball.vx = 0; m.ball.vy = 0; m.ball.z = 0; m.ball.vz = 0; m.ball.spin = 0;
  m.inFlight = false; m.passer = null; m.carrier = null;
  m.offsideFlag = false; m.passCooldown = 0;
  m.possession = team; m.lastTouch = team;
  m.trail.length = 0;
  m.setPiece = { type: "kickoff", team, x: PITCH_L / 2, y: PITCH_W / 2 };
  const side = m.players.filter((p) => p.team === team && !p.gk);
  side.sort((a, b) => dist(a.bx, a.by, PITCH_L / 2, PITCH_W / 2) - dist(b.bx, b.by, PITCH_L / 2, PITCH_W / 2));
  m.taker = side[0];
  m.restart = RESTART_TIME;
}

/* Slots are handed out by shirt number first, then greedily by who is
   already closest — which is what stops players crossing on the way. */
function remapTeam(m, team, key) {
  const slots = FORMATIONS[key].map((s) => ({
    num: s.n, gk: !!s.gk, depth: s.d,
    bx: team === HOME ? s.d * PITCH_L : PITCH_L - s.d * PITCH_L,
    by: team === HOME ? s.w * PITCH_W : PITCH_W - s.w * PITCH_W,
    taken: false,
  }));
  const squad = m.players.filter((p) => p.team === team);
  const assigned = new Map();

  const gkSlot = slots.find((s) => s.gk);
  const gkPlayer = squad.find((p) => p.gk);
  if (gkSlot && gkPlayer) { gkSlot.taken = true; assigned.set(gkPlayer, gkSlot); }

  for (const p of squad) {
    if (assigned.has(p)) continue;
    const s = slots.find((z) => !z.taken && !z.gk && z.num === p.num);
    if (s) { s.taken = true; assigned.set(p, s); }
  }

  const pairs = [];
  for (const p of squad) {
    if (assigned.has(p)) continue;
    for (const s of slots) {
      if (s.taken || s.gk) continue;
      pairs.push({ p, s, d: dist(p.x, p.y, s.bx, s.by) });
    }
  }
  pairs.sort((a, b) => a.d - b.d);
  for (const { p, s } of pairs) {
    if (assigned.has(p) || s.taken) continue;
    s.taken = true; assigned.set(p, s);
  }

  for (const [p, s] of assigned) {
    p.bx = s.bx; p.by = s.by; p.depth = s.depth; p.num = s.num;
    p.att = attributesFor({ d: s.depth, w: s.by / PITCH_W, gk: s.gk });
  }

  if (kickoffPending(m)) {
    snapKickoffPositions(m);        // line up, don't walk
    m.settle = 0; m.morph = 0;
  } else {
    m.settle = 3.2; m.morph = 3.2;
  }
}

/* ============================================================
   SHAPED POSITION
   Canonical slot, adjusted for that team's instructions. Nothing is
   stored — changing an instruction just moves the destination.
   ============================================================ */
/* How hard a side is chasing the game.

   Nothing in the sim knew what the scoreboard said. A team a goal down with
   two minutes left played exactly as it had in the fifth minute — same block,
   same commitment, same patience — and a team a goal up did not sit in. That
   is the single most obvious thing about the closing stages of a football
   match and it was entirely absent.

   Returns roughly -1 (protecting a lead, drop off) through 0 (nothing in it)
   to +1.5 (throwing everybody forward). It ramps with the clock and bites
   hardest in the last ten minutes of the match, less so before half time —
   nobody empties the bench on forty-four minutes. */
function urgency(m, team) {
  const diff = m.score[team] - m.score[other(team)];
  if (diff === 0) return 0;
  const mins = m.clock / 60;
  // how late it is, within the half that matters
  const late = mins > 80 ? clamp((mins - 78) / 12, 0, 1)
    : mins > 38 && mins < 45 ? clamp((mins - 38) / 7, 0, 1) * 0.45
    : clamp((mins - 60) / 25, 0, 0.5);
  if (late <= 0) return 0;
  // one goal down is a push; three down is a rout and the shape goes
  const behind = clamp(-diff, 0, 3);
  const ahead = clamp(diff, 0, 3);
  return late * (behind * 0.75 - ahead * 0.5);
}

/* The mentality a side is actually playing with, once the scoreboard and the
   clock are taken into account. The instruction is what they set out to do;
   this is what they are doing at eighty-eight minutes a goal down. */
function chasedMentality(m, team, t) {
  const base = MENTALITY[t.mentality];
  const u = urgency(m, team);
  if (u === 0) return base;
  return {
    label: base.label,
    push: clamp(base.push * (1 + u * 0.55), 0.3, 2.4),
    risk: clamp(base.risk * (1 + u * 0.45), 0.4, 2.0),
    // the threshold to join the attack falls as they chase, rises as they sit
    join: clamp(base.join - u * 0.18, 0.28, 0.85),
    // and they stop caring about keeping it
    retain: clamp(base.retain * (1 - u * 0.35), 0.3, 2.2),
  };
}

function shapedBase(p, m) {
  if (p.gk) return { x: p.bx, y: p.by };
  const t = m.tactics[p.team];
  const dir = attackDir(p.team);
  const inPoss = p.team === m.possession;

  const spread = inPoss ? WIDTHS[t.width].spread : DEF_WIDTH[t.defWidth].spread;
  const blk = BLOCKS[t.block];
  const weight = 0.9 + (1 - p.depth) * 0.4;

  // an offside trap steps the back line up; cover drops it
  const linePush = inPoss ? 0 : LINE[t.line].push * (p.depth < 0.34 ? 1 : 0.35);

  // Role transition. In possession a 4-4-2 pushes its full-backs and midfield
  // up into something like a 2-4-4; out of possession the front players drop
  // into a compact block. The shape is a phase, not a fixed picture.
  const men = MENTALITY[t.mentality];
  const wideness = Math.abs(p.by - PITCH_W / 2) / (PITCH_W / 2);
  let roleShift;
  if (inPoss) {
    const wideDefender = p.depth < 0.32 && wideness > 0.55;   // full-backs
    const band = wideDefender ? 0.26 : p.depth < 0.32 ? 0.05 : p.depth < 0.55 ? 0.17 : 0.07;
    roleShift = band * men.push;

    // straight from a kick-off a patient side works into shape rather than
    // sprinting up the pitch the instant the whistle goes
    if (m.kickAdvance > 0 && KICKOFF_STYLE[t.kickoffStyle].patient) {
      const ramp = 1 - m.kickAdvance / KICK_ADVANCE;
      roleShift *= 0.18 + 0.82 * clamp(ramp, 0, 1);
    }
  } else {
    roleShift = -(p.depth > 0.55 ? 0.17 : p.depth > 0.32 ? 0.11 : 0.02);
  }

  let x = p.bx + dir * (blk.line * weight + linePush + roleShift * PITCH_L);
  let y = PITCH_W / 2 + (p.by - PITCH_W / 2) * spread;

  // free roles drift; organised ones hold their slot
  // Even an organised side is not a diagram — players drift within their
  // slot. A free role simply drifts a great deal more.
  const drift = 0.3 + SHAPE[t.shape].roam;
  if (p.depth > 0.28) {
    // Mirrored into each side's own frame. In world coordinates a positive
    // drift carried the home side forward and the away side backwards at the
    // same instant, so the two shapes were never mirror images of each other
    // — and with both sides sharing a phase (see buildTeam) all twenty-two
    // players slid up and down the pitch together.
    y += Math.sin(m.clock * 0.09 + p.phase) * 4.4 * drift * dir;
    x += Math.cos(m.clock * 0.07 + p.phase) * 2.8 * drift * dir;
  }

  return { x: clamp(x, 4, PITCH_L - 4), y: clamp(y, 2.5, PITCH_W - 2.5) };
}

/* ============================================================
   MOVEMENT — steering with acceleration limits + arrival damping
   ============================================================ */
/* Which way a player is looking, and what it costs him to go somewhere he is
   not looking. He comes round at a limited rate, and until he has, he moves
   at a fraction of his pace — a man backpedalling is not sprinting. This is
   most of what makes a ball played in behind worth playing, and it is why
   turning to knock it back the way you came takes a moment. */
/* Turning, and what it costs.

   The penalty for going somewhere you are not facing used to be brutal: at
   0.55 a man moving the way he had come did so at barely half pace, for as
   long as it took him to come round at seven radians a second. That reads as
   players skating on rails — they could not shuffle sideways, back off, or
   adjust a step without visibly grinding to a crawl first.

   Footballers can move in any direction. They side-step, they back-pedal, they
   cross their feet and go. What they cannot do is SPRINT backwards, so the
   penalty stays — it is what makes a ball played in behind worth playing —
   but it is now a lean rather than a wall, and the turn itself is quick. */
const TURN_RATE = 11.0;        // radians per second
const BACKWARD_PACE = 0.82;    // share of top speed when going the way you came

/* The signed gap between two headings, wrapped to [-pi, pi]. */
function angleBetween(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/* Rotate `p` towards `want`, capped by the turn rate. Returns how far off he
   was before turning, which is what the speed penalty is charged on. */
function turnToward(p, want, dt) {
  let turn = want - p.face;
  while (turn > Math.PI) turn -= Math.PI * 2;
  while (turn < -Math.PI) turn += Math.PI * 2;
  p.face += clamp(turn, -TURN_RATE * dt, TURN_RATE * dt);
  if (p.face > Math.PI) p.face -= Math.PI * 2;
  else if (p.face < -Math.PI) p.face += Math.PI * 2;
  return Math.abs(turn);
}

/* Where each player is looking, which is not the same as where he is running.
   His body goes where he is going; his head is on the ball. That is the whole
   of a footballer's awareness, and the reason he cannot react to something
   happening behind him.

   The head turns faster than the body but not instantly, and it cannot come
   further round than LOOK_LIMIT from the way his body is pointed — you cannot
   watch a ball directly behind you while sprinting away from it. `sees` is
   then whether the ball is inside his eyeline, and reaction is gated on it:
   the chaser who cannot see it is slower to set off, and a man it arrives at
   blind is less likely to control it. Without this everybody tracks the ball
   perfectly through the back of their head. */
/* The head. It moves faster than the body and turns further round than the
   old limit allowed — 2.1 radians is 120 degrees, and a player looking over
   his shoulder with a twist of the torso sees a good deal more than that.
   The head was the thing meant to carry a player's awareness and it was
   pinned too tightly to his hips to do it. */
const LOOK_RATE = 13.0;        // radians per second — quicker than the body turns
const LOOK_LIMIT = 2.7;        // about 155 degrees either side of straight ahead
const SEES_CONE = 1.05;        // inside this of his eyeline, he has it in view

/* A scan: the moment a player takes his eyes off the ball to look at what is
   around him. It is the single most-coached habit in the modern game and the
   sim had nobody doing it — twenty-two heads locked on the ball for ninety
   minutes.

   It costs him: while he is looking over his shoulder he cannot see the ball,
   so `sees` goes false and everything gated on it — reacting to a loose ball,
   controlling one that arrives — gets worse for that moment. It pays him
   afterwards: a man who has just looked up knows where everyone is and plays
   quicker when it comes to him. That trade is the whole point of doing it,
   and it is why they do it when the ball is somewhere else. */
const SCAN_TIME = 0.4;

function updateVision(m, dt) {
  const b = m.ball;
  for (const p of m.players) {
    if (p.scanCd > 0) p.scanCd -= dt;
    if (p.scanFresh > 0) p.scanFresh -= dt;
    if (p.scan > 0) {
      p.scan -= dt;
      if (p.scan <= 0) p.scanFresh = 2.2;
    } else if (p.scanCd <= 0 && p !== m.carrier && m.restart <= 0 &&
               dist(p.x, p.y, b.x, b.y) > 9 && Math.random() < 0.55 * dt) {
      p.scan = SCAN_TIME;
      p.scanCd = 2.2 + Math.random() * 3.5;
      p.scanTo = (Math.random() < 0.5 ? 1 : -1) * (1.2 + Math.random() * 0.7);
    }

    const toBall = Math.atan2(b.y - p.y, b.x - p.x);

    /* The man on the ball is not looking at the ball.

       Every player's head was aimed at the ball, the carrier included — and
       the carrier's ball is a median 0.66 metres from his own boot. So the
       one player who most needs his head up spent every touch with his eyes
       on the floor, and `look` for him was the direction of a vector barely
       longer than his own foot: numerically unstable, and pointing at nothing
       worth seeing. He was then flagged as unable to SEE the ball he was
       personally in possession of, which is how a scenario turns up in which
       a man mid-scan plays a twenty-six metre pass while formally blind.

       A player in possession has the ball; he does not need to watch it. What
       he does is get his head up and look at the pitch. So his eyeline starts
       up-field and his scans sweep from there, which is what makes the
       picture he is working from a picture of anything at all.

       And he can always see the ball, by definition — it is at his feet. */
    let aimBase = toBall;
    if (p === m.carrier) {
      aimBase = Math.atan2(PITCH_W / 2 - p.y, goalXFor(p.team) - p.x);
    }
    // where he is actually looking this instant — over his shoulder if he is
    // taking a picture of what is around him
    const aim = p.scan > 0 ? aimBase + p.scanTo : aimBase;

    // as far round as his body lets him
    let off = aim - p.face;
    while (off > Math.PI) off -= Math.PI * 2;
    while (off < -Math.PI) off += Math.PI * 2;
    const want = p.face + clamp(off, -LOOK_LIMIT, LOOK_LIMIT);

    let turn = want - p.look;
    while (turn > Math.PI) turn -= Math.PI * 2;
    while (turn < -Math.PI) turn += Math.PI * 2;
    p.look += clamp(turn, -LOOK_RATE * dt, LOOK_RATE * dt);
    if (p.look > Math.PI) p.look -= Math.PI * 2;
    else if (p.look < -Math.PI) p.look += Math.PI * 2;

    /* Which way his BODY is pointed when he is not running anywhere.

       steer() only turns a player when he is moving towards a target more
       than five centimetres away, so a man standing still kept whatever
       direction he last happened to run in — often square to the play, often
       away from it. The keeper had it worst: he shuffles across his line, so
       steer() pointed his body along the shuffle and he spent the match
       side-on or facing his own net.

       A footballer standing still opens his body up to the ball. A keeper
       faces it, always, and never does anything else. */
    const pace = Math.hypot(p.vx, p.vy);
    if (p.gk) {
      turnToward(p, toBall, dt);
    } else if (p !== m.carrier && pace < 2.4) {
      turnToward(p, toBall, dt * ((2.4 - pace) / 2.4) * 0.6);
    }

    let eye = toBall - p.look;
    while (eye > Math.PI) eye -= Math.PI * 2;
    while (eye < -Math.PI) eye += Math.PI * 2;
    p.sees = p === m.carrier || Math.abs(eye) < SEES_CONE;
  }
}

function steer(p, tx, ty, dt, topSpeed) {
  const dx = tx - p.x, dy = ty - p.y;
  const d = Math.hypot(dx, dy);
  let dvx = 0, dvy = 0;
  if (d > 0.05) {
    /* The keeper's body is not turned here.

       updateVision turns him to face the ball — a keeper faces the ball and
       does nothing else — and then this turned him back along whatever line
       he was shuffling. Both are capped at TURN_RATE and both run every tick,
       so with the ball square to his movement the two cancel EXACTLY and he
       stays wherever he was. Measured, he was more than 120 degrees off a
       live ball in his own half 12.4% of the time, and 58% of that while
       standing still. It was never that nothing turned him; it was that two
       things turned him opposite ways with equal force.

       Only the keeper is exempted. The same fight exists for outfielders and
       the same fix works on them — but making a whole team keep its body open
       to the ball costs real pace, because the speed penalty below is then
       charged on body-against-travel for everybody at once. Measured at two
       strengths on two seeds it cost about a point of completion and a third
       of a goal a match, which is too much for a cosmetic gain. The keeper is
       one man, he is rarely sprinting, and he is the one the eye goes to. */
    const off = p.gk ? Math.abs(angleBetween(Math.atan2(dy, dx), p.face))
      : turnToward(p, Math.atan2(dy, dx), dt);
    const facing = 1 - (1 - BACKWARD_PACE) * Math.min(1, off / Math.PI);
    const desired = Math.min(topSpeed * facing, d * 3.0);
    dvx = (dx / d) * desired;
    dvy = (dy / d) * desired;
  }
  let ax = dvx - p.vx, ay = dvy - p.vy;
  const am = Math.hypot(ax, ay);
  const maxA = ACCEL * dt;
  if (am > maxA) { ax = (ax / am) * maxA; ay = (ay / am) * maxA; }
  p.vx += ax; p.vy += ay;
  p.x = clamp(p.x + p.vx * dt, -1, PITCH_L + 1);
  p.y = clamp(p.y + p.vy * dt, -1, PITCH_W + 1);
  // Cadence comes from ground covered, not from the clock, so a man jogging
  // and a man sprinting move their legs at the speeds they should.
  p.stride += Math.hypot(p.vx, p.vy) * dt * 2.1;
}

/* ============================================================
   BALL PREDICTION
   The ball decays as 0.86^t, so its position at time t has a closed
   form. Players aim at where it *will* be, which is what stops passes
   looking like they were played into nothing.
   ============================================================ */
const BALL_FRICTION = 0.76;
const ROLL_DRAG = 2.3;         // m/s^2 — brings a rolling ball to a stop
const BALL_K = -Math.log(BALL_FRICTION);

const AIR_K = -Math.log(0.915);

/* Where the ball will be in t seconds.

   On the grass it loses pace two ways — an exponential term and a constant
   rolling drag — and the closed form has to include both. Using the
   exponential alone predicted a slow ball rolling nearly three times as far
   as it really does, which is why chasers ran straight past it. */
function ballAt(b, t) {
  const airborne = b.z > 0.02 || b.vz > 0.02;
  const sp = Math.hypot(b.vx, b.vy);

  if (airborne) {
    const f = (1 - Math.exp(-AIR_K * t)) / AIR_K;
    return { x: b.x + b.vx * f, y: b.y + b.vy * f };
  }
  if (sp < 0.02) return { x: b.x, y: b.y };

  const c = ROLL_DRAG / BALL_K;
  const tStop = Math.log(1 + (BALL_K * sp) / ROLL_DRAG) / BALL_K;
  const tt = Math.min(t, tStop);
  const travel = (sp + c) * (1 - Math.exp(-BALL_K * tt)) / BALL_K - c * tt;
  const f = travel / sp;
  return { x: b.x + b.vx * f, y: b.y + b.vy * f };
}

/* When will an airborne ball come back to head height, and where? */
/* When will an airborne ball come back down to `atZ`, and where?

   The default is the grass, but almost nobody wants that answer. What a
   player needs to know is when it comes down to a height he can reach —
   which, now that a cross is weighted to arrive at head height rather than to
   land on the spot, is several metres earlier along the flight. Running to
   where it would eventually hit the turf takes him straight past the point
   where he could have headed it. */
const HEADABLE = 1.6;

function landingTime(b, atZ) {
  const target = atZ === undefined ? 0 : atZ;
  if (b.z <= target + 0.02 && b.vz <= 0.02) return 0;
  const disc = b.vz * b.vz + 2 * GRAVITY * Math.max(0, b.z - target);
  return (b.vz + Math.sqrt(Math.max(0, disc))) / GRAVITY;
}

/* When it can next be played by somebody standing on the ground. */
function playableTime(b) {
  return landingTime(b, b.z > HEADABLE ? HEADABLE : 0);
}

/* Where the ball can next be played — its landing spot if it is up, or a
   short lead if it is running along the floor. */
function ballTargetPoint(m) {
  const b = m.ball;
  const land = playableTime(b);
  const q = land > 0.12 ? ballAt(b, land) : ballAt(b, 0.3);
  return { x: clamp(q.x, 0, PITCH_L), y: clamp(q.y, 0, PITCH_W) };
}

/* Whenever nobody is in control — a loose ball, a misplaced pass, a pass
   that missed its man — the nearest player on each side goes and gets it.
   Shape does not keep a real player standing still while a ball is free. */
/* Who goes for a ball nobody owns.

   This returned exactly one player per side, so a loose ball in a crowded
   midfield was politely contested by two men while eighteen others held their
   shape and watched. A ball breaking loose is the one moment in football when
   shape stops mattering — everybody near it goes, and the scramble is what
   decides who has it next.

   So: an array per side. The nearest man always goes; the second and third
   go too, if they are close enough to have a say. A pass in flight is not a
   loose ball — it belongs to the man it was played to, and his side holds
   its shape. */
const SCRAMBLE_RANGE = 13;

function chaseCandidates(m) {
  const out = [[], []];
  if (m.carrier) return out;
  const q = ballTargetPoint(m);
  const ranked = [[], []];
  for (const p of m.players) {
    if (p.gk || p.beaten > 0) continue;
    if (m.passer === p && m.passCooldown > 0) continue;
    // A man who cannot see it is slower to set off after it. Counted as extra
    // ground rather than a delay, so the nearest man who can actually see the
    // ball generally goes, which is what happens.
    const d = dist(p.x, p.y, q.x, q.y) + (p.sees ? 0 : 7);
    ranked[p.team].push({ p, d });
  }
  const loose = !(m.inFlight && m.intendedRx);
  ranked[HOME].sort((a, z) => a.d - z.d);
  ranked[AWAY].sort((a, z) => a.d - z.d);

  /* Is it actually up for grabs?

     Sending three men from each side after every loose ball was wrong in the
     other direction: a clearance dropping to an unmarked centre-half is not a
     scramble, he collects it, and everybody else holds their shape. A
     scramble is the specific case where NEITHER side is confident of getting
     there first — the ball between two players who both think they can win
     it, with more arriving because nobody can be sure.

     So it turns on how close the two sides' nearest men are to each other.
     Level, and the bodies pile in; a clear favourite, and he is left to it. */
  const lead = [ranked[HOME][0], ranked[AWAY][0]];
  const evenness = (lead[HOME] && lead[AWAY])
    ? Math.abs(lead[HOME].d - lead[AWAY].d) : 99;
  const contested = loose && evenness < 4.0;
  // dead level brings a third man; merely close brings a second
  const extras = !contested ? 0 : evenness < 1.6 ? 2 : 1;

  for (const team of [HOME, AWAY]) {
    if (!ranked[team].length) continue;
    out[team].push(ranked[team][0].p);
    if (!extras) continue;
    // and only men who are genuinely in the picture, judged against the
    // leader rather than against a fixed radius
    const near = ranked[team][0].d + 6;
    for (let i = 1; i < ranked[team].length && out[team].length <= extras; i++) {
      if (ranked[team][i].d < Math.min(near, SCRAMBLE_RANGE)) out[team].push(ranked[team][i].p);
      else break;
    }
  }
  if (!loose) out[m.intendedRx.team] = [m.intendedRx];
  return out;
}

function interceptPoint(m, p, topSpeed) {
  const b = m.ball;
  // a ball in the air can only be taken where it drops — run to that spot
  const land = playableTime(b);
  if (land > 0.12) {
    const q = ballAt(b, land);
    return { x: clamp(q.x, 1, PITCH_L - 1), y: clamp(q.y, 1, PITCH_W - 1) };
  }
  for (let t = 0.08; t <= 2.0; t += 0.08) {
    const q = ballAt(b, t);
    if (q.x < -2 || q.x > PITCH_L + 2 || q.y < -2 || q.y > PITCH_W + 2) break;
    if (dist(p.x, p.y, q.x, q.y) <= topSpeed * t + 0.8) return q;
  }
  return ballAt(b, 0.25);   // can't get there — pursue instead
}

/* ============================================================
   OFFSIDE
   ============================================================ */
function offsideLine(m, attTeam) {
  const xs = m.players.filter((p) => p.team !== attTeam).map((p) => p.x);
  xs.sort((a, b) => (attTeam === HOME ? b - a : a - b));
  return xs[1];   // second-last defender
}

function isOffside(m, attTeam, x) {
  const dir = attackDir(attTeam);
  if ((x - PITCH_L / 2) * dir <= 0) return false;   // you cannot be offside in your own half
  const line = offsideLine(m, attTeam);
  return (x - line) * dir > 0.4 && (x - m.ball.x) * dir > 0.4;
}

/* ============================================================
   DECISION LAYER — a few times a second, never per frame
   ============================================================ */
/* Defenders within closing distance. Keepers are deliberately excluded:
   counting the man you are trying to beat as a reason not to shoot meant
   attackers got less likely to shoot the closer they got to goal. */
function pressureOn(m, p) {
  let n = 0;
  for (const o of m.players) {
    if (o.team === p.team || o.gk) continue;
    if (dist(o.x, o.y, p.x, p.y) < 6) n++;
  }
  return n;
}

/* How covered is a passing lane? Counts defenders who are on it now, and
   those close enough to step across and take it — the second group is why a
   forward pass carries risk even when the lane looks open at this instant. */
/* Judged at the moment the ball would arrive, not the moment it is struck.

   Three things were wrong with doing it the other way. The flight time was
   assumed from a fixed 20 m/s whatever the pass was actually weighted at.
   Opponents were frozen where they stood, so a defender already sprinting
   into the lane counted the same as one jogging out of it. And the ground he
   could cover was capped at 3.6m however long the ball was in the air, which
   badly understates a man pressing across a slow ball up the middle.

   All three flattered exactly the pass that keeps arriving at an opponent's
   feet: the slow one, through the middle, into a block that is closing. */
function laneBlocked(m, ax, ay, bx, by, team, flightTime) {
  let worst = 0;
  const len = Math.hypot(bx - ax, by - ay);
  if (len < 0.01) return 0;
  const flight = flightTime === undefined ? clamp(len / 19, 0.22, 1.8) : flightTime;
  for (const o of m.players) {
    if (o.team === team) continue;
    // where he will be when it gets there, carried on his current run
    const ox = o.x + o.vx * flight * 0.8;
    const oy = o.y + o.vy * flight * 0.8;
    const t = clamp(((ox - ax) * (bx - ax) + (oy - ay) * (by - ay)) / (len * len), 0, 1);
    const px = ax + (bx - ax) * t, py = ay + (by - ay) * t;
    const d = dist(ox, oy, px, py);
    /* Plus the ground he can still cover once he has read it.

       How long he has is the question, and it had two wrong answers before
       this one. The whole flight, which is what it used to be, lets a man
       level with the passer cover a lane a second and a half away from him —
       and since a ball played behind the last line always passes the last
       line, every such pass failed the gate. That is why the sim would not
       attempt one and why the offside law had gone silent: an attacker cannot
       be caught offside by a pass nobody will ever play.

       The time until the ball reaches HIS closest point is the other wrong
       answer, and it is wrong because a defender does not have to get to his
       own closest point — he cuts the lane further along it, which is what
       chasing a pass across is. That version made short passes nearly
       unblockable and cost five points of completion.

       So: at least as far along as the middle of the lane, and further if he
       is already past it. */
    const uEff = Math.max(t, 0.5);
    const reach = 2.0 + Math.max(0, uEff * flight - 0.22) * SPRINT_SPEED * 0.7;
    if (d < reach) worst += ((reach - d) / reach) * (0.55 + 0.45 * (1 - Math.abs(t - 0.5) * 2));
  }
  return worst;
}

/* Is somebody simply standing in the way?

   laneBlocked spreads its score over everyone near the lane and weights the
   middle of it. That is the right shape for judging risk in general and the
   wrong one for the pass the eye catches every time: the ball played straight
   at a man three metres in front of you. A defender 1.7m off the line scores
   about 0.15 there, which rounds to nothing next to a gate of 0.85 — so the
   pass gets played, and it is intercepted, and it looks stupid, because it is.

   This is a separate, blunt question with a yes or no answer. Level with
   either the passer or the receiver does not count: a man beside you is not
   in front of you, and a man beside the receiver is what `tightest` is for. */
function lanePlugged(m, ax, ay, bx, by, team, flight, room) {
  const len = Math.hypot(bx - ax, by - ay);
  if (len < 0.01) return false;
  const f = flight === undefined ? clamp(len / 19, 0.22, 1.8) : flight;
  const R = room === undefined ? 1.7 : room;
  for (const o of m.players) {
    if (o.team === team) continue;
    /* Barely projected. This is the blunt "is somebody standing in the way"
       question, and carrying a defender forward along his current run answers
       a different one — a man in the lane who happens to be jogging out of it
       was cleared, played through, and then simply turned and collected it.
       laneBlocked does the projection properly for the graded risk; this one
       should mostly ask about now. */
    const ox = o.x + o.vx * f * 0.25;
    const oy = o.y + o.vy * f * 0.25;
    const t = ((ox - ax) * (bx - ax) + (oy - ay) * (by - ay)) / (len * len);
    if (t < 0.06 || t > 0.94) continue;
    /* A man standing on the receiver is marking him, not blocking the lane —
       and decide() already refuses that pass outright on `tightest`. Counting
       him twice is what made a ball in behind impossible: the last defender
       is by definition right beside the forward you are trying to find, so
       every such lane read as plugged and the offside law went silent.

       Matched to the marking gate rather than picked freely, so the two
       tests meet exactly and nothing falls between them. An earlier attempt
       at this excluded a wide band at BOTH ends, which let a man pressing the
       passer through as well and cost four points of completion. */
    if (dist(ox, oy, bx, by) < 2.3) continue;
    const px = ax + (bx - ax) * t, py = ay + (by - ay) * t;
    if (dist(ox, oy, px, py) < R) return true;
  }
  return false;
}

/* Expected goals. A logistic on the two things that actually decide a
   chance — how much of the goal you can see, and how far away you are —
   plus how many defenders are on you and whether it's a header.

   FITTED, not guessed. The coefficients used to be written by hand from
   remembered real-world calibration points — six yards ~0.7, the penalty spot
   ~0.28 — which is a reasonable way to start and a bad way to finish, because
   what this has to predict is not real football. It is THIS sim's conversion,
   which depends on this sim's keeper, this sim's shot spread and this sim's
   defending. Measured over thirty matches the sides were scoring 1.65 goals
   per 1.0 of xG: not a finishing problem, a model wrong by two thirds.

   These come out of a logistic regression on 2,933 of the sim's own shots —
   see harness/fit-xg.mjs, which replays a hundred-odd matches, records these
   same five features and whether each went in, and fits the thing properly.
   Predicted goals matched actual to three decimal places.

   Two of the fitted numbers are worth knowing. `closing` carries a far bigger
   weight than anything guessed at, because a keeper on top of you is close to
   decisive in this sim now that his positioning is right; and a header is
   worth about a tenth of the same chance struck with a foot, not the half the
   old -0.7 implied.

   Note this function is not only a readout — decide() uses it to choose
   between shooting and squaring the ball, so refitting it changes behaviour.
   The numbers below are the second pass, after the first was fed back in. */
/* TWO models, not one. This split is the point.

   xgAt served as both the scoreboard's expected-goals figure and the
   valuation decide() used to choose between shooting and squaring, and those
   two jobs pull in opposite directions. Three separate times a coefficient
   that made the model MORE accurate made the football worse:

     - `closing` (how near the keeper is) fitted at -6.6 and stayed perfectly
       calibrated, while teaching everybody never to shoot from close range,
       which is where the goals are. Scoring fell from 2.1 a match to 1.2.
     - distance fitted POSITIVE, because it is collinear with angle. Calibrated
       to three decimal places, and it says a thirty-metre shot beats the same
       angle from twelve.
     - the pressure weight fitted at -0.167 against -0.395, which tells a man
       with two defenders on him that his shot is as good as the free man's.
       Installing it cost a quarter of a goal a match.

   Each time I kept the football and left the report wrong. That was the right
   call and the wrong fix: the answer is that a scoreboard and a judgement are
   different things and should not share a set of numbers.

   So: `xgAt` is the scoring model. It is fitted, it is refitted whenever the
   simulation moves, and nothing but the scoreboard reads it. `chanceValue` is
   what a player thinks his chance is worth, which is a different question — it
   is allowed to be pessimistic under pressure, because a footballer weighing
   a shot against a square ball is not estimating a probability, he is judging
   a situation. Neither has to answer to the other any more. */
function xgAt(m, team, x, y, press, header, stretch) {
  const gx = goalXFor(team);
  const d = dist(x, y, gx, PITCH_W / 2);
  const aT = Math.atan2(GOAL_TOP - y, gx - x);
  const aB = Math.atan2(GOAL_BOT - y, gx - x);
  let ang = Math.abs(aB - aT);
  if (ang > Math.PI) ang = Math.PI * 2 - ang;

  /* Fitted by harness/fit-xg.mjs against the simulation's own recorded shot
     features. Signs constrained — further away is never better, more
     defenders is never better, a header is never easier — because angle and
     distance are nearly the same variable and a free fit hands everything to
     angle and lets distance come out positive.

     `d` pins to the constraint, so a modest slope is restored by hand and the
     intercept lifted to match: the data cannot separate distance from angle,
     which is an absence of evidence rather than evidence of absence. */
  const z = -3.10 + 3.537 * ang - 0.027 * d - 0.174 * press
    - (header ? 3.041 : 0) - (stretch ? 2.198 : 0);
  const p = 1 / (1 + Math.exp(-z));

  /* The exact inputs, stashed for the fitter. Nothing in the simulation reads
     this. It exists because reconstructing the features from outside gets
     them slightly wrong — a probe can only look after tick() has returned, by
     which point assignTargets has moved every player, so `press` is a step
     stale and headers are guessed from the ball's height. Fitting on features
     that differ from the ones the model was given produces coefficients that
     calibrate on the probe's numbers rather than the sim's. */
  m.xgFeat = { ang, d, press, header: header ? 1 : 0, stretch: stretch ? 1 : 0, p };
  return p;
}

/* What the player thinks it is worth.

   Same shape, deliberately different weights. Pressure costs far more here
   (-0.395 against the fitted -0.167) and distance falls away harder, because
   this number is not predicting anything — it is standing in for a striker's
   judgement, and a striker with two men on him does not fancy it as much as
   the arithmetic says he should. Every one of these weights earned its place
   by producing better football when it was measured, which is the only test
   that applies to this function. */
function chanceValue(m, team, x, y, press, header) {
  const gx = goalXFor(team);
  const d = dist(x, y, gx, PITCH_W / 2);
  const aT = Math.atan2(GOAL_TOP - y, gx - x);
  const aB = Math.atan2(GOAL_BOT - y, gx - x);
  let ang = Math.abs(aB - aT);
  if (ang > Math.PI) ang = Math.PI * 2 - ang;
  const z = -3.304 + 3.406 * ang - 0.0319 * d - 0.395 * press
    - (header ? 2.332 : 0);
  return 1 / (1 + Math.exp(-z));
}

function chanceQuality(m, p) {
  return chanceValue(m, p.team, p.x, p.y, pressureOn(m, p), false);
}
/* Is there a defender actually in front of him, between him and the goal?
   Not merely somebody standing within six metres — a man behind you is not
   blocking your way forward. */
function blockedInFront(m, c) {
  const dir = attackDir(c.team);
  for (const o of m.players) {
    if (o.team === c.team || o.gk) continue;
    const ahead = (o.x - c.x) * dir;
    if (ahead > -0.5 && ahead < 5 && Math.abs(o.y - c.y) < 3.8) return true;
  }
  return false;
}

function decide(m) {
  const c = m.carrier;
  if (!c) return;
  const t = m.tactics[c.team];
  const tempo = TEMPO[t.tempo];
  const rng = RANGE[t.range];
  const men = chasedMentality(m, c.team, t);
  const pf = PASS_FREQ[t.passFreq];
  const cf = CROSS_FREQ[t.crossFreq];
  const sf = SHOOT_FREQ[t.shootFreq];

  const dir = attackDir(c.team);
  const gx = goalXFor(c.team);
  const press = pressureOn(m, c);
  const dGoal = dist(c.x, c.y, gx, PITCH_W / 2);

  // How much of the goal can he actually see from here?
  const aTop = Math.atan2(GOAL_TOP - c.y, gx - c.x);
  const aBot = Math.atan2(GOAL_BOT - c.y, gx - c.x);
  let openAngle = Math.abs(aBot - aTop);
  if (openAngle > Math.PI) openAngle = Math.PI * 2 - openAngle;

  // A penalty is struck immediately; every other restart must be passed,
  // because the taker cannot play it twice.
  if (m.mustShoot) { m.mustShoot = false; shoot(m, c, gx, 0, dGoal, 'penalty'); return; }
  const forcedPass = m.mustPass;

  // Play the ball the way it was planned before it arrived.
  const intent = m.intent;
  if (intent === "shoot" && !forcedPass && dGoal < sf.range && press < 3 && openAngle > 0.2) {
    m.intent = null;
    shoot(m, c, gx, press, dGoal, 'intent');
    return;
  }
  const quick = intent === "oneTouch";
  m.intent = null;

  /* A keeper with the ball in his hands does not play it the instant an
     option appears. He gets up, he looks up, and he lets his side get out.
     Releasing on the first tick a pass scored positive is why the keepers
     looked panicked: he would catch a cross and the ball would be gone again
     before anybody had moved out of the shape they defended it in. Measured,
     he let go of it inside half a second 88% of the time, for a mean hold of
     0.31 seconds.

     This is only about not going too EARLY. The branch further down already
     keeps him holding while nothing is on, so between them he settles for a
     beat, then looks, then waits for something worth playing. */
  if (c.gk && c.holding > 0 && !forcedPass && (c.holdT || 0) < GK_SETTLE) {
    m.decide = 0.12;
    return;
  }

  // Loose ball in and around the box — hit it, don't take stock.
  if (m.scramble) {
    m.scramble = false;
    /* Twenty-six metres was not a scramble, it was a hopeful swing: these
       came in at a mean of eighteen metres and scored two per cent, three a
       match of them. A scramble is a loose ball in and around the box and
       what you do with it is hit it; from outside that you take a touch. */
    if (!forcedPass && dGoal < 17 && openAngle > 0.24) { shoot(m, c, gx, press, dGoal, 'scramble'); return; }
  }

  // Shooting gets far more likely the closer you are. The old flat chance
  // minus a pressure penalty meant players in the six-yard box dithered
  // while defenders swarmed them.
  // Shoot or square it? Compare the expected goals of hitting it yourself
  // against the expected assist of the best ball to someone else — his xG
  // discounted by how likely the pass is to reach him. This is what stops a
  // player running at the keeper from a tight angle with a team-mate free
  // in the middle: his own xG collapses as the angle closes, the square
  // ball's doesn't.
  // what HE thinks it is worth, not what the scoreboard will record
  const myXg = chanceValue(m, c.team, c.x, c.y, press, false);
  let square = null, bestXa = 0;
  if (!forcedPass && dGoal < 26) {
    for (const mate of m.players) {
      if (mate.team !== c.team || mate === c || mate.gk) continue;
      const dm = dist(c.x, c.y, mate.x, mate.y);
      if (dm < 3 || dm > 24) continue;
      if (isOffside(m, c.team, mate.x)) continue;
      const bl = laneBlocked(m, c.x, c.y, mate.x, mate.y, c.team);
      if (bl > 1.0) continue;
      // The same blunt gate the open-play loop uses. It was missing here, and
      // three quarters of the balls this branch gave away had a defender
      // standing in the lane when it was struck — the highest rate of any
      // branch in the game, on the pass played closest to goal.
      if (lanePlugged(m, c.x, c.y, mate.x, mate.y, c.team, undefined, 1.05)) continue;
      let closest = 99;
      for (const o of m.players) {
        if (o.team === c.team || o.gk) continue;
        closest = Math.min(closest, dist(o.x, o.y, mate.x, mate.y));
      }
      if (closest < 2.2) continue;
      // chance the ball actually gets there
      const completion = clamp(1 - bl * 0.45 - Math.max(0, 4 - closest) * 0.12, 0.15, 0.95);
      const xa = chanceValue(m, c.team, mate.x, mate.y, pressureOn(m, mate), false) * completion;
      if (xa > bestXa) { bestXa = xa; square = mate; }
    }
    /* Shooting is the default in front of goal and the square ball is the
       exception, not a straight comparison of two numbers. This ran before
       the shot was even considered and squared it whenever a team-mate's
       chance was a quarter better — so a man eight yards out with a sight of
       goal passed across the box because somebody else's angle was marginally
       wider, which is the one thing a striker does not do.

       Close in he has to be a lot better placed. And even then, sometimes the
       man on the ball just hits it. */
    /* Retuned against the refitted xG. These ratios were set when the model
       ran on a different scale — it now prices a long-range effort a good
       deal higher relative to a tap-in, so the same thresholds quietly
       stopped the ball ever being squared to a better-placed man. */
    const need = dGoal < 12 ? 1.35 : 1.12;
    if (square && bestXa > myXg * need && Math.random() < 0.72) {
      m.intent = null; pass(m, c, square, null, 'square'); return;
    }
  }

  /* Close in he shoots. Full stop. Everything below weighs a shot against a
     pass and against carrying, which is the right machinery at twenty metres
     and the wrong one at eight — a player that close to goal with a sight of
     it does not weigh anything, and the deliberating was most of what looked
     wrong about the sim's decision-making in the box. */
  if (!forcedPass && dGoal < 11 && openAngle > 0.24) {
    shoot(m, c, gx, press, dGoal, 'closeIn');
    return;
  }

  if (!forcedPass && dGoal < sf.range && openAngle > 0.19) {
    const closeness = clamp((sf.range - dGoal) / sf.range, 0, 1);
    // falls away sharply with distance — real sides do not shoot from 25
    // yards nearly as often as a flat curve suggests
    // The curve starts climbing from the edge of the area rather than only
    // inside it — sides do shoot from 20 yards.
    /* Steeper than it was, and the reason is the refitted xG model.

       That model is calibrated on shots the sim actually takes, and it prices
       a twenty-five metre effort at about 0.05 — which is true, and is a good
       deal more than the old hand-written curve claimed. decide() weighs xG
       when it compares shooting with squaring, so the moment the honest
       numbers went in, players started having a go from range: shots went to
       25 a match and the share on target fell from 39% to 34%.

       How OFTEN you shoot from distance is a matter of shot selection, not of
       what the chance is worth, and this is where shot selection lives. So
       the discouragement moves here, and the xG model is left telling the
       truth. */
    /* Time and space from distance is exactly when a player has a go.

       The curve above falls away so hard with range that a man standing
       unmarked twenty-five metres out with a clear sight of goal effectively
       never shot — and that is precisely the situation a deep block invites,
       and precisely what a side does about it. It needs nobody on him and
       nobody in the way; it is the shot you take because there is nothing
       else on, not one you force. */
    const clearSight = press === 0 &&
      !lanePlugged(m, c.x, c.y, gx, PITCH_W / 2, c.team, 0.5, 1.4);
    const longRange = (clearSight && dGoal > 17 && dGoal < sf.range + 5)
      ? 0.055 * sf.base / 0.18 : 0;

    const chance = sf.base * (0.14 + Math.pow(closeness, 2.3) * 2.5)
      * clamp(openAngle / 0.45, 0.25, 1) - (dGoal > 16 ? press * 0.05 : 0)
      + longRange;
    const worthIt = !square || myXg >= bestXa * 0.70;
    if (worthIt && ((dGoal < 14 && openAngle > 0.28) || Math.random() < chance)) {
      shoot(m, c, gx, press, dGoal, 'weighed');
      return;
    }
  }

  const spaceBehind = Math.abs(goalXFor(c.team) - offsideLine(m, c.team)) > 28;

  let best = null, bestScore = -Infinity, bestAim = null;
  let bestBack = null, bestBackScore = -Infinity;

  // How many bodies are between us and the goal? A set block is the cue to
  // stop forcing it and work the ball around instead.
  let blockAhead = 0;
  for (const o of m.players) {
    if (o.team === c.team) continue;
    if ((o.x - c.x) * dir > 0 && (o.x - c.x) * dir < 28) blockAhead++;
  }
  const blockSet = blockAhead >= 5;

  /* How far the opposition has shifted to the ball's side of the pitch. 0 is
     a side spread evenly across it; 1 is everybody in one half of the width.
     This is the thing that makes a switch worth playing, and nothing in the
     sim was looking at it. */
  const ballSide = Math.sign(c.y - PITCH_W / 2) || 1;
  let onSide = 0, offSide = 0;
  for (const o of m.players) {
    if (o.team === c.team || o.gk) continue;
    if ((o.y - PITCH_W / 2) * ballSide > 0) onSide++; else offSide++;
  }
  const lopsided = clamp((onSide - offSide) / 8, 0, 1);
  for (const mate of m.players) {
    if (mate.team !== c.team || mate === c) continue;
    const d = dist(c.x, c.y, mate.x, mate.y);
    if (d > rng.max || d < 4) continue;
    /* The keeper as an outlet. He was only ever considered when the carrier
       was already under two challenges or facing a set block — an emergency
       ball, never a chosen one. A side playing out from the back uses him as
       a spare man constantly, and he is the one player nobody can tackle.
       In his own third he is an ordinary option. */
    const ownThirdBall = Math.abs(c.x - ownGoalX(c.team)) < 34;
    if (mate.gk && press < 1 && !blockSet && !ownThirdBall) continue;

    /* How long the ball would be in transit, on the same weighting pass()
       actually uses. Everything judged below — where he will have run to,
       where the defenders will be — is judged at that moment rather than at
       the moment of the strike. */
    /* Where he will be when it arrives — led exactly the way pass() leads
       him, because otherwise the lane that gets judged is not the lane the
       ball gets played down.

       This was leading him by his full velocity over the whole flight, with
       no cap, while pass() leads by half of it and clamps the result to 3.6m.
       On a 1.8s ball to a defender running at 5 m/s that is a nine metre
       lead against a three metre one: the gate cleared a corridor the ball
       was never going to travel down. It is why recycled passes gave the ball
       away at twice the rate of ordinary ones with a defender standing in the
       lane in over half of those cases — the check was real, it was just
       being run on the wrong line. */
    const flight = clamp(d / 19, 0.22, 1.8);
    let lx = mate.x + mate.vx * flight * 0.5;
    let ly = mate.y + mate.vy * flight * 0.5;
    const led = Math.hypot(lx - mate.x, ly - mate.y);
    if (led > 3.6) {
      lx = mate.x + (lx - mate.x) * 3.6 / led;
      ly = mate.y + (ly - mate.y) * 3.6 / led;
    }

    const progress = (lx - c.x) * dir;
    const blocked = laneBlocked(m, c.x, c.y, lx, ly, c.team, flight);

    /* How far he has to come round to play it. A ball behind him is a turn,
       and a turn is time he does not always have — so the option is worth
       less than the same ball in front of him, not equal to it. */
    let turnOff = Math.abs(Math.atan2(ly - c.y, lx - c.x) - c.face);
    if (turnOff > Math.PI) turnOff = Math.PI * 2 - turnOff;

    // Hard gate. A defender standing in the lane means the pass is simply
    // not on — previously it was only penalised, so it still got played
    // when nothing better existed, which is what looked forced.
    /* Rescaled with laneBlocked. Projecting defenders forward and letting
       them cover ground for the whole flight makes every lane score higher
       than it used to, so the old 0.62 was suddenly rejecting ordinary
       forward passes and the side stopped attacking — twenty shots a match
       and a lot of very safe football. The gate has to move with the scale it
       reads, or tightening the risk model just turns into refusing to play. */
    /* The gate tightens with distance.

       It used to get that for free from a bug: laneBlocked gave every
       defender the whole flight to cover the lane, so a long pass scored
       enormously and was rejected wholesale. Fixing the reach — a defender
       has only the time until the ball reaches HIS point on the lane, not the
       whole flight — removed the accidental length filter along with the bug,
       and completion fell five points.

       So the filter is stated outright instead of falling out of a mistake. A
       long ball is harder than a short one however clear the lane looks, and
       that is a fact about long balls, not about anybody standing in them. */
    const gate = 0.85 - clamp((d - 14) * 0.008, 0, 0.22);
    /* A restart in your own half is not an emergency.

       `forcedPass` loosens every gate, because a set piece has to be played
       and a corner or a free kick on the edge of the box is worth forcing.
       But it was applying to a free kick near the halfway line just as hard,
       where there is no hurry at all and eleven team-mates to choose from —
       so the taker would fire it into a crowd and hand it straight back. Away
       from goal, a restart is judged like any other pass. */
    const safeRestart = forcedPass && dGoal > 34 && !m.setPieceAim;
    if (blocked > (forcedPass && !safeRestart ? 1.2 : gate)) continue;

    /* In and around the box everything is plugged — that is what a penalty
       area is. A cut-back through two defenders is a good pass there and a
       terrible one on halfway, so the room demanded shrinks near goal
       rather than the rule being dropped. Applied flat, this gate removed a
       third of the sim's shots. */
    const nearGoal = Math.abs(lx - gx) < 24 || Math.abs(c.x - gx) < 22;
    if ((!forcedPass || safeRestart) &&
        lanePlugged(m, c.x, c.y, lx, ly, c.team, flight, nearGoal ? 1.05 : 1.7)) continue;

    const tPress = pressureOn(m, mate);

    // Sideways passes keep the ball but achieve nothing. A team should play
    // forward when it can and recycle backwards when it can't — the middle
    // option is the one worth discouraging.
    // A square ball for its own sake achieves nothing. A long switch to the
    // opposite flank is a different thing entirely — it is how you move a
    // compact block across and open the other side up.
    const lateral = Math.abs(progress) < 4.5;
    const switchPlay = lateral && d > 24 &&
      Math.sign(mate.y - PITCH_W / 2) !== Math.sign(c.y - PITCH_W / 2) &&
      Math.abs(mate.y - c.y) > 18;
    /* And the discouragement the comment above has always promised and never
       delivered. `lateral` was computed and then used for nothing except
       defining switchPlay, so a square ball to nobody in particular scored on
       the retain term alone and beat a modest forward pass roughly as often
       as it lost to one. That is the pointless sideways ball.

       Worse in your own third, where the same pass is played across your own
       goal. Judged on the lane rather than flat, so working it along the back
       four with nobody near it stays free. */
    const ownThird = Math.abs(c.x - ownGoalX(c.team)) < 34;
    // A square ball near their goal is the cut-back, which is one of the best
    // passes in football rather than one of the emptiest. The rule is about
    // the ball played sideways in midfield because nothing else was on.
    // A keeper rolling it out wide is distributing, not playing a pointless
    // square ball — the whole shape of his distribution is sideways.
    const idle = lateral && !switchPlay && !nearGoal && !c.gk;
    const idleCost = idle ? 5.0 + (ownThird ? 3.0 + blocked * 6 : 0) : 0;
    // Every pass to a free man has value in keeping the ball, not only the
    // ones that go forward. Scoring purely on progress made this side play
    // like it was 3-0 down with five minutes left, every single minute.
    let s = 5.5 * men.retain + progress * 1.05 * men.risk - blocked * 11 - tPress * 3.5
      - turnOff * 2.5
      - Math.max(0, d - rng.free) * 0.30 + pf.bias
      // He gave it to me and kept going. Return it.
      + (mate.oneTwo > 0 && mate.oneTwoTo === c ? 9 : 0)
      /* Switching the play. Worth more the more lopsided the opposition is —
         a diagonal to the far side is only a good ball when they have all
         shifted across to this one, and then it is one of the best in
         football. It was a flat three and a half points, which is under a
         tenth of what a modest forward pass scores, so it effectively never
         won. Now it is priced on how compact they have got. */
      + (switchPlay ? 4 + lopsided * 9 + (blockSet ? 4 : 0) : 0)
      + (spaceBehind && progress > 4 ? 5 : 0)
      // A keeper looks for a free full-back first. Rolling it to the man in
      // space wide of the area is the default distribution in football and
      // the sim had no notion of it — he simply scored his options like an
      // outfielder standing in his own six-yard box, which is why so much of
      // it went long.
      + (c.gk && mate.depth < 0.36 && Math.abs(mate.by - PITCH_W / 2) > 14 ? 9 : 0)
      - idleCost;

    const intoBox = Math.abs(lx - gx) < 17 && Math.abs(ly - PITCH_W / 2) < 20;
    if (intoBox) s += cf.boxBonus;

    /* A man in a wide position in the final third, with a ball on into the
       middle, is looking to cross it. That was never scored as a thing in
       itself — crossing only happened when the ordinary scoring loop happened
       to land on a target whose geometry made pass() loft it, which came to
       two open-play crosses a match. A wide player who has got to the byline
       has one obvious ball to play and should be choosing it. */
    if (Math.abs(c.y - PITCH_W / 2) > 15 && Math.abs(c.x - gx) < 32 &&
        Math.abs(lx - gx) < 20 && Math.abs(ly - PITCH_W / 2) < 16 &&
        Math.abs(ly - c.y) > 7 && d > 13) {
      s += 5 + cf.boxBonus * 0.45;
    }

    // A man with a defender on his shoulder is not an option, however open
    // the lane to him looks. This is where most of the sloppy giveaways were.
    // Judged where the defender will be when the ball lands, for the same
    // reason as the lane: a marker closing him down is not "two metres away",
    // he is on him by the time it arrives.
    let tightest = 99;
    for (const o of m.players) {
      if (o.team === c.team || o.gk) continue;
      const ox = o.x + o.vx * flight * 0.8;
      const oy = o.y + o.vy * flight * 0.8;
      const dm = Math.min(dist(ox, oy, lx, ly), dist(o.x, o.y, mate.x, mate.y));
      if (dm < tightest) tightest = dm;
    }
    /* He is not free, don't play it.

       2.3m is a defender close enough to touch him, which is a very low bar
       for "marked" — a man with somebody three metres away is marked in any
       sense that matters, and a square ball to him is the easiest interception
       in football. So the bar rises for the pass that cannot survive being
       read: sideways, going nowhere, with the receiver facing his own goal.
       A ball that breaks a line is worth playing to a man under pressure; a
       ball that achieves nothing is not. */
    const needsRoom = lateral && !switchPlay && !nearGoal ? 3.6 : 2.3;
    if (tightest < needsRoom && !forcedPass) continue;
    if (tightest < 5.0) s -= (5.0 - tightest) * 7;

    // A throw taken on the touchline must come infield. Playing it to
    // someone else hugging the same line just puts it straight back out,
    // which is how a game ends up trading throw-ins for half a minute.
    if (m.fromThrow) {
      s += (PITCH_W / 2 - Math.abs(mate.y - PITCH_W / 2)) * 0.9;
      s -= tPress * 7;                 // find a free man, don't just throw it
      s -= blocked * 10;
    }

    // players mostly stay onside — but not always, which is where
    // offsides come from
    if (isOffside(m, c.team, lx)) s -= 0.4;

    // Recycling. A backward pass is not judged on progress at all — it is
    // judged on whether it keeps the ball. Kept on its own scale so it never
    // competes with a forward option, only replaces one when none exists.
    // Working it across the back line is recycling too, not a square ball
    // for its own sake — judge it on whether it keeps the ball.
    /* A square ball to a defender counts as recycling, not as an ordinary
       option. It is tempting to narrow this so those passes compete normally
       — but they then have to clear the forward-pass gates, which reject most
       of them, and the options vanish rather than being reclassified. Tried
       it: fifty passes a match disappeared and the extra carrying looked
       worse than the problem. The fix for picking the wrong outlet belongs in
       the scoring below, not in what counts as an outlet. */
    const recycleTarget = progress < 0 || (progress < 4 && mate.depth < 0.35);
    if (recycleTarget) {
      const safety = 13 * men.retain - tPress * 5 - blocked * 10
        - turnOff * 3.0                   // a ball played back is a ball turned to
        // Distance mattered only past the comfortable range, so a twenty-five
        // metre ball back scored the same as a six metre one and the choice
        // between them came down to the noise term below. Centred on fifteen
        // metres so this reorders the outlets without lowering all of them
        // against the threshold — subtracting raw distance simply made
        // recycling rarer, which is a different change from making it better.
        - (d - 15) * 0.25
        - Math.max(0, d - rng.free) * 0.2 - tempo.backward * 0.25
        // Across the face of your own goal. Sides do work it along the back
        // four — they do not do it with somebody standing in the lane.
        - (ownThird && Math.abs(progress) < 7 ? blocked * 14 : 0)
        + (blockSet ? 5 : 0)              // nothing on — go back and rebuild
        + (mate.depth < 0.35 ? 3 : 0)     // the back line is the safe outlet
        + Math.random() * 1.2;
      if (safety > bestBackScore) { bestBackScore = safety; bestBack = mate; }
      continue;
    }
    s += Math.random() * 3.5;

    if (s > bestScore) { bestScore = s; best = mate; bestAim = null; }

    // Through ball: play it into the space ahead of a runner rather than to
    // their feet. Only worth it if the runner is onside now and the space
    // behind is actually empty.
    // Only a genuinely running forward, with real space in behind, and only
    // when the carrier has time to pick it. Scored like any other pass —
    // a flat bonus made every ball a through ball.
    // A man who has committed to a run is the cue for the ball in behind —
    // not merely one who happens to be drifting forward at the time.
    /* And he has to be genuinely going. `vx * dir > 0.9` is a walk — every
       attacker drifts forward faster than that most of the time, so this was
       treating the whole front line as permanently making a run. */
    const running = mate.running > 0 || mate.vx * dir > 2.5;
    if (running && mate.depth > 0.45 && !mate.gk && press < 3) {
      const ax = mate.x + dir * 11;
      const ay = mate.y + (PITCH_W / 2 - mate.y) * 0.18;
      if ((ax - gx) * dir < -2 && ay > 3 && ay < PITCH_W - 3) {
        const bl = laneBlocked(m, c.x, c.y, ax, ay, c.team);
        let crowd = 0;
        for (const o of m.players) {
          if (o.team === c.team) continue;
          const d2 = dist(o.x, o.y, ax, ay);
          if (d2 < 8) crowd += (8 - d2) / 8;
        }
        const run = dist(c.x, c.y, ax, ay);
        /* A through ball is still a ball down a lane, and this branch was not
           asking whether anybody was standing in it.

           Tested against the runner, not against the space he is running
           into. The whole point of the pass is that it goes past the last
           defender, and the aim point sits eleven metres beyond him — so
           testing the full line asks "is the last man in the way of a ball
           played behind the last man", to which the answer is always yes. It
           took a third of the through balls out of the game and the offside
           law with them. What matters is whether it can reach him. */
        const runFlight = clamp(run / 19, 0.22, 1.8);
        if (bl < 2.4 && crowd < 0.9 && run < rng.max + 8 &&
            !lanePlugged(m, c.x, c.y, mate.x, mate.y, c.team, runFlight)) {
          /* Scored on the same scale as every other pass.

             It was not. `distance * 1.2` with no counterweights put a ball to
             a runner twenty metres ahead on about forty points, against
             twenty-five for the best ordinary pass in the game — so the
             through ball won almost every time it was legal at all. It came
             to a third of all passes in the match and, at a 22% giveaway
             rate, over half of every ball surrendered.

             Same terms as `s` above, plus a bonus for being the pass that
             breaks a line. It should be attractive. It should not be
             unanswerable. */
          /* Scored on where the RUNNER is, not on where the ball is going.

             Crediting the aim point gave the through ball eleven free metres
             of progress over the ordinary pass to the same man — so even
             after being put on the same scale it still won by fifteen points
             every time it was legal, and stayed a third of all passes in the
             match at a 25% giveaway rate. Those eleven metres are space the
             receiver still has to run into; they are not progress that has
             happened. What is left is a modest bonus for being the ball that
             breaks a line, which is what it should be. */
          const prog2 = (mate.x - c.x) * dir;
          const s2 = 5.5 * men.retain + prog2 * 1.05 * men.risk
            - bl * 11 - crowd * 8
            - Math.max(0, run - rng.free) * 0.30
            + 6 + Math.random() * 3
            - (isOffside(m, c.team, mate.x) ? 0.5 : 0);
          if (s2 > bestScore) { bestScore = s2; best = mate; bestAim = { x: ax, y: ay }; }
        }
      }
    }
  }

  // Carrying needs a reason: either there is grass to run into, or you are
  // being closed down and have to get out. Otherwise it is aimless and the
  // ball should be moved or cleared instead.
  let ahead = 0;
  for (const o of m.players) {
    if (o.team === c.team) continue;
    if ((o.x - c.x) * dir > 0 && (o.x - c.x) * dir < 14 && Math.abs(o.y - c.y) < 7) ahead++;
  }
  const spaceToRun = ahead === 0;
  // Everyone behind him and grass in front: that is a man who should keep
  // running, not look for a pass that isn't there.
  let mateAhead = 0;
  for (const mate of m.players) {
    if (mate.team !== c.team || mate === c || mate.gk) continue;
    if ((mate.x - c.x) * dir > 2) mateAhead++;
  }
  const leadRunner = mateAhead <= 1 && spaceToRun;

  /* Taking his man on. Carrying used to be whatever was left over when no
     pass scored well enough — which is not what dribbling is. A player
     decides to beat somebody, and then he commits to it for a few seconds
     rather than re-deciding twice a second and shovelling it sideways the
     moment a team-mate happens to be free.

     Who does it is who should: a forward or a wide man, in the other half,
     with one defender in front of him and no crowd around him. */
  let marker = null, markerD = 1e9;
  for (const o of m.players) {
    if (o.team === c.team || o.gk || o.beaten > 0) continue;
    const ah = (o.x - c.x) * dir;
    if (ah < -1 || ah > 9) continue;
    const dd = dist(o.x, o.y, c.x, c.y);
    if (dd < markerD) { markerD = dd; marker = o; }
  }
  if (!c.gk && c.taking <= 0 && c.takeCd <= 0 && marker && markerD < 7 && !forcedPass &&
      press <= 2 && (c.depth > 0.5 || Math.abs(c.y - PITCH_W / 2) > 13) &&
      (c.x - PITCH_L / 2) * dir > -20 &&
      Math.random() < FLAIR[t.flair].success * 0.45) {
    c.taking = 1.5;
    c.takeCd = 6.0;
  }

  const dribbleScore = (quick ? -6 : 0) + (spaceToRun ? 6.5 : -3) + (press >= 2 ? 1.5 : 0)
    + (leadRunner ? 9 : 0) + (c.taking > 0 ? 12 : 0)
    - Math.max(0, m.carryTime - 2) * (leadRunner || c.taking > 0 ? 2.6 : 4.5)
    + Math.random() * 2.5;

  // A corner, a lofted free kick or a long throw has a planned delivery. It
  // gets delivered — it does not get recycled to a centre-back because no
  // team-mate happened to clear the open-play passing gate.
  if (forcedPass && m.setPieceAim) {
    const aim = m.setPieceAim;
    let tgt = null, bd = 1e9;
    for (const mate of m.players) {
      if (mate.team !== c.team || mate === c || mate.gk) continue;
      const d2 = dist(mate.x, mate.y, aim.x, aim.y);
      if (d2 < bd) { bd = d2; tgt = mate; }
    }
    if (tgt) {
      m.setPieceAim = null;
      m.mustPass = false;
      m.fromThrow = false;
      pass(m, c, tgt, aim, 'setPiece');
      return;
    }
  }

  // A kick-off is tapped back into midfield. Playing it forward from the
  // centre spot means playing it at a marked forward with the whole
  // opposition in front of him, which is how possession was being handed
  // straight back.
  if (m.fromKickoff) {
    m.fromKickoff = false;
    // A patient side taps it back and builds; a direct one looks forward
    // straight away. That is what the Build up instruction is for.
    const patient = KICKOFF_STYLE[t.kickoffStyle].patient;
    // Send it back a line — the deepest free man behind the ball, not just
    // the nearest one.
    let deep = null;
    if (patient) {
      for (const mate of m.players) {
        if (mate.team !== c.team || mate === c || mate.gk) continue;
        const dm = dist(c.x, c.y, mate.x, mate.y);
        if (dm < 8 || dm > 40) continue;
        if ((mate.x - c.x) * dir > -2) continue;
        if (laneBlocked(m, c.x, c.y, mate.x, mate.y, c.team) > 0.5) continue;
        if (!deep || mate.depth < deep.depth) deep = mate;
      }
    }
    const target = patient ? (deep || bestBack || best) : (best || bestBack);
    if (target) {
      m.mustPass = false;
      pass(m, c, target, null, 'kickoff');
      return;
    }
  }

  // A free kick in a dangerous area is not played back to the halfway line.
  const deepSetPiece = forcedPass && dGoal < 32;

  if (best && (forcedPass || bestScore > dribbleScore)) {
    m.mustPass = false;
    m.fromThrow = false;
    const aimAt = m.setPieceAim || bestAim;
    m.setPieceAim = null;
    pass(m, c, best, aimAt, bestAim ? 'through' : 'open');
  } else if (bestBack && bestBackScore > 0.5 && !deepSetPiece &&
             (forcedPass ||
              /* Only once going forward has stopped being an option at all.
                 The old middle clause let a man with a perfectly good forward
                 ball on turn and knock it backwards anyway, purely because
                 somebody was standing in front of him. Worse, this branch was
                 also reached whenever carrying outscored passing — so a player
                 who should have driven into space played it back instead.
                 Requiring no forward option sends that case on to the carry. */
              /* `!best` is the gate that matters — it is what stops a man
                 with a forward ball on turning and playing it backwards. The
                 rest only asks whether standing still is worse than
                 recycling. Tightening this to two markers as well sent him
                 dribbling instead of passing, which reads worse than the
                 problem it fixed. */
              /* `press >= 1` used to be in that list and was simply wrong.
                 pressureOn counts opponents in every direction within six
                 metres, so a defender *trailing* him counted as a reason to
                 turn and knock it backwards — which is the case where a
                 player is running into open grass with a man chasing and
                 suddenly plays it back to his centre-half. A man behind you
                 is a reason to go, not a reason to stop. What is left asks
                 only about what is in front of him.

                 And a man who has decided to take somebody on is not
                 overruled. This branch is reached whenever no forward pass
                 exists, whatever carrying scored, so without the guard the
                 dribble decision was thrown away the moment the pass options
                 dried up — which is exactly when you want him running. */
              (!best && c.taking <= 0 &&
               (blockedInFront(m, c) || !spaceToRun)))) {
    m.mustPass = false;
    pass(m, c, bestBack, null, 'recycle');   // cycle it and start again
  } else if (!forcedPass && !(c.gk && c.holding > 0) &&
             Math.abs(c.x - ownGoalX(c.team)) < 28 && press >= 2 && !spaceToRun) {
    clearBall(m, c);               // no football on near our own goal
  } else if (c.gk && c.holding > 0 && !forcedPass) {
    /* A keeper with the ball in his hands is under no pressure at all —
       nobody may challenge him and everybody has been backed off five metres.
       So he does not panic, and he does not hoof it because the scoring loop
       came up empty on this particular tick: he waits, and looks again.

       This branch used to fall through to the clearance above, which is why a
       keeper who had just made a save would boot it straight back to the
       opposition with four of his own defenders stood free in front of him. */
    m.decide = 0.7;
  } else if (forcedPass) {
    // nothing good on, but it still has to be played — find anyone
    let near = null, nd = 1e9;
    for (const mate of m.players) {
      if (mate.team !== c.team || mate === c) continue;
      const d = dist(c.x, c.y, mate.x, mate.y);
      if (d > 2 && d < nd) { nd = d; near = mate; }
    }
    if (near) { m.mustPass = false; m.fromThrow = false; pass(m, c, near, null, 'fallback'); }
    else { m.mustPass = false; m.fromThrow = false; m.decide = 0.2; }   // never hold it forever
  } else {
    // In the box there is no time to stand and think about it.
    const hurry = dGoal < 18 ? 0.45 : 1;
    m.decide = (0.35 + Math.random() * 0.3) * tempo.dwell * hurry;
  }
}

/* Ball speed needed to cover D in time t under the friction model.
   Solving for v0 is the whole trick: it lets a pass be *weighted* to the
   run rather than blasted at a fixed speed the receiver can never reach. */
function passVelocityFor(D, t) {
  // inverse of ballAt on the ground, so a weighted pass still arrives when
  // it is meant to now that rolling drag is part of the model
  const tt = Math.max(t, 0.05);
  const A = (1 - Math.exp(-BALL_K * tt)) / BALL_K;
  const c = ROLL_DRAG / BALL_K;
  return (D + c * (tt - A)) / A;
}

/* What is the receiver going to do with it? Worked out at the moment the
   ball is struck, from where he will be when it arrives — so he can play it
   first time instead of stopping it, looking up, and then deciding. */
function planIntent(m, receiver, atX, atY) {
  const t = m.tactics[receiver.team];
  const tempo = TEMPO[t.tempo];
  const sf = SHOOT_FREQ[t.shootFreq];
  const dir = attackDir(receiver.team);
  const gx = goalXFor(receiver.team);
  const dGoal = dist(atX, atY, gx, PITCH_W / 2);

  let press = 0, ahead = 0;
  for (const o of m.players) {
    if (o.team === receiver.team || o.gk) continue;
    if (dist(o.x, o.y, atX, atY) < 5.5) press++;
    if ((o.x - atX) * dir > 0 && (o.x - atX) * dir < 12 && Math.abs(o.y - atY) < 6) ahead++;
  }

  const aT = Math.atan2(GOAL_TOP - atY, gx - atX);
  const aB = Math.atan2(GOAL_BOT - atY, gx - atX);
  let ang = Math.abs(aB - aT);
  if (ang > Math.PI) ang = Math.PI * 2 - ang;
  if (dGoal < sf.range * 0.62 && press < 2 && ang > 0.24) return "shoot";
  if (press >= 2) return "oneTouch";                          // move it early
  if (ahead === 0) return "carry";                            // grass ahead — drive
  return Math.random() < 0.18 * tempo.urgency ? "oneTouch" : "settle";
}

/* He swings a foot through it. Purely so the drawing can show which foot
   and when — nothing in the simulation reads it. */
function strike(p, ang) {
  p.kick = 0.20;
  /* Which foot. A ball on his left goes with his left — judged against the
     way his body is pointed at the moment he strikes it, which is why this
     has to be called before pass() turns him to face the target. */
  if (ang === undefined) { p.kickFoot = Math.random() < 0.5 ? 1 : -1; return; }
  let off = ang - p.face;
  while (off > Math.PI) off -= Math.PI * 2;
  while (off < -Math.PI) off += Math.PI * 2;
  p.kickFoot = off >= 0 ? 1 : -1;
}

function pass(m, c, target, aim, via) {
  /* `via` is which branch of decide() chose this pass. Diagnostic only —
     nothing reads it inside the simulation. It exists because "passes that
     end at an opponent" is a symptom with six possible causes, and guessing
     which one is doing it is how you spend an afternoon tightening a gate
     that was never the problem. See harness/probe-passes.mjs. */
  m.passVia = via || 'open';
  m.touchKind = 'kick';
  const tempo = TEMPO[m.tactics[c.team].tempo];
  const d = dist(c.x, c.y, target.x, target.y);

  // Lead the runner, but only a little, and never by more than a few
  // metres — an over-led pass is the one that looks like it went nowhere.
  // Work out roughly how hard it will be struck first, then lead off that.
  // A flat 20 m/s assumption mistimed every pass not hit at exactly 20.
  const guess = clamp(passVelocityFor(d, clamp(d / 19, 0.22, 1.8)), 8, 24);
  const travel = d / Math.max(6, guess * 0.82);
  // Lead him, but modestly. A big lead assumes he keeps running exactly as
  // he is, and the moment he turns the ball is played into space he has
  // just left — which is what the drifting passes were.
  let lx = target.x + target.vx * travel * 0.5;
  let ly = target.y + target.vy * travel * 0.5;
  const ld = Math.hypot(lx - target.x, ly - target.y);
  if (ld > 3.6) {
    lx = target.x + (lx - target.x) * 3.6 / ld;
    ly = target.y + (ly - target.y) * 3.6 / ld;
  }
  if (aim) { lx = aim.x; ly = aim.y; }
  // never aim a pass off the pitch
  lx = clamp(lx, 1.5, PITCH_L - 1.5);
  ly = clamp(ly, 1.5, PITCH_W - 1.5);

  // He turns to play it. On a ball knocked back the way he came that is very
  // nearly a full turn, and it is what the turn penalty in decide() paid for.
  const kickAng = Math.atan2(ly - c.y, lx - c.x);
  strike(c, kickAng);
  c.face = kickAng;
  c.taking = 0;                  // he has let it go, whatever he had decided

  /* A one-two. Give it and go: a short ball played forward is the one you
     follow, and the man receiving it knows to look for you coming past your
     marker. Without this a pass ended the passer's involvement — he stood and
     admired it, which is why the sim had no combination play at all. */
  const fwd = (target.x - c.x) * attackDir(c.team);
  if (!aim && fwd > 2 && d < 24 && !c.gk) {
    c.oneTwo = 1.1;
    c.oneTwoTo = target;
  }

  // How long does the receiver need to get to where the ball is going?
  // Weight the pass to that, so it arrives as they do rather than skidding
  // past them. Firm enough to beat a defender, soft enough to be reached.
  const D = Math.hypot(lx - c.x, ly - c.y);
  const runDist = Math.max(0, dist(target.x, target.y, lx, ly) - 1.2);
  const receiverTime = runDist / (SPRINT_SPEED * 0.85) + 0.12;
  // Firm enough that a defender reading it cannot get across in time. The
  // old floor gave a 20m pass a 1.3s flight, which is a stroll.
  const flightTime = clamp(Math.max(receiverTime, D / 19), 0.22, 1.8);
  const speed = clamp(passVelocityFor(D, flightTime) * tempo.passSpeed, 8, 24);

  // A ball into the box from wide, or any set-piece delivery, is clipped
  // into the air rather than rolled along the floor.
  const gx = goalXFor(c.team);
  const cdir = attackDir(c.team);
  /* What makes a pass a cross.

     It used to be any ball over fourteen metres, from anywhere more than
     thirteen metres off the centre line, ending anywhere within nineteen
     metres of goal. The penalty area is forty metres wide — so a man standing
     INSIDE it counted as "wide", and a fifteen-metre pass between two players
     in the box got chipped into the air. That is where the balls floating
     about for no reason came from.

     A cross is a specific thing: a wide player, in the final third, hitting it
     ACROSS the face of goal to somebody in the middle. All four have to hold,
     and "across" is the one that was missing entirely — a ball played straight
     up the touchline is not a cross however wide the man is. */
  const wide = Math.abs(c.y - PITCH_W / 2) > 15;
  const finalThird = Math.abs(c.x - gx) < 32;
  const intoMiddle = Math.abs(lx - gx) < 20 && Math.abs(ly - PITCH_W / 2) < 16;
  const goesAcross = Math.abs(ly - c.y) > 7;
  const cross = m.setPieceLoft ||
    (wide && finalThird && intoMiddle && goesAcross && D > 13);

  if (cross) {
    // Pull the delivery back into the six-to-sixteen metre band. Aimed at
    // the runner's lead point it was landing on the byline and running
    // straight through for a goal kick.
    /* Where it goes.

       A planned set-piece delivery keeps the spot it was planned for — a
       near-post corner is aimed at the near post on purpose, and dragging it
       to the middle would throw the instruction away.

       An open-play cross is different: it is hit to a place, not to a pair of
       feet. Aimed at the intended man's lead point it was dropping on the
       byline or out by the touchline, because that is where wingers are. It
       now hangs up around the penalty spot and the men in the middle attack
       it, which is what a cross is for. */
    const planned = m.setPieceLoft;
    // A whipped near-post delivery: driven, not hung.
    const flat = !!(aim && aim.flat);
    // An open-play cross is its own kind of pass, and worth being able to
    // count separately from the branch that chose it.
    if (!planned) m.passVia = 'cross';
    const depth = clamp(Math.abs(gx - lx), planned ? 6.5 : 8, planned ? 15 : 14);
    lx = gx - cdir * depth;
    ly = planned
      ? clamp(ly, 9, PITCH_W - 9)
      : clamp(PITCH_W / 2 + (ly - PITCH_W / 2) * 0.30,
        PITCH_W / 2 - 10, PITCH_W / 2 + 10);
    const D2 = Math.hypot(lx - c.x, ly - c.y) || 1;
    // A cross hangs. Driven flat it is a pass that happens to be off the
    // floor, and nobody has time to attack it.
    /* Whipped, not fired. At D2/22 the near-post ball was crossing the box at
       thirty metres a second and a third of all corners ran straight through
       everybody and out for a goal kick. It has to be quick enough to beat
       the keeper to the near post and slow enough for somebody to get a head
       on it. */
    const T = flat
      ? clamp(D2 / 17, 0.9, 1.5)                      // whipped in
      : clamp(D2 / (planned ? 17 : 14.5), planned ? 0.9 : 1.15, 1.9);
    const side = c.y > PITCH_W / 2 ? -1 : 1;          // swing it toward goal
    // Weighted to arrive at heading height, not to land on the spot. A driven
    // near-post ball comes in lower and harder than a hanging one.
    loft(m, c, lx, ly, T, side * (flat ? 3.5 + Math.random() * 2.5 : 2.4 + Math.random() * 2.4),
      flat ? 1.25 + Math.random() * 0.4 : 1.55 + Math.random() * 0.35);
    m.ball.vx *= 0.94; m.ball.vy *= 0.94;   // let it drop rather than run on
    m.setPieceLoft = false;

    /* Everybody attacks it, not just the man it is credited to.

       Once the ball is struck the set piece is over — m.setPiece is null and
       assignTargets takes back over — so the box that spent two seconds
       filling up emptied again the instant the corner was taken, and one
       attacker chased the ball while eight jogged back to their open-play
       slots. This is what keeps them in there: while a delivery is in the
       air, the men near it attack it, staggered around the landing spot
       rather than all converging on the same square metre, and the defenders
       go with them. */
    m.airVia = 'cross'; m.airStat.cross++;
    m.delivery = { x: lx, y: ly, team: c.team };

    /* The delivery is aimed at a spot in the danger area, not at the feet of
       whoever the scoring loop picked — the two lines above move it into the
       six-to-fifteen metre band whatever he was standing. So the man it is
       credited to has to be whoever can actually get on the end of it, or the
       cross is played to somebody twenty metres away, nobody is sent to
       attack it, and it lands on nobody. */
    let bestRx = null, bestGap = Infinity;
    for (const mate of m.players) {
      if (mate.team !== c.team || mate === c || mate.gk) continue;
      const gap = dist(mate.x, mate.y, lx, ly) - SPRINT_SPEED * T;
      if (gap < bestGap) { bestGap = gap; bestRx = mate; }
    }
    if (bestRx) target = bestRx;

    m.inFlight = true;
    m.passer = c;
    m.lastTouch = c.team;
    m.intendedRx = target;
    m.offsideFlag = isOffside(m, c.team, target.x);
    m.passCooldown = 0.3;
    m.carrier = null;
    m.decide = 0.3 * tempo.dwell;
    return;
  }

  m.airVia = 'ground'; m.airStat.ground++;
  const a = Math.atan2(ly - c.y, lx - c.x) + (Math.random() - 0.5) * 0.05 / c.att.pass;
  m.ball.x = clamp(c.x, 0.5, PITCH_L - 0.5);
  m.ball.y = clamp(c.y, 0.5, PITCH_W - 0.5);
  m.ball.z = 0; m.ball.vz = 0; m.ball.spin = 0;
  m.ball.vx = Math.cos(a) * speed;
  m.ball.vy = Math.sin(a) * speed;
  m.inFlight = true;
  m.passer = c;
  m.lastTouch = c.team;
  m.intendedRx = target;
  m.intent = planIntent(m, target, lx, ly);
  m.deadBall = false;          // only the strike itself gets set-piece accuracy
  m.offsideFlag = isOffside(m, c.team, target.x);
  m.passCooldown = 0.3;
  m.carrier = null;
  m.decide = 0.62 * tempo.dwell;
}

/* A ball struck hard into a player comes off them. Reflected about the
   contact normal, with pace lost and a bit of randomness — this is what
   wins corners, and occasionally puts one in off a defender. */
function deflect(m, p) {
  const b = m.ball;
  const pace = Math.hypot(b.vx, b.vy);
  let nx = b.x - p.x, ny = b.y - p.y;
  const nl = Math.hypot(nx, ny) || 1;
  nx /= nl; ny /= nl;
  const dot = b.vx * nx + b.vy * ny;
  const rx = b.vx - 2 * dot * nx;
  const ry = b.vy - 2 * dot * ny;
  // blend the reflection with the ball's original line — a block deflects,
  // it doesn't bounce straight back
  const ia = Math.atan2(b.vy, b.vx);
  const ra = Math.atan2(ry, rx);
  const blend = 0.42;
  let a = ia + (((ra - ia + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * blend
    + (Math.random() - 0.5) * 0.7;
  // blocked close to his own line — it usually deflects behind, not back out
  const towardOwn = b.vx * attackDir(other(p.team));
  if (Math.abs(b.x - ownGoalX(p.team)) < 16 && towardOwn > 6 && m.cornerRun < 2
      && Math.random() < 0.5) {
    a = Math.atan2((Math.random() - 0.5) * 26, attackDir(other(p.team)) * 12);
  }
  // a ball off a body loses most of its pace — it doesn't ricochet away
  // faster than it arrived
  const out = pace * (0.26 + Math.random() * 0.26);
  b.vx = Math.cos(a) * out;
  b.vy = Math.sin(a) * out;
  b.vz = Math.max(0, b.vz * 0.4) + Math.random() * 2.2;
  b.spin = 0;
  m.shotBy = null;               // blocked shots are not on target
  m.passer = p;
  m.lastTouch = p.team;
  m.passCooldown = 0.32;
  m.intendedRx = null;
  m.offsideFlag = false;
  m.carrier = null;
  m.inFlight = true;
}

/* Put the ball in the air toward a point, arriving in T seconds. */
/* Put the ball in the air toward a point, arriving in T seconds — and at
   `zEnd` metres off the floor when it gets there.

   That last part was missing and it is most of why corners looked wrong. The
   old flight was symmetric: it left the boot at 0.35m and was weighted to
   come back to 0.35m at the target, so a corner arrived at the near post at
   ankle height. It passed through heading height about a third of a second
   earlier — some six metres short of where the delivery was aimed and where
   the attackers had been sent — so the header, if there was one, happened in
   the wrong place, and what landed on the target was a ball rolling along the
   deck into a crowd. A cross is meant to arrive at a head. */
function loft(m, c, tx, ty, T, spin, zEnd) {
  const dx = tx - c.x, dy = ty - c.y;
  const D = Math.hypot(dx, dy) || 1;
  const horiz = D / T;
  const z0 = 0.35;
  const end = zEnd === undefined ? z0 : zEnd;
  m.ball.x = clamp(c.x, 0.5, PITCH_L - 0.5);
  m.ball.y = clamp(c.y, 0.5, PITCH_W - 0.5);
  m.ball.z = z0;
  m.ball.vx = (dx / D) * horiz;
  m.ball.vy = (dy / D) * horiz;
  m.ball.vz = (end - z0 + 0.5 * GRAVITY * T * T) / T;
  m.ball.spin = spin;
}

/* A ball above waist height is headed: on goal in the box, cleared away
   from your own goal otherwise. */
function header(m, p) {
  const b = m.ball;
  const gx = goalXFor(p.team);
  const dir = attackDir(p.team);
  const attacking = Math.abs(b.x - gx) < 18 && Math.abs(b.y - PITCH_W / 2) < 18;

  /* Whether he is getting a clean jump at it. A free header and one under a
     challenge were the same header before this, which is why defending a
     cross by putting a body on the attacker achieved nothing at all. */
  let challenge = 0;
  let rival = null, rivalD = 99;
  for (const o of m.players) {
    if (o.team === p.team || o.gk) continue;
    const dch = dist(o.x, o.y, p.x, p.y);
    if (dch < 2.2) challenge = Math.max(challenge, (2.2 - dch) / 2.2);
    if (dch < rivalD) { rivalD = dch; rival = o; }
  }
  const clean = clamp(1 - challenge * 0.7, 0.25, 1) * clamp(p.att.aerial, 0.7, 1.25);

  /* And the referee has never once seen a duel in the air.

     There is no route from header() to foul() anywhere in the file, so every
     foul in the match comes from a mistimed tackle on a man on the floor.
     Measured, the sim plays 53.7 aerial duels a match and 26.8 of them have
     an opponent inside a metre and a bit — two players off the ground, in
     contact, going for the same ball — and not one of them has ever been
     given. That is most of the gap between 8.3 fouls a match and a real 21,
     and it is why a defending side can put a body on a man at a corner with
     no risk whatever.

     What is being modelled is the man who does not get there first going
     through the back of the man who does: an arm across, a knee in, a climb.
     He is the offender because he is the one arriving late — the winner of
     the duel is by definition the one who got to the ball.

     Inside his own area it is barely given, the same way contest() barely
     gives one there. Referees do not award a penalty for every shirt at a
     corner and a sim that does would produce four spot kicks a match. */
  if (rival && rivalD < 1.25 && m.restart <= 0) {
    const shy = inBoxOf(rival.team, rival.x, rival.y) ? 0.11 : 1;
    if (Math.random() < 0.30 * shy) { foul(m, rival, p); return; }
  }
  p.jump = 0.35;

  /* How hard he can actually head it.

     A head is not a boot. You cannot generate pace with it — you redirect
     what arrives, and you add a little. Every header in here used to be
     struck at a flat 13-22 m/s with up to 8 m/s of lift whatever the ball was
     doing, so a gently dropping cross was nodded forty metres and thirty feet
     in the air, which is not a thing that happens.

     So the power comes mostly from the pace of the ball he is heading, and
     the height he can put on it is capped. A firm ball is headed firmly; a
     dropping one is nodded. */
  m.airVia = 'header'; m.airStat.header++;
  const incoming = Math.hypot(b.vx, b.vy);
  const nod = (base, share) =>
    (base + incoming * share) * (0.62 + clean * 0.45);

  m.passer = p;
  m.lastTouch = p.team;
  m.touchKind = 'head';
  m.passCooldown = 0.3;
  m.intendedRx = null;
  m.offsideFlag = false;
  m.carrier = null;
  m.inFlight = true;

  if (attacking) {
    const hT = Math.atan2(GOAL_TOP - p.y, gx - p.x);
    const hB = Math.atan2(GOAL_BOT - p.y, gx - p.x);
    let hAng = Math.abs(hB - hT);
    if (hAng > Math.PI) hAng = Math.PI * 2 - hAng;

    const dH = dist(p.x, p.y, gx, PITCH_W / 2);
    /* Is this an attempt on goal at all?

       The gate used to be "any angle wider than half a radian", which is
       everything inside about fourteen metres straight on — so heading at
       goal was the DEFAULT for anyone in the air near the box. It showed up
       in the count: 8.8 headed shots a match, twenty-seven per cent of every
       shot in the game, worth 0.023 apiece and scoring four per cent. A real
       match records about three. The rest of what happens in there is nods
       down, flicks on, and men simply getting a head to it — none of which is
       an attempt on goal and none of which is logged as a shot.

       So he needs a real sight of goal, and the worse his jump the more of it
       he needs: a man climbing under a challenge does not pick his corner, he
       makes contact. Past about eleven metres it is a flick whatever the
       angle, because heading a ball that far with direction on it is not a
       thing that happens.

       Note this changes what is COUNTED as well as what is done — the header
       still happens either way. That is the point: the surplus was never
       extra football, it was extra bookkeeping. */
    const atGoal = dH < 11.5 && hAng > 0.5 + (1 - clean) * 0.75;

    if (!atGoal) {
      // Not an attempt: a nod back across the six-yard box, a knock-down, or
      // a flick on. None of the three is a shot and none is counted as one.
      // From deeper it carries further forward — that is a flick into the
      // danger area rather than a header square across the face of it.
      const across = Math.sign(PITCH_W / 2 - p.y) || 1;
      const nodPace = nod(1.5, 0.30);
      const fwd = clamp((dH - 6) / 8, 0.35, 1.1);
      b.vx = dir * nodPace * fwd;
      b.vy = across * nodPace * clamp(1.2 - fwd, 0.35, 1);
      b.vz = 0.9 + Math.random() * 1.3;
      b.spin = 0;
      m.possession = p.team;
    } else {
      m.shots[p.team]++;
      m.shotBy = p.team;
      m.shooter = p;
      m.shotVia = 'header';
      const headXg = xgAt(m, p.team, p.x, p.y, pressureOn(m, p), true);
      m.xg[p.team] += headXg;
      m.shotSeq++;
      m.shotFeat = { ...m.xgFeat, seq: m.shotSeq };
      if (m.assistBy && m.assistBy.team === p.team && m.assistBy !== p) m.xa[p.team] += headXg;
      m.assistBy = null;
      const aimY = PITCH_W / 2 + (Math.random() - 0.5) * 5.0;
      // Under a challenge he cannot pick his spot and cannot get over it.
      const a = Math.atan2(aimY - p.y, gx - p.x)
        + (Math.random() - 0.5) * (0.14 + (1 - clean) * 0.6);
      // Redirected pace, plus a little of his own — not a shot.
      const power = clamp(nod(3.5, 0.55), 6, 19);
      b.vx = Math.cos(a) * power;
      b.vy = Math.sin(a) * power;
      // A header at goal is flat or downward. It does not loop.
      b.vz = (0.5 + Math.random() * 1.4) * (1.4 - clean * 0.5);
      b.spin = 0;
      m.possession = p.team;
    }
  } else {
    // Where the ball came from decides what he can do with it. A ball
    // arriving hard at his own goal cannot be turned back up the pitch —
    // it goes behind, over, or off for a throw. A ball he can get across
    // gets hammered away.
    const ownG = ownGoalX(p.team);
    const behind = attackDir(other(p.team));
    const distGoal = Math.abs(b.x - ownG);
    const towardGoal = b.vx * behind;               // >0: heading at my goal
    const side = Math.sign(p.y - PITCH_W / 2) || 1;
    // Only genuinely pinned — the ball arriving hard and low at his own goal
    // with him on the line. A corner dropping in from the side is not that:
    // he heads it away, which is what stops a corner producing a corner
    // producing a corner.
    const pinned = distGoal < 10 && towardGoal > 8;
    const streaking = m.cornerRun >= 2;

    /* A flick-on. A long ball into a target man is not a clearance — he gets
       his head to it and helps it on into the space behind him for somebody
       running. The sim had no such thing: every header outside the box was a
       hoof in the general direction of the other end, which is why a long
       ball could never be a plan.

       It has to have come from behind him, or it is a header back the way it
       came, and there has to be somebody making the run. */
    const fromBehind = b.vx * dir > 4;
    let runner = null, rd = 1e9;
    for (const o of m.players) {
      if (o.team !== p.team || o === p || o.gk) continue;
      if ((o.x - p.x) * dir < 2) continue;
      const d2 = dist(o.x, o.y, p.x, p.y);
      if (d2 < 26 && d2 < rd) { rd = d2; runner = o; }
    }
    if (fromBehind && runner && !pinned && !streaking && Math.random() < 0.55 * clean) {
      const fx = runner.x + dir * 4, fy = runner.y;
      const a2 = Math.atan2(fy - p.y, fx - p.x) + (Math.random() - 0.5) * (0.3 / clean);
      const pw = clamp(nod(2.0, 0.5), 5, 14);
      b.vx = Math.cos(a2) * pw;
      b.vy = Math.sin(a2) * pw;
      b.vz = 1.2 + Math.random() * 1.1;
      b.spin = 0;
      m.possession = p.team;
      m.intendedRx = runner;                       // it is aimed at somebody
      m.offsideFlag = isOffside(m, p.team, runner.x);
      return;
    }

    if (!streaking && pinned && Math.random() < 0.7) {
      const overTheBar = Math.random() < 0.4;
      const pinPace = clamp(nod(3, 0.5), 5, 15);
      b.vx = behind * pinPace * 0.7;
      b.vy = side * pinPace * 0.6;
      b.vz = overTheBar ? 5.2 + Math.random() * 1.8 : 1.8 + Math.random() * 1.8;
      b.spin = 0;
    } else if (distGoal < 30 && Math.random() < 0.32) {
      // out for a throw rather than back across his own box
      const outPace = clamp(nod(3, 0.55), 6, 16);
      b.vx = dir * outPace * 0.3;
      b.vy = side * outPace;
      b.vz = 2.4 + Math.random() * 1.8;
      b.spin = 0;
    } else {
      const a = Math.atan2((Math.random() - 0.5) * 40, dir * 30);
      // A defensive header travels — it does not travel like a goal kick.
      const power = clamp(nod(4, 0.6), 7, 18);
      b.vx = Math.cos(a) * power;
      b.vy = Math.sin(a) * power;
      b.vz = 3.0 + Math.random() * 2.0;
      b.spin = 0;
    }
    m.possession = p.team;
  }
}

/* Get rid of it. Used when the ball is near your own goal and there is no
   sensible football to play — high, long, and wide of the middle. */
function clearBall(m, c) {
  m.airVia = 'clear'; m.airStat.clear++;
  m.touchKind = 'kick';
  const dir = attackDir(c.team);
  const ax = clamp(c.x + dir * (34 + Math.random() * 22), 5, PITCH_L - 5);

  /* Away from the goal, not across it.

     Seven clearances in ten were aimed at the middle of the pitch, plus or
     minus seventeen metres. From your own six-yard box that is the one place
     the ball must never go: it is the corridor the other side is attacking
     down, and a header that lands there is a second chance handed straight
     back. The first thing a defender is taught is width — put it towards the
     touchline, where the worst case is a throw-in to them in a corner of the
     pitch rather than a shot.

     So the nearer touchline is the default, hard, when he is clearing from
     inside his own box, and the bias relaxes as he gets further from goal
     where a ball into the middle is just a long pass.

     It stays IN PLAY unless he is genuinely under it — putting it out is
     giving up possession on purpose, which is a thing you do when a man is on
     you and not otherwise. */
  const panic = inBoxOf(c.team, c.x, c.y);
  const side = c.y < PITCH_W / 2 ? -1 : 1;      // his nearer touchline
  let squeeze = 0;
  for (const o of m.players) {
    if (o.team === c.team || o.gk) continue;
    if (dist(o.x, o.y, c.x, c.y) < 4.5) squeeze++;
  }
  const wideBias = panic ? 0.88 : 0.45;
  const wide = Math.random() < wideBias;
  // out of play only when he is truly under it
  const putOut = wide && panic && squeeze > 0 && Math.random() < 0.25;
  const ay = wide
    ? (putOut
      ? clamp(c.y + side * (16 + Math.random() * 16), -2, PITCH_W + 2)
      : clamp(c.y + side * (11 + Math.random() * 15), 2.5, PITCH_W - 2.5))
    : clamp(PITCH_W / 2 + side * (4 + Math.random() * 16), 6, PITCH_W - 6);
  strike(c, Math.atan2(ay - c.y, ax - c.x));
  loft(m, c, ax, ay, 1.5 + Math.random() * 0.45, 0);
  m.inFlight = true;
  m.passer = c;
  m.lastTouch = c.team;
  m.intendedRx = null;
  m.offsideFlag = false;
  m.carrier = null;
  m.passCooldown = 0.3;
  m.mustPass = false;
  m.decide = 0.3;
}

/* What kind of strike it is. Every shot used to leave the boot at exactly
   30 m/s with a two-in-five chance of swerve, which is why they all looked
   the same. A man in space outside the box leans back and hits it; one inside
   with the keeper coming has no use for power and tries to pass it into the
   corner; a tight angle, or a body in the way, gets bent round the outside.
   Power buys pace at the cost of placement and placement the other way, and a
   curled ball gives up some of both for swerve. */
/* Pulled further apart. The four kinds existed but you could not tell them
   apart on screen: a curl bent by three and a half units of spin, which over
   a fifteen-metre flight is a couple of feet, and power was six metres a
   second quicker than regular. If the difference is not visible there is no
   variety, only a variable. */
/* `rise` is how high the ball is as it reaches the goal line, in metres —
   see shoot(), which solves the flight backwards from it. The crossbar is at
   2.72, so a power shot at 1.5 has real spread either side of the frame and
   a placed one at 0.35 is rolling into the corner. */
const SHOT_KINDS = {
  power: { pace: 37, spread: 2.2, rise: 1.5, spin: 0 },
  placed: { pace: 21, spread: 0.45, rise: 0.35, spin: 0.5 },
  /* Spin had to come down hard once the flight was fixed. At 7.0 it was
     tuned against a ball that hit the grass in a fifth of a second and had
     its spin zeroed there — give the same number a full flight and it turns
     the shot twelve degrees, which from eighteen metres is nearly four metres
     of bend and puts most curled efforts wide of the frame entirely. */
  curl: { pace: 25, spread: 0.8, rise: 0.95, spin: 2.6 },
  regular: { pace: 29, spread: 1.0, rise: 0.7, spin: 0 },
};

function shoot(m, c, gx, press, dGoal, via) {
  m.shotVia = via || 'open';
  m.touchKind = 'kick';
  m.airVia = 'shot'; m.airStat.shot++;
  m.shots[c.team]++;
  const chanceXg = xgAt(m, c.team, c.x, c.y, press, false);
  m.xg[c.team] += chanceXg;
  m.shotSeq++;
  m.shotFeat = { ...m.xgFeat, seq: m.shotSeq };
  if (m.assistBy && m.assistBy.team === c.team && m.assistBy !== c) {
    m.xa[c.team] += chanceXg;      // the pass that created it
  }
  m.assistBy = null;
  // Aim inside the posts, and keep the error small. The old model scattered
  // shots by up to +-23 degrees, which is why almost nothing hit the target.
  const dead = m.deadBall;
  m.deadBall = false;

  // How much of the goal he can see from where he is standing.
  const sT = Math.atan2(GOAL_TOP - c.y, gx - c.x);
  const sB = Math.atan2(GOAL_BOT - c.y, gx - c.x);
  let open = Math.abs(sB - sT);
  if (open > Math.PI) open = Math.PI * 2 - open;

  /* Which one. The `press < 2` conditions almost never held — a man shooting
     has somebody near him by definition — so placed and power were together
     twelve per cent of shots and what you actually saw was curl or regular,
     every time. Loosened to press < 3, which is still "not swarmed". */
  /* One-on-one with the keeper. Nobody near him, close to goal, and the only
     thing left to beat is the man in gloves — which in this sim had become a
     losing proposition, because his positioning was fixed and nothing about
     the shooter's situation changed. A player through on goal picks his spot:
     he sees the whole picture, has time to look up, and slots it. */
  let clear = 99;
  for (const o of m.players) {
    if (o.team === c.team || o.gk) continue;
    clear = Math.min(clear, dist(o.x, o.y, c.x, c.y));
  }
  const oneOnOne = !dead && clear > 5.5 && dGoal < 20 && press === 0;

  let kind;
  if (oneOnOne) kind = 'placed';
  else if (dead) kind = (open < 0.24 || dGoal > 22) ? 'curl' : 'placed';
  else if (dGoal < 14 && press < 3) kind = 'placed';       // no need to burst it
  else if (dGoal > 18 && press < 3) kind = 'power';        // time and space to hit it
  else if (open < 0.22) kind = 'curl';                     // genuinely tight angle
  else if (press >= 2) kind = Math.random() < 0.5 ? 'curl' : 'regular';
  else kind = Math.random() < 0.3 ? 'curl' : 'regular';    // most shots are just struck
  const K = SHOT_KINDS[kind];

  /* Where he aims — and this is the half of shooting the sim never had.

     It scattered every shot around the CENTRE of the goal, plus or minus
     three metres. That is fine against a keeper who is out of position, which
     is what the old positioning gave you, and it is hopeless against one who
     is not: fixing his angle-play took conversion from eleven per cent to
     four, because every shot was being fired at the man.

     A player shoots for a corner, and the corner he picks is the one the
     keeper has left. How well he picks it is what separates a placed finish
     from a hit-and-hope. */
  let gkY = PITCH_W / 2;
  for (const o of m.players) if (o.gk && o.team !== c.team) gkY = o.y;
  const openSide = gkY > PITCH_W / 2 ? -1 : 1;
  const corner = (GOAL_BOT - GOAL_TOP) / 2 - 0.55;
  /* How near the post he is trying to put it.

     These were too timid, and it was the whole reason keepers were saving
     four shots in five. Measured, a shot on target crossed the line a mean of
     2.36m from the middle of a goal whose post is at 4.15m, and 40% of them
     crossed inside 2.08m — which is one diving reach from a keeper starting
     centrally. The shooters were not going for the corners; the width in the
     old distribution came from the SPREAD, not from the aim, so a shot was
     either straight at him or missing the target altogether.

     Aim at the corner, and let the spread be what occasionally drags it off.
     That is the right way round, and it is the difference between a keeper
     making saves and a keeper standing where the ball was always going. */
  const pick = kind === 'placed' ? 1.10 : kind === 'curl' ? 1.00
    : kind === 'power' ? 0.80 : 0.95;
  /* Through on goal he goes nearer the post than he otherwise would. Placing
     it inside the keeper is what a one-on-one is: the whole reason it is a
     chance is that the man has time to pick a corner, and aiming it where he
     would from twenty yards hands it straight back. */
  /* Deliberately NOT clamped inside the posts.

     It looks like an obvious safeguard — a player aims at the goal, and
     `spread` decides whether it stays there. Tried it: squeezing every aim
     into the goal mouth concentrates the shots, and the keeper's dive error
     is a fixed width, so a tighter distribution of shots is one he covers
     more of. Goals fell from 1.8 a match to 1.1 and goalless matches went
     from five in thirty to eleven.

     The aim running a little past the upright is not a bug; it is where the
     misses come from, and taking it away takes the misses with it. */
  const aimY = PITCH_W / 2 + openSide * corner * pick *
    (oneOnOne ? 0.9 + Math.random() * 0.35 : 0.55 + Math.random() * 0.5) *
    clamp(c.att.shoot, 0.6, 1.25);
  m.shotKind = kind;

  // Real players miss the target with about a third of their shots. The old
  // spread put nearly everything between the posts, which inflated shots on
  // target and made the keeper look busier than any keeper is.
  // A man through on goal has time to be accurate, and that is most of why a
  // one-on-one is a chance rather than just another shot.
  /* And the spread comes down to match.

     At 0.062 a regular shot from fifteen metres under two challenges scattered
     by +-2.4m, which is as wide as the entire aim offset — so where the ball
     ended up was mostly noise, and the aim barely mattered. Cutting it while
     widening the aim keeps roughly the same number of shots missing the
     target; what changes is that the ones on target are near a post rather
     than near the middle. */
  const spread = ((dead ? 0.018 : 0.040) * K.spread + press * 0.016 + dGoal * 0.0024)
    / c.att.shoot * (oneOnOne ? 0.58 : 1);
  const a = Math.atan2(aimY - c.y, gx - c.x) + (Math.random() - 0.5) * spread * 2;

  strike(c, a);
  // No pre-computed block any more — the shot travels and if a defender is
  // in the way it deflects off them for real.
  m.ball.x = c.x; m.ball.y = c.y;
  m.ball.z = 0.2;
  // A finish is side-footed, not caressed. `placed` is deliberately slow so a
  // twelve-yard effort does not fly, but at 21 m/s a one-on-one gives the
  // keeper time to get across it however well it is placed.
  const pace = K.pace * (0.9 + Math.random() * 0.2) * (oneOnOne ? 1.25 : 1);

  /* How high it is when it gets there — not how hard it was scooped.

     `vz = lift * ~1` gave a regular shot about 1 m/s of climb, which puts it
     back on the grass in a fifth of a second. Everything that distinguishes
     one strike from another then vanished: the four kinds all skidded along
     the floor at different speeds, and a curled shot could not curl at all,
     because updateBall zeroes the spin the moment the ball lands. Twenty
     metres of swerve was being cancelled after two.

     So the flight is solved backwards from where it should cross the line.
     Placed goes in low and along the ground, power is still climbing, curl
     sits at knee height and has the whole flight to bend. That is a
     difference you can see from above, and it is the same difference that
     decides whether the keeper can reach it. */
  const tGoal = clamp(dGoal / Math.max(8, pace), 0.18, 1.6);
  /* How high it is at the line, and there is real spread on it.

     At 0.55-1.5 of the kind's nominal height, the very highest shot in the
     game arrived at 2.25m under a 2.72m bar — so nothing ever went over. Every
     miss was wide, which is half of the ways a shot can miss and the less
     common half at that.

     Plus the skied one. A player leaning back, or under pressure, or simply
     not a finisher, puts it into the stand, and that is a shot everybody has
     seen a thousand times and this sim had never produced once. */
  let rise = K.rise * (0.5 + Math.random() * 1.1);
  if (Math.random() < 0.05 + press * 0.015) rise += 1.2 + Math.random() * 1.4;
  m.ball.vz = (rise - m.ball.z + 0.5 * GRAVITY * tGoal * tGoal) / tGoal;
  m.ball.spin = K.spin
    ? (Math.random() < 0.5 ? -1 : 1) * K.spin * (0.7 + Math.random() * 0.6)
    : 0;
  m.ball.vx = Math.cos(a) * pace;
  m.ball.vy = Math.sin(a) * pace;
  m.lastTouch = c.team;

  m.shotBy = c.team;      // live until it is blocked, saved, scored or out
  m.shooter = c;
  m.inFlight = true;
  m.passer = c;
  m.intendedRx = null;
  m.offsideFlag = false;
  m.passCooldown = 0.25;
  m.carrier = null;
  m.decide = 0.3;
}

/* ============================================================
   SET PIECES — every restart takes RESTART_TIME to be taken
   ============================================================ */
const SET_PIECE_LABEL = {
  throwIn: "Throw-in", goalKick: "Goal kick", corner: "Corner",
  freeKick: "Free kick", penalty: "Penalty", kickoff: "Kick-off",
};

/* `why` is what the crowd is told. Without it every stoppage announces itself
   as the restart it produced, so an offside was flagged, the flag was
   immediately overwritten by "Free kick", and what you saw was a free kick
   awarded for nothing at all. */
function awardSetPiece(m, type, team, x, y, why) {
  m.setPiece = { type, team, x, y };

  /* A dead ball ends whatever anybody was in the middle of.

     Skill moves above all. The per-player timers run in tick() *after* the
     restart branch returns, so a move caught by the whistle does not advance
     and does not finish: the man freezes mid-pose, is drawn two metres from
     where the simulation actually has him for the whole restart while he
     walks to his set-piece position, and snaps back into himself when play
     resumes. A player doing a croqueta over a stationary ball while the wall
     lines up is not a thing that happens. */
  m.delivery = null;
  for (const p of m.players) {
    p.skill = null; p.skillT = 0; p.skillDur = 0;
    p.showboat = 0; p.jump = 0;
    p.taking = 0; p.pull = 0; p.late = 0; p.lateCd = 0; p.slide = 0;
    p.scan = 0; p.scanCd = 0;
    // The run is over, but the cooldown goes with it — otherwise twenty
    // restarts a match each suppress the next four seconds of running in
    // behind, and the offside law goes quiet along with them.
    p.running = 0; p.runCd = 0;
    p.oneTwo = 0; p.oneTwoTo = null;
    p.dive = 0; p.claim = 0; p.holding = 0;
    p.lunge = 0; p.beaten = 0; p.stabCd = 0;
  }
  m.ball.x = clamp(x, 0.4, PITCH_L - 0.4);
  m.ball.y = clamp(y, 0.4, PITCH_W - 0.4);
  m.ball.vx = 0; m.ball.vy = 0; m.ball.z = 0; m.ball.vz = 0; m.ball.spin = 0;
  m.inFlight = false;
  m.carrier = null;
  m.passer = null;
  m.intendedRx = null;
  m.offsideFlag = false;
  m.possession = team;
  m.lastTouch = team;
  m.restart = RESTART_TIME;
  m.penaltyWait = 0;
  m.trail.length = 0;

  // ten yards, enforced immediately — steering alone won't clear the ball
  // in time and the wall ends up standing on top of the taker
  if (type === "freeKick" || type === "corner") {
    for (const p of m.players) {
      if (p.team === team || p.gk) continue;
      const d = dist(p.x, p.y, m.ball.x, m.ball.y);
      if (d >= 9.15) continue;
      const a = d < 0.1 ? Math.random() * 6.28 : Math.atan2(p.y - m.ball.y, p.x - m.ball.x);
      p.x = clamp(m.ball.x + Math.cos(a) * 9.15, 1, PITCH_L - 1);
      p.y = clamp(m.ball.y + Math.sin(a) * 9.15, 1, PITCH_W - 1);
      p.vx = 0; p.vy = 0;
    }
  }

  // who takes it
  const squad = m.players.filter((p) => p.team === team);
  if (type === "goalKick") {
    m.taker = squad.find((p) => p.gk) || squad[0];
  } else if (type === "penalty") {
    m.taker = squad.filter((p) => !p.gk).sort((a, b) => b.depth - a.depth)[0];
  } else if (type === "freeKick" && Math.abs(m.ball.x - ownGoalX(team)) < 22) {
    /* His free kick, in his own third. Keepers take these, and in here nobody
       did: the taker was always the nearest outfielder, which put a body
       behind the ball for no reason and left the one man on the pitch under
       no pressure at all standing on his line watching.

       It also gives keeperFreeKickClear something to gate. Before this the
       keeper took 0.00 free kicks a match and that clause was dead code. */
    m.taker = squad.find((p) => p.gk) || squad[0];
  } else {
    m.taker = squad.filter((p) => !p.gk)
      .sort((a, b) => dist(a.x, a.y, m.ball.x, m.ball.y) - dist(b.x, b.y, m.ball.x, m.ball.y))[0];
  }
  announce(m, why || SET_PIECE_LABEL[type]);
}

/* A penalty cannot be taken while anyone but the taker and the keeper is
   still inside the area. */
function penaltyBoxClear(m) {
  const sp = m.setPiece;
  if (!sp) return true;
  const defending = other(sp.team);
  for (const p of m.players) {
    if (p === m.taker) continue;
    if (p.gk && p.team === defending) continue;
    if (inBoxOf(defending, p.x, p.y)) return false;
  }
  return true;
}

/* How many attackers a side commits to a corner. */
const CORNER_BODIES = { attacking: 8, balanced: 7, defensive: 6 };

/* A goal kick is not struck the moment the ball is placed.

   Going long, it is only worth kicking when there is somebody up there to
   head it: launched while the whole side is still on the edge of its own box
   it is a free ball for their centre-halves, which is what a goal kick was in
   this sim. Playing out, he needs somebody free to play out TO, which is the
   same test the throw-in already makes. */
function goalKickReady(m) {
  const sp = m.setPiece;
  if (!sp) return true;
  const dir = attackDir(sp.team);
  if (!GOAL_KICK_STYLE[m.tactics[sp.team].goalKickStyle].long) {
    let opts = 0;
    for (const p of m.players) {
      if (p.team !== sp.team || p.gk) continue;
      const d = dist(p.x, p.y, sp.x, sp.y);
      if (d < 8 || d > 34) continue;
      let marked = false;
      for (const o of m.players) {
        if (o.team === sp.team || o.gk) continue;
        if (dist(o.x, o.y, p.x, p.y) < 4) { marked = true; break; }
      }
      if (!marked) opts++;
    }
    return opts >= 2;
  }
  let up = 0;
  for (const p of m.players) {
    if (p.team !== sp.team || p.gk) continue;
    if ((p.x - PITCH_L / 2) * dir > -18) up++;
  }
  return up >= 3;
}

/* And a keeper taking a free kick waits for them to get their ten yards.

   Everybody else in here is trying to take it quickly, which is usually
   right. A keeper is not: he has the ball in his own third with nothing to
   hurry for, and playing it while a forward is still stood over him is how a
   clearance goes straight back whence it came. */
function keeperFreeKickClear(m) {
  const sp = m.setPiece;
  if (!sp || !m.taker || !m.taker.gk) return true;
  for (const o of m.players) {
    if (o.team === sp.team) continue;
    if (dist(o.x, o.y, sp.x, sp.y) < 9.15) return false;
  }
  return true;
}

/* An attacking free kick is held while the side pushes bodies up. */
function freeKickLoaded(m) {
  const sp = m.setPiece;
  if (!sp) return true;
  const gx = goalXFor(sp.team);
  if (Math.abs(sp.x - gx) > 32) return true;      // nothing to push up for
  const want = CORNER_BODIES[m.tactics[sp.team].mentality] - 2;
  let up = 0;
  for (const p of m.players) {
    if (p.team !== sp.team || p === m.taker || p.gk) continue;
    if (Math.abs(p.x - gx) < 30) up++;
  }
  return up >= Math.min(want, 7);
}

function cornerLoaded(m) {
  const sp = m.setPiece;
  if (!sp) return true;
  const want = CORNER_BODIES[m.tactics[sp.team].mentality] || 7;
  const defending = other(sp.team);
  let inBox = 0;
  for (const p of m.players) {
    if (p.team !== sp.team || p === m.taker || p.gk) continue;
    if (inBoxOf(defending, p.x, p.y)) inBox++;
  }
  return inBox >= Math.min(want, 9);
}

/* Turn the side's set-piece instructions into a concrete delivery. */
function planSetPiece(m, type) {
  const c = m.carrier;
  if (!c) return;
  const t = m.tactics[c.team];
  const gx = goalXFor(c.team);
  const dir = attackDir(c.team);
  m.setPieceLoft = false;
  m.setPieceAim = null;
  m.mustShoot = false;
  m.mustPass = true;

  if (type === "corner") {
    /* The instruction is what they mostly do, not all they ever do. A side
       that takes near-post corners takes a near-post corner about three times
       in four and mixes it up the rest of the time — which is the point of
       mixing it up. Every corner in the match being identical is its own
       kind of wrong. */
    let st = CORNER_STYLE[t.cornerStyle];
    if (Math.random() < 0.24) {
      const others = Object.values(CORNER_STYLE).filter((z) => z !== st);
      st = others[Math.floor(Math.random() * others.length)];
    }
    if (st.short) return;                       // roll it to a team-mate
    const nearSide = m.ball.y < PITCH_W / 2;
    const postY = st.near
      ? (nearSide ? GOAL_TOP + 0.6 : GOAL_BOT - 0.6)
      : (nearSide ? 43 : 25);
    /* Further off the line than it was.

       Aimed 7.5m out and 3.5m off centre, a corner drops inside the six-yard
       box — which is the keeper's, and he was claiming two of every three.
       A near-post corner is hung around the penalty spot and a far-post one
       past it; both are deliberately outside the range where he can simply
       come and take it. */
    /* And not every one lands on the same square metre. A side aims at the
       near post or the far post; where it actually comes down varies by a
       couple of metres either way, and that variation is what decides whether
       the keeper can come for it. Without it every corner in the match was
       the same corner. */
    /* A near-post corner is a whipped ball to the post itself, six or seven
       metres out and arriving fast and low — that is what makes it dangerous
       and what makes it hard to deal with despite being close to the keeper.
       Aiming it ten metres out at a lofted, hanging height, which is what it
       was doing, is not a near-post corner at all; it is a far-post corner
       delivered to the wrong place. `flat` tells pass() to drive it. */
    m.setPieceLoft = true;
    m.setPieceAim = {
      x: gx - dir * ((st.near ? 6.5 : 13.5) + (Math.random() - 0.5) * (st.near ? 2.5 : 4.5)),
      y: postY + (Math.random() - 0.5) * (st.near ? 2.0 : 3.5),
      flat: !!st.near,
    };
    return;
  }

  if (type === "throwIn") {
    const nearBox = Math.abs(m.ball.x - gx) < 30;
    if (!THROW_STYLE[t.throwStyle].long || !nearBox) return;   // long throws only in range
    m.setPieceLoft = true;
    const far = Math.abs(m.ball.x - gx) < 30;
    m.setPieceAim = far
      ? { x: gx - dir * 10, y: PITCH_W / 2 + (m.ball.y < PITCH_W / 2 ? -6 : 6) }
      : { x: m.ball.x + dir * 26, y: m.ball.y + (PITCH_W / 2 - m.ball.y) * 0.5 };
    return;
  }

  if (type === "goalKick") {
    if (!GOAL_KICK_STYLE[t.goalKickStyle].long) return;
    m.setPieceLoft = true;
    m.setPieceAim = { x: m.ball.x + dir * 48, y: PITCH_W / 2 + (Math.random() - 0.5) * 30 };
    return;
  }

  if (type === "freeKick") {
    const mode = FREE_KICK_STYLE[t.freeKickStyle].mode;
    const dGoal = dist(c.x, c.y, gx, PITCH_W / 2);
    if (mode === "shoot" && dGoal < 25) { m.mustShoot = true; m.mustPass = false; m.deadBall = true; return; }
    if (mode === "short") return;
    // Only from somewhere it is actually a delivery. At forty-five metres this
    // was hanging one up into a packed box from inside your own half, which is
    // a hopeful punt, not a set piece — and it was the single worst-completing
    // pass in the game.
    if (dGoal < 36) {
      m.setPieceLoft = true;
      m.setPieceAim = { x: gx - dir * 7, y: PITCH_W / 2 + (Math.random() - 0.5) * 12 };
    }
    return;
  }
}

/* Don't throw it into nothing — wait until there are team-mates showing. */
function throwInReady(m) {
  const sp = m.setPiece;
  if (!sp) return true;
  let options = 0;
  for (const p of m.players) {
    if (p.team !== sp.team || p === m.taker || p.gk) continue;
    const d = dist(p.x, p.y, sp.x, sp.y);
    if (d < 6 || d > 26) continue;
    let marked = false;
    for (const o of m.players) {
      if (o.team === sp.team) continue;
      if (dist(o.x, o.y, p.x, p.y) < 2.6) { marked = true; break; }
    }
    if (!marked) options++;
  }
  return options >= 2;
}

function takeSetPiece(m) {
  const sp = m.setPiece;
  m.setPiece = null;
  if (!m.taker) return;
  m.carrier = m.taker;
  m.possession = m.taker.team;
  m.lastTouch = m.taker.team;
  m.carryTime = 0;
  m.lastCarrier = m.taker;
  // corners and penalties should be struck immediately
  const type = sp && sp.type;
  if (type === "kickoff") m.kickAdvance = KICK_ADVANCE;
  m.throwGrace = type === "throwIn" ? 2.0 : 0;
  m.fromThrow = type === "throwIn";
  m.fromKickoff = type === "kickoff";
  m.penaltyWait = 0;
  m.mustShoot = type === "penalty";

  // a direct free kick in range can be struck rather than played short
  const shootable = type === "freeKick" && m.carrier &&
    dist(m.carrier.x, m.carrier.y, goalXFor(m.carrier.team), PITCH_W / 2) < 25;

  m.mustPass = !m.mustShoot && !shootable;
  m.deadBall = m.mustShoot || shootable;
  if (type !== "penalty" && type !== "kickoff") planSetPiece(m, type);
  m.decide = type === "corner" || type === "penalty" ? 0.05 : 0.25;
  m.taker = null;
}

/* ============================================================
   TARGETS — where every player wants to be right now
   ============================================================ */
function setPieceTargets(m, dt) {
  const sp = m.setPiece;
  if (!sp) return;
  const attGoal = goalXFor(sp.team);
  const dirA = attackDir(sp.team);
  const standoff = sp.type === "freeKick" || sp.type === "corner" ? 9.15
    : sp.type === "throwIn" ? 2.2 : 5;

  // Direct free kick in range: the defending side lines up a wall on the
  // goal side of the ball, ten yards off it.
  let wall = [];
  let wallPos = null;
  const wallRange = Math.abs(sp.x - attGoal);
  if (sp.type === "freeKick" && wallRange < 40) {
    const ang = Math.atan2(PITCH_W / 2 - sp.y, attGoal - sp.x);
    wallPos = {
      x: sp.x + Math.cos(ang) * 9.15,
      y: sp.y + Math.sin(ang) * 9.15,
      px: -Math.sin(ang),
      py: Math.cos(ang),
    };
    /* How many bodies. Sized to the threat rather than the two-value step it
       used to be, and extended out to forty metres — a side does put two men
       in front of a ball from there, and the sim was letting anything past
       thirty-two be struck at an empty net with nobody in the way. */
    const size = wallRange < 18 ? 5 : wallRange < 25 ? 4 : wallRange < 32 ? 3 : 2;
    wall = m.players
      .filter((q) => q.team !== sp.team && !q.gk)
      .sort((a, z) => dist(a.x, a.y, wallPos.x, wallPos.y) - dist(z.x, z.y, wallPos.x, wallPos.y))
      .slice(0, size);
  }

  /* Somebody to give it to.

     Every restart had the taker standing over the ball while his team-mates
     held whatever shape they were in — which at a throw-in meant a man on the
     touchline with nobody inside ten metres of him, waiting out the clock
     until throwInReady gave up. The two or three nearest come and show for it
     at a sensible distance, spread either side of him. */
  let support = [];
  const longGk = sp.type === "goalKick" &&
    GOAL_KICK_STYLE[m.tactics[sp.team].goalKickStyle].long;
  if (sp.type === "throwIn" || sp.type === "corner" ||
      (sp.type === "freeKick" && wallRange > 26) || (sp.type === "goalKick" && !longGk)) {
    const want = sp.type === "corner" ? 1 : 3;
    support = m.players
      .filter((q) => q.team === sp.team && !q.gk && q !== m.taker)
      .sort((a, z) => dist(a.x, a.y, sp.x, sp.y) - dist(z.x, z.y, sp.x, sp.y))
      .slice(0, want);
  }

  for (const p of m.players) {
    let tx, ty, speed = SHAPE_SPEED;
    let outsideOk = false;
    // A wall man is a wall man before he is anything else.
    const wallIdxEarly = wall.indexOf(p);

    if (p === m.taker) {
      if (sp.type === "throwIn") {
        // step off the pitch to take it, as you must
        tx = sp.x;
        ty = sp.y < PITCH_W / 2 ? -1.0 : PITCH_W + 1.0;
        outsideOk = true;
      } else {
        tx = sp.x - dirA * 1.4;
        ty = sp.y;
      }
      speed = MAX_SPEED;
    } else if (p.gk) {
      const g = ownGoalX(p.team);
      tx = g + attackDir(p.team) * 3.5;
      ty = PITCH_W / 2 + clamp((sp.y - PITCH_W / 2) * 0.3, -6, 6);
    } else if (sp.type === "penalty") {
      // everyone outside the box, on the edge
      tx = attGoal - dirA * (BOX_D + 3);
      ty = PITCH_W / 2 + (p.by - PITCH_W / 2) * 0.8;
    } else if (longGk && p.team === sp.team) {
      /* Going long, somebody has to be up there to head it.

         Nothing sent anybody. The only shape a goal kick had was three men
         coming SHORT to show for it, so a ball aimed forty-eight metres
         downfield was contested by an average of 1.4 of his own team-mates
         against a back four already standing there — 97% of goal kicks went
         with fewer than five men up. goalKickReady then waited for numbers
         that were never coming, and timed out.

         The four most advanced go and attack the drop, spread across it, at a
         sprint, because they are racing men who are already home. Everybody
         else holds their shape. */
      const rank = m.players.filter((q) => q.team === sp.team && !q.gk)
        .sort((a, z) => z.depth - a.depth).indexOf(p);
      if (rank >= 0 && rank < 4) {
        tx = ownGoalX(p.team) + dirA * (44 + (p.num % 3) * 5);
        ty = PITCH_W / 2 + ((p.num % 5) - 2) * 7;
        speed = SPRINT_SPEED;
      } else {
        const sb = shapedBase(p, m);
        tx = sb.x; ty = sb.y;
      }
    } else if (sp.type === "corner" || (sp.type === "freeKick" && Math.abs(sp.x - attGoal) < 32)) {
      // load the box, attackers and defenders both
      const attacking = p.team === sp.team;
      const want = CORNER_BODIES[m.tactics[sp.team].mentality] || 7;
      const rank = m.players.filter((q) => q.team === sp.team && !q.gk && q !== m.taker)
        .sort((a, z) => z.depth - a.depth).indexOf(p);
      /* The defending side leaves its most advanced man out of it, up the
         pitch, ready for the counter — which is what sides do, and which
         stops the box being ten against six before anybody moves. */
      const defRank = attacking ? -1 : m.players
        .filter((q) => q.team !== sp.team && !q.gk)
        .sort((a, z) => z.depth - a.depth).indexOf(p);
      const depthIn = attacking ? (rank >= 0 && rank < want) : defRank !== 0;
      if (depthIn) {
        tx = attGoal - dirA * (attacking ? 7 + (p.num % 4) * 2.4 : 5 + (p.num % 3) * 2.2);
        ty = PITCH_W / 2 + ((p.num % 5) - 2) * 4.2;
        /* They JOG in at shape speed, which is 4.6 m/s, and a forward can be
           forty metres from the box when the corner is given. The restart is
           two seconds plus a hold of at most four, so half of them simply
           never arrived: measured over a hundred corners, four attackers were
           in the box against nine and a half defenders. A four-against-ten is
           not a set piece, it is a formality, and it is why corners produced
           nothing. Defenders are already home, so this is what the attacking
           side needed and only the attacking side gets. */
        if (attacking) speed = SPRINT_SPEED;
      } else if (attacking) {
        // The men who stay out do not stay at home. A side attacking a corner
        // pushes its back line up to just inside the opposition half, to
        // squeeze the pitch and win the second ball. Standing on your own box
        // while eight of your team-mates attack a corner concedes forty
        // metres for nothing.
        const sb = shapedBase(p, m);
        const upTo = PITCH_L / 2 + dirA * 4;
        tx = dirA > 0 ? Math.max(sb.x, upTo) : Math.min(sb.x, upTo);
        ty = sb.y;
      } else {
        const sb = shapedBase(p, m);
        tx = sb.x; ty = sb.y;
      }
    } else if (sp.type === "kickoff") {
      const q = kickoffSpot(p, sp.team);
      tx = q.x; ty = q.y;
    } else if (sp.type === "freeKick" && p.team !== sp.team && !p.gk &&
               wallRange > 55 && wallIdxEarly < 0) {
      /* A free kick deep in the other side's half. They were the ones
         attacking a moment ago — trooping the whole team back behind the ball
         is what you do when you have conceded one in a dangerous area, not
         when you have given away a foul near their corner flag. So they hold
         a press line where they are and wait for it to be played.

         Situational is the whole point: the retreat below still applies to
         anything closer, and the ten-yard law still applies to everybody. */
      const tac = m.tactics[p.team];
      const blk = BLOCKS[tac.block];
      const dirP = attackDir(p.team);
      const gxk = goalXFor(p.team);
      const front = blk.line >= 11 ? 26 : blk.line <= -8 ? 46 : 34;
      tx = gxk - dirP * (front + (1 - p.depth) * 22);
      ty = PITCH_W / 2 + (p.by - PITCH_W / 2) * 1.02;
      speed = MAX_SPEED;
    } else if (sp.type === "goalKick" && p.team !== sp.team && !p.gk) {
      /* A goal kick is the one restart the defending side gets to organise
         for, and the side facing it should be using it. Previously they held
         whatever shape they happened to be in when the ball went out — which,
         for a side that had just been attacking, meant standing around the
         edge of the area waiting to be played over.

         Now they drop off and set up: a couple of triggers on the corners of
         the box to jump the short ball, everyone else back behind them in
         their block, spread across the pitch. How far back is the block
         instruction — a high press squeezes onto the area, a low one concedes
         it and waits. */
      const tac = m.tactics[p.team];
      const blk = BLOCKS[tac.block];
      const pc = PRESSURE[tac.pressure];
      const dirP = attackDir(p.team);
      const gxk = goalXFor(p.team);               // the goal it is taken from
      const rankP = m.players
        .filter((q) => q.team === p.team && !q.gk)
        .sort((a, z) => z.depth - a.depth)
        .indexOf(p);

      if (rankP >= 0 && rankP < pc.pressers) {
        tx = gxk - dirP * (BOX_D + 3.5);
        ty = PITCH_W / 2 + (rankP === 0 ? 0 : (rankP % 2 ? 12 : -12));
      } else {
        const front = blk.line >= 11 ? 23 : blk.line <= -8 ? 46 : 33;
        tx = gxk - dirP * (front + (1 - p.depth) * 24);
        ty = PITCH_W / 2 + (p.by - PITCH_W / 2) * 1.02;
      }
      speed = MAX_SPEED;                          // get back, don't stroll
    } else {
      const sb = shapedBase(p, m);
      tx = sb.x; ty = sb.y;
    }

    // stand in the wall — shoulder to shoulder, which at this scale is a
    // marker's width apart, not a marker's width of overlap
    const wallIdx = wall.indexOf(p);
    if (wallIdx >= 0 && wallPos) {
      const offset = (wallIdx - (wall.length - 1) / 2) * 1.55;
      tx = wallPos.x + wallPos.px * offset;
      ty = wallPos.y + wallPos.py * offset;
      speed = MAX_SPEED;
    }

    // show for the ball, either side of the taker and at a passable distance
    const supIdx = support.indexOf(p);
    if (supIdx >= 0 && wallIdx < 0) {
      const along = sp.type === "throwIn" ? dirA : 0;
      const across = supIdx === 0 ? 0 : supIdx === 1 ? 1 : -1;
      const back = sp.type === "throwIn" ? -0.35 : 0.6;
      tx = clamp(sp.x + along * 9 + dirA * back * 6 + (supIdx === 0 ? 0 : across * 2),
        3, PITCH_L - 3);
      ty = clamp(sp.y + (sp.y < PITCH_W / 2 ? 1 : -1) * (7 + supIdx * 4.5) +
        across * 3, 3, PITCH_W - 3);
      speed = MAX_SPEED;
    }

    // a goal kick cannot be taken with an opponent inside the area
    if (sp.type === "goalKick" && p.team !== sp.team && inBoxOf(sp.team, tx, ty)) {
      const q = pushOutOfBox(sp.team, tx, ty);
      tx = q.x; ty = q.y;
      speed = MAX_SPEED;
    }

    // the defending side must retreat the required distance from the ball
    if (p.team !== sp.team && !p.gk && wallIdx < 0) {
      const d = dist(tx, ty, sp.x, sp.y);
      if (d < standoff) {
        const a = Math.atan2(ty - sp.y, tx - sp.x) || 0;
        tx = sp.x + Math.cos(a) * standoff;
        ty = sp.y + Math.sin(a) * standoff;
      }
    }

    // Offside applies from a free kick, so the attacking side lines up
    // onside. It does not apply from a corner, goal kick or throw-in, so
    // those are left alone.
    if (sp.type === "freeKick" && p.team === sp.team && !p.gk && p !== m.taker) {
      const ln = offsideLine(m, sp.team);
      if ((tx - ln) * dirA > -0.8) tx = ln - dirA * 1.2;
    }

    const loY = outsideOk ? -1.2 : 1.5;
    const hiY = outsideOk ? PITCH_W + 1.2 : PITCH_W - 1.5;
    steer(p, clamp(tx, 1.5, PITCH_L - 1.5), clamp(ty, loY, hiY), dt, speed);

    // Ten yards is a constraint on where they *are*, not just where they are
    // heading — otherwise a defender crossing to the far side of the pitch
    // walks straight past the ball on the way.
    // and it is a constraint on where they stand, not just where they aim
    if (sp.type === "goalKick" && p.team !== sp.team && inBoxOf(sp.team, p.x, p.y)) {
      const q = pushOutOfBox(sp.team, p.x, p.y);
      p.x = clamp(q.x, 1, PITCH_L - 1);
      p.y = clamp(q.y, 1, PITCH_W - 1);
    }

    if (p.team !== sp.team && !p.gk && (sp.type === "freeKick" || sp.type === "corner")) {
      const d = dist(p.x, p.y, sp.x, sp.y);
      if (d < 9.1) {
        const a = d < 0.1 ? Math.random() * 6.283 : Math.atan2(p.y - sp.y, p.x - sp.x);
        p.x = clamp(sp.x + Math.cos(a) * 9.15, 1, PITCH_L - 1);
        p.y = clamp(sp.y + Math.sin(a) * 9.15, 1, PITCH_W - 1);
      }
    }
  }
}

function assignTargets(m, dt) {
  const b = m.ball;
  const shiftX = (b.x - PITCH_L / 2) * 0.30;
  const shiftY = (b.y - PITCH_W / 2) * 0.36;

  const defTeam = other(m.possession);
  const defTac = m.tactics[defTeam];
  const pressCfg = PRESSURE[defTac.pressure];
  const chasers = m.players
    .filter((p) => p.team === defTeam && !p.gk)
    .sort((a, z) => dist(a.x, a.y, b.x, b.y) - dist(z.x, z.y, b.x, b.y));

  const chasers2 = chaseCandidates(m);
  const looseChaser = chasers2[m.possession][0] || null;
  const lineFor = [offsideLine(m, HOME), offsideLine(m, AWAY)];

  // If the man on the ball has stopped to look up, the game around him
  // settles too. Everyone jogging flat out while he stands still is what
  // makes it look frantic rather than considered.
  const carrierPace = m.carrier ? Math.hypot(m.carrier.vx, m.carrier.vy) : 99;
  const settled = !!m.carrier && carrierPace < 2.6 && m.decide > 0.25;

  /* A keeper with it in his hands. contest() already refuses the challenge,
     but eight attackers standing on his toes reads as one anyway, and at a
     corner that is exactly where they all are. They back off him. */
  const gkHold = m.carrier && m.carrier.gk && m.carrier.holding > 0 ? m.carrier : null;
  const GK_ROOM = 5.5;

  /* My keeper is coming for it — the whole point of shouting. Nobody in front
     of him goes for the same ball, and the defenders in his way get out of
     it, which is the difference between a claimed cross and a keeper flattened
     by his own centre-half. */
  const keeperCall = [null, null];
  for (const p of m.players) {
    if (p.gk && p.claim > 0) keeperCall[p.team] = p;
  }

  /* A cross or a set-piece delivery in the air.

     A corner used to end the moment it was struck: m.setPiece goes null,
     assignTargets takes back over, and the box that had spent two seconds
     filling up emptied again — one man chased the ball and eight jogged back
     to their open-play slots while it was still in the air. Which is exactly
     what a corner looked like.

     While the ball is up, the men near where it is coming down go and attack
     it, and they attack different parts of it: near post, the spot, far post,
     the edge. Both sides — a cross is contested. */
  // near post, the spot, far post, the second ball — in the crosser's frame
  const DELIVERY_SPOTS = [[0, 0], [-1.2, -4.0], [0.6, 4.2], [-2.4, -7.5], [2.2, 7.8], [4.5, 0]];

  const del = (m.delivery && (b.z > 0.6 || b.vz > 0.2)) ? m.delivery : null;
  const delSpot = del ? new Map() : null;
  if (del) {
    /* Ranked per side, not as one queue. Ranking everybody together handed
       the spot the ball is actually coming down on to whichever player was
       nearest — which at a corner is a defender, every time — and pushed the
       man the delivery was aimed at four metres off it. Half of all set-piece
       deliveries went straight to the opposition.

       Spot 0 belongs to the man it is aimed at; he is already being sent
       there by the chase branch above, so his side starts at spot 1. */
    const fill = (team, from, cap) => m.players
      .filter((p) => p.team === team && !p.gk && p !== m.carrier && p !== m.intendedRx &&
        dist(p.x, p.y, del.x, del.y) < 26)
      .sort((a, z) => dist(a.x, a.y, del.x, del.y) - dist(z.x, z.y, del.x, del.y))
      .slice(0, Math.min(cap === undefined ? 99 : cap, DELIVERY_SPOTS.length - from))
      .forEach((p, i) => delSpot.set(p, i + from));
    fill(del.team, 1);
    /* Defenders contest it, goal-side, and there are fewer of them — sending
       as many of each turned every delivery into an eleven-man scrum in one
       square metre.

       Keeping them off spot 0 entirely went too far the other way: the man
       the ball was aimed at was the only one being sent to where it actually
       lands, so he won the first touch at ninety-eight corners in a hundred.
       A cross is a duel. One defender contests the drop; the rest take the
       ground around it. */
    fill(other(del.team), 0, 3);
  }

  for (const p of m.players) {
    const dir = attackDir(p.team);
    const myGoal = ownGoalX(p.team);

    if (p.gk) {
      const pace = Math.hypot(b.vx, b.vy);

      /* A ball played to him, or one loose in front of him.

         He had no notion of receiving. chaseCandidates skips keepers outright,
         so he was never sent for a loose ball, and when a team-mate passed
         back to him he simply held his position on the bisector and waited for
         it to arrive — which for a ball rolling slowly across his area meant
         standing still while an onrushing forward reached it first.

         A keeper comes off his line to meet a pass like anybody else. He is
         the one player who must not let a ball sit. */
      /* Not a shot. A shot has no intended receiver either, so without this
         the branch fired on every effort at his goal and sent him charging
         out at it instead of diving to where it would cross — which is a
         different thing entirely and cost a goal a match. The dive branch
         below owns shots; this one owns everything else. */
      const mine = m.intendedRx === p;
      const looseNear = !m.carrier && !m.intendedRx && m.shotBy === null &&
        b.z < 1.4 && pace < 17 &&
        Math.abs(b.x - myGoal) < 26 && Math.abs(b.y - PITCH_W / 2) < 24;
      if ((mine || looseNear) && m.restart <= 0) {
        const q = interceptPoint(m, p, GK_SPEED * 1.5);
        // step towards it rather than waiting on the spot
        const toBall = Math.atan2(b.y - q.y, b.x - q.x);
        const meet = clamp(dist(q.x, q.y, b.x, b.y) * 0.3, 0, 2.5);
        let qx = q.x + Math.cos(toBall) * meet;
        let qy = q.y + Math.sin(toBall) * meet;
        // he does not chase one into the far corner of his own half
        const outTo = Math.abs(qx - myGoal);
        if (outTo < 30) {
          steer(p, clamp(qx, 1, PITCH_L - 1), clamp(qy, 2, PITCH_W - 2),
            dt, GK_SPEED * 1.5);
          continue;
        }
      }

      // A shot on its way: work out where it will cross the line and throw
      // yourself at that point. Standing on the line waiting for the ball to
      // arrive within arm's reach is not goalkeeping.
      if (m.inFlight && pace > 14 && b.vx * dir < -1) {
        const tt = (myGoal - b.x) / b.vx;
        /* He needs time to react, and he can pick the wrong side.

           The lower bound used to be 0.26s, and that turned out to be why a
           man through on goal could not score. A shot from twelve metres
           reaches a keeper who has come out in about 0.24s — under the
           threshold, so the dive never fired, so he never committed and never
           picked a side. He simply stood on the bisector, perfectly placed,
           with a metre and a half of reach, and saved 82% of one-on-ones.

           Coming out is a commitment. At 0.12s he still cannot get anywhere,
           but he has already thrown himself one way — which is what makes a
           one-on-one a chance rather than a formality.

           Tried it. It made him BETTER — diving grants 2.08m of reach against
           1.8m standing, so letting him dive at close-range shots handed him
           a bigger radius for exactly the shots he was already saving, and
           one-on-one conversion fell from 15% to 7%. The threshold stays; the
           commitment goes where it belongs, in the rush out itself. */
        if (tt > 0.26 && tt < 1.6) {
          /* And only at one that is going in. He used to throw himself at
             anything struck at his end, so a shot missing by three metres was
             palmed round the post — which is where most of the sim's corners
             were coming from, and why it produced nine a match and barely one
             goal kick. A keeper watches those go wide, and the count of
             on-target shots already knew the difference; his feet did not.

             The margin is deliberately not zero. He has to decide before he
             can be sure, so he goes for one just outside the frame and lets
             the obvious miss go. */
          const yAt = b.y + b.vy * tt;
          const zAt = Math.max(0, b.z + b.vz * tt - 0.5 * GRAVITY * tt * tt);
          const onFrame = yAt > GOAL_TOP - 1.3 && yAt < GOAL_BOT + 1.3 && zAt < CROSSBAR + 0.7;
          if (onFrame) {
            /* How far he can be wrong about where it is going. He dives to
               the predicted crossing point and anything he reaches he stops,
               so this spread is the entire difference between a save and a
               goal — and at 4.6 the keepers saved 89% of the shots on target
               against a real figure nearer 70%. That did not show while the
               sim was taking thirty shots a match; once the pass model cut
               the loose half of those out, it showed as a quarter of all
               matches finishing goalless. */
            /* Widened again, and this time it bit. Every earlier attempt at this
               knob (4.6, 6.2, 8.5, 10.5) barely moved the save rate, and the
               reason turned out to have nothing to do with the keeper: only
               four shots in ten that were going in ever reached him, because
               defenders were blocking the rest from a metre and a half away.
               His parameters could not matter while somebody else was doing
               the saving. With the block radius cut to a body's width they
               matter again — the same sweep that did nothing before now moves
               scoring from 1.5 a match to 2.0. */
            /* He has to see it leave the boot first.

               There was no reaction time anywhere in here. The dive fired on
               the very tick the ball was struck, so a keeper was already
               moving before a real one has processed that the shot has been
               hit — and over a twelve-metre flight of half a second at 8.5
               m/s that is four and a quarter metres of travel plus two
               metres of reach, against a goal whose half-width is 4.15m. He
               covered more of the goal than the goal has, which is why a man
               genuinely through on goal scored 14% of the time, was saved
               86% of the time, and never once missed the target: where the
               ball went could not matter.

               A human keeper picks the ball up, decides, and goes, and that
               takes about a fifth of a second. It is not a handicap invented
               to make scoring easier — it is the thing that makes placement
               worth anything at all, because it is what turns four and a
               quarter metres of dive into two and a half.

               Charged once per shot, not once per keeper: m.shotSeq changes
               on every attempt, so a rebound struck a moment later is a new
               shot and he has to react to that one too. While he is reacting
               he is set and still, which is what a keeper facing a shot
               does — he does not keep shuffling along his line.

               Note this deliberately does NOT touch DIVE_SPEED or the dive
               error, both of which have been swept before with no effect.
               The problem was never how fast or how accurately he moved; it
               was that he started moving before the ball did. */
            if (p.reactShot !== m.shotSeq) { p.reactShot = m.shotSeq; p.react = 0.18; }
            if (p.react > 0) { p.react -= dt; continue; }
            if (p.dive <= 0) p.diveErr = (Math.random() - 0.5) * 18;
            /* The clamp looks like it should be bounding the error — with a
               spread of +-5.25 against a goal 8.3m wide, most of the guess
               ought to be pulled back inside the frame, which would make
               widening the spread pointless past a certain point. It is a
               good theory and it is wrong: opening the clamp to +-3.5 and
               +-5.5 beyond the posts moved nothing, or moved scoring slightly
               down. A keeper flung further outside his goal is not covering
               less of it, because the shots aim at corners and he still ends
               up on the right side of centre. Left as it was. */
            const cy = clamp(yAt + p.diveErr, GOAL_TOP - 1.6, GOAL_BOT + 1.6);
            p.dive = 0.45;
            /* Tried scaling this down the further he had come out, on the
               reasoning that a keeper spread at somebody's feet cannot then
               dive across. It reads well and it measured badly: one-on-one
               conversion fell from 17% to 9% and scoring with it. The dive
               speed has an optimum rather than a direction — too slow and he
               simply stays central, covering the middle, which is where most
               shots go. 8.5 is that optimum; 6.5 and 12.5 are both worse for
               the attacker. */
            steer(p, myGoal + dir * 1.6, cy, dt, DIVE_SPEED);
            continue;
          }
        }
      }

      // A ball in the air dropping into my area — go and take it. This is
      // the whole job at a corner, and the keeper had no logic for it at
      // all, so he just shuffled along his line while it was headed in.
      // He takes it above his head, not off the floor.
      const land = landingTime(b, b.z > CLAIM_HEIGHT - 0.4 ? CLAIM_HEIGHT - 0.4 : 0);
      if (m.inFlight && b.z > 0.5 && land > 0.15) {
        const q = ballAt(b, land);
        // Out as far as the penalty spot. At nine metres he could not reach a
        // corner at all once they were being hung up around the spot, which
        // took him from claiming two in three to claiming none.
        if (inBoxOf(p.team, q.x, q.y) && Math.abs(q.x - myGoal) < 11.5
            && Math.abs(q.y - PITCH_W / 2) < 14) {
          const myTime = dist(p.x, p.y, q.x, q.y) / (GK_SPEED * 1.7);
          let oppTime = 99;
          for (const o of m.players) {
            if (o.gk || o.team === p.team) continue;
            oppTime = Math.min(oppTime, dist(o.x, o.y, q.x, q.y) / SPRINT_SPEED);
          }
          /* How much of an edge he needs — and it is not a fixed one.

             A keeper's advantage over a forward is not that he gets there
             first. It is that he has hands and takes the ball above
             everybody's head. That advantage is enormous on his own six-yard
             line, where he can come through a crowd and pluck it, and it is
             close to nothing at the penalty spot, where he is one more body
             arriving late among six.

             Comparing ground arrival times as though he were another header
             is what got this wrong twice. Letting him claim anything he could
             reach at the same moment had him taking two thirds of every first
             touch at a corner; demanding a flat quarter-second edge locked him
             out so completely he claimed none at all. So the margin is a
             function of the thing that actually decides it: how far off his
             line the ball is coming down. */
          const outFrom = Math.abs(q.x - myGoal);
          const edge = outFrom < 5.5 ? 0.30 : outFrom < 8 ? -0.05 : -0.30;
          if (myTime < land + 0.05 && myTime < oppTime + edge) {
            p.claim = 0.5;
            // never further than the six-yard box to take a cross
            const lo = Math.min(myGoal, myGoal + dir * 8);
            const hi = Math.max(myGoal, myGoal + dir * 8);
            steer(p, clamp(q.x, lo, hi), clamp(q.y, 2, PITCH_W - 2), dt, GK_SPEED * 1.75);
            continue;
          }
        }
      }

      // A man on the ball in the box: come out and close the angle down.
      if (m.carrier && m.carrier.team !== p.team && inBoxOf(p.team, m.carrier.x, m.carrier.y)) {
        const dc = dist(p.x, p.y, m.carrier.x, m.carrier.y);
        const f = clamp(1 - dc / 18, 0.25, 0.7);

        /* Coming out is a commitment, and this is where the cost of it lives.

           He was tracking the exact bisector between the ball and the middle
           of his goal, continuously, all the way out. That is a keeper who
           has come out AND stayed perfectly placed, and against it a man
           through on goal cannot score: the ball has barely diverged from
           centre by the time it reaches him, so his metre and a half of reach
           covers everything. Measured, he was saving 82% of one-on-ones
           against a real figure nearer 55%.

           So he picks a side. The error is chosen once per attacker — he does
           not get to re-roll it every tick — and it grows the further off his
           line he has come, because that is exactly when a keeper is
           committed and beatable. */
        if (p.advFor !== m.carrier) {
          p.advFor = m.carrier;
          p.advErr = (Math.random() - 0.5) * 5.0;
        }
        const outBy = Math.abs(p.x - myGoal);
        const lean = p.advErr * clamp(outBy / 9, 0.25, 1.3);

        steer(p, myGoal + (m.carrier.x - myGoal) * f,
          clamp(PITCH_W / 2 + (m.carrier.y - PITCH_W / 2) * f + lean,
            GOAL_TOP - 4, GOAL_BOT + 4), dt, GK_SPEED * 1.35);
        continue;
      }

      /* Sweeping. A ball loose in the space behind his own back line is his
         to come for, and a keeper who stands on his line while it rolls
         there is the reason a high line looked free of risk. He only goes
         for one he can reach first, and only inside his own third — this is
         a keeper sweeping up, not a keeper joining in.

         Note he is not protected out here: past his own area he may not
         handle it, and contest() will let him be challenged like anyone
         else. That is the trade, and it is the right one. */
      if (!m.carrier && b.z < 1.6) {
        const q = ballTargetPoint(m);
        const outTo = Math.abs(q.x - myGoal);
        if (outTo < 30 && Math.abs(q.y - PITCH_W / 2) < 26) {
          const myTime = dist(p.x, p.y, q.x, q.y) / (GK_SPEED * 1.6);
          let oppTime = 99;
          for (const o of m.players) {
            if (o.team === p.team || o.gk) continue;
            oppTime = Math.min(oppTime, dist(o.x, o.y, q.x, q.y) / SPRINT_SPEED);
          }
          if (myTime < oppTime - 0.2 && dist(p.x, p.y, q.x, q.y) > 2.5) {
            p.claim = 0.4;
            steer(p, clamp(q.x, 1, PITCH_L - 1), clamp(q.y, 2, PITCH_W - 2),
              dt, GK_SPEED * 1.6);
            continue;
          }
        }
      }

      /* Resting position: on the bisector of the angle, not on two
         independent axes. The old version came off his line as a function of
         how far up the pitch the ball was and shaded across as a separate
         function of how wide it was, which for a ball in the corner put him
         four metres out and central — the one place a keeper is never
         standing. Now he sits on the line from the middle of his goal to the
         ball, shading further across it than out along it, which is what
         covering the near post looks like from above. */
      /* Two things were wrong with this.

         He barely left his line. `off` topped out at 6.5m and shrank to 1.8m
         the further away the ball was — exactly backwards. A keeper is at his
         most advanced when the play is at the other end, sweeping the space
         behind a pushed-up back line, and tightest to his line when the ball
         is on top of him.

         And the sideways term was scaled by 1.8 and clamped at 7.5m, so
         covering a wide ball put him a metre and a half OUTSIDE his own post,
         which is the one place a keeper is never standing. The goal is 8.3m
         wide; he does not leave it to cover an angle.

         Now he stands on the line from the middle of his goal to the ball —
         the actual bisector — at a distance that grows with how far away the
         play is, capped by how high his side plays. */
      const dxb = b.x - myGoal, dyb = b.y - PITCH_W / 2;
      const db = Math.hypot(dxb, dyb) || 1;
      const myBlock = BLOCKS[m.tactics[p.team].block];
      const highest = myBlock.line >= 11 ? 16 : myBlock.line <= -8 ? 9 : 12.5;
      const off = clamp(db * 0.30, 2.6, highest);
      const t = off / db;
      steer(p, myGoal + dxb * t,
        clamp(PITCH_W / 2 + dyb * t, GOAL_TOP - 2.2, GOAL_BOT + 2.2), dt, GK_SPEED);
      continue;
    }

    /* My keeper has called for it. Nobody in front of him goes for the same
       ball — that shout is the whole point of it, and a centre-half heading
       one out of his keeper's hands is the sort of thing that made corners
       look like a scramble every time. */
    const mine = keeperCall[p.team];
    if (mine && !m.carrier) {
      const q = ballTargetPoint(m);
      if (dist(q.x, q.y, mine.x, mine.y) < 8 && inBoxOf(p.team, q.x, q.y)) {
        const sb0 = shapedBase(p, m);
        // out of his way, and goal-side, in case he does not get there
        steer(p, clamp(sb0.x, 1.5, PITCH_L - 1.5),
          clamp(sb0.y + Math.sign(p.y - q.y || 1) * 3, 1.5, PITCH_W - 1.5),
          dt, MAX_SPEED * 0.8);
        continue;
      }
    }

    // Nobody is in control and I'm the closest — go and get it, whatever my
    // shape says. A free ball, a misplaced pass, a pass that missed its man.
    if (!m.carrier && chasers2[p.team].includes(p)) {
      const q = interceptPoint(m, p, SPRINT_SPEED);
      let qx = q.x, qy = q.y;

      /* Come and meet it.

         interceptPoint returns the first place he can reach the ball, which
         for a pass played straight at him is roughly where he is already
         standing — so he stood still and waited for it, every time. A player
         receiving the ball steps towards it: it takes the pace off, it gets
         him to it before the man behind him can, and it is what receiving a
         pass looks like.

         Not on a ball played into space. A through ball or a cross is meant
         to be run onto, and stepping back towards those would undo the whole
         point of playing them. */
      if (p === m.intendedRx && m.passVia !== 'through' && m.passVia !== 'cross') {
        const toBall = Math.atan2(b.y - qy, b.x - qx);
        // A step towards it, not a retreat — at a third of the distance he was
        // giving up real ground every time he received the ball.
        const meet = clamp(dist(qx, qy, b.x, b.y) * 0.22, 0, 1.9);
        qx += Math.cos(toBall) * meet;
        qy += Math.sin(toBall) * meet;
      }

      /* The men behind the first man don't run at the same square metre — they
         come at it from either side, which is what a scramble looks like and
         which stops three team-mates arriving in a stack. */
      const rank = chasers2[p.team].indexOf(p);
      if (rank > 0) {
        const a = Math.atan2(qy - p.y, qx - p.x) + (rank === 1 ? 1.1 : -1.1);
        qx += Math.cos(a) * 1.6;
        qy += Math.sin(a) * 1.6;
      }

      const gxc = goalXFor(p.team);
      if (Math.abs(q.x - gxc) < 26) {
        // get goal-side of it so the next touch can be a shot
        const a = Math.atan2(PITCH_W / 2 - q.y, gxc - q.x);
        qx += Math.cos(a) * 1.3;
        qy += Math.sin(a) * 1.3;
      }
      steer(p, clamp(qx, 1, PITCH_L - 1), clamp(qy, 1, PITCH_W - 1), dt, SPRINT_SPEED);
      continue;
    }

    // committed to a challenge — dash at the carrier
    if (p.lunge > 0 && m.carrier) {
      steer(p, m.carrier.x + m.carrier.vx * 0.16, m.carrier.y + m.carrier.vy * 0.16, dt, 10.4);
      continue;
    }
    // beaten by the man — recovering, briefly out of the play
    if (p.beaten > 0) {
      const rb = shapedBase(p, m);
      steer(p, rb.x, rb.y, dt, MAX_SPEED * 0.55);
      continue;
    }

    // Attacking a delivery. The chaser is already handled above; this is
    // everybody else who can get on the end of it.
    if (del && delSpot.has(p)) {
      const spot = DELIVERY_SPOTS[delSpot.get(p)];
      const toGoal = Math.sign(goalXFor(del.team) - del.x) || 1;
      // a defender takes up the same space, a stride goal-side of it
      // The man contesting the drop itself stands almost on it; the rest hold
      // the ground a stride goal-side.
      const gside = p.team === del.team ? 0
        : toGoal * (delSpot.get(p) === 0 ? 0.7 : 1.5);
      steer(p, clamp(del.x + spot[0] * toGoal + gside, 1.5, PITCH_L - 1.5),
        clamp(del.y + spot[1], 1.5, PITCH_W - 1.5), dt, SPRINT_SPEED);
      continue;
    }

    const sb = shapedBase(p, m);
    let tx = sb.x + shiftX;
    let ty = sb.y + shiftY;
    let speed = MAX_SPEED;
    const chasing = (m.inFlight && p === m.intendedRx) || chasers2[p.team].includes(p);

    if (p.team === m.possession) {
      const t = m.tactics[p.team];
      const men = chasedMentality(m, p.team, t);
      const cf = CROSS_FREQ[t.crossFreq];
      const tempo = TEMPO[t.tempo];

      // the role shift already advances the team; a deep block just adds
      // an extra surge when it wins the ball back
      if (BLOCKS[t.block].line < 0) tx += dir * 5;

      // The back line follows the attack up the pitch — a centre-back holds
      // roughly 28m behind the ball and will come as far as halfway rather
      // than standing on his own box while his side attacks.
      if (p.depth < 0.32) {
        const support = b.x - dir * 28;
        const cap = PITCH_L / 2 + dir * 6;
        const want = dir > 0 ? Math.min(support, cap) : Math.max(support, cap);
        tx = dir > 0 ? Math.max(tx, want) : Math.min(tx, want);
      }
      ty += (sb.y - PITCH_W / 2) * 0.10;

      const gx = goalXFor(p.team);
      /* The cue to put bodies in the box.

         It used to need the ball WIDE, or already within nineteen metres of
         goal. So a side working the ball centrally between nineteen and
         thirty-four metres — which is most of how a team actually arrives in
         the final third — sent nobody at all, and the man who eventually got
         a shot away had an average of nought point nine team-mates in the box
         with him. That is why chances were worth 0.06 xG apiece against a
         real 0.11: not bad positions, just nobody else there, so every shot
         was taken by a man with two defenders on him and no alternative.

         Possession in the final third is itself the cue. */
      const crossOn = Math.abs(b.x - gx) < 34;

      /* Showing for your own keeper.

         When he had it, nothing changed for his side at all — they held
         whatever shape they were in, which for a back four defending a corner
         is four men stood in a line inside their own six-yard box. He then had
         to pick one of them, marked, with an attacker between. Half of what
         made his distribution look stupid was that there was nothing sensible
         to give it to.

         So they split: the full-backs go wide and high enough to be an angle
         rather than a square ball, the centre-backs open either side of the
         box, and one midfielder drops in short. */
      if (gkHold && gkHold.team === p.team && p !== m.intendedRx) {
        const wideness = Math.abs(p.by - PITCH_W / 2) / (PITCH_W / 2);
        if (p.depth < 0.36) {
          const side = Math.sign(p.by - PITCH_W / 2) || 1;
          const out = wideness > 0.55 ? 1 : 0;          // full-back or centre-half
          tx = gkHold.x + dir * (out ? 15 : 8);
          ty = PITCH_W / 2 + side * (out ? 24 : 11);
          speed = MAX_SPEED;
        } else if (p.depth < 0.55) {
          tx = gkHold.x + dir * 22;
          ty = PITCH_W / 2 + (p.by - PITCH_W / 2) * 0.7;
          speed = MAX_SPEED;
        }
        // and nobody stands in the six-yard box in front of him
        if (dist(p.x, p.y, gkHold.x, gkHold.y) < 6) {
          tx = gkHold.x + dir * 9;
          ty = p.y + (p.y > PITCH_W / 2 ? 4 : -4);
        }
        steer(p, clamp(tx, 2, PITCH_L - 2), clamp(ty, 2, PITCH_W - 2), dt, speed);
        continue;
      }

      if ((m.inFlight && p === m.intendedRx) || p === looseChaser) {
        // go and meet the ball, or passes only connect by luck
        tx = b.x + b.vx * 0.30;
        ty = b.y + b.vy * 0.30;
        speed = SPRINT_SPEED;
      } else if (p.oneTwo > 0 && p !== m.carrier) {
        // Given and gone — past his man and into the space beyond him, which
        // is the half of a one-two that has to happen off the ball.
        tx = p.x + dir * 11;
        ty = p.y + (PITCH_W / 2 - p.y) * 0.12;
        speed = SPRINT_SPEED;
      } else if (m.shotBy === p.team && p.depth > 0.42 && Math.abs(b.x - gx) < 30) {
        // A shot is away — get into the six-yard box for the rebound rather
        // than standing off admiring it.
        tx = gx - dir * (5.5 + (p.num % 3) * 3.5);
        ty = PITCH_W / 2 + ((p.num % 5) - 2) * 3.8;
        speed = SPRINT_SPEED;
      } else if (p === m.carrier) {
        // Carrying: sample a fan of directions and run into the emptiest
        // one, biased toward goal. This is what makes dribbling look like
        // a decision rather than a straight line into traffic.
        const wp = WING_PLAY[t.wingPlay];
        const winger = wp.on && Math.abs(p.y - PITCH_W / 2) > 14 && p.depth > 0.45;

        // Drive at the full-back, then do whatever the instruction says:
        // reach the byline and cross, or come inside onto your other foot.
        const cutIn = winger && WING_FOCUS[t.wingFocus].cutIn && Math.abs(p.x - gx) < 26;
        const holdWidth = winger && !cutIn ? 0.85 : 0;
        const aimY = winger
          ? PITCH_W / 2 + (p.y - PITCH_W / 2) * (cutIn ? 0.15 : 0.30 + 0.6 * holdWidth)
          : PITCH_W / 2 + (p.y - PITCH_W / 2) * (0.30 + 0.32 * cf.wideDrive);
        const baseAng = Math.atan2(aimY - p.y, gx - p.x);
        let bestAng = baseAng, bestCost = Infinity;

        /* The fan reached 1.3 radians either side of the line to goal — 74
           degrees — so "the emptiest direction" was only ever chosen from a
           forward arc. There was no option to turn out of trouble, go
           sideways, or come back on yourself, and measured over sixty
           decisions one touch in a thousand finished more than three metres
           further from the opposition goal than it started.

           That is not how anybody plays. A man who runs into a dead end turns
           and comes away from it; a full-back with the touchline and a winger
           in front of him goes back inside. Refusing to let him meant the
           alternative to a blocked forward run was a hopeful pass, which is
           most of where the aimless long balls were coming from.

           Forward is still strongly preferred — the cost term is unchanged
           and rises with the angle, so a backward carry has to beat a forward
           one by a distance before it is chosen. What is new is that it CAN
           be chosen. */
        for (const off of [0, 0.4, -0.4, 0.85, -0.85, 1.3, -1.3, 1.9, -1.9, 2.5, -2.5]) {
          const a = baseAng + off;
          const qx = p.x + Math.cos(a) * 8;
          const qy = p.y + Math.sin(a) * 8;
          if (qy < 2.5 || qy > PITCH_W - 2.5) continue;
          if ((qx - gx) * dir > 0) continue;             // never run past the goal line
          let cost = Math.abs(off) * 2.4;                 // prefer going forward
          /* Coming away from goal is a tool, not a habit, and it is a much
             worse idea in your own third than in theirs — carrying towards
             your own net under pressure is how a defender ends up in the
             situation everybody remembers. */
          const ownward = -(qx - p.x) * dir;
          if (ownward > 0) {
            cost += ownward * (Math.abs(p.x - ownGoalX(p.team)) < 30 ? 1.7 : 0.55);
          }
          for (const o of m.players) {
            if (o.team === p.team) continue;
            const d = dist(o.x, o.y, qx, qy);
            if (d < 5.5) cost += (5.5 - d) * 1.8;
          }
          if (cost < bestCost) { bestCost = cost; bestAng = a; }
        }

        tx = p.x + Math.cos(bestAng) * 9;
        ty = clamp(p.y + Math.sin(bestAng) * 9, 3, PITCH_W - 3);

        /* Unless he has decided to take somebody on, in which case he runs at
           the man. The fan above is what a player does when he is looking for
           space; going round the outside of a defender is not the same
           picture as going at him and through him. */
        if (p.taking > 0) {
          let mk = null, mkd = 1e9;
          for (const o of m.players) {
            if (o.team === p.team || o.gk || o.beaten > 0) continue;
            if ((o.x - p.x) * dir < -1) continue;
            const dd = dist(o.x, o.y, p.x, p.y);
            if (dd < mkd) { mkd = dd; mk = o; }
          }
          if (mk && mkd < 12) {
            const ang = Math.atan2(mk.y - p.y, mk.x - p.x);
            tx = p.x + Math.cos(ang) * 6;
            ty = clamp(p.y + Math.sin(ang) * 6, 3, PITCH_W - 3);
          }
        }

        // Nobody in front of him: this is a man running at a back line with
        // the ball, and he goes at close to full pace rather than the
        // shuffling carry speed used when he has to keep it close.
        let inFront = 0;
        for (const o of m.players) {
          if (o.team === p.team || o.gk) continue;
          if ((o.x - p.x) * dir > 0 && (o.x - p.x) * dir < 13 && Math.abs(o.y - p.y) < 8) inFront++;
        }
        speed = p.taking > 0 ? CARRY_SPEED * 1.15
          : inFront === 0 ? SPRINT_SPEED * 0.97
          : p.burst > 0 ? SPRINT_SPEED : CARRY_SPEED;
      // And the closer the ball gets, the further down the side the invitation
      // goes — a full-back does not join on halfway and does at the byline.
      } else if (crossOn && p.depth > (Math.abs(b.x - gx) < 24 ? men.join - 0.30
        : Math.abs(b.x - gx) < 32 ? men.join - 0.20 : men.join)) {
        // attack the box so a cross has someone to find
        tx = gx - dir * (8 + (p.num % 3) * 3);
        ty = PITCH_W / 2 + (sb.y - PITCH_W / 2) * 0.32;
        speed = SPRINT_SPEED;
        // mostly hold the line, but not perfectly
        const line = offsideLine(m, p.team);
        if ((tx - line) * dir > 0) tx = line - dir * 2.2;
      } else if (m.carrier) {
        const dc = dist(p.x, p.y, m.carrier.x, m.carrier.y);
        if (dc < 22) {
          tx += dir * 4 * tempo.urgency;
          ty += Math.sign(p.y - m.carrier.y) * 3;
        }
        if (p.depth > 0.6) { tx += dir * 5; speed = SPRINT_SPEED; }

        // Midfield support. Get around the ball rather than holding a line
        // 30m away — this is what creates a numerical overload in the middle
        // and gives the carrier angles instead of one covered option.
        if (p.depth > 0.30 && p.depth < 0.60 && dc < 34) {
          // A man in the middle of the pitch has no side of his own, so one
          // gets picked for him. It has to be picked in his side's frame: a
          // flat 1 sent both teams' central midfielders towards the same
          // touchline instead of mirroring them.
          const side = Math.sign(p.by - PITCH_W / 2) || dir;
          const ahead = p.depth > 0.45 ? 7 : -5;      // one beyond, one behind
          const sx = m.carrier.x + dir * ahead;
          const sy = m.carrier.y + side * (11 + (p.num % 3) * 3.2);
          /* How hard they actually come. At 0.22 to 0.42 this was a nudge —
             the target moved a fifth of the way towards the support position
             and the midfielder stayed essentially where his shape put him, so
             the overload the comment describes never materialised. It has to
             be most of the way there to be an overload at all.

             And it gets stronger the more outnumbered his side is around the
             ball, which is the thing that decides whether anybody needs to
             come and help in the first place. */
          let mine = 0, theirs = 0;
          for (const o of m.players) {
            if (o.gk) continue;
            const dd = dist(o.x, o.y, m.carrier.x, m.carrier.y);
            if (dd > 16) continue;
            if (o.team === p.team) mine++; else theirs++;
          }
          const outnumbered = clamp((theirs - mine + 1) / 3, 0, 1);
          // Strong enough to be an overload, not so strong that six players
          // end up inside ten metres of the ball and nobody has any space —
          // at 0.55-0.95 it was costing half a goal a match in congestion.
          const pull = clamp(0.36 + 0.16 * men.push + outnumbered * 0.26, 0, 0.78);
          tx += (sx - tx) * pull;
          ty += (sy - ty) * pull;
          if (outnumbered > 0.4) speed = SPRINT_SPEED;
        }

        // Late runs from midfield once the ball is in the final third. The
        // advanced midfielders actually arrive in the box; the deeper one
        // holds the edge in case it breaks down.
        const joinFrom = men.push >= 1.5 ? 0.36 : men.push <= 0.5 ? 0.52 : 0.44;
        if (p.depth > 0.34 && p.depth < 0.58 && Math.abs(b.x - gx) < 32) {
          if (p.depth > joinFrom) {
            tx = gx - dir * (13 + (p.num % 3) * 4.5);
            ty = PITCH_W / 2 + (sb.y - PITCH_W / 2) * 0.45;
            speed = SPRINT_SPEED;
            const line = offsideLine(m, p.team);
            if ((tx - line) * dir > 0) tx = line - dir * 2.2;   // stay onside
          } else {
            tx += dir * 9;                                       // hold the edge
          }
        }

        // Overlapping full-back: get outside the winger and beyond the ball
        if (OVERLAP[t.overlap].on && p.depth < 0.32
            && Math.abs(p.by - PITCH_W / 2) > 18
            && (b.x - PITCH_L / 2) * dir > -18
            && Math.sign(p.by - PITCH_W / 2) === Math.sign(b.y - PITCH_W / 2)) {
          tx = b.x + dir * (10 + (t.mentality === "attacking" ? 5 : 0));
          ty = p.by < PITCH_W / 2 ? 4.5 : PITCH_W - 4.5;
          speed = SPRINT_SPEED;
        }

        // Show for the ball. If someone is standing in the lane between me
        // and the carrier, step across to the open side of them — this is
        // what stops the carrier having no option but a blocked pass.
        if (dc > 6 && dc < 34) {
          const lx = p.x - m.carrier.x, ly = p.y - m.carrier.y;
          const len = Math.hypot(lx, ly) || 1;
          const ux = lx / len, uy = ly / len;

          let blocker = null, bd = 1e9;
          for (const o of m.players) {
            if (o.team === p.team) continue;
            const t = clamp(((o.x - m.carrier.x) * lx + (o.y - m.carrier.y) * ly) / (len * len), 0, 1);
            if (t < 0.1 || t > 0.95) continue;
            const qx = m.carrier.x + lx * t, qy = m.carrier.y + ly * t;
            const d = dist(o.x, o.y, qx, qy);
            if (d < bd) { bd = d; blocker = o; }
          }

          if (blocker && bd < 4.0) {
            const crossSide = ux * (blocker.y - m.carrier.y) - uy * (blocker.x - m.carrier.x);
            const away = crossSide > 0 ? 1 : -1;          // step off the blocked side
            tx += uy * away * 7;
            ty += -ux * away * 7;
            speed = SPRINT_SPEED;
          }
        }

        /* Decoy runs.

           Judging a pass on whether an opponent is sitting in the lane is
           only half of the problem it was meant to fix. On its own it means
           the middle is simply never used, because in a compact block
           somebody is always sitting in it — the pass model gets stricter and
           the football gets narrower, which is not the trade anybody wanted.

           The other half is moving the man who is sitting there. The only
           thing that moves a marker is somebody worth following, so: a player
           standing in the corridor his side wants to play through, who is not
           himself the option, runs out of it and takes his marker with him.
           The corridor opens for whoever stayed. */
        if (p !== m.intendedRx && p.running <= 0 && p.oneTwo <= 0 && p.depth > 0.28) {
          if (p.pull <= 0 && p.pullCd <= 0) {
            const ex = m.carrier.x + dir * 20, ey = PITCH_W / 2;
            const cx2 = ex - m.carrier.x, cy2 = ey - m.carrier.y;
            const cl = cx2 * cx2 + cy2 * cy2 || 1;
            const tt = clamp(((p.x - m.carrier.x) * cx2 + (p.y - m.carrier.y) * cy2) / cl, 0, 1);
            const qx = m.carrier.x + cx2 * tt, qy = m.carrier.y + cy2 * tt;
            const offLane = dist(p.x, p.y, qx, qy);
            let mk = 99;
            for (const o of m.players) {
              if (o.team === p.team || o.gk) continue;
              mk = Math.min(mk, dist(o.x, o.y, p.x, p.y));
            }
            // in the corridor, with somebody on him who is worth taking away
            if (offLane < 9 && tt > 0.15 && mk < 8 && Math.random() < 1.4 * dt) {
              const away = Math.sign(p.y - qy) || (p.num % 2 ? 1 : -1);
              p.pullX = clamp(p.x + dir * 5, 4, PITCH_L - 4);
              p.pullY = clamp(p.y + away * 13, 4, PITCH_W - 4);
              p.pull = 1.1;
              p.pullCd = 4.5;
            }
          }
          if (p.pull > 0) { tx = p.pullX; ty = p.pullY; speed = SPRINT_SPEED; }
        }

        /* Arriving late.

           The box was only ever filled by men who were already high up the
           pitch — the crossOn branch takes whoever is past the mentality's
           join threshold and sends them, and they get there with the ball.
           Nobody arrived *after* it. That run, from the edge, onto the
           cut-back or the second ball or the one that breaks loose, is the
           most dangerous thing a midfielder does and the sim had no notion
           of it at all. */
        if (p.depth > 0.30 && p.depth < 0.64 && p !== m.intendedRx &&
            Math.abs(b.x - gx) < 27 && (b.x - p.x) * dir > 2) {
          if (p.late <= 0 && p.lateCd <= 0 && Math.random() < 1.1 * dt) {
            p.late = 1.7;
            p.lateCd = 7;
          }
          if (p.late > 0) {
            tx = gx - dir * (10 + (p.num % 3) * 3.5);
            ty = PITCH_W / 2 + ((p.num % 3) - 1) * 5.5;
            speed = SPRINT_SPEED;
          }
        }
      }

      // Forwards play off the last defender rather than a fixed slot. This
      // is what creates a real offside line — and the odd stray run past it.
      const chasingBall = chasing;

      // Nobody aims for a position beyond the last defender. Runners onto a
      // pass are the exception — they are timing a run, not standing there.
      if (!chasingBall && p !== m.carrier && p.depth > 0.30) {
        const ln = lineFor[p.team];
        if ((tx - ln) * dir > -1.2) tx = ln - dir * 1.6;
      }
      // This runs whatever the ball is doing. Gating it on the ball being
      // near halfway left forwards camped on the last line while play was
      // 60m behind them, permanently offside with nothing pulling them back.
      if (p.depth > 0.58 && p !== m.carrier && !chasingBall) {
        const line = offsideLine(m, p.team);
        // Sit off the last man's shoulder rather than level with it — but by
        // a stride or two, not a bus length. At the old three to six metres a
        // line stepping up never caught anybody, which is half of why the
        // flag was dead law.
        //
        // The other half was the stray run. Every so often a forward goes too
        // early, and that is the one route by which offside can be given, so
        // the step has to carry him past the last man and the window has to
        // be long enough to run it in. Neither held. The offset was 2.2
        // against a depth of 3.2 to 5.8, so going early only ever made him
        // shallower; and the clock advances CLOCK_SCALE times faster than the
        // physics, so a 1.4 clock-second window left him a tenth of a second
        // on his feet to cover five metres. Measured over two hundred
        // matches, the pair of them produced six offsides.
        const depth = 1.3 + (p.num % 3) * 0.9;
        const stray = Math.sin(m.clock * 0.014 + p.phase) > 0.988 ? depth + 1.8 : 0;
        const hug = line + dir * stray - dir * depth;
        const beyond = (p.x - line) * dir;
        const ballNear = dist(p.x, p.y, b.x, b.y) < 30;

        /* A run in behind. Holding the shoulder is not a run — it is where you
           wait. The run is the moment you go, and it has to be made before the
           ball is played or there is nothing to play. So: when the man on the
           ball has his head up and time to pick it, and there is grass between
           the last defender and the keeper, a forward commits. He accepts
           being caught offside sometimes, which is the price of going early
           and the reason the flag exists at all. */
        if (p.runCd > 0) p.runCd -= dt;
        if (p.running > 0) p.running -= dt;
        const carrier = m.carrier;
        const spaceBehindLine = Math.abs(goalXFor(p.team) - line) > 18;
        const carrierLooking = carrier && carrier.team === p.team && carrier.sees &&
          pressureOn(m, carrier) < 2 && dist(carrier.x, carrier.y, p.x, p.y) < 45;
        if (p.running <= 0 && p.runCd <= 0 && carrierLooking && spaceBehindLine &&
            Math.random() < 0.5 * dt) {
          p.running = 1.0;
          p.runCd = 4.0;
        }

        // A man mid-run is exempt from the hold-the-line clamp, like a strayer
        // — that is what lets the run actually get in behind.
        p.straying = (stray || p.running > 0) ? 1 : 0;

        if (p.running > 0) {
          tx = line + dir * (4 + (p.num % 3) * 2.5);
          speed = SPRINT_SPEED;
          p.offHold = 0;
        } else if (beyond > 0.2 && !stray && ballNear) {
          // Worth holding a moment in case the line drops and plays him
          // onside — but only while a pass could actually reach him.
          p.offHold += dt;
          if (p.offHold > 0.5) { tx = hug; speed = SPRINT_SPEED; }
          else { tx = p.x; ty = p.y; speed = MAX_SPEED * 0.35; }
        } else {
          p.offHold = 0;
          tx = hug;                                 // hold the shoulder, both ways
          if (beyond > 0.2) speed = SPRINT_SPEED;   // no reason to stand there
        }

        // No forward stands 40m clear of his own ball. He drops in to stay
        // within range of the play — the ball pulls him, up the pitch and
        // across it. A man already running in behind is the exception: reeling
        // him back in is exactly what stops the run.
        if (p.running <= 0) {
          const maxAhead = b.x + dir * 32;
          tx = dir > 0 ? Math.min(tx, maxAhead) : Math.max(tx, maxAhead);
        }
        ty += (b.y - ty) * 0.22;
      }
    } else {
      const blk = BLOCKS[defTac.block];
      const engaged = Math.abs(b.x - myGoal) < blk.engage * pressCfg.reach;
      const rank = chasers.indexOf(p);

      // The keeper has it in his hands. Nobody can win it off him, so the
      // side drops off and gets set: one or two forwards stay up to make him
      // hurry it, everyone else retreats into their own half. Previously
      // this branch applied to the whole team, which sent all eleven
      // trotting up to stand around his box.
      const gkHolding = !!gkHold ||
        (m.carrier && m.carrier.gk && inBoxOf(m.carrier.team, m.carrier.x, m.carrier.y));
      if (gkHolding) {
        const presser = p.depth > 0.52 && rank >= 0 && rank < 2;
        if (presser) {
          // stand off him and cut the angle to the nearest short option
          const away = Math.atan2(p.y - m.carrier.y, p.x - m.carrier.x) || 0;
          tx = m.carrier.x + Math.cos(away) * 9;
          ty = m.carrier.y + Math.sin(away) * 9;
          speed = SHAPE_SPEED;
        } else {
          // get back and set the block, ignoring the pull toward the ball
          const sb2 = shapedBase(p, m);
          tx = sb2.x;
          ty = sb2.y + (b.y - PITCH_W / 2) * 0.12;
          const ownHalf = PITCH_L / 2 - dir * 3;
          tx = dir > 0 ? Math.min(tx, ownHalf) : Math.max(tx, ownHalf);
          speed = SHAPE_SPEED;
        }
      } else if (engaged && rank === 0) {
        tx = b.x + b.vx * 0.25;
        ty = b.y + b.vy * 0.25;
        speed = SPRINT_SPEED;
      } else if (engaged && rank > 0 && rank < pressCfg.pressers) {
        tx = b.x + (myGoal - b.x) * 0.22;
        ty = b.y + (PITCH_W / 2 - b.y) * 0.22;
        speed = SPRINT_SPEED;
      } else {
        tx += (myGoal - tx) * pressCfg.compress;
        ty += (PITCH_W / 2 - ty) * 0.12;
        // zonal, but pick up whoever is nearest your area
        let mark = null, md = 1e9;
        for (const o of m.players) {
          if (o.team === p.team || o.gk) continue;
          const d = dist(o.x, o.y, tx, ty);
          if (d < md) { md = d; mark = o; }
        }
        if (mark && md < 13) {
          tx += (mark.x - tx) * 0.45;
          ty += (mark.y - ty) * 0.50;
        }

        // The back line holds a set distance off the ball rather than
        // collapsing onto its own goal.
        if (p.depth < 0.34) {
          const wideness = Math.abs(p.by - PITCH_W / 2) / (PITCH_W / 2);
          const fullBack = wideness > 0.55;

          const gap = (blk.line >= 11 ? 12 : blk.line <= -8 ? 24 : 18) - LINE[defTac.line].push;
          const lineX = b.x - dir * gap;
          const floorX = myGoal + dir * 8;
          // full-backs play a couple of metres higher than the centre-backs
          const roleOffset = dir * (fullBack ? 2.5 : 0);
          const hold = (dir > 0 ? Math.max(lineX, floorX) : Math.min(lineX, floorX)) + roleOffset;
          // hold the line, and stay within a few metres of it — a back four
          // is close to flat, not a staircase
          tx = dir > 0 ? clamp(tx, hold, hold + 5) : clamp(tx, hold - 5, hold);

          // The back line slides across as a unit toward the ball, squeezing
          // as it goes. The far-side full-back tucks right in rather than
          // standing on his own touchline while the game happens elsewhere.
          const ballSide = Math.sign(b.y - PITCH_W / 2) || 1;
          const mySide = Math.sign(p.by - PITCH_W / 2) || dir;   // his frame, not the world's
          const near = ballSide === mySide;
          const slide = (b.y - PITCH_W / 2) * 0.5;
          const squeeze = near ? 0.85 : 0.42;     // far side narrows hard
          ty = PITCH_W / 2 + (p.by - PITCH_W / 2) * squeeze + slide;

          if (fullBack && near && Math.abs(b.y - PITCH_W / 2) > 14) {
            tx += dir * 2.5;                      // step out to the winger
            ty += (b.y - ty) * 0.4;
            speed = SPRINT_SPEED;
          }

          // whoever is nearest still picks up a runner in their area
          if (mark && md < 10) ty += (mark.y - ty) * 0.35;

          // A centre-back steps out to meet the man he is marking rather
          // than dropping off until the ball reaches the box.
          if (!fullBack && m.carrier && mark === m.carrier) {
            const dcb = dist(p.x, p.y, m.carrier.x, m.carrier.y);
            if (dcb < 16) {
              tx = m.carrier.x + m.carrier.vx * 0.2;
              ty = m.carrier.y + m.carrier.vy * 0.2;
              speed = SPRINT_SPEED;
            }
          }
        }
      }
    }

    speed *= p.att.pace;
    if (p.team === m.possession) {
      speed *= TEMPO[m.tactics[p.team].tempo].move;

      // The forwards and the nearest midfielder keep moving while he thinks —
      // running across the line, dragging a marker with them and opening a
      // lane. Everyone else takes a breath.
      if (settled && p !== m.carrier) {
        const near = dist(p.x, p.y, m.carrier.x, m.carrier.y);
        const runner = p.depth > 0.55 || (near < 20 && p.num % 2 === 0);
        if (runner) {
          // In the side's own frame, like the drift in shapedBase. In world
          // coordinates these runs carried whoever had the ball towards the
          // home side's goal, which is forward for one team and backwards for
          // the other.
          ty += Math.sin(m.clock * 0.55 + p.phase) * 7.5 * dir;
          tx += Math.cos(m.clock * 0.4 + p.phase) * 3.5 * dir;
          speed = SPRINT_SPEED;
        } else {
          speed *= 0.5;
        }
      }
    } else if (settled) {
      // the defending side holds its shape and jockeys rather than charging
      const rank = chasers.indexOf(p);
      if (rank < 0 || rank >= pressCfg.pressers) speed *= 0.6;
    }
    // Two men of the same side going for the same ball look like a scramble
    // and cost possession. Nudge them apart before they get there.
    for (const o of m.players) {
      if (o === p || o.team !== p.team || o.gk) continue;
      const gap = dist(o.x, o.y, p.x, p.y);
      if (gap > 3.2 || gap < 0.01) continue;
      const push = (3.2 - gap) * 1.6;
      tx += ((p.x - o.x) / gap) * push;
      ty += ((p.y - o.y) / gap) * push;
    }

    /* Physicality.

       Two opponents could stand inside each other, and nothing about being
       leaned on cost anybody anything — a striker and the centre-half marking
       him occupied the same square metre and both ran at full pace. Now they
       hold each other off, the stronger man gives less ground, and a man with
       a body on him carries the ball a shade slower.

       Applied to the target rather than the position so it reads as leaning
       and jostling rather than as two markers repelling like magnets. */
    let leanedOn = 0;
    for (const o of m.players) {
      if (o.team === p.team) continue;
      const gap = dist(o.x, o.y, p.x, p.y);
      if (gap > 1.7 || gap < 0.01) continue;
      const mine = p.att.tackle + p.att.aerial;
      const his = o.att.tackle + o.att.aerial;
      const give = clamp(his / (mine + his), 0.25, 0.75);
      const shove = (1.7 - gap) * 2.4 * give;
      tx += ((p.x - o.x) / gap) * shove;
      ty += ((p.y - o.y) / gap) * shove;
      leanedOn = Math.max(leanedOn, give);
    }
    if (leanedOn) speed *= 1 - leanedOn * 0.16;

    steer(p, clamp(tx, 1.5, PITCH_L - 1.5), clamp(ty, 1.5, PITCH_W - 1.5), dt, speed);

    // Give the keeper his room. Enforced on where they stand, not only where
    // they are heading — the same reason the ten-yard rule is.
    if (gkHold && p.team !== gkHold.team) {
      const dg = dist(p.x, p.y, gkHold.x, gkHold.y);
      if (dg < GK_ROOM) {
        const a = dg < 0.1 ? Math.random() * 6.283 : Math.atan2(p.y - gkHold.y, p.x - gkHold.x);
        p.x = clamp(gkHold.x + Math.cos(a) * GK_ROOM, 1, PITCH_L - 1);
        p.y = clamp(gkHold.y + Math.sin(a) * GK_ROOM, 1, PITCH_W - 1);
        p.vx *= 0.3; p.vy *= 0.3;
      }
    }
  }

  // Hold the line. This runs after everyone has moved, with the line
  // recomputed, because a defender processed later in the same step was
  // undoing a clamp applied earlier in it. Runners onto a pass in flight
  // are exempt — they are timing a run, and that is where offside comes from.
  const finalLine = [offsideLine(m, HOME), offsideLine(m, AWAY)];
  for (const p of m.players) {
    if (p.gk || p.team !== m.possession || p === m.carrier || p.depth <= 0.30) continue;
    if (m.inFlight && p === m.intendedRx) continue;
    if (p.straying) continue;          // he's gone early, let him be caught
    const d = attackDir(p.team);
    const ln = finalLine[p.team];
    if ((p.x - ln) * d > 1.0) {
      p.x = ln + d * 1.0;
      if (p.vx * d > 0) p.vx = 0;
    }
  }
}

/* ============================================================
   BALL, TACKLES, FOULS, RESTARTS
   ============================================================ */
/* Snapshot the ball on its way out of play so the renderer can follow it
   past the line. Called before the restart moves it. */
function keepGhost(m, life) {
  const b = m.ball;
  m.ghost = { x: b.x, y: b.y, z: b.z, vx: b.vx, vy: b.vy, vz: b.vz, life };
  m.ghostT = life;
}

function goal(m, team) {
  keepGhost(m, 1.6);
  // which shot this was, or -1 for an own goal / a goal with no shooter
  m.goalShot = (m.shooter && m.shooter.team === team) ? m.shotSeq : -1;
  m.score[team]++;
  const sc = m.shooter && m.shooter.team === team ? m.shooter : null;
  m.scorers.push({
    team,
    num: sc ? sc.num : null,
    own: !sc,
    minute: Math.max(1, Math.ceil(m.clock / 60)),
  });
  m.shooter = null;
  if (m.shotBy === team) m.onTarget[team]++;
  m.shotBy = null;
  m.flash = 1.8;
  announce(m, "GOAL");
  kickoff(m, other(team));
}

/* Posts and bar. The goal was a pure height-and-width test — anything crossing
   the line above CROSSBAR or outside the posts was simply "not a goal" and the
   ball carried on into the netting behind. Nothing ever came back off the
   frame, which happens several times a match and looks like nothing else in
   the game. */
const POST_R = 0.11;

function hitWoodwork(m) {
  const b = m.ball;
  for (const end of [HOME, AWAY]) {
    const gx = ownGoalX(end);
    // only as it reaches the line, and only if it is travelling that way
    if (Math.abs(b.x - gx) > 0.9) continue;
    if (Math.abs(b.vx) < 1 || Math.sign(gx - b.x) !== Math.sign(b.vx)) continue;

    const nearPost = Math.abs(b.y - GOAL_TOP) < POST_R + 0.05 ||
                     Math.abs(b.y - GOAL_BOT) < POST_R + 0.05;
    const post = nearPost && b.z < CROSSBAR;
    const bar = b.y > GOAL_TOP - POST_R && b.y < GOAL_BOT + POST_R &&
                Math.abs(b.z - CROSSBAR) < POST_R + 0.05;
    if (!post && !bar) continue;

    /* It comes back off the frame — and it comes back ONTO THE PITCH.

       The test fires anywhere within 0.9m of the goal line, which includes
       the far side of it, so the ball was being bounced while already out of
       play. It then needed two or three ticks to travel back over the line,
       and ballOut runs every one of them: post, rebound, still behind the
       line, awarded as a goal kick before it ever got out. Which is exactly
       what you saw. So it gets put back in front of the line as part of the
       rebound, where a ball coming off a post actually is. */
    const inward = end === HOME ? 1 : -1;
    b.vx = Math.abs(b.vx) * 0.55 * inward;
    b.x = gx + inward * 0.75;
    if (post) {
      /* Off the outside of the post it goes behind; off the inside it comes
         back across the face of goal. It was always driven outwards, which is
         half the reason every post produced a restart instead of a scramble. */
      const away = b.y < PITCH_W / 2 ? -1 : 1;
      const out = Math.random() < 0.45 ? away : -away;
      b.vy = out * (Math.abs(b.vy) * 0.5 + 2 + Math.random() * 3);
      b.y = clamp(b.y, 1.0, PITCH_W - 1.0);
    }
    if (bar) {
      b.z = CROSSBAR - 0.05;
      b.vz = -Math.abs(b.vz) * 0.5 - 1.5;
    }
    b.spin = 0;
    m.shotBy = null;                     // off the woodwork is not a save
    m.passer = null;
    m.intendedRx = null;
    m.offsideFlag = false;
    m.carrier = null;
    m.inFlight = true;
    m.passCooldown = 0.25;
    announce(m, bar ? 'Off the bar' : 'Off the post');
    return true;
  }
  return false;
}

function ballOut(m) {
  const b = m.ball;
  const last = m.lastTouch;

  // sidelines -> throw-in
  if (b.y < 0.4 || b.y > PITCH_W - 0.4) {
    m.shotBy = null;
    m.cornerRun = 0; m.cornerRunTeam = null;
    awardSetPiece(m, "throwIn", other(last), clamp(b.x, 2, PITCH_L - 2),
      b.y < 0.4 ? 0.15 : PITCH_W - 0.15);
    return true;
  }

  // goal lines
  for (const end of [HOME, AWAY]) {
    const gx = ownGoalX(end);          // the line `end` defends
    const past = end === HOME ? b.x < 0.5 : b.x > PITCH_L - 0.5;
    if (!past) continue;

    if (b.y > GOAL_TOP && b.y < GOAL_BOT && b.z < CROSSBAR) {
      goal(m, other(end));
      return true;
    }

    m.shotBy = null;
    // it carried over the line — let it be seen doing so
    keepGhost(m, 1.1);
    if (last === end) {
      // defender put it behind -> corner
      const att = other(end);
      m.cornerRun = m.cornerRunTeam === att ? m.cornerRun + 1 : 1;
      m.cornerRunTeam = att;
      m.corners[att]++;
      awardSetPiece(m, "corner", other(end),
        gx + (end === HOME ? 0.8 : -0.8),
        b.y < PITCH_W / 2 ? 0.8 : PITCH_W - 0.8);
    } else {
      m.cornerRun = 0; m.cornerRunTeam = null;
      awardSetPiece(m, "goalKick", end, gx + attackDir(end) * 6, PITCH_W / 2);
    }
    return true;
  }
  return false;
}

function foul(m, offender, victim) {
  m.fouls[offender.team]++;
  /* Given where the contact was, not where the ball was.

     The carrier keeps the ball a stride or more in front of him and the
     defender can be a stride the other side of him, so the whistle was going
     up to two and a half metres from either player — the free kick appeared
     somewhere neither of them was standing, which is most of what makes a
     foul look like it came from nowhere. The offence happens between the two
     of them, so that is where the ball is placed. */
  const x = clamp((offender.x + victim.x) / 2, 0.5, PITCH_L - 0.5);
  const y = clamp((offender.y + victim.y) / 2, 0.5, PITCH_W - 0.5);
  if (inBoxOf(offender.team, x, y)) {
    const g = ownGoalX(offender.team);
    awardSetPiece(m, "penalty", victim.team, g + attackDir(offender.team) * 11, PITCH_W / 2);
  } else {
    // Say what it was for. A free kick that announces itself as "Free kick"
    // and nothing else looks like one given for nothing.
    awardSetPiece(m, "freeKick", victim.team, x, y, "Foul");
  }
}

/* Flair. With a defender tight, a player can try to go past him. It comes
   off and the defender is beaten; it doesn't and he either loses it or is
   fouled — which is its own way of winning a free kick in a good area. */
function tryFlair(m, dt) {
  const c = m.carrier;
  if (!c || m.mustPass || c.flairCd > 0) return;
  if (c.gk) return;
  const cfg = FLAIR[m.tactics[c.team].flair];

  let mark = null, md = 1e9;
  for (const o of m.players) {
    if (o.team === c.team || o.beaten > 0) continue;
    /* The keeper counts, but only as the last man — one-on-one with him,
       inside the area, is the one place in football where a player is most
       likely to try something, and he was excluded outright so it never
       happened. Elsewhere he is not somebody you take on, he is somebody you
       pass the ball past. */
    /* The keeper counts as a man to beat inside the area — and also when the
       carrier is through on goal, which is the situation this is really for:
       nobody near him, the keeper the only thing left, and a decision to go
       round him rather than shoot. */
    if (o.gk) {
      const dG = Math.abs(c.x - goalXFor(c.team));
      let nearestDef = 99;
      for (const q of m.players) {
        if (q.team === c.team || q.gk) continue;
        nearestDef = Math.min(nearestDef, dist(q.x, q.y, c.x, c.y));
      }
      const through = dG < 26 && nearestDef > 6;
      if (!through && !(inBoxOf(o.team, c.x, c.y) && dG < 15)) continue;
    }
    const d = dist(o.x, o.y, c.x, c.y);
    if (d < md) { md = d; mark = o; }
  }
  /* A man who has decided to take his marker on tries something, and tries it
     as the defender gets close rather than at whatever rate the instruction
     dials in. That decision is made in decide(); this is where it comes out. */
  const committed = c.taking > 0;
  const keeper = mark && mark.gk;
  if (!mark || md > (keeper ? 4.0 : committed ? 3.2 : 2.4)) return;

  /* Who tries things. A centre-half does not attempt a roulette on halfway,
     and the rate was flat across the whole team — so the sim's tricks were
     spread evenly over eleven players, which is not what anybody watching
     football sees. It scales with how far up the pitch he plays and how wide,
     so wingers and forwards do nearly all of it and the back four almost
     none. */
  const wideness = Math.abs(c.by - PITCH_W / 2) / (PITCH_W / 2);
  const flairFor = c.depth > 0.62 ? 1.2
    : c.depth > 0.45 ? 0.7 + wideness * 0.45
    : c.depth > 0.32 ? 0.30
    : 0.10;

  // Rounding the keeper is a thing that happens sometimes, not every time.
  const rate = cfg.rate * flairFor * (keeper ? 1.4 : committed ? 2.2 : 1);
  if (Math.random() > rate * dt) return;

  c.taking = 0;
  c.takeCd = 4.0;
  c.flairCd = 0.9;
  c.showboat = SHOWBOAT_TIME;
  c.skill = SKILL_NAMES[Math.floor(Math.random() * SKILL_NAMES.length)];
  c.skillT = 0;
  c.skillDur = SKILL_MOVES[c.skill];
  const bonus = c.depth > 0.55 ? 0.07 : 0;
  // Rounding a keeper is harder than beating a full-back, and he has hands.
  const odds = keeper ? cfg.success * 0.62 : cfg.success + bonus;

  if (Math.random() < odds) {
    mark.beaten = keeper ? 0.9 : 0.55;   // gone past him, and a keeper stays down
    mark.lungeCd = 0.5;
    mark.dive = 0;
    mark.claim = 0;
    c.burst = 0.9;
    m.carryTime = Math.max(0, m.carryTime - 1.2);
    /* He has just beaten his man — he drives on. `taking` was cleared above
       for both outcomes, which meant that a fraction of a second after a
       successful skill move the recycle branch was free to fire, and the
       thing you saw was a player go past a defender and immediately knock it
       back to his centre-half. Beating somebody is a reason to keep going. */
    c.taking = 1.3;
    m.decide = Math.max(m.decide, 0.5);
    return;
  }

  /* Didn't come off against the keeper. Usually he reads it and picks the
     ball up, which is not a foul and not a tackle and is the reason trying it
     is a risk. Sometimes he goes through the man instead — and a keeper who
     takes a forward down inside his own area concedes a penalty like anybody
     else, which is the other half of why going round him is worth trying. */
  if (keeper) {
    if (inBoxOf(mark.team, c.x, c.y) && Math.random() < 0.22) {
      foul(m, mark, c);
      return;
    }
    m.carrier = mark;
    m.possession = mark.team;
    m.lastTouch = mark.team;
    m.carryTime = 0;
    m.lastCarrier = mark;
    mark.holding = 0.7;
    m.decide = 0.4;
    return;
  }

  /* Otherwise he is dispossessed, and sometimes fouled — but only if the
     defender is actually on him. This fired at up to 2.4m, which is two
     metres of clear grass between the two of them: a free kick awarded for
     nothing anybody could see, which is exactly what a phantom foul is. */
  const boxCare = inBoxOf(mark.team, mark.x, mark.y) ? 0.06 : 1;
  if (md < 1.5 && Math.random() < 0.22 * boxCare) { foul(m, mark, c); return; }
  m.carrier = mark;
  m.possession = mark.team;
  m.lastTouch = mark.team;
  m.carryTime = 0;
  m.lastCarrier = mark;
  m.decide = 0.25;
}

/* Challenges. A defender commits to a tackle — a short dash at the
   carrier. Win it and they take the ball; mistime it and they are beaten
   and the carrier goes past, with a share of those becoming fouls.
   Aggression sets how often they commit, not how often they foul. */
function contest(m, dt) {
  const c = m.carrier;
  if (!c) return;
  /* Ball in his hands — nobody may challenge for it. The `holding` clause is
     what makes that true at a corner: a keeper who claims one is momentarily
     several metres off his line among eight attackers, and the box test alone
     let anyone who caught him a stride outside it take it back off him. It
     also covers the instant after he lets go of it. */
  if (c.gk && (c.holding > 0 || inBoxOf(c.team, c.x, c.y))) return;

  for (const o of m.players) {
    if (o.team === c.team || o.beaten > 0) continue;
    // a keeper only gets involved for a man on the ball in his own area —
    // and if he gets it wrong it is a penalty like any other foul
    if (o.gk && !(inBoxOf(o.team, c.x, c.y) && dist(o.x, o.y, c.x, c.y) < 9)) continue;
    const d = dist(o.x, o.y, c.x, c.y);

    if (o.lunge > 0) {
      if (d > 1.25) continue;
      const agg = AGGRESSION[m.tactics[o.team].aggression];
      o.lunge = 0;
      // Recovery cooldowns belong to the same time-lapse as the dwell timer.
      // A foul needs a defender in range of a man on the ball, so the number
      // of fouls in a match is set by how much of the match a defender is
      // available to challenge. Left at real-time lengths while deliberation
      // was compressed, these took a third of the challenges out of the game
      // and the foul count fell with them.
      o.lungeCd = 0.6;

      // a quick carrier is harder to dispossess cleanly
      const carrierSpeed = Math.hypot(c.vx, c.vy);
      m.scramble = false;
      m.mustShoot = false;
      m.intent = null;
      m.assistBy = null;
      m.fromKickoff = false;
      // A sliding challenge from range is harder to time.
      const slid = o.slide > 0;
      if (Math.random() < (slid ? 0.50 : 0.64) * o.att.tackle - carrierSpeed * 0.035) {
        // a third of challenges knock it loose rather than winning it clean
        if (Math.random() < 0.2) {
          const a = Math.random() * Math.PI * 2;
          const pace = 9 + Math.random() * 8;
          m.ball.vx = Math.cos(a) * pace;
          m.ball.vy = Math.sin(a) * pace;
          m.ball.vz = Math.random() * 2.5;
          m.carrier = null;
          m.possession = o.team;
          m.lastTouch = o.team;
          m.passer = o;
          m.passCooldown = 0.3;
          return;
        }
        m.carrier = o;
        m.possession = o.team;
        m.lastTouch = o.team;
        m.carryTime = 0;
        m.lastCarrier = o;
        m.mustPass = false;
        m.decide = 0.25;
        return;
      }

      o.beaten = slid ? 0.85 : 0.5;         // gone past — and a slide stays down
      const careful = o.gk ? 0.30 : inBoxOf(o.team, o.x, o.y) ? 0.03 : 1;
      /* A missed challenge is only a foul if he actually caught the man. He
         can be a metre and a quarter away when the challenge resolves, which
         with the carrier's own stride is a body's width of clear grass — and
         a free kick given across a gap you can see is a free kick given for
         nothing. He has to be on him.

         The rate is up to compensate, so the same challenges produce roughly
         the same number of fouls; what changes is that the ones given are the
         ones where the two players are together. */
      /* And he has to have gone THROUGH him, not merely been beside him.

         Distance alone was still giving fouls that read as nothing: two
         players a metre apart, both moving, and a whistle. A foul is contact
         — one man arriving into another — so it now also asks whether the
         defender was actually closing on the carrier when the challenge
         failed. A defender running alongside, or away, has not fouled
         anybody. */
      const gap = dist(o.x, o.y, c.x, c.y);
      const closingIn = (c.x - o.x) * (o.vx - c.vx) + (c.y - o.y) * (o.vy - c.vy);
      // Any arrival into him counts; only a defender moving AWAY is let off.
      const wentThrough = gap < 1.15 && closingIn > -0.4;
      if (wentThrough && Math.random() < agg.foulOnFail * 1.7 * careful * (slid ? 1.7 : 1)) {
        foul(m, o, c);
        return;
      }
      continue;
    }

    if (o.lungeCd > 0 || d > 4.2) continue;
    /* And he has to be able to get to him.

       The test was where the carrier is standing NOW, which is not what a
       defender is looking at. He is looking at where the man is going, and
       he does not throw himself at somebody who is already past him — he
       stays on his feet and runs with him.

       Measured, 213 challenges a match were committed and 129 of them — sixty
       per cent — never got within the metre and a quarter at which contest()
       resolves anything. The lunge simply ran out: the defender was marked
       beaten for a third of a second, cooled down for another six tenths,
       and nothing happened at all. No tackle, no contact, no whistle, and a
       defender out of the game for nearly a second for it. That is not a
       missed tackle, it is a tackle that was never on, and there were more
       of them than there were of every other outcome put together.

       Half a second is how long a lunge lasts before tick() expires it, so
       that is the horizon: where will he be when this lands. A man running
       away at 6 m/s is three metres further on by then, and diving in at him
       from four is exactly the challenge that should not be attempted. */
    const lungeT = 0.5;
    if (dist(o.x, o.y, c.x + c.vx * lungeT, c.y + c.vy * lungeT) > 3.6) continue;
    const agg = AGGRESSION[m.tactics[o.team].aggression];
    if (Math.random() < agg.commit * dt) {
      o.lunge = 0.5;
      /* A committed challenge. Everything was the same short dash before
         this — there was no such thing in the game as a defender throwing
         himself at it from three metres, which is the challenge that gets
         seen, gets mistimed, and gets given.

         Going in from range is harder to time and harder to pull out of, so
         it wins the ball less often and fouls more when it misses. The
         renderer draws him low with a leg out. */
      // Rare. A side does not put in forty of these a match — most challenges
      // are a step across and a foot in, and the slide is the one you notice.
      o.slide = d > 2.9 && Math.random() < 0.16 ? 0.55 : 0;
    }
  }
}

function updateBall(m, dt) {
  const b = m.ball;
  if (m.passCooldown > 0) m.passCooldown -= dt;

  // A delivery is live only while it is in the air and nobody has touched it.
  if (m.delivery && (m.carrier || m.restart > 0 || (b.z < 0.6 && b.vz <= 0.2))) {
    m.delivery = null;
  }

  if (m.carrier) {
    const cc = m.carrier;
    const sp = Math.hypot(cc.vx, cc.vy);
    /* How far in front of him he keeps it. A fixed stride meant a man
       jockeying with a defender on his shoulder and a man running into forty
       metres of grass carried the ball in exactly the same way. Close control
       is literally the distance between the man and the ball changing, so it
       changes: tucked under him when somebody is on him or he has decided to
       take his man on, knocked well ahead when he is running into space. */
    let lead = 1.25;
    if (cc.taking > 0 || pressureOn(m, cc) >= 1) lead = 0.8;
    else if (sp > 6.6) lead = 1.25 + Math.min(0.9, (sp - 6.6) * 0.38);
    m.carryLead = lead;
    const ox = sp > 0.4 ? (cc.vx / sp) * lead : attackDir(cc.team) * lead;
    const oy = sp > 0.4 ? (cc.vy / sp) * lead : 0;
    b.x += (m.carrier.x + ox - b.x) * Math.min(1, dt * 22);
    b.y += (m.carrier.y + oy - b.y) * Math.min(1, dt * 22);
    b.z = 0; b.vz = 0;

    // Judge this on the man, not the ball. The ball is carried a stride
    // ahead of him, so testing its position put it out of play every time
    // anyone ran along the touchline — which traded throw-ins forever.
    if (m.throwGrace > 0) {
      m.throwGrace -= dt;
    } else if (m.carrier.y < 0.25 || m.carrier.y > PITCH_W - 0.25) {
      b.y = clamp(b.y, 0.1, PITCH_W - 0.1);
      ballOut(m);
      return;
    }
    b.y = clamp(b.y, 0.25, PITCH_W - 0.25);
    b.x = clamp(b.x, 0.25, PITCH_L - 0.25);
    return;
  }

  b.x += b.vx * dt;
  b.y += b.vy * dt;

  // Rolling friction. The exponential term takes the sting out of a firmly
  // struck ball early; the constant term is what actually brings it to rest
  // rather than letting it creep on forever.
  const airborne = b.z > 0.02 || b.vz > 0.02;
  if (airborne) {
    b.vz -= GRAVITY * dt;
    b.z += b.vz * dt;

    // sidespin bends the flight — this is what makes a corner swing
    if (b.spin) {
      const sp = Math.hypot(b.vx, b.vy) || 1;
      const ux = b.vx / sp, uy = b.vy / sp;   // cache: vy must not use the new vx
      // Magnus force scales with pace. A fixed force kept turning a slow
      // ball, which is why one could curl round on itself in the corner.
      const bend = b.spin * clamp(sp / 18, 0, 1.2);
      b.vx += -uy * bend * dt;
      b.vy += ux * bend * dt;
    }
    const air = Math.pow(0.915, dt);     // less drag than grass, but not none
    b.vx *= air; b.vy *= air;

    if (b.z <= 0) {
      b.z = 0;
      b.spin = 0;                       // it stops swerving once it lands
      /* It bounces. The old threshold only let a ball dropping at more than
         3.5 m/s come back up, so a cross, a clipped pass and a header down
         all landed and stopped dead — the ball had two states, in the air and
         glued to the carpet, with nothing in between. A ball that skips once
         or twice before it settles is most of what a long ball looks like,
         and it is what makes a bouncing ball awkward to control. */
      if (b.vz < -0.9) {
        b.vz = -b.vz * (b.vz < -6 ? 0.40 : 0.48);
        b.vx *= 0.80; b.vy *= 0.80;
      } else b.vz = 0;
    }
  } else {
    b.z = 0; b.vz = 0; b.spin = 0;
    const fr = Math.pow(BALL_FRICTION, dt);
    b.vx *= fr; b.vy *= fr;
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > 0.01) {
      const dv = Math.min(sp, ROLL_DRAG * dt);
      b.vx -= (b.vx / sp) * dv;
      b.vy -= (b.vy / sp) * dv;
    }
  }

  // Once a pass has run out of pace it is simply a loose ball. Without
  // this it stays "in flight" forever and nobody is sent to chase it.
  if (m.inFlight && Math.hypot(b.vx, b.vy) < 4 && b.z < 0.3) {
    m.inFlight = false;
    m.intendedRx = null;
    m.offsideFlag = false;
  }

  // Clearing off the line. Has to be tested before the goal is given, and
  // with a proper radius — no hands, so it is far harder than a save and
  // often only half-clears.
  if (b.z < 2.2) {
    for (const p of m.players) {
      if (p.gk) continue;
      const ownG = ownGoalX(p.team);
      if (Math.abs(b.x - ownG) > 3.5) continue;
      if (b.y < GOAL_TOP - 1.5 || b.y > GOAL_BOT + 1.5) continue;
      if (b.vx * attackDir(other(p.team)) < 4) continue;   // must be going in
      if (dist(p.x, p.y, b.x, b.y) > 2.2) continue;
      if (Math.random() > 0.5) continue;
      const away = attackDir(p.team);
      const side = Math.sign(b.y - PITCH_W / 2) || 1;
      b.vx = away * (5 + Math.random() * 9);
      b.vy = side * (5 + Math.random() * 11);
      b.vz = 1.5 + Math.random() * 4;
      b.spin = 0;
      m.shotBy = null;
      m.passer = p;
      m.lastTouch = p.team;
      m.passCooldown = 0.3;
      m.intendedRx = null;
      m.carrier = null;
      m.inFlight = true;
      announce(m, "Off the line");
      return;
    }
  }

  if (hitWoodwork(m)) return;
  if (ballOut(m)) return;

  // A keeper has hands and gets first call on a high ball in his own area.
  // Without this an attacker earlier in the array simply headed it first.
  if (b.z > 0.9 && b.z < CLAIM_HEIGHT) {
    for (const p of m.players) {
      if (!p.gk || !inBoxOf(p.team, b.x, b.y)) continue;
      // And he has to be inside his own area himself, not just the ball. He
      // may only handle it in there, and challenging him is only barred in
      // there — so a claim made outside it announced "Claimed" and then had
      // the ball taken off him a moment later.
      if (!inBoxOf(p.team, p.x, p.y)) continue;
      if (m.passer === p && m.passCooldown > 0) continue;
      if (p.claim <= 0) continue;          // only if he came for it
      const reachUp = 2.1;
      if (dist(p.x, p.y, b.x, b.y) > reachUp) continue;

      m.shotBy = null;
      m.passer = p;
      m.lastTouch = p.team;
      m.intendedRx = null;
      m.offsideFlag = false;
      m.assistBy = null;
      if (Math.random() < 0.62) {
        m.carrier = p;
        m.possession = p.team;
        m.inFlight = false;
        b.vx = 0; b.vy = 0; b.vz = 0; b.z = 0; b.spin = 0;
        m.decide = 0.5;
        announce(m, "Claimed");
      } else {
        const away = attackDir(p.team);
        const side = Math.sign(b.y - PITCH_W / 2) || 1;
        b.vx = away * (9 + Math.random() * 8);
        b.vy = side * (7 + Math.random() * 10);
        b.vz = 3.5 + Math.random() * 3;
        b.spin = 0;
        m.carrier = null;
        m.inFlight = true;
        m.passCooldown = 0.4;
      }
      return;
    }
  }

  /* Nearest man gets to it first. This used to walk m.players in declaration
     order and hand the ball to the first player inside his own reach — and
     m.players is the home eleven followed by the away eleven, so every
     fifty-fifty that two opponents could both reach was settled by which
     squad was built first. Always the home side. Measured on mirror matches,
     with the same shape at both ends, it was worth about two points of
     possession. The keeper's longer reach still applies; the order only
     decides who is asked first, not who is eligible.

     Only players who could actually reach it are worth ordering — 2.95 is the
     largest reach any of them has, so anything past 3.5m fails the reach test
     below whatever order it is asked in. On most ticks that leaves nobody,
     and sorting all twenty-two every tick to discover that costs about a
     third of the run time. */
  const nearest = [];
  for (const p of m.players) {
    if (dist(p.x, p.y, b.x, b.y) < 3.5) nearest.push(p);
  }
  /* In the air, being nearest is not the same as winning it. A ball above
     chest height is a duel, and a duel is won by the man who gets up to it —
     so a centre-half beats a winger to one they are equally close to, which
     is what makes a corner worth defending with your big men. On the floor
     this term is zero and the order is pure distance, as before. */
  const airBall = b.z > 1.1;
  if (nearest.length > 1) {
    const key = (q) => dist(q.x, q.y, b.x, b.y) - (airBall ? q.att.aerial * 0.75 : 0);
    nearest.sort((a, z) => key(a) - key(z));
  }

  for (const p of nearest) {
    if (m.passer === p && m.passCooldown > 0) continue;
    let chested = false;
    let r = p.gk ? (p.dive > 0 ? 2.08 : p.claim > 0 ? 2.4 : 1.8) : 0.85;
    if (p === m.intendedRx) r = 2.95;
    const pace0 = Math.hypot(b.vx, b.vy);
    const opponent = m.passer ? p.team !== m.passer.team : true;
    /* Throwing a body in the way of a shot. 1.55m is not a body — it is a
       body and a metre of fresh air either side, and with eight defenders in
       the box it meant 39% of every shot that was going in got blocked, at a
       mean of thirteen metres from the goal line. That, not the keeper, was
       what was stopping the goals: only four in ten shots on target ever got
       within reach of him at all. A block is a body. */
    let reach = (!p.gk && opponent && pace0 > 24 && b.z < 1.9) ? 0.95 : r;
    // Arriving at a man who is not watching it. He can still get a foot to it
    // — it is not a blindfold — but he is a good deal less likely to.
    if (!p.sees) reach *= 0.6;
    const gap = dist(p.x, p.y, b.x, b.y);

    /* A defender does not watch a pass roll past him. Controlling one takes
       him getting his body to it, which is the 0.85 above; getting a foot to
       it does not, and at a stretch is most of what an interception actually
       is. Without this a ball played a metre and a half in front of a
       defender went straight through him untouched, which is the single
       oddest thing in the game to watch.

       Kept entirely separate from the control path: a stab is a stab. It
       knocks the ball away and leaves it loose, it does not hand him the ball
       at his feet with his head up. */
    /* Not at a shot. This is the interception model for PASSES — a defender
       stretching a leg out at a ball rolling past him — and `placed` leaves
       the boot at 21 m/s, inside the band, so defenders were reading shots
       like passes and poking them away from a metre and a half. A shot is
       blocked by getting a body in the way, which is the branch below. */
    if (!p.gk && opponent && p !== m.intendedRx && b.z < 1.2 && m.shotBy === null &&
        pace0 > 4 && pace0 <= 24 && gap >= reach && gap < INTERCEPT_REACH) {
      if (p.stabCd > 0 || !p.sees) continue;
      // Only on the way in. A ball already past him is past him — without
      // this he stabs at one going away from him, which is worse to watch
      // than the problem being fixed.
      if ((b.x - p.x) * b.vx + (b.y - p.y) * b.vy > 0) continue;
      p.stabCd = INTERCEPT_CD;
      // A ball hit hard is harder to get a foot to than one rolled.
      const odds = INTERCEPT_ODDS * p.att.tackle * clamp(1.35 - pace0 / 24, 0.35, 1);
      if (Math.random() > odds) continue;
      deflect(m, p);
      return;
    }

    if (gap >= reach) continue;

    /* A keeper does not put a hand to a shot that is missing. Stopping him
       running at one — the dive branch in assignTargets — is only half of it;
       he also stands in the way of some, and gloving a ball that was going a
       metre wide turns a goal kick into a corner. Judged exactly the way the
       on-target counter below judges it, which already knew the difference
       and was the only part of him that did. */
    if (p.gk && m.shotBy !== null && p.team !== m.shotBy && p.dive <= 0 && Math.abs(b.vx) > 1) {
      const gl = ownGoalX(p.team);
      const tw = (gl - b.x) / b.vx;
      if (tw > 0) {
        const yW = b.y + b.vy * tw;
        const zW = b.z + b.vz * tw - 0.5 * GRAVITY * tw * tw;
        if (yW < GOAL_TOP - 1.0 || yW > GOAL_BOT + 1.0 || zW > CROSSBAR + 0.5) continue;
      }
    }

    // How high he can get to it. A big centre-half reaches a good deal above
    // a small winger, and a flat ceiling for everybody was why every high
    // ball was won by whoever happened to be standing closest.
    const ceiling = p.gk ? CLAIM_HEIGHT : HEAD_HEIGHT + (p.att.aerial - 1) * 1.2;
    if (b.z > ceiling) continue;

    /* A ball across the face of goal is stretched for, not controlled — a
       sliding poke at it from close range.

       This looks like too much football: it fires about six times a match,
       a fifth of every shot in the game, and converts three per cent. So it
       was tightened — pace over 11 m/s rather than 6, because at a gentle
       roll he takes a touch instead of going to ground, and the ball had to
       be crossing him rather than played to him, because a ball running
       through to a forward is one he should be finishing properly.

       It measured clearly worse and was reverted. Pokes fell as intended, but
       xG went UP by 0.75 a match while goals went DOWN 0.3, and goals per xG
       fell from 0.90 to 0.70. The reason is what the poke is actually FOR: it
       resolves a loose ball in the six-yard box. Take it away and the ball
       stays live in there, pinballing between bodies and generating chance
       after high-priced chance that goes nowhere. That is worse to watch than
       an ugly stab, and it is worse on every number.

       So the count stays high on purpose. If this is revisited, the thing to
       change is what happens to the ball AFTER the stab, not whether he is
       allowed to make it. */
    if (!p.gk && b.z < 0.9 && Math.hypot(b.vx, b.vy) > 6) {
      const agx = goalXFor(p.team);
      if (Math.abs(b.x - agx) < 11 && Math.abs(b.y - PITCH_W / 2) < 11
          && dist(p.x, p.y, b.x, b.y) < 1.35 && p !== m.carrier) {
        m.shots[p.team]++;
        m.shotBy = p.team;
        m.shooter = p;
        // A stretching poke at a ball across the face of goal. This used to be
        // an ad-hoc 0.8 multiplier applied outside the model, which meant the
        // number booked into m.xg and the number the model produced were
        // different things — enough to put the match totals and the fitter
        // permanently at odds. It is a property of the chance, so it belongs
        // in the model, where it can be fitted like everything else.
        m.shotVia = 'poke';
        const slideXg = xgAt(m, p.team, p.x, p.y, pressureOn(m, p), false, true);
        m.xg[p.team] += slideXg;
        m.shotSeq++;
        m.shotFeat = { ...m.xgFeat, seq: m.shotSeq };
        if (m.assistBy && m.assistBy.team === p.team && m.assistBy !== p) m.xa[p.team] += slideXg;
        m.assistBy = null;
        const aimY = PITCH_W / 2 + (Math.random() - 0.5) * 5.4;
        const a = Math.atan2(aimY - p.y, agx - p.x) + (Math.random() - 0.5) * 0.30 / p.att.shoot;
        const power = 13 + Math.random() * 8;
        b.vx = Math.cos(a) * power;
        b.vy = Math.sin(a) * power;
        b.vz = 0.4 + Math.random() * 0.9;
        b.spin = 0;
        p.showboat = SHOWBOAT_TIME * 0.6;
        m.passer = p;
        m.lastTouch = p.team;
        m.passCooldown = 0.3;
        m.intendedRx = null;
        m.offsideFlag = false;
        m.carrier = null;
        m.inFlight = true;
        return;
      }
    }

    /* Above waist height it can only be headed — unless it is dropping onto
       a man who is expecting it and is not being jumped with, in which case
       he takes it down on his chest. The touch is heavy and costs him a beat,
       which is the point: a ball out of the air is not the same as one played
       to his feet. Without this every lofted pass ended in a header, and a
       side playing out from the back could never receive one. */
    if (!p.gk && b.z > CONTROL_HEIGHT) {
      /* Nobody near him and the ball coming down: he lets it drop and takes a
         touch. Heading is what you do when you cannot afford to wait, and the
         sim treated every ball above waist height as a header regardless —
         so a man alone in forty metres of space nodded a dropping pass away
         from himself for no reason at all.

         Waiting is literally doing nothing: skip him this tick and the ball
         falls a few more centimetres. Within a few dozen ticks it is under
         1.1m and he controls it like any other pass. */
      let nearest = 99;
      for (const o of m.players) {
        if (o.team === p.team || o.gk) continue;
        nearest = Math.min(nearest, dist(o.x, o.y, b.x, b.y));
      }
      /* Take it down. Heading it is what you do when you have no choice.

         Measured over sixty matches the ball was off the floor for 9.8% of
         live play and there were 40.6 headers a match against only 12.1
         crosses — which is the tell, because it means most headers were not
         won from a delivery at all. They came from each other. A header puts
         the ball straight back up at heading height for somebody else to
         head, and once a passage of play left the ground it stayed there.

         Both gates below were too tight to break that. A man needed FOUR
         metres of space merely to let a dropping ball land, and to take a
         touch out of the air he had to be the intended receiver, be good in
         the air, and have it arriving under thirteen metres a second — so in
         any crowd, which is where every second ball happens, nobody ever
         controlled anything.

         A player with three metres and a ball dropping in front of him kills
         it. He does not nod it on to nobody. Relaxing these two alone took
         headers from 40.6 to 33.4 a match; it is CONTROL_HEIGHT above that
         does most of the rest, by not calling a ball at waist height a
         header in the first place. */
      const free = nearest > 3.0 && b.vz < 0.5 && b.z < 3.2;
      if (free && Math.hypot(b.vx, b.vy) < 17) continue;   // let it come down

      const settleIt = b.z < 1.9 && b.vz < 0.5 && Math.hypot(b.vx, b.vy) < 15 &&
        (p === m.intendedRx || nearest > 3.2) && p.att.aerial > 0.75;
      if (!settleIt || nearest < 2.0) { p.jump = 0.35; header(m, p); return; }
      chested = true;
    }

    // hit hard and not expecting it — it comes off the body
    const pace = Math.hypot(b.vx, b.vy);
    if (!p.gk && opponent && p !== m.intendedRx && pace > 24 && b.z < 1.9
        && dist(p.x, p.y, b.x, b.y) < 0.95) {
      deflect(m, p);                 // thrown in the way of a shot
      return;
    }
    // And a glancing touch on anything struck firmly, but only if it is
    // genuinely at him rather than merely inside his control radius.
    if (!p.gk && opponent && p !== m.intendedRx && pace > 17 &&
        dist(p.x, p.y, b.x, b.y) < 0.8 && Math.random() < 0.18) {
      deflect(m, p);
      return;
    }

    // a keeper can only hold a firm shot so often — the rest are parried
    // On target only if it was actually going in. A keeper diving across to
    // a ball flying wide of the post has not made a save.
    if (p.gk && m.shotBy !== null && p.team !== m.shotBy) {
      const gLine = ownGoalX(p.team);
      const tt = Math.abs(gLine - b.x) / Math.max(1, Math.abs(b.vx));
      const yAt = b.y + b.vy * tt;
      const zAt = Math.max(0, b.z + b.vz * tt - 0.5 * GRAVITY * tt * tt);
      if (yAt > GOAL_TOP && yAt < GOAL_BOT && zAt < CROSSBAR) m.onTarget[m.shotBy]++;
      m.shotBy = null;
    }
    // The harder it is struck, the less chance of holding it. A ball at 30
    // m/s is parried almost every time; only a tame one is caught cleanly.
    const gkPace = Math.hypot(b.vx, b.vy);
    const parryOdds = clamp((gkPace - 11) / 19, 0, 0.82) * (p.dive > 0 ? 1.15 : 1);
    if (p.gk && gkPace > 11 && Math.random() < parryOdds) {
      // push it away from goal — usually behind for a corner
      const outward = attackDir(other(p.team));
      const side = b.y > PITCH_W / 2 ? 1 : -1;
      b.vx = outward * (11 + Math.random() * 9);
      b.vy = side * (11 + Math.random() * 13);
      b.vz = 1.5 + Math.random() * 2;
      m.passer = p;
      m.lastTouch = p.team;
      m.passCooldown = 0.5;
      m.intendedRx = null;
      m.offsideFlag = false;
      return;
    }

    // flag raised against the intended receiver
    if (m.offsideFlag && p === m.intendedRx) {
      m.offsides[p.team]++;
      m.offsideFlag = false;
      awardSetPiece(m, "freeKick", other(p.team), p.x, p.y, "Offside");
      return;
    }

    // Winning a loose ball near their goal is a chance, not a restart of
    // possession — take it on and hit it.
    const wasLoose = !m.intendedRx;
    m.scramble = wasLoose && Math.abs(p.x - goalXFor(p.team)) < 26;
    m.shotBy = null;
    m.assistBy = (m.passer && m.passer.team === p.team && m.passer !== p) ? m.passer : null;
    m.carrier = p;
    m.possession = p.team;
    m.lastTouch = p.team;
    m.mustPass = false;
    m.inFlight = false;
    m.intendedRx = null;
    m.offsideFlag = false;
    b.vx = 0; b.vy = 0;
    const dwell = TEMPO[m.tactics[p.team].tempo].dwell;
    if (m.scramble) m.decide = 0.06;
    else if (m.intent === "shoot") m.decide = 0.08;
    else if (m.intent === "oneTouch") m.decide = 0.14;
    /* A touch, a look, and it is gone. These were a full second of real time
       to settle an ordinary pass, which at fifteen-times clock speed is a
       quarter of a minute of match standing on the ball — every receipt in
       the game looked like a man taking a breather. */
    else if (m.intent === "carry") m.decide = 0.30 * dwell;
    else m.decide = 0.62 * dwell;

    /* And how long he has depends on whether anybody is near him.

       A flat dwell meant every player treated every ball the same: the man
       under two challenges dithered and the man alone in forty metres of
       space hurried, when it should be the other way round. Composure is
       having time and using it. */
    const onMe = pressureOn(m, p);
    m.decide *= onMe === 0 ? 1.75 : onMe === 1 ? 1.1 : 0.6;
    if (chested) m.decide = Math.max(m.decide, 0.5);   // he had to bring it down
    /* He looked up a moment ago and already knows what is around him, so he
       does not need to stop and find out. This is what a scan buys, and it is
       the reason players are drilled to do it. */
    if (p.scanFresh > 0) m.decide *= 0.7;
    return;
  }
}

/* ============================================================
   TICK
   ============================================================ */
function tick(m, dt) {
  if (m.over) return;

  if (m.flash > 0) m.flash -= dt;
  if (m.morph > 0) m.morph -= dt;
  if (m.ghostT > 0) m.ghostT -= dt;
  if (m.settle > 0) m.settle -= dt;
  if (m.eventTimer > 0) m.eventTimer -= dt;
  if (m.kickAdvance > 0) m.kickAdvance -= dt;

  if (m.restart > 0) {
    m.restart -= dt;
    m.clock += dt * CLOCK_SCALE;            // the clock runs during set pieces, as it does in football
    setPieceTargets(m, dt);
    if (m.restart <= 0) {
      // hold the penalty until the area is empty (with a safety cap)
      const sp = m.setPiece;
      const waitPen = sp && sp.type === "penalty" && !penaltyBoxClear(m);
      const waitCorner = sp && sp.type === "corner" && !cornerLoaded(m);
      const waitThrow = sp && sp.type === "throwIn" && !throwInReady(m);
      const waitFk = sp && sp.type === "freeKick" && !freeKickLoaded(m);
      const gkTakes = m.taker && m.taker.gk;
      const waitGk = sp && (sp.type === "goalKick"
        ? !goalKickReady(m)
        : (sp.type === "freeKick" && !keeperFreeKickClear(m)));
      /* A goal kick gets a longer hold than anything else, because what it is
         waiting for is men running forty metres. */
      const cap = sp && sp.type === "goalKick" ? 6
        : sp && sp.type === "throwIn" ? 2.4
        : gkTakes ? 3.5
        : sp && sp.type === "freeKick" ? 1.8 : 4;
      // Count the length of the hold, not one physics step. Adding dt here
      // while holding for HOLD seconds made a 1.2s cap take 17 seconds.
      const HOLD = 0.12;
      if ((waitPen || waitCorner || waitThrow || waitFk || waitGk) && m.penaltyWait < cap) {
        m.penaltyWait += HOLD;
        m.restart = HOLD;
      } else {
        takeSetPiece(m);
      }
    }
    return;
  }

  m.clock += dt * CLOCK_SCALE;

  /* Halves, and the whistle that waits.

     The match used to be ninety continuous minutes that stopped dead on the
     tick the clock reached them — mid-pass, mid-shot, or with a free kick
     sitting on the edge of the box waiting to be taken. A half now ends the
     way a half ends: the referee looks for a moment to blow.

     He waits for one of two things — the ball dead, or possession settled with
     nobody in a promising position — and he will not blow at all while the
     side that is behind has a set piece to take. There is a cap, because a
     referee who waits forever is its own kind of wrong. */
  const end = m.half === 1 ? HALF_LENGTH : HALF_LENGTH * 2;
  if (m.clock >= end) {
    const trailing = m.score[0] === m.score[1] ? -1
      : (m.score[0] < m.score[1] ? HOME : AWAY);
    const theirSetPiece = m.setPiece && m.setPiece.team === trailing;
    const attackingWell = m.carrier &&
      Math.abs(m.carrier.x - goalXFor(m.carrier.team)) < 30;
    const settled = !m.inFlight && m.restart <= 0 && !attackingWell;
    const dead = m.restart > 0 && !theirSetPiece;

    m.added += dt * CLOCK_SCALE;
    if (dead || settled || m.added >= ADDED_TIME_CAP) {
      m.added = 0;
      if (m.half === 1) {
        m.half = 2;
        m.clock = HALF_LENGTH;
        announce(m, "Half time");
        // the other side gets it back
        kickoff(m, other(m.firstKick));
        return;
      }
      m.clock = HALF_LENGTH * 2;
      m.over = true;
      announce(m, "Full time");
      return;
    }
    // hold the clock on the whistle-line while he waits
    m.clock = end;
  }

  m.possTicks[m.possession] += dt;

  for (const p of m.players) {
    if (p.lunge > 0) {
      p.lunge -= dt;
      if (p.lunge <= 0) { p.lunge = 0; p.beaten = 0.3; p.lungeCd = 0.6; }
    }
    if (p.beaten > 0) p.beaten = Math.max(0, p.beaten - dt);
    if (p.lungeCd > 0) p.lungeCd = Math.max(0, p.lungeCd - dt);
    if (p.flairCd > 0) p.flairCd = Math.max(0, p.flairCd - dt);
    if (p.dive > 0) p.dive = Math.max(0, p.dive - dt);
    if (p.claim > 0) p.claim = Math.max(0, p.claim - dt);
    if (p.burst > 0) p.burst = Math.max(0, p.burst - dt);
    if (p.showboat > 0) p.showboat = Math.max(0, p.showboat - dt);
    if (p.skill) { p.skillT += dt; if (p.skillT >= p.skillDur) p.skill = null; }
    if (p.oneTwo > 0) { p.oneTwo -= dt; if (p.oneTwo <= 0) p.oneTwoTo = null; }
    if (p.holding > 0) p.holding = Math.max(0, p.holding - dt);
    else p.holdT = 0;
    if (p.jump > 0) p.jump = Math.max(0, p.jump - dt);
    if (p.taking > 0) p.taking = Math.max(0, p.taking - dt);
    if (p.takeCd > 0) p.takeCd = Math.max(0, p.takeCd - dt);
    if (p.pull > 0) p.pull = Math.max(0, p.pull - dt);
    if (p.pullCd > 0) p.pullCd = Math.max(0, p.pullCd - dt);
    if (p.stabCd > 0) p.stabCd = Math.max(0, p.stabCd - dt);
    if (p.kick > 0) p.kick = Math.max(0, p.kick - dt);
    if (p.slide > 0) p.slide = Math.max(0, p.slide - dt);
    if (p.late > 0) p.late = Math.max(0, p.late - dt);
    if (p.lateCd > 0) p.lateCd = Math.max(0, p.lateCd - dt);
  }

  updateBall(m, dt);
  /* A keeper with the ball in his hands. Refreshed every step he holds it and
     left to run down for a moment after he releases, so a man arriving late
     cannot barge him as he throws. */
  if (m.carrier && m.carrier.gk && inBoxOf(m.carrier.team, m.carrier.x, m.carrier.y)) {
    /* The back-pass law, which this sim did not have.

       A keeper could pick up anything, including a ball his own full-back had
       just passed him along the floor — so playing out from the back had no
       risk in it at all, and the safest thing a defender under pressure could
       ever do was knock it to the goalkeeper and let him hold it. That is a
       1992 game of football.

       He may still handle a ball that was HEADED, chested or kneed back to
       him, which is why touchKind exists rather than a simple flag: the
       distinction the law draws is about whether the team-mate deliberately
       kicked it, not about whether it came from a team-mate.

       When he cannot handle it he does not lose the ball — he has it at his
       feet as an ordinary carrier, under pressure, and has to play it. Which
       is the whole point of the law and most of what makes playing out from
       the back a decision rather than a formality. */
    const backPass = m.touchKind === 'kick' && m.passer &&
      m.passer !== m.carrier && m.passer.team === m.carrier.team;
    if (backPass) {
      m.carrier.holding = 0;
      m.carrier.holdT = 0;
    } else {
      m.carrier.holding = 0.7;
      m.carrier.holdT = (m.carrier.holdT || 0) + dt;
    }
  }
  if (m.restart > 0) return;               // a restart was just awarded
  tryFlair(m, dt);
  if (m.restart > 0) return;
  contest(m, dt);
  if (m.restart > 0) return;
  assignTargets(m, dt);
  updateVision(m, dt);

  if (m.carrier) {
    if (m.carrier !== m.lastCarrier) { m.carryTime = 0; m.lastCarrier = m.carrier; }
    m.carryTime += dt;
    m.hold += dt;
    m.decide -= dt;
    if (m.decide <= 0 || m.hold > 2.2) { decide(m); m.hold = 0; }
  }

  m.trail.push({ x: m.ball.x, y: m.ball.y, z: m.ball.z });
  if (m.trail.length > 26) m.trail.shift();
}

/* Runs while the match is paused so a shape change is still watchable. */
function settleTick(m, dt) {
  m.settle -= dt;
  if (m.morph > 0) m.morph -= dt;
  let furthest = 0;
  for (const p of m.players) {
    const sb = shapedBase(p, m);
    steer(p, clamp(sb.x, 1.5, PITCH_L - 1.5), clamp(sb.y, 1.5, PITCH_W - 1.5), dt, SHAPE_SPEED);
    furthest = Math.max(furthest, dist(p.x, p.y, sb.x, sb.y));
  }
  if (m.carrier) {
    m.ball.x += (m.carrier.x + attackDir(m.carrier.team) * 1.25 - m.ball.x) * Math.min(1, dt * 14);
    m.ball.y += (m.carrier.y - m.ball.y) * Math.min(1, dt * 14);
  }
  if (furthest < 0.25) m.settle = 0;
}

/* ============================================================
   RENDER
   ============================================================ */
/* Skill moves, drawn rather than simulated. Each returns where the player and
   the ball sit relative to where the simulation has put him, in his own frame:
   `fwd` along the way he is facing, `lat` across it, both in metres, `spin`
   added to his facing, and `ball` how far ahead the ball rides. `u` runs 0 to
   1 through the move.

   None of this moves anybody. The simulation's positions are untouched, which
   is the difference between a marker that slides and a player who does
   something — and it means a croqueta cannot win the ball back by accident.

   Every path must be back at zero when `u` reaches 1. The simulation has not
   moved him, so an offset left hanging at the end snaps him across the pitch
   the instant the move finishes. That is why `fwd` and `lat` are built from
   half-sines rather than ramps: a ramp ends where it finished. A full 2*PI of
   `spin` is allowed, since it comes back round to where it started. */
/* What actually distinguishes one skill move from another is what the BALL
   does, not what the man does. The first version of this moved the player and
   kept the ball a fixed stride in front of him the whole way through, so a
   croqueta, a stepover and a nutmeg were the same wobble with different
   amplitudes — which is exactly what they looked like.

   So each move now returns two paths: `fwd`/`lat` for the player and `bf`/`bl`
   for the ball, both in his frame, both back at their resting value by u = 1.
   The ball rests at BALL_CARRY in front of him, which is where updateBall
   keeps it, so `bf` is measured from there and a move that pulls the ball back
   under his foot is genuinely a negative number. */
const BALL_CARRY = 1.25;

function skillOffset(name, u) {
  const arc = Math.sin(u * Math.PI);          // 0 -> 1 -> 0, so the move closes
  const wag = Math.sin(u * Math.PI * 2);      // 0 -> 1 -> 0 -> -1 -> 0, one each way
  const early = Math.sin(Math.pow(u, 0.55) * Math.PI);   // snaps out, eases back
  const late = Math.sin(Math.pow(u, 1.8) * Math.PI);     // hangs, then goes
  switch (name) {
    case 'croqueta':
      // Knocked from one foot to the other and taken away with the second.
      // The ball crosses his body; he barely moves off his line.
      return { fwd: arc * 0.5, lat: wag * 0.5, spin: 0,
        bf: arc * 0.5, bl: -wag * 1.5 };
    case 'elastico':
      // Pushed out with the outside of the boot, snapped back through the
      // other way. All of it is in the ball; the body only leans after it.
      return { fwd: arc * 0.3, lat: early * 0.6, spin: -early * 0.5,
        bf: arc * 0.2, bl: Math.sin(Math.pow(u, 0.5) * Math.PI * 2) * 1.6 };
    case 'roulette':
      // Foot on it, full turn over the top, and out the other side. The ball
      // is dragged round him rather than sitting in front of him.
      return { fwd: arc * 0.4, lat: arc * 0.4, spin: u * Math.PI * 2,
        bf: Math.cos(u * Math.PI * 2) * 0.9 - 0.9 + arc * 0.3,
        bl: Math.sin(u * Math.PI * 2) * 1.5 };
    case 'stepover':
      // Body swings all the way round the ball; the ball does not move until
      // he has finished selling it, then it goes.
      return { fwd: arc * 0.35, lat: wag * 1.35, spin: wag * 0.6,
        bf: late * 0.9, bl: late * 0.35 };
    case 'chop':
      // Cut hard across it with the inside of the foot and gone the other way.
      return { fwd: -arc * 0.4, lat: arc * 1.0, spin: arc * Math.PI * 0.5,
        bf: -arc * 0.5, bl: -arc * 2.1 };
    case 'dragback':
      // Sole on the ball, pulled back under him, then away at an angle.
      return { fwd: -arc * 0.8, lat: arc * 0.5, spin: arc * Math.PI * 0.55,
        bf: -early * 1.7, bl: late * 1.1 };
    case 'nutmeg':
      // Ball straight through the gap at pace, man round the outside of him.
      return { fwd: arc * 0.6, lat: arc * 1.6, spin: 0,
        bf: arc * 2.2, bl: -arc * 0.5 };
    case 'cruyff':
      // Shapes to cross, drags it back behind the standing leg and turns out.
      return { fwd: arc * 0.45, lat: -arc * 0.5, spin: arc * Math.PI,
        bf: -late * 2.0, bl: late * 1.4 };
    case 'rollover':
      // Rolled across the body with the sole, one way and then back.
      return { fwd: arc * 0.25, lat: wag * 0.4, spin: wag * 0.35,
        bf: -arc * 0.3, bl: wag * 1.8 };
  }
  return { fwd: 0, lat: 0, spin: 0, bf: 0, bl: 0 };
}

/* Where a player is drawn: where he is, unless he is in the middle of a move.
   `o` carries the ball's offsets too, so the ball can be drawn on the same
   path — see the ball block in draw(). */
/* How much of the move the MAN does, against how much the ball does.

   The table below is written in metres of real movement, and at the scale a
   marker is drawn that turned out to be far too much: a nutmeg threw the
   player a metre and a half sideways inside half a second, a stepover swung
   him nearly as far the other way and back, and the body rotation carried the
   boots round with it. Twenty-two markers doing that reads as chaos rather
   than as football.

   The ball keeps most of its path, because the ball moving is what a skill
   move actually is. The man is damped hard: he leans, he does not teleport.
   Spin is damped too, apart from the roulette, whose whole point is the turn
   — so that one is exempted rather than flattened. */
const SKILL_BODY = 0.45;
const SKILL_SPIN = 0.5;
const SKILL_BALL = 0.8;

function drawnAt(p) {
  if (!p.skill || p.skillDur <= 0) return { x: p.x, y: p.y, face: p.face, o: null, u: 0 };
  const u = clamp(p.skillT / p.skillDur, 0, 1);
  const raw = skillOffset(p.skill, u);
  const spinK = p.skill === 'roulette' ? 1 : SKILL_SPIN;
  const o = {
    fwd: raw.fwd * SKILL_BODY,
    lat: raw.lat * SKILL_BODY,
    spin: raw.spin * spinK,
    bf: raw.bf * SKILL_BALL,
    bl: raw.bl * SKILL_BALL,
  };
  const cf = Math.cos(p.face), sf = Math.sin(p.face);
  return {
    x: p.x + cf * o.fwd - sf * o.lat,
    y: p.y + sf * o.fwd + cf * o.lat,
    face: p.face + o.spin,
    o,
    u,
  };
}

/* The goal frame, its netting, and the strip of dead ground behind it.

   None of this is part of play. Every rule in the simulation above measures
   from the goal line and knows nothing about it. It exists so that a ball
   crossing the line can be watched going into the net instead of vanishing at
   the moment it matters, and so that one clipping the frame is visibly
   clipping something. */
/* A hex colour, darkened. Used for boots against shirts. */
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  // clamped, because k above 1 is used to lighten and would otherwise wrap
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return 'rgb(' + ch((n >> 16) & 255) + ',' + ch((n >> 8) & 255) + ',' + ch(n & 255) + ')';
}

function drawGoal(ctx, X, Y, s, end) {
  const gx = ownGoalX(end);
  const out = end === HOME ? -1 : 1;               // away from the pitch
  const back = gx + out * GOAL_DEPTH;
  const yT = Y(GOAL_TOP), yB = Y(GOAL_BOT);
  const xL = Math.min(X(gx), X(back)), wN = Math.abs(X(back) - X(gx));

  ctx.fillStyle = "rgba(255,255,255,0.045)";
  ctx.fillRect(xL, yT, wN, yB - yT);

  // the mesh, both ways
  ctx.strokeStyle = "rgba(233,244,238,0.28)";
  ctx.lineWidth = Math.max(0.7, s * 0.055);
  ctx.beginPath();
  for (let y = GOAL_TOP; y <= GOAL_BOT + 0.001; y += (GOAL_BOT - GOAL_TOP) / 9) {
    ctx.moveTo(X(gx), Y(y)); ctx.lineTo(X(back), Y(y));
  }
  for (let d = 0; d <= GOAL_DEPTH + 0.001; d += GOAL_DEPTH / 4) {
    ctx.moveTo(X(gx + out * d), yT); ctx.lineTo(X(gx + out * d), yB);
  }
  ctx.stroke();

  // side netting and the back of it
  ctx.strokeStyle = "rgba(233,244,238,0.34)";
  ctx.lineWidth = Math.max(0.8, s * 0.08);
  ctx.beginPath();
  ctx.moveTo(X(gx), yT); ctx.lineTo(X(back), yT);
  ctx.lineTo(X(back), yB); ctx.lineTo(X(gx), yB);
  ctx.stroke();

  // the posts themselves, on the line
  ctx.fillStyle = "rgba(246,252,249,0.95)";
  for (const yy of [GOAL_TOP, GOAL_BOT]) {
    ctx.beginPath();
    ctx.arc(X(gx), Y(yy), Math.max(1.3, s * POST_R * 2.1), 0, Math.PI * 2);
    ctx.fill();
  }
}

function draw(ctx, m, W, H, showZones) {
  const pad = 14;
  // Scaled against the pitch plus the run-off behind both goals, so the
  // netting has room to be drawn without the pitch running off the canvas.
  const s = Math.min((W - pad * 2) / (PITCH_L + BEHIND_GOAL * 2),
    (H - pad * 2) / PITCH_W);
  // There is nothing to draw into yet. The wrapper measures zero width until
  // the stylesheet lands, and a width below the padding makes the scale
  // negative — which throws out of the first ctx.arc with a negative radius,
  // takes the animation loop down with it, and leaves a blank page.
  if (!(s > 0)) return;
  const ox = (W - PITCH_L * s) / 2;
  const oy = (H - PITCH_W * s) / 2;
  const X = (x) => ox + x * s;
  const Y = (y) => oy + y * s;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // The run-off behind each goal. Not in play — it is where the net lives.
  ctx.fillStyle = C.runOff;
  ctx.fillRect(X(-BEHIND_GOAL), Y(0), BEHIND_GOAL * s, PITCH_W * s);
  ctx.fillRect(X(PITCH_L), Y(0), BEHIND_GOAL * s, PITCH_W * s);

  ctx.fillStyle = C.turf;
  ctx.fillRect(X(0), Y(0), PITCH_L * s, PITCH_W * s);
  ctx.fillStyle = C.turfAlt;
  for (let i = 0; i < 10; i += 2) ctx.fillRect(X(i * 10.5), Y(0), 10.5 * s, PITCH_W * s);

  if (showZones) {
    const cols = 6, rows = 4;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x0 = (i / cols) * PITCH_L, x1 = ((i + 1) / cols) * PITCH_L;
        const y0 = (j / rows) * PITCH_W, y1 = ((j + 1) / rows) * PITCH_W;
        let h = 0, a = 0;
        for (const p of m.players) {
          if (p.gk) continue;
          if (p.x >= x0 && p.x < x1 && p.y >= y0 && p.y < y1) p.team === HOME ? h++ : a++;
        }
        const diff = h - a;
        if (diff === 0) continue;
        ctx.fillStyle = diff > 0
          ? `rgba(255,90,60,${Math.min(0.20, Math.abs(diff) * 0.055)})`
          : `rgba(73,166,255,${Math.min(0.20, Math.abs(diff) * 0.055)})`;
        ctx.fillRect(X(x0), Y(y0), (x1 - x0) * s, (y1 - y0) * s);
      }
    }
  }

  ctx.strokeStyle = C.chalk;
  ctx.lineWidth = Math.max(1, s * 0.11);
  ctx.strokeRect(X(0), Y(0), PITCH_L * s, PITCH_W * s);
  ctx.beginPath();
  ctx.moveTo(X(PITCH_L / 2), Y(0)); ctx.lineTo(X(PITCH_L / 2), Y(PITCH_W));
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(X(PITCH_L / 2), Y(PITCH_W / 2), 9.15 * s, 0, Math.PI * 2);
  ctx.stroke();
  [0, 1].forEach((side) => {
    ctx.strokeRect(X(side ? PITCH_L - BOX_D : 0), Y(13.84), BOX_D * s, 40.32 * s);
    ctx.strokeRect(X(side ? PITCH_L - 5.5 : 0), Y(24.84), 5.5 * s, 18.32 * s);
    ctx.beginPath();
    ctx.arc(X(side ? PITCH_L - 11 : 11), Y(PITCH_W / 2), s * 0.28, 0, Math.PI * 2);
    ctx.fill();
  });
  drawGoal(ctx, X, Y, s, HOME);
  drawGoal(ctx, X, Y, s, AWAY);

  // offside lines while a set piece is being taken, defensive lines otherwise
  if (showZones) {
    [HOME, AWAY].forEach((team) => {
      const backs = m.players.filter((p) => p.team === team && !p.gk && p.depth < 0.32);
      if (!backs.length) return;
      const avg = backs.reduce((a, p) => a + p.x, 0) / backs.length;
      ctx.strokeStyle = team === HOME ? "rgba(255,90,60,0.42)" : "rgba(73,166,255,0.42)";
      ctx.lineWidth = Math.max(1, s * 0.09);
      ctx.setLineDash([s * 1.1, s * 1.1]);
      ctx.beginPath();
      ctx.moveTo(X(avg), Y(1.5)); ctx.lineTo(X(avg), Y(PITCH_W - 1.5));
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  for (let i = 0; i < m.trail.length; i++) {
    const t = m.trail[i];
    const k = i / m.trail.length;
    ctx.fillStyle = `rgba(255,255,255,${k * 0.16})`;
    ctx.beginPath();
    ctx.arc(X(t.x), Y(t.y) - (t.z || 0) * s * 0.85, s * 0.16 * k, 0, Math.PI * 2);
    ctx.fill();
  }

  if (m.morph > 0) {
    const fade = Math.min(1, m.morph / 1.4);
    ctx.lineWidth = Math.max(1, s * 0.10);
    for (const p of m.players) {
      const sb = shapedBase(p, m);
      if (dist(p.x, p.y, sb.x, sb.y) < 1.8) continue;
      const rgb = p.team === HOME ? "255,90,60" : "73,166,255";
      ctx.strokeStyle = `rgba(${rgb},${0.45 * fade})`;
      ctx.setLineDash([s * 0.55, s * 0.55]);
      ctx.beginPath();
      ctx.moveTo(X(p.x), Y(p.y)); ctx.lineTo(X(sb.x), Y(sb.y));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(X(sb.x), Y(sb.y), s * 1.15, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const r = s * 0.98;
  for (const p of m.players) {
    const at = drawnAt(p);
    const px = at.x, py = at.y, pface = at.face;
    const col = p.gk
      ? (p.team === HOME ? C.homeGk : C.awayGk)
      : (p.team === HOME ? C.home : C.away);
    // Darker than the shirt, so a boot sticking out past the body reads as a
    // boot rather than as a bulge in the marker.
    const feetCol = shade(col, 0.62);

    /* A smear of where he was a moment ago. A skill move is a metre or two of
       movement inside a second, which on a marker this size is a twitch —
       the trail is what turns it into a shape the eye can follow, and it is
       the difference between "he did something" and "he wobbled". */
    if (at.o && at.u > 0.06 && at.u < 0.98) {
      const rgb = p.team === HOME ? "255,90,60" : "73,166,255";
      for (const back of [0.13, 0.26]) {
        const u2 = at.u - back;
        if (u2 <= 0) continue;
        // Damped the same way the body is, or the trail leads somewhere the
        // player was never drawn.
        const g = skillOffset(p.skill, u2);
        const cf2 = Math.cos(p.face), sf2 = Math.sin(p.face);
        ctx.fillStyle = `rgba(${rgb},${0.20 - back * 0.5})`;
        ctx.beginPath();
        ctx.arc(X(p.x + (cf2 * g.fwd - sf2 * g.lat) * SKILL_BODY),
          Y(p.y + (sf2 * g.fwd + cf2 * g.lat) * SKILL_BODY),
          r * (0.78 - back), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (p.showboat > 0) {
      /* A skill move that came off. Two rings pushing outwards and fading
         behind one another — kept tight, since the move itself is now the
         thing worth watching and the rings only point at it. */
      const k = p.showboat / SHOWBOAT_TIME;        // 1 the instant it lands
      for (const lag of [0, 0.3]) {
        const kk = k + lag;
        if (kk > 1) continue;
        ctx.strokeStyle = `rgba(255,238,170,${0.75 * kk * kk})`;
        ctx.lineWidth = Math.max(1, s * 0.15 * kk);
        ctx.beginPath();
        ctx.arc(X(px), Y(py), r + s * (0.35 + (1 - kk) * 2.6), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    if (p.beaten > 0) {
      // Left for dead. The other half of a skill move, and worth seeing.
      ctx.strokeStyle = `rgba(255,110,80,${0.55 * Math.min(1, p.beaten * 2)})`;
      ctx.lineWidth = Math.max(1, s * 0.13);
      ctx.beginPath();
      ctx.arc(X(px), Y(py), r + s * 0.6, 0.7, 0.7 + Math.PI * 1.15);
      ctx.stroke();
    }
    if (p === m.carrier || p === m.taker) {
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = Math.max(1.4, s * 0.16);
      ctx.beginPath();
      ctx.arc(X(px), Y(py), r + s * 0.42, 0, Math.PI * 2);
      ctx.stroke();
    }
    /* Off the ground. The shadow stays on the grass and the man lifts away
       from it, the same trick the ball uses — without it a header and a pass
       along the floor look identical from above. */
    const jumpU = p.jump > 0 ? Math.sin((0.35 - Math.min(p.jump, 0.35)) / 0.35 * Math.PI) : 0;
    const pyUp = Y(py) - jumpU * s * 1.15;
    ctx.fillStyle = `rgba(0,0,0,${0.35 - jumpU * 0.12})`;
    ctx.beginPath();
    ctx.arc(X(px) + s * (0.16 + jumpU * 0.5), Y(py) + s * (0.2 + jumpU * 0.6),
      r * (1 - jumpU * 0.12), 0, Math.PI * 2);
    ctx.fill();

    /* Two feet.

       This replaces the bump that used to mark which way he was pointed. A
       bump could say one thing — a direction — and it had to say it about the
       head, so the body's direction was invisible and so was everything the
       body does. Feet say all of it at once: which way he is running, how
       fast (the cadence comes from ground covered, so a jog and a sprint
       differ), when he strikes the ball and with which foot, when he lunges
       into a tackle and how far he has stretched to reach it, and what his
       legs are doing through a skill move.

       Drawn before the body so the circle sits on top of them. */
    const cf = Math.cos(pface), sf = Math.sin(pface);
    const swing = Math.sin(p.stride || 0);
    const kickU = p.kick > 0 ? Math.sin((p.kick / 0.20) * Math.PI) : 0;
    const lungeFoot = p.num % 2 ? 1 : -1;
    const sliding = p.slide > 0 ? clamp(p.slide / 0.55, 0, 1) : 0;
    /* Through a skill move the legs go where the ball is being worked. The
       skill offsets already move the whole man; carrying a share of them into
       the feet is what makes a croqueta look like the ball going across his
       body rather than the marker sliding sideways. */
    const skillLat = at.o ? at.o.bl * 0.20 : 0;
    const skillFwd = at.o ? at.o.bf * 0.16 : 0;
    let bodyBack = 0;
    ctx.fillStyle = feetCol;
    for (const side of [-1, 1]) {
      /* Far enough out that the body does not swallow them. The body circle is
         drawn on top, so anything inside about 0.7r is simply not there —
         which is what the first version of this did, and it looked exactly
         like the plain marker it replaced. */
      let fwd = 0.72 + swing * side * 0.88 + skillFwd;
      let lat = side * 0.52 + skillLat;
      let fr = 0.36, fw = 0.24;

      if (kickU) {
        if (p.kickFoot === side) {
          fwd += 1.45 * kickU;          // the boot swinging through the ball
          fr += 0.10 * kickU;
        } else {
          fwd -= 0.30 * kickU;          // the standing foot planted beside it
          lat += side * 0.20 * kickU;
        }
      }

      if (sliding) {
        // Both legs out, low and long — a proper committed challenge, and the
        // one thing in the game that should be unmistakable from above.
        fwd += 1.6 + sliding * 1.0;
        lat *= 0.5;
        fr = 0.48; fw = 0.20;
        bodyBack = 0.5 + sliding * 0.35;
      } else if (p.lunge > 0 && side === lungeFoot) fwd += 1.85;
      else if (p.beaten > 0 && side === lungeFoot) fwd += 0.9;

      /* The leg. A boot on its own floats — there was nothing joining it to
         the man, so a stride read as two detached blobs drifting around a
         circle rather than as legs moving. A line from the hip to the boot is
         all it takes, and it is what makes the stride, the planted standing
         foot and the leg stretched into a tackle legible as one movement. */
      const fx = X(px) + (cf * fwd - sf * lat) * r;
      const fy = pyUp + (sf * fwd + cf * lat) * r;
      const hipF = 0.10, hipL = side * 0.34;
      ctx.strokeStyle = feetCol;
      ctx.lineWidth = Math.max(1, r * 0.20);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(X(px) + (cf * hipF - sf * hipL) * r,
        pyUp + (sf * hipF + cf * hipL) * r);
      ctx.lineTo(fx, fy);
      ctx.stroke();
      ctx.lineCap = 'butt';

      ctx.beginPath();
      ctx.ellipse(fx, fy, r * fr, r * fw, pface, 0, Math.PI * 2);
      ctx.fill();
    }
    // A man on the floor is behind his own legs.
    const bx0 = X(px) - cf * bodyBack * r;
    const by0 = pyUp - sf * bodyBack * r;

    /* A keeper's arms, drawn at the length he can actually use them.

       This is the one player whose reach is not a detail — it is 1.8m
       standing, 2.08m stretched in a dive and 2.4m when he has come to claim
       one, against 0.85m for everybody else, and every save in the game is
       decided by it. It was invisible: he was a circle like the other
       twenty-one, and whether a shot was reachable or not looked arbitrary
       because the thing doing the reaching was not on screen.

       So the arms are drawn to the radius the simulation is testing against.
       Where they point is what he is doing: spread wide in his set position,
       both hands together toward the ball when he goes for one, and clamped
       in front of him when he has it. */
    if (p.gk) {
      const reach = p.dive > 0 ? 2.08
        : (p.claim > 0 || p.holding > 0) ? 2.4 : 1.8;
      const armR = (reach / 0.98) * r * 0.90;
      const holding = p.holding > 0 || p === m.carrier;
      const going = p.dive > 0 || p.claim > 0;
      const toBall = Math.atan2(m.ball.y - p.y, m.ball.x - p.x);
      // how far apart the hands are: together when he is going for it or has
      // it, wide and ready when he is set
      const spread = p.dive > 0 ? 0.17 : holding ? 0.26 : going ? 0.34 : 1.12;
      const base = (going || holding) ? toBall : pface;
      /* Upper arm, elbow, forearm. A single straight spoke from shoulder to
         hand read as an antenna; a bend at the elbow is what makes it an arm,
         and it lets the set position (elbows out, hands up) look different
         from the dive (everything straight and long). */
      ctx.strokeStyle = feetCol;
      ctx.lineWidth = Math.max(1, r * 0.24);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const bend = p.dive > 0 ? 0.10 : holding ? 0.55 : 0.42;
      const hands = [];
      for (const side of [-1, 1]) {
        const a = base + side * spread;
        const shoulder = base + side * 1.35;
        const sxp = X(px) + Math.cos(shoulder) * r * 0.62;
        const syp = pyUp + Math.sin(shoulder) * r * 0.62;
        // the elbow sits out to the side of the line to the hand
        const ex = X(px) + Math.cos(a + side * bend) * armR * 0.56;
        const ey = pyUp + Math.sin(a + side * bend) * armR * 0.56;
        const hx = X(px) + Math.cos(a) * armR;
        const hy = pyUp + Math.sin(a) * armR;
        ctx.beginPath();
        ctx.moveTo(sxp, syp);
        ctx.lineTo(ex, ey);
        ctx.lineTo(hx, hy);
        ctx.stroke();
        hands.push({ x: hx, y: hy, a });
      }
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'miter';

      /* The gloves. They were white circles the same size as the ball, sitting
         a metre from it — two more round white things on a pitch whose only
         round white thing is supposed to be findable at a glance.

         So both differences at once: a mitt shape rather than a disc, squared
         off and set across the arm, and tinted off the keeper's own kit
         instead of white. The ball stays the only white circle on the pitch. */
      ctx.fillStyle = shade(col, holding ? 1.45 : 1.28);
      ctx.strokeStyle = shade(col, 0.55);
      ctx.lineWidth = Math.max(0.6, r * 0.07);
      const gw = r * (holding ? 0.40 : 0.34), gh = r * (holding ? 0.30 : 0.26);
      for (const h of hands) {
        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.rotate(h.a);
        ctx.beginPath();
        // a rounded oblong — a hand, not a ball
        const rr = gh * 0.55;
        ctx.moveTo(-gw + rr, -gh);
        ctx.arcTo(gw, -gh, gw, gh, rr);
        ctx.arcTo(gw, gh, -gw, gh, rr);
        ctx.arcTo(-gw, gh, -gw, -gh, rr);
        ctx.arcTo(-gw, -gh, gw, -gh, rr);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    /* The body is drawn smaller than the marker's nominal radius, so the
       boots sit outside it. At the full radius it simply ate them, and the
       whole thing looked exactly like the plain circle it replaced. */
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(bx0, by0, r * (0.80 + jumpU * 0.08) * (1 - bodyBack * 0.18), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = p.gk
      ? (p.team === HOME ? "#04240F" : "#332703")
      : (p.team === HOME ? "#2A0A04" : "#04182E");
    ctx.font = `700 ${Math.max(6, s * 0.80)}px ui-monospace, Menlo, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(p.num), bx0, by0 + s * 0.05);

    /* Where his head is turned, which the feet cannot say — it is the whole
       reason a ball played behind him is worth playing. A small light mark on
       the edge of the body, not a spike. */
    const plook = (p.look === undefined ? pface : p.look) + (at.o ? at.o.spin : 0);
    ctx.fillStyle = p.sees ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.38)";
    ctx.beginPath();
    ctx.arc(bx0 + Math.cos(plook) * r * 0.54, by0 + Math.sin(plook) * r * 0.54,
      Math.max(0.8, r * 0.18), 0, Math.PI * 2);
    ctx.fill();
  }

  // Ball. When it is off the ground the shadow stays on the grass and the
  // ball itself lifts away from it, so height is readable at a glance.
  const bz = m.ball.z || 0;
  const lift = bz * s * 0.85;

  /* The ball goes with the move. While the man on it is doing something the
     simulation keeps the ball a fixed stride in front of him, so without this
     he would croqueta round a ball that stayed put. */
  let ballX = m.ball.x, ballY = m.ball.y;
  const mover = m.carrier;
  if (mover && mover.skill && mover.skillDur > 0) {
    const at = drawnAt(mover);
    const cf = Math.cos(mover.face), sf = Math.sin(mover.face);
    const ahead = (m.carryLead || BALL_CARRY) + at.o.bf;
    ballX = mover.x + cf * ahead - sf * at.o.bl;
    ballY = mover.y + sf * ahead + cf * at.o.bl;
  }
  const shX = X(ballX);
  const shY = Y(ballY);
  const airFrac = clamp(bz / 6, 0, 1);

  ctx.fillStyle = `rgba(0,0,0,${0.45 - airFrac * 0.22})`;
  ctx.beginPath();
  ctx.ellipse(shX + s * 0.12, shY + s * 0.15, s * (0.34 + airFrac * 0.22),
    s * (0.34 - airFrac * 0.12), 0, 0, Math.PI * 2);
  ctx.fill();

  if (bz > 0.25) {
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = Math.max(0.8, s * 0.06);
    ctx.setLineDash([s * 0.3, s * 0.3]);
    ctx.beginPath();
    ctx.moveTo(shX, shY);
    ctx.lineTo(shX, shY - lift);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.fillStyle = C.ball;
  ctx.beginPath();
  ctx.arc(shX, shY - lift, s * (0.33 + airFrac * 0.26), 0, Math.PI * 2);
  ctx.fill();

  /* The ball carrying on past the line. The simulation has already moved the
     real ball to the restart spot by now — this is the last thing it did
     before it counted, played forward off its own velocity so a goal can be
     seen hitting the net and a shot wide can be seen missing.

     Purely a function of m.ghostT, which tick() runs down, so it never
     accumulates state of its own. */
  if (m.ghost && m.ghostT > 0) {
    const g = m.ghost;
    const u = Math.min(g.life - m.ghostT, 0.9);
    const f = (1 - Math.exp(-2.4 * u)) / 2.4;
    // A ball that crossed between the posts is in the net, and the net stops
    // it. Left to run on its own velocity a goal struck across the face drifts
    // out through the side netting and reads as a miss.
    const scored = g.y > GOAL_TOP && g.y < GOAL_BOT;
    const gxp = scored
      ? clamp(g.x + g.vx * f, -GOAL_DEPTH + 0.35, PITCH_L + GOAL_DEPTH - 0.35)
      : clamp(g.x + g.vx * f, -BEHIND_GOAL + 0.4, PITCH_L + BEHIND_GOAL - 0.4);
    const gyp = scored
      ? clamp(g.y + g.vy * f, GOAL_TOP + 0.3, GOAL_BOT - 0.3)
      : clamp(g.y + g.vy * f, 0.4, PITCH_W - 0.4);
    let gzp = Math.max(0, g.z + g.vz * u - 0.5 * GRAVITY * u * u);
    if (scored) gzp = Math.min(gzp, CROSSBAR - 0.15);
    const fade = Math.min(1, m.ghostT / 0.5);
    ctx.fillStyle = `rgba(255,255,255,${0.9 * fade})`;
    ctx.beginPath();
    ctx.arc(X(gxp), Y(gyp) - gzp * s * 0.85, s * 0.33, 0, Math.PI * 2);
    ctx.fill();
  }

  if (m.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.16, m.flash * 0.09)})`;
    ctx.fillRect(X(0), Y(0), PITCH_L * s, PITCH_W * s);
  }

  if (bz > 0.6) {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = `600 ${Math.max(8, s * 1.15)}px ui-monospace, Menlo, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${bz.toFixed(1)}m`, shX, shY - lift - s * 1.1);
  }

  if (m.eventTimer > 0 && m.event) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.9, m.eventTimer)})`;
    ctx.font = `600 ${Math.max(11, s * 2.1)}px ui-monospace, Menlo, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(m.event.toUpperCase(), X(PITCH_L / 2), Y(2.5));
  }
}

/* ============================================================
   COMPONENT
   ============================================================ */
const SECTIONS = [
  {
    name: "Build up",
    rows: [
      { field: "tempo", label: "Speed of play", opts: TEMPO, num: true },
      { field: "range", label: "Passing distance", opts: RANGE, num: true },
      { field: "mentality", label: "Mentality", opts: MENTALITY, num: false },
      { field: "kickoffStyle", label: "From kick-off", opts: KICKOFF_STYLE, num: false },
    ],
  },
  {
    name: "Attacking",
    rows: [
      { field: "passFreq", label: "Passing frequency", opts: PASS_FREQ, num: true },
      { field: "crossFreq", label: "Crossing frequency", opts: CROSS_FREQ, num: true },
      { field: "shootFreq", label: "Shooting frequency", opts: SHOOT_FREQ, num: true },
      { field: "width", label: "Attacking width", opts: WIDTHS, num: false },
      { field: "shape", label: "Shape", opts: SHAPE, num: false },
      { field: "flair", label: "Flair", opts: FLAIR, num: true },
      { field: "wingPlay", label: "Wing play", opts: WING_PLAY, num: false },
      { field: "wingFocus", label: "Wing priority", opts: WING_FOCUS, num: false,
        showIf: (t) => t.wingPlay === "on" },
      { field: "overlap", label: "Full-backs", opts: OVERLAP, num: false,
        showIf: (t) => t.wingPlay === "on" },
    ],
  },
  {
    name: "Set pieces",
    rows: [
      { field: "throwStyle", label: "Throw-ins", opts: THROW_STYLE, num: false },
      { field: "cornerStyle", label: "Corners", opts: CORNER_STYLE, num: false },
      { field: "freeKickStyle", label: "Free kicks", opts: FREE_KICK_STYLE, num: false },
      { field: "goalKickStyle", label: "Goal kicks", opts: GOAL_KICK_STYLE, num: false },
    ],
  },
  {
    name: "Defending",
    rows: [
      { field: "block", label: "Block height", opts: BLOCKS, num: false },
      { field: "pressure", label: "Pressure", opts: PRESSURE, num: true },
      { field: "aggression", label: "Aggression", opts: AGGRESSION, num: true },
      { field: "defWidth", label: "Defensive width", opts: DEF_WIDTH, num: true },
      { field: "line", label: "Defensive line", opts: LINE, num: false },
    ],
  },
];

export default function TacticsSim() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const matchRef = useRef(null);
  const rafRef = useRef(0);
  const accRef = useRef(0);
  const lastRef = useRef(0);

  const [homeKey, setHomeKey] = useState("4-3-3");
  const [awayKey, setAwayKey] = useState("4-4-2");
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [zones, setZones] = useState(true);
  const [tactics, setTactics] = useState([{ ...DEFAULT_TACTICS }, { ...DEFAULT_TACTICS }]);
  const [hud, setHud] = useState({
    score: [0, 0], clock: 0, poss: [50, 50], shots: [0, 0],
    fouls: [0, 0], offsides: [0, 0], corners: [0, 0], xg: [0, 0], xa: [0, 0],
    scorers: [], over: false,
  });

  const runningRef = useRef(running);
  const speedRef = useRef(speed);
  const zonesRef = useRef(zones);
  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { zonesRef.current = zones; }, [zones]);

  if (!matchRef.current) matchRef.current = createMatch(homeKey, awayKey);

  const reset = useCallback(() => {
    matchRef.current = createMatch(homeKey, awayKey);
    matchRef.current.tactics = tactics.map((t) => ({ ...t }));
    accRef.current = 0;
    setHud({
      score: [0, 0], clock: 0, poss: [50, 50], shots: [0, 0],
      fouls: [0, 0], offsides: [0, 0], corners: [0, 0], xg: [0, 0], xa: [0, 0],
      scorers: [], over: false,
    });
  }, [homeKey, awayKey, tactics]);

  // Changing shape or instructions never restarts the match — the score,
  // clock and whoever has the ball all carry over.
  const changeFormation = useCallback((team, key) => {
    if (team === HOME) setHomeKey(key); else setAwayKey(key);
    if (matchRef.current) remapTeam(matchRef.current, team, key);
  }, []);

  const setTactic = useCallback((team, field, value) => {
    setTactics((prev) => {
      const next = prev.map((t, i) => (i === team ? { ...t, [field]: value } : t));
      const m = matchRef.current;
      if (m) {
        m.tactics = next.map((t) => ({ ...t }));
        if (kickoffPending(m)) {
          snapKickoffPositions(m);
          m.settle = 0; m.morph = 0;
        } else {
          m.settle = 3.2; m.morph = 3.2;
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let hudTimer = 0;

    const resize = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const dpr = window.devicePixelRatio || 1;
      const w = wrap.clientWidth;
      const h = Math.max(220, Math.round(w * (PITCH_W / PITCH_L)));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (wrapRef.current) ro.observe(wrapRef.current);

    const loop = (ts) => {
      rafRef.current = requestAnimationFrame(loop);
      const m = matchRef.current;
      if (!m) return;

      if (!lastRef.current) lastRef.current = ts;
      let frame = (ts - lastRef.current) / 1000;
      lastRef.current = ts;
      if (frame > 0.25) frame = 0.25;

      if (runningRef.current && !m.over) {
        accRef.current += frame * speedRef.current;
        let steps = 0;
        while (accRef.current >= FIXED_DT && steps < MAX_STEPS) {
          tick(m, FIXED_DT);
          accRef.current -= FIXED_DT;
          steps++;
        }
        if (steps >= MAX_STEPS) accRef.current = 0;

        hudTimer += frame;
        if (hudTimer > 0.12) {
          hudTimer = 0;
          const tot = m.possTicks[0] + m.possTicks[1] || 1;
          setHud({
            score: [...m.score], clock: m.clock,
            poss: [Math.round((m.possTicks[0] / tot) * 100), Math.round((m.possTicks[1] / tot) * 100)],
            shots: [...m.shots], fouls: [...m.fouls],
            offsides: [...m.offsides], corners: [...m.corners],
            xg: [m.xg[0], m.xg[1]], xa: [m.xa[0], m.xa[1]],
            scorers: m.scorers.slice(-12), over: m.over,
          });
        }
      } else if (m.settle > 0) {
        accRef.current += frame;
        let steps = 0;
        while (accRef.current >= FIXED_DT && steps < MAX_STEPS) {
          settleTick(m, FIXED_DT);
          accRef.current -= FIXED_DT;
          steps++;
        }
        if (steps >= MAX_STEPS) accRef.current = 0;
      }

      const dpr = window.devicePixelRatio || 1;
      draw(ctx, m, canvas.width / dpr, canvas.height / dpr, zonesRef.current);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); lastRef.current = 0; };
  }, []);

  const mm = String(Math.floor(hud.clock / 60)).padStart(2, "0");
  const ss = String(Math.floor(hud.clock % 60)).padStart(2, "0");

  const sel = "bg-transparent border border-slate-700 text-slate-100 text-sm rounded px-2 py-1.5 outline-none focus:border-slate-400";
  const btn = "text-sm px-3 py-1.5 rounded border border-slate-700 text-slate-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400";
  const seg = (on) =>
    `flex-1 text-xs px-1.5 py-1.5 rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 ${
      on ? "border-slate-300 text-white bg-slate-100/10" : "border-slate-700 text-slate-400 hover:border-slate-500"
    }`;

  const Stat = ({ label, v }) => (
    <div className="flex justify-between gap-3">
      <span className="font-mono">{v[0]}</span>
      <span className="text-[11px] uppercase tracking-wider">{label}</span>
      <span className="font-mono">{v[1]}</span>
    </div>
  );

  return (
    <div className="w-full min-h-screen p-4 sm:p-6" style={{ background: C.bg, color: C.text }}>
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: C.home }} />
            <span className="font-mono text-sm truncate">{homeKey}</span>
          </div>
          <div className="text-center px-3">
            <div className="font-mono text-3xl sm:text-4xl tracking-tight leading-none">
              {hud.score[0]}<span className="opacity-40 px-1.5">:</span>{hud.score[1]}
            </div>
            <div className="font-mono text-xs mt-1" style={{ color: C.muted }}>
              {hud.over ? "FULL TIME" : `${mm}'${ss}`}
            </div>
          </div>
          <div className="flex items-center gap-2 min-w-0 justify-end">
            <span className="font-mono text-sm truncate">{awayKey}</span>
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: C.away }} />
          </div>
        </div>

        <div className="flex h-1 mb-4 rounded overflow-hidden" style={{ background: C.line }}>
          <div style={{ width: `${hud.poss[0]}%`, background: C.home, transition: "width 300ms linear" }} />
          <div style={{ width: `${hud.poss[1]}%`, background: C.away, transition: "width 300ms linear" }} />
        </div>

        <div ref={wrapRef} className="w-full rounded-lg overflow-hidden border" style={{ borderColor: C.line }}>
          <canvas ref={canvasRef} className="block w-full" />
        </div>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-sm" style={{ color: C.muted }}>
          <Stat label="Shots" v={hud.shots} />
          <Stat label="xG" v={[hud.xg[0].toFixed(2), hud.xg[1].toFixed(2)]} />
          <Stat label="xA" v={[hud.xa[0].toFixed(2), hud.xa[1].toFixed(2)]} />
          <Stat label="Corners" v={hud.corners} />
          <Stat label="Fouls" v={hud.fouls} />
          <Stat label="Offside" v={hud.offsides} />
        </div>

        {hud.scorers.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-x-6 text-xs" style={{ color: C.muted }}>
            <div>
              {hud.scorers.filter((g) => g.team === HOME).map((g, i) => (
                <div key={i} className="font-mono">
                  {g.own ? "og" : `#${g.num}`} <span className="opacity-60">{g.minute}'</span>
                </div>
              ))}
            </div>
            <div className="text-right">
              {hud.scorers.filter((g) => g.team === AWAY).map((g, i) => (
                <div key={i} className="font-mono">
                  <span className="opacity-60">{g.minute}'</span> {g.own ? "og" : `#${g.num}`}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full time. The Reset button below has always been there, but at
            the end of a match it is the only thing anybody wants and it sits
            in a row of six controls looking like all the others. */}
        {hud.over && (
          <div className="mt-3 flex items-center gap-3 rounded-lg border px-4 py-3"
            style={{ borderColor: C.line, background: C.panel }}>
            <div className="font-mono text-sm" style={{ color: C.muted }}>
              Full time — {hud.score[0]}:{hud.score[1]}
            </div>
            <button
              onClick={() => { reset(); setRunning(true); }}
              className="text-sm px-4 py-1.5 rounded border border-slate-300 text-white bg-slate-100/10 hover:bg-slate-100/20 focus:outline-none focus:ring-2 focus:ring-slate-400">
              New match
            </button>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <button onClick={() => setRunning((r) => !r)} className={btn}>
            {running ? "Pause" : "Kick off"}
          </button>
          <button onClick={() => { setRunning(false); reset(); }} className={btn}>Reset</button>
          <div className="flex gap-1">
            {[1, 2, 4].map((sp) => (
              <button key={sp} onClick={() => setSpeed(sp)}
                className={`text-sm px-2.5 py-1.5 rounded border font-mono ${speed === sp ? "border-slate-300 text-white" : "border-slate-700 text-slate-400"}`}>
                {sp}×
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm ml-auto" style={{ color: C.muted }}>
            <input type="checkbox" checked={zones} onChange={(e) => setZones(e.target.checked)} className="accent-slate-400" />
            Overlays
          </label>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[HOME, AWAY].map((team) => (
            <div key={team} className="rounded-lg border p-3" style={{ borderColor: C.line }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ background: team === HOME ? C.home : C.away }} />
                <span className="text-xs uppercase tracking-widest" style={{ color: C.muted }}>
                  {team === HOME ? "Home" : "Away"}
                </span>
                <select
                  value={team === HOME ? homeKey : awayKey}
                  onChange={(e) => changeFormation(team, e.target.value)}
                  className={`${sel} ml-auto font-mono`}
                  aria-label={`${team === HOME ? "Home" : "Away"} formation`}
                >
                  {Object.keys(FORMATIONS).map((k) => (
                    <option key={k} value={k} className="bg-slate-900">{k}</option>
                  ))}
                </select>
              </div>

              {SECTIONS.map((sec) => (
                <details key={sec.name} className="border-t pt-2 mt-2 first:border-t-0 first:mt-0 first:pt-0"
                  style={{ borderColor: C.line }}>
                  <summary className="cursor-pointer list-none flex items-center justify-between text-sm py-1 select-none">
                    <span>{sec.name}</span>
                    <span className="text-xs" style={{ color: C.muted }}>edit</span>
                  </summary>
                  <div className="pt-2">
                    {sec.rows.filter((row) => !row.showIf || row.showIf(tactics[team])).map((row) => (
                      <div key={row.field} className="mb-2.5 last:mb-0">
                        <div className="text-xs mb-1.5" style={{ color: C.muted }}>{row.label}</div>
                        <div className="flex gap-1">
                          {Object.entries(row.opts).map(([k, v]) => {
                            const val = row.num ? Number(k) : k;
                            return (
                              <button key={k} onClick={() => setTactic(team, row.field, val)}
                                className={seg(tactics[team][row.field] === val)}>
                                {v.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs leading-relaxed" style={{ color: C.muted }}>
          Full laws: throw-ins, goal kicks, corners, free kicks and penalties each take {RESTART_TIME}s to
          restart, with offsides and fouls called live. Instructions can be changed at any moment — nothing
          restarts, because an instruction only moves where players want to be.
        </p>
      </div>
    </div>
  );
}

