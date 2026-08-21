import {
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Crosshair,
  Download,
  Eraser,
  Gamepad2,
  Goal,
  GraduationCap,
  Grip,
  LayoutGrid,
  Lightbulb,
  ListFilter,
  Minus,
  MoveUpRight,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Search,
  X,
  Shield,
  Sparkles,
  Spline,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import {
  FORMATION_CONTENT,
  ERA_CONTENT,
  GLOSSARY,
  MANAGER_PLAYSTYLES,
} from './formation-content';
import { GUIDE_ENTRY_SECTION, GUIDE_SECTIONS, GUIDE_TERMS } from './guide-content';
import { FORMATIONS, type Formation } from './formations';
import { MANAGERS, type Era } from './managers';
import MatchGame from './match-game';
import HowToPlay from './how-to-play';
import { isNewVisit, rememberReturn } from './first-visit';
import { MANAGER_PHOTOS, managerPhotoUrl } from './manager-photos';
import { PLAYER_PHOTOS, playerPhotoUrl, type PlayerPhoto } from './player-photos';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

type Position = {
  x: number;
  y: number;
};

type Player = Position & {
  id: string;
  number: number;
  role: string;
  name?: string;
};

type ArrowStyle = 'solid' | 'dashed' | 'curved';

type Arrow = {
  id: string;
  // Arrows drawn from a player circle anchor to that player and travel with
  // him when he is dragged. Arrows drawn from open grass carry their own
  // fixed start point instead.
  playerId?: string;
  startX?: number;
  startY?: number;
  endX: number;
  endY: number;
  style: ArrowStyle;
  // Signed perpendicular bend for curved arrows, in viewBox units. Derived
  // from the point of the drag path that strays furthest from the straight
  // start-end line: sign picks the side, magnitude sets how deep the bow is.
  // Undefined (or tiny) means "near-straight drag" — use the default bow.
  bend?: number;
};

// Where an arrow begins: the anchored player's current spot, or its own fixed
// start point for arrows drawn from open grass.
function arrowStart(arrow: Arrow, players: Player[]): Position | null {
  if (arrow.playerId !== undefined) {
    const anchor = players.find((player) => player.id === arrow.playerId);
    return anchor ? { x: anchor.x, y: anchor.y } : null;
  }
  if (arrow.startX === undefined || arrow.startY === undefined) return null;
  return { x: arrow.startX, y: arrow.startY };
}

// Drag-path bends smaller than this (viewBox units) are treated as a
// straight-line drag, keeping the historical default curve direction.
const CURVE_BEND_THRESHOLD = 2;

// The pitch viewBox is 100 units wide by this many tall, and the CSS
// aspect-ratio of .pitch must stay equal to 100 / PITCH_VIEWBOX_HEIGHT so
// viewBox units stay square. Player/arrow coordinates are percentages of the
// pitch, so y values scale by PITCH_Y_SCALE when drawn in viewBox units.
const PITCH_VIEWBOX_HEIGHT = 122;
const PITCH_Y_SCALE = PITCH_VIEWBOX_HEIGHT / 100;
const PITCH_VIEWBOX = `0 0 100 ${PITCH_VIEWBOX_HEIGHT}`;

// Display-only shirt numbers by position. Duplicates within one formation are
// intentional (two CMs both wear 8, two STs both wear 9). Edit here.
export const SHIRT_NUMBERS: Record<string, number> = {
  GK: 1,
  RB: 2,
  RWB: 2,
  LB: 3,
  LWB: 3,
  LCB: 4,
  RCB: 5,
  CB: 5,
  DEF: 5,
  DM: 6,
  RW: 7,
  RM: 7,
  CM: 8,
  LCM: 8,
  RCM: 8,
  MID: 8,
  ST: 9,
  CF: 9,
  FWD: 9,
  AM: 10,
  SS: 10,
  LW: 11,
  LM: 11,
};

const ROLE_NAMES: Record<string, string> = {
  GK: 'Goalkeeper',
  RB: 'Right-back',
  RWB: 'Right wing-back',
  LB: 'Left-back',
  LWB: 'Left wing-back',
  LCB: 'Left centre-back',
  CB: 'Centre-back',
  RCB: 'Right centre-back',
  DEF: 'Defender',
  DM: 'Defensive midfielder',
  CM: 'Central midfielder',
  LCM: 'Left central midfielder',
  RCM: 'Right central midfielder',
  MID: 'Midfielder',
  AM: 'Attacking midfielder',
  SS: 'Second striker',
  LM: 'Left midfielder',
  RM: 'Right midfielder',
  LW: 'Left winger',
  RW: 'Right winger',
  ST: 'Striker',
  CF: 'Centre-forward',
  FWD: 'Forward',
};

const shirtNumber = (player: Player) => SHIRT_NUMBERS[player.role] ?? player.number;
const roleName = (role: string) => ROLE_NAMES[role] ?? role;

// The user-built shape, listed above the presets. Only its `shape` changes as
// the lines are edited; roles, shirt numbers, the thumbnail and the pitch are
// all derived from it by the same code every preset formation uses, so a
// custom shape behaves like any other once it is on the board.
const CUSTOM_NAME = 'Custom';
const CUSTOM_SUBTITLE = 'Build your own';
const DEFAULT_CUSTOM_SHAPE = [4, 4, 2];
// A team is a keeper plus ten outfield players, spread over at most five
// lines. Five in one line is already extreme (a back five); more than that
// stops resembling a formation.
const MAX_OUTFIELD = 10;
const MAX_LINES = 5;
const MAX_PER_LINE = 5;

/** One recorded moment of a user-made clip. Frames store a full snapshot of
 *  the board rather than a diff from the previous one: capturing is then just
 *  "remember where everything is", and deleting a frame in the middle cannot
 *  leave the ones after it describing positions that no longer exist. */
type ClipFrame = {
  id: string;
  note: string;
  players: Record<string, Position>;
  ball: Position | null;
  opponents: Position[];
};

const CLIP_STORAGE_KEY = 'tactics-canvas:custom-clip';
const CLIP_SPEEDS: { label: string; seconds: number }[] = [
  { label: 'Slow', seconds: 1.7 },
  { label: 'Normal', seconds: 1.1 },
  { label: 'Fast', seconds: 0.7 },
];
const DEFAULT_CLIP_SPEED = 1.1;
const MAX_CLIP_FRAMES = 12;

/** Reads a saved clip back. Anything unrecognised is discarded rather than
 *  trusted — the value is user-editable and survives across releases. */
function loadStoredClip(): { frames: ClipFrame[]; speed: number } {
  const empty = { frames: [], speed: DEFAULT_CLIP_SPEED };
  try {
    const raw = window.localStorage.getItem(CLIP_STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as { frames?: unknown; speed?: unknown };
    if (!Array.isArray(parsed.frames)) return empty;
    const isPoint = (value: unknown): value is Position =>
      typeof value === 'object' &&
      value !== null &&
      typeof (value as Position).x === 'number' &&
      typeof (value as Position).y === 'number';
    const frames = parsed.frames.flatMap((frame): ClipFrame[] => {
      if (typeof frame !== 'object' || frame === null) return [];
      const { id, note, players, ball, opponents } = frame as Partial<ClipFrame>;
      if (typeof id !== 'string' || typeof players !== 'object' || players === null) return [];
      const points = Object.entries(players).filter(([, value]) => isPoint(value));
      return [
        {
          id,
          note: typeof note === 'string' ? note : '',
          players: Object.fromEntries(points) as Record<string, Position>,
          ball: isPoint(ball) ? ball : null,
          opponents: Array.isArray(opponents) ? opponents.filter(isPoint) : [],
        },
      ];
    });
    const speed = CLIP_SPEEDS.some((option) => option.seconds === parsed.speed)
      ? (parsed.speed as number)
      : DEFAULT_CLIP_SPEED;
    return { frames: frames.slice(0, MAX_CLIP_FRAMES), speed };
  } catch {
    return empty;
  }
}

/** Names the builder's rows. A shape is written back to front, so row 0 is the
 *  defence and the last row is the attack; anything between is midfield. */
function lineLabel(row: number, totalRows: number): string {
  if (row === 0) return 'Defence';
  if (row === totalRows - 1) return 'Attack';
  const middleCount = totalRows - 2;
  if (middleCount === 1) return 'Midfield';
  const middleIndex = row - 1;
  if (middleIndex === 0) return 'Deep midfield';
  if (middleIndex === middleCount - 1) return 'Attacking midfield';
  return 'Midfield';
}

// The dugout list is split by whether the manager is still coaching, so the
// people you can watch this weekend are not buried among the greats.
const MANAGER_SECTIONS = [
  { status: 'current' as const, title: 'Current managers' },
  { status: 'retired' as const, title: 'Retired managers' },
].map((section) => ({
  ...section,
  // Alphabetical by surname. localeCompare rather than a plain sort so
  // accented names file where a reader expects instead of after Z.
  managers: MANAGERS.filter((manager) => manager.status === section.status).sort((a, b) =>
    a.sortName.localeCompare(b.sortName),
  ),
}));

// Tactic animations live in ./era-animations and are pulled in with a dynamic
// import() the first time a clip is played, so the initial bundle stays small.
// The shared Position type now lives in ./pitch-types.
import type { TacticAnimation } from './era-animations';

// ---------------------------------------------------------------------------
// Jargon glossing: football terms in panel copy get an asterisk, and the
// panel footer defines every term that appeared. Patterns are matched
// longest-first, case-insensitively, against the raw copy strings.
// ---------------------------------------------------------------------------

const GLOSS_PATTERNS: Array<[source: string, key: string]> = [
  ['juego de posición', 'juego de posición'],
  ['positional play', 'positional play'],
  ['total football', 'total football'],
  ['inverted full-backs?', 'inverted full-back'],
  ['counter-press(?:ing|es)?|counterpress(?:ing)?', 'counter-press'],
  ['gegenpress(?:ing)?', 'gegenpressing'],
  ['half-spaces?', 'half-space'],
  ['false[ -]nine', 'false nine'],
  ['single pivot', 'single pivot'],
  ['double pivot', 'double pivot'],
  ['number ten', 'number ten'],
  ['low block', 'low block'],
  ['rest defence', 'rest defence'],
  ['third[- ]man', 'third-man'],
  ['trequartistas?', 'trequartista'],
  ['tiki-taka', 'tiki-taka'],
  ['wing-backs?', 'wing-back'],
  ['underlap(?:ping|s)?', 'underlap'],
  ['overload(?:s|ing)?', 'overload'],
  ['fantasistas?', 'fantasista'],
  ['liberos?', 'libero'],
  ['registas?', 'regista'],
  ['raumdeuter', 'raumdeuter'],
  ['pivot', 'pivot'],
];

const GLOSS_REGEX = new RegExp(
  GLOSS_PATTERNS.map(([source]) => `(?:\\b(?:${source})\\b)`).join('|'),
  'gi',
);

function glossKeyFor(match: string): string | undefined {
  return GLOSS_PATTERNS.find(([source]) => new RegExp(`^(?:${source})$`, 'i').test(match))?.[1];
}

// Every glossary key found across the given strings, in order of appearance.
function findGlossTerms(texts: string[]): string[] {
  const found: string[] = [];
  for (const text of texts) {
    for (const match of text.matchAll(GLOSS_REGEX)) {
      const key = glossKeyFor(match[0]);
      if (key && GLOSSARY[key] && !found.includes(key)) found.push(key);
    }
  }
  return found;
}

// Positions and ideas worth emphasising so a bullet can be skimmed. Glossary
// terms are matched first and win, so a word is never both starred and merely
// bolded. Deliberately short — bolding everything emphasises nothing.
const KEY_TERM_SOURCES = [
  'full-backs?',
  'centre-backs?',
  'wing-backs?',
  'wingers?',
  'goalkeepers?',
  'strikers?',
  'centre-forwards?',
  'midfielders?',
  'defenders?',
  'width',
  'press(?:ing|es)?',
  'counter-attacks?',
  'crosses',
  'cut-?backs?',
  'overlaps?',
  'offside trap',
  'high line',
  'the box',
  'touchlines?',
  'compact',
  'narrow',
];

// Glossary patterns first, then guide terms, then plain emphasis: at the same
// position the earlier alternative wins, so the more specific pattern has to
// come first or the general one swallows it.
const EMPHASIS_REGEX = new RegExp(
  [
    ...GLOSS_PATTERNS.map(([source]) => source),
    ...GUIDE_TERMS.map(([source]) => source),
    ...KEY_TERM_SOURCES,
  ]
    .map((source) => `(?:\\b(?:${source})\\b)`)
    .join('|'),
  'gi',
);

// Which guide entry a matched word opens, if any.
function guideIdFor(match: string): string | undefined {
  return GUIDE_TERMS.find(([source]) => new RegExp(`^(?:${source})$`, 'i').test(match))?.[1];
}

// The Guide jump handler is parked here rather than threaded through as a
// prop, because glossify() is a plain function called from a dozen places in
// the panel tree. There is only ever one board on the page.
const guideJump: { current: ((entryId: string) => void) | null } = { current: null };

// One emphasised word. When the Guide documents it the word becomes a link
// into that entry; otherwise it is simply emphasised, so the copy reads the
// same whether or not the term happens to be covered.
function EmphasisTerm({
  guideId,
  starred,
  text,
}: {
  guideId?: string;
  starred: boolean;
  text: string;
}) {
  const label = starred ? `${text}*` : text;
  if (!guideId) {
    return <strong className={starred ? 'gloss-term' : 'key-term'}>{label}</strong>;
  }
  return (
    <button
      className={`key-term guide-link${starred ? ' gloss-term' : ''}`}
      data-guide-term={guideId}
      onClick={() => guideJump.current?.(guideId)}
      title={`Read about ${text} in the guide`}
      type="button"
    >
      {label}
    </button>
  );
}

// Renders text with glossary terms starred, terms the Guide covers linked,
// and other key words simply bolded.
function glossify(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(EMPHASIS_REGEX)) {
    const index = match.index ?? 0;
    const glossKey = glossKeyFor(match[0]);
    parts.push(text.slice(last, index));
    parts.push(
      <EmphasisTerm
        guideId={guideIdFor(match[0])}
        key={`${index}-${match[0]}`}
        starred={Boolean(glossKey && GLOSSARY[glossKey])}
        text={match[0]}
      />,
    );
    last = index + match[0].length;
  }
  parts.push(text.slice(last));
  return parts.length > 1 ? parts : text;
}

function GlossFooter({ terms }: { terms: string[] }) {
  if (!terms.length) return null;
  return (
    <div className="gloss-footer">
      {terms.map((key) => (
        <div key={key}>
          <em>*{key}</em> — {GLOSSARY[key]}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shape phases for the Shapes tab: how a formation stretches when it has the
// ball and compresses when it does not. Expressed per role as a vertical shift
// (dy, negative is up the pitch) and a lateral shift (spread, positive moves
// away from the centre), so it works for every formation without hand-placing
// coordinates. These are simplified textbook shapes, not a real team's shape.
// ---------------------------------------------------------------------------

type PhaseMove = { dy: number; spread: number };

const PHASE_MOVES: Record<string, { attack: PhaseMove; defend: PhaseMove }> = {
  GK: { attack: { dy: -5, spread: 0 }, defend: { dy: 1, spread: 0 } },
  LCB: { attack: { dy: -7, spread: 4 }, defend: { dy: 5, spread: -2 } },
  CB: { attack: { dy: -7, spread: 0 }, defend: { dy: 5, spread: 0 } },
  RCB: { attack: { dy: -7, spread: 4 }, defend: { dy: 5, spread: -2 } },
  DEF: { attack: { dy: -7, spread: 3 }, defend: { dy: 5, spread: -2 } },
  LB: { attack: { dy: -22, spread: 5 }, defend: { dy: 7, spread: -4 } },
  RB: { attack: { dy: -22, spread: 5 }, defend: { dy: 7, spread: -4 } },
  LWB: { attack: { dy: -24, spread: 5 }, defend: { dy: 9, spread: -5 } },
  RWB: { attack: { dy: -24, spread: 5 }, defend: { dy: 9, spread: -5 } },
  DM: { attack: { dy: -6, spread: 0 }, defend: { dy: 5, spread: 0 } },
  LCM: { attack: { dy: -11, spread: 0 }, defend: { dy: 9, spread: -3 } },
  CM: { attack: { dy: -11, spread: 0 }, defend: { dy: 9, spread: 0 } },
  RCM: { attack: { dy: -11, spread: 0 }, defend: { dy: 9, spread: -3 } },
  MID: { attack: { dy: -11, spread: 0 }, defend: { dy: 9, spread: -3 } },
  AM: { attack: { dy: -8, spread: 0 }, defend: { dy: 15, spread: 0 } },
  SS: { attack: { dy: -8, spread: 0 }, defend: { dy: 14, spread: 0 } },
  LM: { attack: { dy: -10, spread: 6 }, defend: { dy: 14, spread: -9 } },
  RM: { attack: { dy: -10, spread: 6 }, defend: { dy: 14, spread: -9 } },
  LW: { attack: { dy: -7, spread: 6 }, defend: { dy: 16, spread: -10 } },
  RW: { attack: { dy: -7, spread: 6 }, defend: { dy: 16, spread: -10 } },
  ST: { attack: { dy: -6, spread: 0 }, defend: { dy: 13, spread: -2 } },
  CF: { attack: { dy: -6, spread: 0 }, defend: { dy: 13, spread: -2 } },
  FWD: { attack: { dy: -6, spread: 0 }, defend: { dy: 13, spread: -2 } },
};

// How far a piece may be dragged. 1 to 100 rather than a safe inset, so the
// touchlines and goal lines are usable positions.
const MIN_POS = 1;
const MAX_POS = 100;

// Shape phases are generated, not dragged, so they keep a margin: a
// computed position on the touchline would look like a mistake.
const clampPitch = (value: number) => Math.max(6, Math.min(94, value));

function phasePlayers(players: Player[], phase: 'attack' | 'defend'): Player[] {
  return players.map((player) => {
    const move = (PHASE_MOVES[player.role] ?? PHASE_MOVES.MID)[phase];
    // Central players have no lateral shift; wide ones move out or tuck in
    // relative to whichever touchline they start nearest.
    const side = player.x === 50 ? 0 : player.x < 50 ? -1 : 1;
    return {
      ...player,
      x: clampPitch(player.x + move.spread * side),
      y: clampPitch(player.y + move.dy),
    };
  });
}

// Preferred traditional shirt numbers per role, first available wins
const ROLE_NUMBER_PREFS: Record<string, number[]> = {
  GK: [1],
  RB: [2, 7],
  RWB: [2, 7],
  LB: [3, 11],
  LWB: [3, 11],
  LCB: [4, 6, 5],
  CB: [5, 4, 6],
  RCB: [5, 6, 4],
  DM: [6, 8, 4],
  LCM: [8, 10, 6],
  CM: [8, 6, 10],
  RCM: [6, 8, 10],
  AM: [10, 8, 7],
  LM: [11, 7],
  LW: [11, 7],
  RM: [7, 11],
  RW: [7, 11],
  ST: [9, 10, 7, 11],
  FWD: [9, 10],
  MID: [8, 6],
  DEF: [4, 5],
};

const DEF_ROLES: Record<number, string[]> = {
  3: ['LCB', 'CB', 'RCB'],
  4: ['LB', 'LCB', 'RCB', 'RB'],
  5: ['LWB', 'LCB', 'CB', 'RCB', 'RWB'],
};

const MID_ROLES: Record<number, string[]> = {
  1: ['DM'],
  2: ['LCM', 'RCM'],
  3: ['LCM', 'CM', 'RCM'],
  4: ['LM', 'LCM', 'RCM', 'RM'],
  5: ['LM', 'LCM', 'CM', 'RCM', 'RM'],
};

const DM_ROLES: Record<number, string[]> = {
  1: ['DM'],
  2: ['DM', 'DM'],
  3: ['LCM', 'DM', 'RCM'],
  4: ['LM', 'DM', 'DM', 'RM'],
  5: ['LM', 'LCM', 'DM', 'RCM', 'RM'],
};

const AM_ROLES: Record<number, string[]> = {
  1: ['AM'],
  2: ['AM', 'AM'],
  3: ['LM', 'AM', 'RM'],
  4: ['LM', 'AM', 'AM', 'RM'],
};

const FWD_ROLES: Record<number, string[]> = {
  1: ['ST'],
  2: ['ST', 'ST'],
  3: ['LW', 'ST', 'RW'],
  4: ['LW', 'ST', 'ST', 'RW'],
};

function linePositions(count: number, y: number, isDiamond: boolean): Position[] {
  if (isDiamond && count === 4) {
    return [
      { x: 50, y: y + 9 },
      { x: 22, y },
      { x: 78, y },
      { x: 50, y: y - 10 },
    ];
  }
  if (count === 1) return [{ x: 50, y }];
  const width = count >= 5 ? 72 : count === 4 ? 65 : count === 3 ? 54 : 38;
  return Array.from({ length: count }, (_, index) => ({
    x: 50 - width / 2 + (width * index) / (count - 1),
    y,
  }));
}

function rowRoles(count: number, row: number, totalRows: number): string[] {
  const fallback = (label: string) => Array.from({ length: count }, () => label);
  if (row === totalRows - 1) return FWD_ROLES[count] ?? fallback('FWD');
  if (row === 0) return DEF_ROLES[count] ?? fallback('DEF');
  const middleCount = totalRows - 2;
  const middleIndex = row - 1;
  // Only treat narrow lines as dedicated DM/AM rows; a flat line of 4 is a
  // conventional midfield (e.g. 4-4-1-1, 4-1-4-1), not a DM or AM bank.
  if (middleCount > 1 && middleIndex === middleCount - 1 && count <= 3) return AM_ROLES[count] ?? fallback('AM');
  if (middleCount > 1 && middleIndex === 0 && count <= 2) return DM_ROLES[count] ?? fallback('MID');
  return MID_ROLES[count] ?? fallback('MID');
}

function makePlayers(shape: number[], isDiamondFormation: boolean, names?: string[]): Player[] {
  const used = new Set<number>([1]);
  const pickNumber = (role: string) => {
    const prefs = ROLE_NUMBER_PREFS[role] ?? [];
    for (const preference of prefs) {
      if (!used.has(preference)) {
        used.add(preference);
        return preference;
      }
    }
    for (let candidate = 2; candidate <= 23; candidate += 1) {
      if (!used.has(candidate)) {
        used.add(candidate);
        return candidate;
      }
    }
    return 12;
  };

  const players: Player[] = [
    { id: 'p1', number: 1, role: 'GK', name: names?.[0], x: 50, y: 92 },
  ];
  // shape reads back to front: defenders first, attackers last.
  // Defenders sit just in front of the GK (high y), attackers at the far end (low y).
  let idCounter = 2;
  shape.forEach((count, row) => {
    const y = 77 - (row * 61) / Math.max(shape.length - 1, 1);
    const diamondRow = isDiamondFormation && row === 1 && count === 4;
    const positions = linePositions(count, y, diamondRow);
    const roles = diamondRow ? ['DM', 'LM', 'RM', 'AM'] : rowRoles(count, row, shape.length);
    positions.forEach((position, index) => {
      const role = roles[index] ?? 'MID';
      players.push({
        id: `p${idCounter}`,
        number: pickNumber(role),
        role,
        name: names?.[idCounter - 1],
        ...position,
      });
      idCounter += 1;
    });
  });
  return players.slice(0, 11);
}

function formationPlayers(formation: Formation): Player[] {
  return makePlayers(formation.shape, formation.name.toLowerCase().includes('diamond'));
}

function eraPlayers(era: Era): Player[] {
  return makePlayers(era.shape, false, era.xi);
}

// Club colours, used only as small accent swatches beside each era so the
// library reads at a glance. Keyed by club name as it appears in MANAGERS.
// Club kits, drawn as simple original shirt marks. Real club crests are
// copyrighted artwork and registered trade marks, so they are deliberately not
// reproduced here; a plain shirt in the club's kit colours identifies the side
// without using anyone's badge.
type KitPattern = {
  kind: 'solid' | 'stripes' | 'sleeves' | 'band';
  colours: [string, string];
};

const CLUB_KITS: Record<string, KitPattern> = {
  'Manchester United': { kind: 'solid', colours: ['#da291c', '#1b1b1b'] },
  Barcelona: { kind: 'stripes', colours: ['#a50044', '#004d98'] },
  'Bayern Munich': { kind: 'solid', colours: ['#dc052d', '#0066b2'] },
  'Manchester City': { kind: 'solid', colours: ['#6cabdd', '#1c2c5b'] },
  'FC Porto': { kind: 'stripes', colours: ['#f4f4f4', '#00428c'] },
  Chelsea: { kind: 'solid', colours: ['#034694', '#f4f4f4'] },
  'Inter Milan': { kind: 'stripes', colours: ['#1b1b1b', '#0b3fa8'] },
  'AC Milan': { kind: 'stripes', colours: ['#1b1b1b', '#fb090b'] },
  'Real Madrid': { kind: 'solid', colours: ['#f4f4f4', '#00529f'] },
  Arsenal: { kind: 'sleeves', colours: ['#ef0107', '#f4f4f4'] },
  Liverpool: { kind: 'solid', colours: ['#c8102e', '#00b2a9'] },
  'Paris Saint-Germain': { kind: 'band', colours: ['#0b2b57', '#da291c'] },
  Sevilla: { kind: 'solid', colours: ['#f4f4f4', '#d10a11'] },
  'Aston Villa': { kind: 'sleeves', colours: ['#670e36', '#95bfe5'] },
  'Bayer Leverkusen': { kind: 'solid', colours: ['#e32219', '#1b1b1b'] },
  'Sporting CP': { kind: 'stripes', colours: ['#008057', '#f4f4f4'] },
  'Atlético Madrid': { kind: 'stripes', colours: ['#f4f4f4', '#cb3524'] },
  Juventus: { kind: 'stripes', colours: ['#f4f4f4', '#1b1b1b'] },
  Netherlands: { kind: 'solid', colours: ['#ff6a13', '#1b1b1b'] },
  Spain: { kind: 'solid', colours: ['#c60b1e', '#1b3a8f'] },
  Italy: { kind: 'solid', colours: ['#0b3fa8', '#f4f4f4'] },
};

const SHIRT_PATH =
  'M4.5 5.2 L9.2 2.8 Q12 5.4 14.8 2.8 L19.5 5.2 L21.8 9.4 L18.2 10.9 L18.2 21.2 L5.8 21.2 L5.8 10.9 L2.2 9.4 Z';

// Free-licensed portraits require visible credit, so the photo and its
// attribution line always render together.
function ManagerPhoto({ manager, size }: { manager: string; size: 'small' | 'large' }) {
  const photo = MANAGER_PHOTOS[manager];
  if (!photo) return null;
  return (
    <img
      className={`manager-photo is-${size}`}
      src={managerPhotoUrl(photo.file)}
      alt={manager}
      loading="lazy"
      width={size === 'large' ? 72 : 30}
      height={size === 'large' ? 72 : 30}
    />
  );
}

function ManagerPhotoCredit({ manager }: { manager: string }) {
  const photo = MANAGER_PHOTOS[manager];
  if (!photo) return null;
  return (
    <p className="photo-credit">
      Photo:{' '}
      <a href={photo.source} target="_blank" rel="noreferrer noopener">
        Wikimedia Commons
      </a>{' '}
      — {photo.author},{' '}
      <a href={photo.licenceUrl} target="_blank" rel="noreferrer noopener">
        {photo.licence}
      </a>
    </p>
  );
}

function ClubSwatch({ club }: { club: string }) {
  const kit: KitPattern = CLUB_KITS[club] ?? { kind: 'solid', colours: ['#9a9a9a', '#d4d4d4'] };
  const clipId = `kit-${club.replace(/[^a-z]/gi, '')}`;
  const [base, accent] = kit.colours;
  return (
    <svg className="club-kit" viewBox="0 0 24 24" role="img" aria-label={`${club} kit colours`}>
      <defs>
        <clipPath id={clipId}>
          <path d={SHIRT_PATH} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="0" width="24" height="24" fill={base} />
        {kit.kind === 'stripes' &&
          [3, 9, 15, 21].map((x) => (
            <rect key={x} x={x} y="0" width="3" height="24" fill={accent} />
          ))}
        {kit.kind === 'sleeves' && (
          <>
            <rect x="0" y="0" width="5.5" height="24" fill={accent} />
            <rect x="18.5" y="0" width="5.5" height="24" fill={accent} />
          </>
        )}
        {kit.kind === 'band' && <rect x="9.5" y="0" width="5" height="24" fill={accent} />}
      </g>
      <path d={SHIRT_PATH} className="club-kit-outline" />
    </svg>
  );
}

// A miniature of the shape, built from the same layout code as the real board
// so the thumbnail always matches what loading it will draw.
function FormationThumb({ shape, isDiamond = false }: { shape: number[]; isDiamond?: boolean }) {
  const dots = makePlayers(shape, isDiamond);
  return (
    <svg className="formation-thumb" viewBox="0 0 100 122" aria-hidden="true">
      <rect className="formation-thumb-pitch" x="1" y="1" width="98" height="120" />
      <line className="formation-thumb-line" x1="1" y1="61" x2="99" y2="61" />
      {dots.map((dot) => (
        <circle
          key={dot.id}
          className={`formation-thumb-dot ${dot.role === 'GK' ? 'is-keeper' : ''}`}
          cx={dot.x}
          cy={dot.y * PITCH_Y_SCALE}
          r="7"
        />
      ))}
    </svg>
  );
}

// Where one arrow is drawn, and the point halfway along it. Shared between the
// SVG layer and the delete badge so the badge can never drift off its line.
function arrowGeometry(arrow: Arrow, players: Player[]) {
  const start = arrowStart(arrow, players);
  if (!start) return null;
  // Pitch coordinates are percentages; the viewBox matches the pitch aspect
  // ratio, so y scales by PITCH_Y_SCALE.
  const sx = start.x;
  const sy = start.y * PITCH_Y_SCALE;
  const ex = arrow.endX;
  const ey = arrow.endY * PITCH_Y_SCALE;
  if (arrow.style !== 'curved') {
    return { d: `M ${sx} ${sy} L ${ex} ${ey}`, midX: (sx + ex) / 2, midY: (sy + ey) / 2 };
  }
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;
  const dx = ex - sx;
  const dy = ey - sy;
  const length = Math.hypot(dx, dy) || 1;
  // Bow along the unit normal (-dy, dx)/length. A recorded bend from the drag
  // path picks the side and depth; near-straight drags fall back to the
  // historical default bow of a quarter of the length.
  const bend =
    arrow.bend !== undefined && Math.abs(arrow.bend) >= CURVE_BEND_THRESHOLD
      ? Math.max(-length * 0.5, Math.min(length * 0.5, arrow.bend))
      : length * 0.25;
  const cx = mx - (dy / length) * bend;
  const cy = my + (dx / length) * bend;
  return {
    d: `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`,
    // A quadratic sits halfway to its control point at t = 0.5.
    midX: (sx + 2 * cx + ex) / 4,
    midY: (sy + 2 * cy + ey) / 4,
  };
}

// Arrows anchor to their player, so a dragged circle carries its arrows along.
// Rendered in a layer above the pitch lines but below the player circles.
function ArrowLayer({
  arrows,
  players,
  selectedArrowId,
  onSelect,
  onDelete,
}: {
  arrows: Arrow[];
  players: Player[];
  selectedArrowId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <svg className="arrow-layer" viewBox={PITCH_VIEWBOX} role="group" aria-label="Tactical arrows">
      <defs>
        <marker id="arrowhead" markerWidth="7" markerHeight="7" refX="5.4" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 Z" className="arrow-head" />
        </marker>
        <marker id="arrowhead-selected" markerWidth="7" markerHeight="7" refX="5.4" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 Z" className="arrow-head is-selected" />
        </marker>
      </defs>
      {arrows.map((arrow) => {
        const geometry = arrowGeometry(arrow, players);
        if (!geometry) return null;
        const anchor = players.find((player) => player.id === arrow.playerId);
        const isSelected = arrow.id === selectedArrowId;
        return (
          <g key={arrow.id}>
            <path
              className="arrow-hit"
              d={geometry.d}
              data-testid={`arrow-${arrow.id}`}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`${arrow.style} arrow from ${anchor ? roleName(anchor.role) : 'open space'}${isSelected ? ', selected' : ''}. Press Delete to remove.`}
              onPointerDown={(event) => {
                event.stopPropagation();
                onSelect(arrow.id);
              }}
              onFocus={() => onSelect(arrow.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(arrow.id);
                } else if (event.key === 'Delete' || event.key === 'Backspace') {
                  event.preventDefault();
                  onDelete(arrow.id);
                }
              }}
            />
            {/* The selected look is a glow traced along the arrow's own path
                rather than a box or a fattened line, so what lights up is the
                shape the user actually drew. */}
            {isSelected && <path className="arrow-halo" d={geometry.d} />}
            <path
              className={`arrow-path ${arrow.style === 'dashed' ? 'is-dashed' : ''} ${isSelected ? 'is-selected' : ''}`}
              d={geometry.d}
              markerEnd={isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'}
            />

          </g>
        );
      })}
    </svg>
  );
}

function PitchLines() {
  return (
    <svg className="pitch-lines" viewBox={PITCH_VIEWBOX} aria-hidden="true">
      <rect className="pitch-line" x="1" y="1" width="98" height="120" />
      <line className="pitch-line" x1="1" y1="61" x2="99" y2="61" />
      <circle className="pitch-line" cx="50" cy="61" r="9.15" />
      <circle className="pitch-dot" cx="50" cy="61" r="0.7" />
      <rect className="pitch-line" x="17" y="1" width="66" height="18" />
      <rect className="pitch-line" x="31" y="1" width="38" height="7" />
      <circle className="pitch-line" cx="50" cy="12" r="0.7" />
      <path className="pitch-line" d="M38 19 A12 12 0 0 0 62 19" />
      <rect className="pitch-line" x="17" y="103" width="66" height="18" />
      <rect className="pitch-line" x="31" y="114" width="38" height="7" />
      <circle className="pitch-line" cx="50" cy="110" r="0.7" />
      <path className="pitch-line" d="M38 103 A12 12 0 0 1 62 103" />
      <path className="pitch-line" d="M1 5 A4 4 0 0 1 5 1 M95 1 A4 4 0 0 1 99 5 M1 117 A4 4 0 0 0 5 121 M95 121 A4 4 0 0 0 99 117" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// The Guide. The library panel holds the index; the right-hand column holds
// the whole reference as one scrollable article, so a link inside a write-up
// can scroll to the exact entry rather than swapping the page underneath the
// reader.
// ---------------------------------------------------------------------------

function GuideIndex({
  activeId,
  onQuery,
  onSelect,
  query,
}: {
  activeId: string;
  onQuery: (value: string) => void;
  onSelect: (entryId: string) => void;
  query: string;
}) {
  const needle = query.toLowerCase().trim();
  const sections = GUIDE_SECTIONS.map((section) => ({
    ...section,
    entries: section.entries.filter((entry) =>
      `${entry.title} ${entry.badge ?? ''} ${entry.aka ?? ''} ${entry.summary}`
        .toLowerCase()
        .includes(needle),
    ),
  })).filter((section) => section.entries.length > 0);

  return (
    <>
      <div className="panel-heading">
        <div className="eyebrow">The guide</div>
        <h2 className="panel-title">Learn the game</h2>
        <p className="panel-copy">
          Every position with its number, the jargon behind the write-ups, and the rules that
          decide what you are watching.
        </p>
        <label className="search-wrap">
          <Search size={16} aria-hidden="true" />
          <input
            aria-label="Search the guide"
            className="search-input"
            data-testid="input-guide-search"
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search positions and rules"
            type="search"
            value={query}
          />
        </label>
      </div>
      <div className="guide-index">
        {sections.length ? (
          sections.map((section) => (
            <div className="guide-index-group" key={section.id}>
              <div className="guide-index-title">{section.title}</div>
              {section.entries.map((entry) => (
                <button
                  className={`guide-index-item ${entry.id === activeId ? 'is-active' : ''}`}
                  data-testid={`button-guide-${entry.id}`}
                  key={entry.id}
                  onClick={() => onSelect(entry.id)}
                  type="button"
                >
                  <span className="guide-index-name">{entry.title}</span>
                  {entry.badge && <span className="guide-index-badge">{entry.badge}</span>}
                </button>
              ))}
            </div>
          ))
        ) : (
          <div className="empty-search" data-testid="empty-guide-search">
            <strong>Nothing found</strong>
            Try a position, a number, or a word like offside.
          </div>
        )}
      </div>
    </>
  );
}

function GuideArticle({
  activeId,
  backLabel,
  onBack,
  onTogglePart,
  openParts,
}: {
  activeId: string;
  backLabel: string;
  onBack: () => void;
  /** Sections and entries share one list of what is open; ids never collide. */
  onTogglePart: (partId: string, open: boolean) => void;
  openParts: string[];
}) {
  return (
    <div className="guide-article" data-testid="panel-guide">
      <button className="guide-back" data-testid="button-guide-back" onClick={onBack} type="button">
        <ChevronLeft size={14} />
        Back to {backLabel}
      </button>
      <div className="eyebrow">The guide</div>
      <h2 className="guide-heading">How football works</h2>
      <p className="guide-intro">
        Written for anyone still learning the vocabulary. Every position carries the number this
        board puts in its circle, so a 6 on the pitch and the six in a write-up are plainly the
        same thing.
      </p>
      {/* Sections and the entries inside them all start closed, so the guide
          opens as a contents page rather than a wall of text: seven headings,
          then a list of titles under whichever one is asked for. Following a
          link from a write-up opens both on the way past. */}
      {GUIDE_SECTIONS.map((section) => (
        <details
          className="guide-section"
          data-testid={`guide-section-${section.id}`}
          key={section.id}
          open={openParts.includes(section.id)}
          onToggle={(event) => onTogglePart(section.id, event.currentTarget.open)}
        >
          <summary>
            <span className="guide-section-title">{section.title}</span>
            <span className="guide-section-count">{section.entries.length}</span>
            <span className="summary-hint">tap to show</span>
            <span className="guide-section-blurb">{section.blurb}</span>
          </summary>
          {section.entries.map((entry) => (
            <details
              className={`guide-entry ${entry.id === activeId ? 'is-active' : ''}`}
              id={`guide-${entry.id}`}
              key={entry.id}
              open={openParts.includes(entry.id)}
              onToggle={(event) => onTogglePart(entry.id, event.currentTarget.open)}
            >
              <summary className="guide-entry-title">
                <span className="guide-entry-name">{entry.title}</span>
                <span className="guide-entry-meta">
                  {entry.badge && <span className="guide-entry-badge">{entry.badge}</span>}
                  <span className="summary-hint">tap to show</span>
                </span>
              </summary>
              {entry.aka && <p className="guide-entry-aka">Also called: {entry.aka}</p>}
              <p className="guide-entry-summary">{entry.summary}</p>
              <ul className="guide-entry-points">
                {entry.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              {entry.watch && (
                <p className="guide-entry-watch">
                  <strong>Watch for</strong> {entry.watch}
                </p>
              )}
            </details>
          ))}
        </details>
      ))}
    </div>
  );
}

function Home() {
  const [, navigate] = useLocation();
  const [panelTab, setPanelTab] = useState<'shapes' | 'managers' | 'guide'>('shapes');
  // The tab the Guide was opened from, so the back button returns there.
  const [guideReturn, setGuideReturn] = useState<'shapes' | 'managers'>('shapes');
  const [guideEntryId, setGuideEntryId] = useState(GUIDE_SECTIONS[0].entries[0].id);
  const [guideQuery, setGuideQuery] = useState('');
  // Which guide sections and entries are open. One list for both, since the
  // two sets of ids never collide.
  const [openGuideParts, setOpenGuideParts] = useState<string[]>([]);
  // Bumped on every jump so asking for the same entry twice scrolls again.
  const [guideNonce, setGuideNonce] = useState(0);
  const [managerTab, setManagerTab] = useState<'current' | 'retired'>('current');
  const [formation, setFormation] = useState<Formation>(FORMATIONS[1]);
  // Kept outside `formation` so an edited custom shape survives a trip through
  // the presets and the manager tab.
  const [customShape, setCustomShape] = useState<number[]>(DEFAULT_CUSTOM_SHAPE);
  const [activeEra, setActiveEra] = useState<Era | null>(null);
  const [players, setPlayers] = useState<Player[]>(() => formationPlayers(FORMATIONS[1]));
  const [selectedId, setSelectedId] = useState('p1');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('Ready for a shape change.');
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [arrowMode, setArrowMode] = useState(false);
  const [arrowStyle, setArrowStyle] = useState<ArrowStyle>('solid');
  const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState<number | null>(null);
  const [arrowDraft, setArrowDraft] = useState<Arrow | null>(null);
  const [ball, setBall] = useState<Position | null>(null);
  const [showNumbersNote, setShowNumbersNote] = useState(false);
  const [factIndex, setFactIndex] = useState(0);
  const [opponents, setOpponents] = useState<Position[]>([]);
  // Opponents placed by hand while building a clip. Kept apart from
  // `opponents`, which is playback-owned and gets cleared whenever a clip
  // stops — this set has to outlive that.
  const [clipOpponents, setClipOpponents] = useState<Position[]>([]);
  const [clipFrames, setClipFrames] = useState<ClipFrame[]>(() => loadStoredClip().frames);
  const [clipSpeed, setClipSpeed] = useState<number>(() => loadStoredClip().speed);
  const clipCounter = useRef(0);
  const [clipSaving, setClipSaving] = useState(false);
  const [animRunning, setAnimRunning] = useState(false);
  const [animCaption, setAnimCaption] = useState('');
  const [animLoading, setAnimLoading] = useState(false);
  const [animStepDuration, setAnimStepDuration] = useState(0);
  const animTimersRef = useRef<number[]>([]);
  // Cycles through an era's animation variants so repeat plays differ.
  const animVariantRef = useRef<Record<string, number>>({});
  const arrowCounter = useRef(0);
  const pitchRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string } | null>(null);
  // Sampled drag-path points (viewBox coords) for the arrow being drawn,
  // used to decide which way a curved arrow should bow.
  const draftSamplesRef = useRef<Position[]>([]);

  const matchesQuery = (name: string, subtitle: string) =>
    `${name} ${subtitle}`.toLowerCase().includes(query.toLowerCase().trim());

  const filteredFormations = useMemo(
    () =>
      FORMATIONS.filter((item) =>
        `${item.name} ${item.subtitle}`.toLowerCase().includes(query.toLowerCase().trim()),
      ),
    [query],
  );

  const customFormation: Formation = {
    name: CUSTOM_NAME,
    subtitle: CUSTOM_SUBTITLE,
    shape: customShape,
  };
  const isCustom = !activeEra && formation.name === CUSTOM_NAME;
  const customOutfield = customShape.reduce((total, count) => total + count, 0);
  const customIsFull = customOutfield >= MAX_OUTFIELD;
  const showCustomItem = matchesQuery(CUSTOM_NAME, CUSTOM_SUBTITLE);

  const selectedPlayer = players.find((player) => player.id === selectedId);
  const contentKey = activeEra ? activeEra.formation : formation.name;
  const content = FORMATION_CONTENT[contentKey];
  const eraContent = activeEra ? ERA_CONTENT[activeEra.id] : undefined;
  // Player facts are keyed by the era XI name; look it up via the player's
  // slot index so a coach renaming a circle doesn't break the lookup.
  const selectedXiName =
    activeEra && selectedPlayer ? activeEra.xi[Number(selectedPlayer.id.slice(1)) - 1] : undefined;
  const selectedPlayerFacts =
    eraContent && selectedXiName ? eraContent.playerFacts[selectedXiName] : undefined;
  // Portraits only exist for the historical XIs, so a plain formation (or a
  // player we have no free-licensed photo of) keeps the shield placeholder.
  const selectedPlayerPhoto = selectedXiName ? PLAYER_PHOTOS[selectedXiName] : undefined;
  // Portrait for any slot on the board, looked up by slot index like the
  // jersey number so renaming a circle cannot break it.
  const photoFor = (player: Player) => {
    if (!activeEra) return undefined;
    const xiName = activeEra.xi[Number(player.id.slice(1)) - 1];
    return xiName ? PLAYER_PHOTOS[xiName] : undefined;
  };
  // Every photo on show needs its credit, so collect the ones currently on the
  // pitch for the credits list under the board.
  const visiblePhotoCredits = activeEra
    ? players
        .map((player) => {
          const xiName = activeEra.xi[Number(player.id.slice(1)) - 1];
          const photo = xiName ? PLAYER_PHOTOS[xiName] : undefined;
          return photo ? { name: xiName, photo } : null;
        })
        .filter((entry): entry is { name: string; photo: PlayerPhoto } => entry !== null)
    : [];
  // Real jersey number for a slot in the active era, looked up by slot index
  // (like the XI name) so renaming a circle doesn't break it.
  const eraJersey = (player: Player) =>
    activeEra ? activeEra.numbers[Number(player.id.slice(1)) - 1] : undefined;
  const activeManager = activeEra
    ? MANAGERS.find((manager) => manager.eras.some((era) => era.id === activeEra.id))
    : undefined;

  const stopTactic = (restorePieces: boolean) => {
    animTimersRef.current.forEach((timer) => clearTimeout(timer));
    animTimersRef.current = [];
    setAnimRunning(false);
    setAnimCaption('');
    setOpponents([]);
    if (restorePieces && activeEra) {
      setPlayers(eraPlayers(activeEra));
      setBall(null);
    }
  };

  const playTactic = async (kind: 'attack' | 'defense') => {
    if (!activeEra) return;
    const era = activeEra;
    // The animation data is a large blob, so it is fetched on first play
    // rather than shipped in the initial bundle.
    setAnimLoading(true);
    let variants: TacticAnimation[] | undefined;
    try {
      const { ERA_ANIMATIONS } = await import('./era-animations');
      variants = ERA_ANIMATIONS[era.id]?.[kind];
    } catch {
      setAnimLoading(false);
      setMessage('Could not load that clip — check your connection and try again.');
      return;
    }
    setAnimLoading(false);
    if (!variants?.length) return;
    const variantKey = `${era.id}:${kind}`;
    const variantIndex = animVariantRef.current[variantKey] ?? 0;
    animVariantRef.current[variantKey] = variantIndex + 1;
    const animation = variants[variantIndex % variants.length];
    stopTactic(false);
    clearArrows();
    setPlayers(eraPlayers(activeEra));
    setBall(null);
    setAnimRunning(true);
    setOpponents(animation.opponents);
    setAnimCaption(animation.intro);
    pitchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    let elapsed = 900; // let the scroll settle and the intro read
    for (const step of animation.steps) {
      animTimersRef.current.push(
        window.setTimeout(() => {
          setAnimStepDuration(step.duration);
          setAnimCaption(step.note);
          if (step.players) {
            const moves = step.players;
            setPlayers((current) =>
              current.map((p) => (moves[p.id] ? { ...p, ...moves[p.id] } : p)),
            );
          }
          if (step.ball) setBall(step.ball);
          if (step.opponents) setOpponents(step.opponents);
        }, elapsed),
      );
      elapsed += step.duration * 1000 + 250;
    }
    animTimersRef.current.push(
      window.setTimeout(() => {
        setAnimRunning(false);
        setAnimCaption('');
        setOpponents([]);
        setPlayers(eraPlayers(activeEra));
        setBall(null);
        setMessage('That was the idea — now drag the pieces and make your own version.');
      }, elapsed + 800),
    );
  };

  useEffect(() => () => animTimersRef.current.forEach((timer) => clearTimeout(timer)), []);

  // Keep a recorded clip across reloads. Storage can be full or blocked
  // (private browsing), which must not take the board down with it.
  useEffect(() => {
    try {
      window.localStorage.setItem(
        CLIP_STORAGE_KEY,
        JSON.stringify({ frames: clipFrames, speed: clipSpeed }),
      );
    } catch {
      // Saving is a convenience; the clip still works for this session.
    }
  }, [clipFrames, clipSpeed]);

  // Shapes tab: glide the current formation into its attacking or defending
  // shape and hold it there, so the change is easy to read.
  const showShapePhase = (phase: 'attack' | 'defend') => {
    stopTactic(false);
    const base = activeEra ? eraPlayers(activeEra) : formationPlayers(formation);
    // Bring the board into view first, then start the slide once the scroll
    // has settled, so the movement is not missed on smaller screens.
    pitchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setAnimStepDuration(2.2);
    setAnimRunning(true);
    setAnimCaption(
      phase === 'attack'
        ? 'In possession — the shape stretches: full-backs up, wingers wide'
        : 'Out of possession — the shape shrinks: everyone drops and narrows',
    );
    animTimersRef.current.push(
      window.setTimeout(() => setPlayers(phasePlayers(base, phase)), 420),
    );
    animTimersRef.current.push(
      window.setTimeout(() => {
        setAnimRunning(false);
        setAnimCaption('');
        setMessage(
          phase === 'attack'
            ? 'Attacking shape. Reset shape puts them back.'
            : 'Defending shape. Reset shape puts them back.',
        );
      }, 3000),
    );
  };
  // The Did You Know box talks about the team when an era is active, and
  // about the formation itself only in the Shapes tab.
  const didYouKnowFacts = activeEra ? eraContent?.teamFacts ?? [] : content?.funFacts ?? [];
  // Jargon found in each panel's copy, defined in that panel's footer.
  const coreGlossTerms = content
    ? findGlossTerms([
        ...content.coreIdeas.inPossession,
        ...content.coreIdeas.outOfPossession,
        ...content.coreIdeas.principles,
        ...(activeEra?.points ?? []),
        ...content.coreIdeas.keyRoles.flatMap((keyRole) => [keyRole.role, keyRole.job]),
        content.coreIdeas.strength,
        content.coreIdeas.vulnerability,
      ])
    : [];
  const playstyleGlossTerms = activeManager
    ? findGlossTerms([MANAGER_PLAYSTYLES[activeManager.name] ?? ''])
    : [];
  const currentFact = didYouKnowFacts.length
    ? didYouKnowFacts[factIndex % didYouKnowFacts.length]
    : undefined;
  const factGlossTerms = currentFact ? findGlossTerms([currentFact]) : [];

  const clearArrows = () => {
    setArrows([]);
    setSelectedArrowId(null);
    setArrowDraft(null);
  };

  // Arrows and hand-placed opponents share a single selection, so the delete
  // control always has exactly one thing to act on.
  const selectArrow = (id: string) => {
    setSelectedArrowId(id);
    setSelectedOpponent(null);
  };

  const selectOpponent = (index: number) => {
    setSelectedOpponent(index);
    setSelectedArrowId(null);
  };

  const clearSelection = () => {
    setSelectedArrowId(null);
    setSelectedOpponent(null);
  };

  const deleteArrow = (id: string) => {
    setArrows((current) => current.filter((arrow) => arrow.id !== id));
    setSelectedArrowId((current) => (current === id ? null : current));
    setMessage('Arrow deleted.');
  };

  const deleteOpponent = (index: number) => {
    setClipOpponents((current) => current.filter((_, i) => i !== index));
    setSelectedOpponent(null);
    setMessage('Opponent removed.');
  };

  // Tap a thing, then delete it. The same gesture works with a mouse, with a
  // keyboard and with a thumb, which is the point of having it at all.
  const deleteSelection = () => {
    if (selectedArrowId) {
      deleteArrow(selectedArrowId);
    } else if (selectedOpponent !== null) {
      deleteOpponent(selectedOpponent);
    }
  };

  const deleteSelectionRef = useRef(deleteSelection);
  deleteSelectionRef.current = deleteSelection;

  // Returns the same array when nothing changes, so the <details> element
  // reporting a state React set does not loop.
  const setGuidePartOpen = (partId: string, open: boolean) => {
    setOpenGuideParts((current) => {
      const isOpen = current.includes(partId);
      if (isOpen === open) return current;
      return open ? [...current, partId] : current.filter((id) => id !== partId);
    });
  };

  // Opens the Guide at one entry, from the index or from a linked word. Both
  // the entry and the section holding it are opened, or there would be
  // nothing on screen to scroll to.
  const openGuide = (entryId: string) => {
    if (panelTab !== 'guide') setGuideReturn(panelTab);
    setPanelTab('guide');
    setGuideEntryId(entryId);
    setGuideNonce((current) => current + 1);
    const section = GUIDE_ENTRY_SECTION[entryId];
    setOpenGuideParts((current) => {
      const wanted = section ? [section, entryId] : [entryId];
      const missing = wanted.filter((id) => !current.includes(id));
      return missing.length ? [...current, ...missing] : current;
    });
  };
  guideJump.current = openGuide;

  const selectFormation = (nextFormation: Formation) => {
    stopTactic(false);
    setFormation(nextFormation);
    setActiveEra(null);
    setPlayers(formationPlayers(nextFormation));
    setSelectedId('p1');
    clearArrows();
    setFactIndex(0);
    setMessage(
      nextFormation.name === CUSTOM_NAME
        ? 'Your own shape. Set the lines below, then drag anyone.'
        : `${nextFormation.name} loaded. Drag to make it yours.`,
    );
  };

  // Puts an edited line-up straight on the pitch, so the shape being built is
  // always the shape on screen. Arrows are left alone — they follow their
  // player, so a line change carries them along rather than stranding them.
  const applyCustomShape = (nextShape: number[]) => {
    stopTactic(false);
    setCustomShape(nextShape);
    setFormation({ name: CUSTOM_NAME, subtitle: CUSTOM_SUBTITLE, shape: nextShape });
    setActiveEra(null);
    setPlayers(makePlayers(nextShape, false));
    setSelectedId('p1');
    setFactIndex(0);
    const placed = nextShape.reduce((total, count) => total + count, 0);
    setMessage(
      placed === MAX_OUTFIELD
        ? `Your ${nextShape.join('-')} is a full eleven.`
        : `${nextShape.join('-')} — ${MAX_OUTFIELD - placed} more outfield to place.`,
    );
  };

  const changeLine = (index: number, delta: number) => {
    const next = customShape.map((count, i) => (i === index ? count + delta : count));
    if (next[index] < 1 || next[index] > MAX_PER_LINE) return;
    if (next.reduce((total, count) => total + count, 0) > MAX_OUTFIELD) return;
    applyCustomShape(next);
  };

  // A new line is added at the front, which is how shapes are usually
  // extended: 4-4-2 becomes 4-4-2-1, not 1-4-4-2.
  const addLine = () => {
    if (customShape.length >= MAX_LINES || customOutfield >= MAX_OUTFIELD) return;
    applyCustomShape([...customShape, 1]);
  };

  const removeLine = () => {
    if (customShape.length <= 2) return;
    applyCustomShape(customShape.slice(0, -1));
  };

  // --- Recording a clip on the custom board -------------------------------
  // Playback reuses the same runner the manager clips use; the only new part
  // is capturing frames, which is just snapshotting wherever the pieces are.

  const captureFrame = () => {
    if (animRunning || clipFrames.length >= MAX_CLIP_FRAMES) return;
    clipCounter.current += 1;
    const frame: ClipFrame = {
      id: `f${clipCounter.current}-${Date.now()}`,
      note: '',
      players: Object.fromEntries(players.map((p) => [p.id, { x: p.x, y: p.y }])),
      ball: ball ? { ...ball } : null,
      opponents: clipOpponents.map((opponent) => ({ ...opponent })),
    };
    setClipFrames((current) => [...current, frame]);
    setMessage(
      clipFrames.length === 0
        ? 'Frame 1 captured. Move the pieces, then capture again.'
        : `Frame ${clipFrames.length + 1} captured.`,
    );
  };

  const setFrameNote = (id: string, note: string) => {
    setClipFrames((current) =>
      current.map((frame) => (frame.id === id ? { ...frame, note } : frame)),
    );
  };

  const deleteFrame = (id: string) => {
    setClipFrames((current) => current.filter((frame) => frame.id !== id));
  };

  const clearClip = () => {
    stopTactic(false);
    setClipFrames([]);
    setMessage('Clip cleared. Capture a frame to start a new one.');
  };

  // Puts the board back into a captured frame so it can be adjusted and
  // re-captured, rather than rebuilt from scratch.
  const jumpToFrame = (frame: ClipFrame) => {
    stopTactic(false);
    setPlayers((current) =>
      current.map((p) => (frame.players[p.id] ? { ...p, ...frame.players[p.id] } : p)),
    );
    setBall(frame.ball);
    setClipOpponents(frame.opponents.map((opponent) => ({ ...opponent })));
  };

  const addOpponent = () => {
    if (animRunning) return;
    setClipOpponents((current) => {
      // Fanned across the pitch so a second opponent never lands exactly on
      // the first, and walked along that fan until it clears every player and
      // every marker already down. A marker sitting underneath a player circle
      // cannot be tapped, so it could not be selected or deleted either.
      const taken: Position[] = [
        ...players.map((player) => ({ x: player.x, y: player.y })),
        ...current,
      ];
      const spotAt = (index: number) => ({
        x: 30 + ((index * 13) % 45),
        y: 34 + ((index * 7) % 22),
      });
      for (let step = 0; step < 24; step += 1) {
        const spot = spotAt(current.length + step);
        if (taken.every((other) => Math.hypot(other.x - spot.x, other.y - spot.y) > 7)) {
          return [...current, spot];
        }
      }
      return [...current, spotAt(current.length)];
    });
    setMessage('Opponent added. Drag it anywhere, or tap it and press delete.');
  };

  const playCustomClip = () => {
    if (clipFrames.length < 2 || animRunning) return;
    stopTactic(false);
    clearArrows();
    setAnimRunning(true);
    pitchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    let elapsed = 700; // let the scroll settle before the first move
    clipFrames.forEach((frame, index) => {
      animTimersRef.current.push(
        window.setTimeout(() => {
          setAnimStepDuration(clipSpeed);
          setAnimCaption(frame.note.trim() || `Frame ${index + 1}`);
          setPlayers((current) =>
            current.map((p) => (frame.players[p.id] ? { ...p, ...frame.players[p.id] } : p)),
          );
          setBall(frame.ball);
          setOpponents(frame.opponents);
        }, elapsed),
      );
      elapsed += clipSpeed * 1000 + 250;
    });
    animTimersRef.current.push(
      window.setTimeout(() => {
        // Left on the closing frame rather than reset, so the board is ready
        // to carry on from where the clip ended.
        setAnimRunning(false);
        setAnimCaption('');
        setOpponents([]);
        setMessage('That was your clip. Move the pieces and capture to add to it.');
      }, elapsed + 600),
    );
  };

  // Renders the clip to an animated GIF. The encoder is a sizeable chunk of
  // code that most visitors never need, so it is fetched on first use.
  const downloadClip = async () => {
    if (clipFrames.length < 2 || clipSaving) return;
    setClipSaving(true);
    setMessage('Building your GIF…');
    let url: string | undefined;
    try {
      const { renderClipGif } = await import('./clip-gif');
      // Read the live theme rather than hard-coding colours, so the export
      // matches whatever the board actually looks like.
      const styles = getComputedStyle(document.documentElement);
      const hsl = (token: string) =>
        `hsl(${styles.getPropertyValue(token).trim().replace(/\s+/g, ', ')})`;
      const blob = await renderClipGif({
        frames: clipFrames.map((frame) => ({
          players: frame.players,
          ball: frame.ball,
          opponents: frame.opponents,
          note: frame.note.trim(),
        })),
        roster: players.map((player) => ({
          id: player.id,
          number: shirtNumber(player),
          label: player.name ?? player.role,
        })),
        speed: clipSpeed,
        palette: {
          pitch: '#2f8f56',
          line: 'rgba(255, 248, 221, 0.92)',
          player: hsl('--primary'),
          playerText: hsl('--primary-foreground'),
          opponent: 'hsl(220, 12%, 26%)',
        },
      });
      url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tactics-clip-${customShape.join('-')}.gif`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMessage(`Saved a ${Math.round(blob.size / 1024)} KB GIF to your downloads.`);
    } catch {
      setMessage('Could not build the GIF. Try again, or shorten the clip.');
    } finally {
      if (url) URL.revokeObjectURL(url);
      setClipSaving(false);
    }
  };

  const selectEra = (era: Era, managerName: string) => {
    stopTactic(false);
    setActiveEra(era);
    setPlayers(eraPlayers(era));
    setSelectedId('p1');
    clearArrows();
    setFactIndex(0);
    setMessage(`${managerName}'s ${era.club} ${era.years} loaded in a ${era.formation}.`);
  };

  const resetFormation = () => {
    stopTactic(false);
    if (activeEra) {
      setPlayers(eraPlayers(activeEra));
      setMessage(`${activeEra.club} ${activeEra.years} restored to the starting shape.`);
    } else {
      setPlayers(formationPlayers(formation));
      setMessage(`${formation.name} restored to the starting shape.`);
    }
    setSelectedId('p1');
  };

  const clearBoard = () => {
    stopTactic(false);
    setPlayers([]);
    setSelectedId('');
    clearArrows();
    clearSelection();
    setClipOpponents([]);
    setBall(null);
    setMessage('Board cleared. Choose reset when you want the shape back.');
  };

  // The position initials are editable: a coach running a 4-4-2 with an
  // inverted winger can relabel RM as RW. The role also drives the number in
  // the circle and the phase-animation movement, so a known code retunes
  // both, while free text simply shows as typed.
  const setPlayerRole = (id: string, role: string) => {
    const cleaned = role.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    setPlayers((current) =>
      current.map((p) => (p.id === id ? { ...p, role: cleaned || p.role } : p)),
    );
  };

  const renamePlayer = (id: string, name: string) => {
    setPlayers((current) =>
      current.map((p) => (p.id === id ? { ...p, name: name.trim() ? name : undefined } : p)),
    );
  };

  const pitchPoint = (event: PointerEvent<HTMLDivElement>) => {
    const pitch = pitchRef.current;
    if (!pitch) return null;
    const bounds = pitch.getBoundingClientRect();
    return {
      // Clamped here as well as at the drop, so the pointer position can
      // reach the goal lines and touchlines rather than stopping short.
      x: Math.max(MIN_POS, Math.min(MAX_POS, ((event.clientX - bounds.left) / bounds.width) * 100)),
      y: Math.max(MIN_POS, Math.min(MAX_POS, ((event.clientY - bounds.top) / bounds.height) * 100)),
    };
  };

  const updatePosition = (event: PointerEvent<HTMLDivElement>) => {
    const point = pitchPoint(event);
    if (!point) return;
    if (arrowDraft) {
      let bend = arrowDraft.bend;
      const start = arrowStart(arrowDraft, players);
      if (start) {
        if (draftSamplesRef.current.length < 400) {
          draftSamplesRef.current.push({ x: point.x, y: point.y * PITCH_Y_SCALE });
        }
        const sx = start.x;
        const sy = start.y * PITCH_Y_SCALE;
        const dx = point.x - sx;
        const dy = point.y * PITCH_Y_SCALE - sy;
        const length = Math.hypot(dx, dy);
        if (length > 1) {
          // Signed distance of each sample from the start-end line; the
          // furthest one decides the curve's side and depth (live).
          let best = 0;
          for (const sample of draftSamplesRef.current) {
            const signed = (-dy * (sample.x - sx) + dx * (sample.y - sy)) / length;
            if (Math.abs(signed) > Math.abs(best)) best = signed;
          }
          // The quadratic's apex sits halfway to the control point, so double
          // the deviation to make the curve pass near the sampled path.
          bend = best * 2;
        }
      }
      setArrowDraft({ ...arrowDraft, endX: point.x, endY: point.y, bend });
      return;
    }
    const drag = dragRef.current;
    if (!drag) return;
    // The full pitch is reachable: a piece can sit right on a touchline or
    // goal line rather than stopping short of it.
    const x = Math.max(MIN_POS, Math.min(MAX_POS, point.x));
    const y = Math.max(MIN_POS, Math.min(MAX_POS, point.y));
    if (drag.id === 'ball') {
      setBall({ x, y });
      return;
    }
    if (drag.id.startsWith('opp-')) {
      const index = Number(drag.id.slice(4));
      setClipOpponents((current) =>
        current.map((opponent, i) => (i === index ? { x, y } : opponent)),
      );
      return;
    }
    setPlayers((current) =>
      current.map((player) => (player.id === drag.id ? { ...player, x, y } : player)),
    );
  };

  const commitArrowDraft = () => {
    if (!arrowDraft) return;
    const start = arrowStart(arrowDraft, players);
    if (start) {
      const length = Math.hypot(arrowDraft.endX - start.x, arrowDraft.endY - start.y);
      if (length > 4) {
        // A real pointerup fires both the pitch handler and the window one,
        // and both land in the same React batch reading the same draft, so
        // appending blindly filed every arrow twice.
        setArrows((current) =>
          current.some((arrow) => arrow.id === arrowDraft.id) ? current : [...current, arrowDraft],
        );
        setSelectedArrowId(arrowDraft.id);
        setMessage('Arrow added. Click an arrow and press Delete to remove it.');
      }
    }
    setArrowDraft(null);
    draftSamplesRef.current = [];
  };

  // Any pointer release — even outside the pitch — must end the drag and
  // settle the arrow draft, otherwise a stale draft keeps following the cursor.
  const commitArrowDraftRef = useRef(commitArrowDraft);
  commitArrowDraftRef.current = commitArrowDraft;

  useEffect(() => {
    const finishDrag = () => {
      dragRef.current = null;
      commitArrowDraftRef.current();
    };
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);
    return () => {
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('pointercancel', finishDrag);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (!selectedArrowId && selectedOpponent === null) return;
      event.preventDefault();
      deleteSelectionRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedArrowId, selectedOpponent]);

  // The article has to be on the page before it can be scrolled, which is why
  // the jump lives in an effect rather than inside openGuide.
  useEffect(() => {
    if (panelTab !== 'guide') return;
    const node = document.getElementById(`guide-${guideEntryId}`);
    // A closed panel keeps its contents in the DOM and, under the browser's
    // own details styling, they even keep their measurements. Asking the
    // entry and its section is the only reliable way to know it is on screen.
    if (!node || !(node as HTMLDetailsElement).open) return;
    if (!node.parentElement?.closest('details')?.open) return;

    // Jumped to instantly, and then again once the layout has settled. A
    // smooth scroll aims at an offset measured before the portraits above it
    // have loaded, so it lands a few hundred pixels short of the entry.
    const align = () => node.scrollIntoView({ block: 'start' });
    align();
    const frame = requestAnimationFrame(align);
    const settle = window.setTimeout(align, 280);
    node.classList.add('is-flashing');
    const flash = window.setTimeout(() => node.classList.remove('is-flashing'), 1800);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.clearTimeout(flash);
    };
  }, [panelTab, guideEntryId, guideNonce]);

  const boardLabel = activeEra
    ? `${activeEra.club} ${activeEra.years} / ${activeEra.formation}`
    : isCustom
      ? `${CUSTOM_NAME} ${customShape.join('-')}`
      : formation.name;

  // A custom shape has no write-up, but the in/out-of-possession slide is
  // driven purely by each player's role, so it works on any eleven.
  const showShapePhases = !activeEra && (Boolean(content) || (isCustom && customIsFull));

  // While a clip plays, the markers come from the frame being shown; the rest
  // of the time they are the ones placed by hand. Hand-placed markers can be
  // dragged and deleted on any shape or era, not only in the clip builder.
  const visibleOpponents = animRunning ? opponents : clipOpponents;
  const opponentsDraggable = !animRunning;
  // Guarded against a stale index: deleting an opponent shifts the ones after
  // it, and playback swaps the whole list out from underneath.
  const selectedOpponentSpot =
    opponentsDraggable && selectedOpponent !== null ? visibleOpponents[selectedOpponent] : undefined;

  // Where the selected arrow's delete badge goes: halfway along its own line.
  const selectedArrow = arrows.find((arrow) => arrow.id === selectedArrowId);
  const selectedArrowGeometry =
    selectedArrow && !animRunning ? arrowGeometry(selectedArrow, players) : null;

  return (
    <main className="board-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <Goal size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div className="brand-name">Shape / Play</div>
            <div className="brand-subtitle">Football tactics board</div>
          </div>
        </div>
        <div className="topbar-note">
          <Sparkles size={15} />
          Experiment first. Explain later.
        </div>
      </header>

      {showNumbersNote && (
        <div className="numbers-note" role="dialog" aria-label="About the numbers on the pitch">
          <button
            className="numbers-note-close"
            data-testid="button-close-numbers-note"
            type="button"
            aria-label="Close"
            onClick={() => setShowNumbersNote(false)}
          >
            <X size={15} />
          </button>
          <strong>About the numbers</strong>
          <p>
            The numbers inside the circles on the pitch represent each player’s role — 1 for the
            goalkeeper, 9 for the striker, and so on — not their real jersey numbers. Each player’s
            actual jersey number is shown in brackets after their name.
          </p>
        </div>
      )}

      <div className="workspace">
        <aside className="panel library-panel" aria-label="Formation library">
          <div className="panel-tabs" role="tablist" aria-label="Library sections">
            <button
              className={`panel-tab ${panelTab === 'shapes' ? 'is-active' : ''}`}
              data-testid="tab-shapes"
              type="button"
              role="tab"
              aria-selected={panelTab === 'shapes'}
              onClick={() => setPanelTab('shapes')}
            >
              <LayoutGrid size={14} />
              Shapes
            </button>
            <button
              className={`panel-tab ${panelTab === 'managers' ? 'is-active' : ''}`}
              data-testid="tab-managers"
              type="button"
              role="tab"
              aria-selected={panelTab === 'managers'}
              onClick={() => {
                setPanelTab('managers');
                setShowNumbersNote(true);
              }}
            >
              <BookOpen size={14} />
              Managers
            </button>
            <button
              className={`panel-tab ${panelTab === 'guide' ? 'is-active' : ''}`}
              data-testid="tab-guide"
              type="button"
              role="tab"
              aria-selected={panelTab === 'guide'}
              onClick={() => {
                // Opening the tab by hand lands on the contents, with every
                // section still closed; only a link jumps to an entry.
                if (panelTab !== 'guide') setGuideReturn(panelTab);
                setPanelTab('guide');
              }}
            >
              <GraduationCap size={14} />
              Guide
            </button>
          </div>

          {panelTab === 'guide' ? (
            <GuideIndex
              activeId={guideEntryId}
              onQuery={setGuideQuery}
              onSelect={openGuide}
              query={guideQuery}
            />
          ) : panelTab === 'shapes' ? (
            <>
              <div className="panel-heading">
                <div className="eyebrow">The library</div>
                <h2 className="panel-title">Find a shape</h2>
                <p className="panel-copy">Start with a structure, then move the pieces until the idea clicks.</p>
                <label className="search-wrap">
                  <Search size={16} aria-hidden="true" />
                  <input
                    className="search-input"
                    data-testid="input-formation-search"
                    type="search"
                    placeholder="Search formations"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    aria-label="Search formations"
                  />
                </label>
              </div>
              <div className="formation-list">
                {showCustomItem && (
                  <>
                    <button
                      className={`formation-item ${isCustom ? 'is-active' : ''}`}
                      data-testid="button-formation-custom"
                      type="button"
                      onClick={() => selectFormation(customFormation)}
                    >
                      <FormationThumb shape={customShape} />
                      <span>
                        <span className="formation-item-name">{CUSTOM_NAME}</span>
                        <span className="formation-item-meta">{CUSTOM_SUBTITLE}</span>
                      </span>
                      {isCustom ? <Crosshair size={15} /> : <Pencil size={14} />}
                    </button>
                    {isCustom && (
                      <div className="custom-builder" data-testid="panel-custom-builder">
                        <p className="custom-builder-intro">
                          Choose how many players stand in each line. The board updates as you go,
                          and you can still drag anyone afterwards.
                        </p>
                        <ul className="custom-lines">
                          {customShape.map((count, index) => (
                            <li className="custom-line" key={index}>
                              <span className="custom-line-label">
                                {lineLabel(index, customShape.length)}
                              </span>
                              <span className="custom-stepper">
                                <button
                                  aria-label={`One fewer in ${lineLabel(index, customShape.length)}`}
                                  data-testid={`button-line-down-${index}`}
                                  disabled={count <= 1}
                                  onClick={() => changeLine(index, -1)}
                                  type="button"
                                >
                                  <Minus size={13} />
                                </button>
                                <span className="custom-line-count">{count}</span>
                                <button
                                  aria-label={`One more in ${lineLabel(index, customShape.length)}`}
                                  data-testid={`button-line-up-${index}`}
                                  disabled={count >= MAX_PER_LINE || customIsFull}
                                  onClick={() => changeLine(index, 1)}
                                  type="button"
                                >
                                  <Plus size={13} />
                                </button>
                              </span>
                            </li>
                          ))}
                        </ul>
                        <div className="custom-builder-actions">
                          <button
                            data-testid="button-add-line"
                            disabled={customShape.length >= MAX_LINES || customIsFull}
                            onClick={addLine}
                            type="button"
                          >
                            Add a line
                          </button>
                          <button
                            data-testid="button-remove-line"
                            disabled={customShape.length <= 2}
                            onClick={removeLine}
                            type="button"
                          >
                            Remove last
                          </button>
                        </div>
                        <p
                          className={`custom-builder-total ${customIsFull ? 'is-complete' : ''}`}
                          data-testid="text-custom-total"
                        >
                          {customIsFull
                            ? `${customShape.join('-')} — a full eleven`
                            : `${customOutfield} of ${MAX_OUTFIELD} outfield placed`}
                        </p>
                      </div>
                    )}
                  </>
                )}
                {filteredFormations.length ? (
                  filteredFormations.map((item) => (
                    <button
                      className={`formation-item ${!activeEra && formation.name === item.name ? 'is-active' : ''}`}
                      data-testid={`button-formation-${item.name.replaceAll(' ', '-').toLowerCase()}`}
                      key={item.name}
                      type="button"
                      onClick={() => selectFormation(item)}
                    >
                      <FormationThumb
                        shape={item.shape}
                        isDiamond={item.name.toLowerCase().includes('diamond')}
                      />
                      <span>
                        <span className="formation-item-name">{item.name}</span>
                        <span className="formation-item-meta">{item.subtitle}</span>
                      </span>
                      {!activeEra && formation.name === item.name ? (
                        <Crosshair size={15} />
                      ) : (
                        <ListFilter size={14} />
                      )}
                    </button>
                  ))
                ) : (
                  // Suppressed when the search matched Custom, since the list
                  // is not actually empty in that case.
                  !showCustomItem && (
                    <div className="empty-search" data-testid="empty-formation-search">
                      <strong>No shape found</strong>
                      Try a number like 3-5-2 or clear the search.
                    </div>
                  )
                )}
              </div>
            </>
          ) : (
            <>
              <div className="panel-heading">
                <div className="eyebrow">The dugout</div>
                <h2 className="panel-title">Steal a blueprint</h2>
                <p className="panel-copy">
                  Seventeen serial winners, each frozen at a defining moment of their career.
                </p>
              </div>
              <div className="panel-tabs manager-tabs" role="tablist" aria-label="Dugout sections">
                {MANAGER_SECTIONS.map((section) => (
                  <button
                    aria-selected={managerTab === section.status}
                    className={`panel-tab ${managerTab === section.status ? 'is-active' : ''}`}
                    data-testid={`tab-managers-${section.status}`}
                    key={section.status}
                    onClick={() => setManagerTab(section.status)}
                    role="tab"
                    type="button"
                  >
                    {section.title}
                    <span className="tab-count">{section.managers.length}</span>
                  </button>
                ))}
              </div>
              <div className="formation-list manager-list">
                {MANAGER_SECTIONS.filter((section) => section.status === managerTab).map((section) => (
                  <div className="manager-section" key={section.status}>
                    {section.managers.map((manager) => (
                      <div className="manager-group" key={manager.name}>
                        <div className="manager-name">
                          <ManagerPhoto manager={manager.name} size="small" />
                          <Trophy size={13} aria-hidden="true" />
                          {manager.name}
                        </div>
                        {manager.eras.map((era) => (
                          <button
                            className={`formation-item era-item ${activeEra?.id === era.id ? 'is-active' : ''}`}
                            data-testid={`button-era-${era.id}`}
                            key={era.id}
                            type="button"
                            onClick={() => selectEra(era, manager.name)}
                          >
                            <ClubSwatch club={era.club} />
                            <span>
                              <span className="formation-item-name">
                                {era.club} <span className="era-years">{era.years}</span>
                              </span>
                              <span className="formation-item-meta">{era.formation}</span>
                            </span>
                            {activeEra?.id === era.id ? (
                              <Crosshair size={15} />
                            ) : (
                              <ListFilter size={14} />
                            )}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>

        <section className="pitch-column" aria-label="Interactive tactics pitch">
          <div className="pitch-header">
            <div>
              <div className="eyebrow">Live board / {boardLabel}</div>
              <div className="pitch-title-row">
                <h1 className="pitch-title">{activeEra ? 'Study the idea.' : 'Move the idea.'}</h1>
                {/* The way into match mode, deliberately next to the headline
                    rather than buried in the toolbar. */}
                <button
                  className="match-cta"
                  data-testid="button-play-match"
                  onClick={() => navigate('/match')}
                  type="button"
                >
                  <Gamepad2 size={15} />
                  Play a match
                </button>
                {/* Every control on one page. The tutorial has its own door
                    there, and starts itself for anyone arriving anyway. */}
                <button
                  className="match-cta is-quiet"
                  data-testid="button-how-to-play"
                  onClick={() => navigate('/how-to-play')}
                  type="button"
                >
                  <BookOpen size={15} />
                  How to play
                </button>
              </div>
              <p className="pitch-caption">
                {activeEra
                  ? `${activeEra.summary}`
                  : 'A clean starting point for messy thinking. Pull any player into space and see the shape change.'}
              </p>
            </div>
          </div>

          <div className="pitch-toolbar" role="toolbar" aria-label="Arrow tools">
            <button
              className={`tool-button arrow-toggle ${arrowMode ? 'is-active' : ''}`}
              data-testid="button-arrow-mode"
              type="button"
              aria-pressed={arrowMode}
              onClick={() => {
                setArrowMode((current) => !current);
                setArrowDraft(null);
                setMessage(
                  arrowMode
                    ? 'Arrow mode off. Drag circles to move players.'
                    : 'Arrow mode on. Drag from a player, or from anywhere on the grass.',
                );
              }}
            >
              <MoveUpRight size={14} />
              {arrowMode ? 'Drawing arrows' : 'Draw arrows'}
            </button>
            {arrowMode && (
            <div className="tool-group is-revealed" role="group" aria-label="Arrow style">
              <button
                className={`tool-button ${arrowStyle === 'solid' ? 'is-active' : ''}`}
                data-testid="button-arrow-solid"
                type="button"
                aria-pressed={arrowStyle === 'solid'}
                title="Run with the ball"
                onClick={() => setArrowStyle('solid')}
              >
                <Minus size={14} />
                Run
              </button>
              <button
                className={`tool-button ${arrowStyle === 'dashed' ? 'is-active' : ''}`}
                data-testid="button-arrow-dashed"
                type="button"
                aria-pressed={arrowStyle === 'dashed'}
                title="Pass"
                onClick={() => setArrowStyle('dashed')}
              >
                <Grip size={14} />
                Pass
              </button>
              <button
                className={`tool-button ${arrowStyle === 'curved' ? 'is-active' : ''}`}
                data-testid="button-arrow-curved"
                type="button"
                aria-pressed={arrowStyle === 'curved'}
                title="Off-ball movement"
                onClick={() => setArrowStyle('curved')}
              >
                <Spline size={14} />
                Move
              </button>
            </div>
            )}
            <button
              className={`tool-button ${ball ? 'is-active' : ''}`}
              data-testid="button-toggle-ball"
              type="button"
              aria-pressed={ball !== null}
              title={ball ? 'Remove the ball from the pitch' : 'Place a ball on the centre spot'}
              onClick={() => {
                if (ball) {
                  setBall(null);
                  setMessage('Ball removed.');
                } else {
                  setBall({ x: 50, y: 50 });
                  setMessage('Ball on the centre spot. Drag it anywhere.');
                }
              }}
            >
              <CircleDot size={14} />
              {ball ? 'Remove ball' : 'Add ball'}
            </button>
            <button
              className="tool-button"
              data-testid="button-add-opponent-pitch"
              type="button"
              disabled={animRunning}
              title="Drop an opposition marker on the pitch"
              onClick={addOpponent}
            >
              <Shield size={14} />
              Add opponent
            </button>
            {(selectedArrowGeometry || selectedOpponentSpot) && (
              <button
                className="tool-button danger-tool"
                data-testid="button-delete-selected"
                type="button"
                onClick={deleteSelection}
              >
                <Trash2 size={14} />
                Delete {selectedArrowId ? 'arrow' : 'opponent'}
              </button>
            )}
            {arrows.length > 0 && (
              <button
                className="tool-button"
                data-testid="button-clear-arrows"
                type="button"
                onClick={() => {
                  clearArrows();
                  setMessage('All arrows cleared.');
                }}
              >
                <Eraser size={14} />
                Clear all arrows
              </button>
            )}
          </div>

          <div className="pitch-frame">
            <div
              ref={pitchRef}
              className={`pitch ${animRunning ? 'is-animating' : ''}`}
              style={{ '--anim-dur': `${animStepDuration}s` } as CSSProperties}
              data-testid="pitch-board"
              onPointerDown={(event) => {
                // A press on bare grass drops the current selection, so the
                // delete control never acts on something the user has already
                // moved on from.
                if (!animRunning) clearSelection();
                // Arrow mode: pressing open grass starts an arrow from that
                // spot, so runs and passes can be drawn anywhere, not just
                // from a player circle.
                if (!arrowMode || animRunning) return;
                const point = pitchPoint(event);
                if (!point) return;
                event.preventDefault();
                setSelectedArrowId(null);
                arrowCounter.current += 1;
                draftSamplesRef.current = [];
                setArrowDraft({
                  id: `a${arrowCounter.current}`,
                  startX: point.x,
                  startY: point.y,
                  endX: point.x,
                  endY: point.y,
                  style: arrowStyle,
                });
              }}
              onPointerMove={updatePosition}
              onPointerUp={() => {
                dragRef.current = null;
                commitArrowDraft();
              }}
            >
              <PitchLines />
              <ArrowLayer
                arrows={arrowDraft ? [...arrows, arrowDraft] : arrows}
                players={players}
                selectedArrowId={selectedArrowId}
                onSelect={selectArrow}
                onDelete={deleteArrow}
              />
              {players.map((player) => (
                <button
                  className={`player-marker ${selectedId === player.id ? 'is-selected' : ''}`}
                  data-testid={`button-player-${player.id}`}
                  key={player.id}
                  type="button"
                  style={{ left: `${player.x}%`, top: `${player.y}%` }}
                  title={roleName(player.role)}
                  onPointerDown={(event) => {
                    if (animRunning) return;
                    event.preventDefault();
                    event.stopPropagation();
                    // Picking up a player is a different intent, so it drops
                    // any arrow or opponent that was picked out before.
                    clearSelection();
                    setSelectedId(player.id);
                    if (arrowMode) {
                      arrowCounter.current += 1;
                      draftSamplesRef.current = [];
                      setArrowDraft({
                        id: `a${arrowCounter.current}`,
                        playerId: player.id,
                        endX: player.x,
                        endY: player.y,
                        style: arrowStyle,
                      });
                    } else {
                      dragRef.current = { id: player.id };
                    }
                  }}
                  onClick={() => setSelectedId(player.id)}
                  aria-label={`${shirtNumber(player)} ${player.name ?? roleName(player.role)}, ${roleName(player.role)}`}
                >
                  {photoFor(player) && (
                    // Visible immediately on the pitch, so lazy loading would
                    // only delay them; async decoding keeps eleven at once off
                    // the main thread on mobile.
                    <img
                      className="player-photo"
                      src={playerPhotoUrl(photoFor(player)!.file)}
                      alt=""
                      loading="eager"
                      decoding="async"
                      width={26}
                      height={26}
                      draggable={false}
                    />
                  )}
                  <span className="player-number">{shirtNumber(player)}</span>
                  {/* Shapes mode labels each circle with its position initials
                      (GK, LCB, CM…), because the number on the circle is a role
                      number that several players can share. A name the user has
                      typed wins, being more specific than the default. */}
                  {(player.name || !activeEra) && (
                    <span className="player-label">
                      {player.name ?? player.role}
                      {player.name && eraJersey(player) !== undefined
                        ? ` (${eraJersey(player)})`
                        : ''}
                    </span>
                  )}
                </button>
              ))}
              {ball && (
                <div
                  className="ball-marker"
                  data-testid="ball-marker"
                  style={{ left: `${ball.x}%`, top: `${ball.y}%` }}
                  role="img"
                  aria-label="Ball"
                  onPointerDown={(event) => {
                    if (animRunning) return;
                    event.preventDefault();
                    event.stopPropagation();
                    clearSelection();
                    dragRef.current = { id: 'ball' };
                  }}

                />
              )}
              {visibleOpponents.map((opponent, index) => (
                <div
                  key={`opp-${index}`}
                  className={`opponent-marker ${opponentsDraggable ? 'is-draggable' : ''} ${
                    opponentsDraggable && selectedOpponent === index ? 'is-selected' : ''
                  }`}
                  data-testid={`opponent-marker-${index}`}
                  style={{ left: `${opponent.x}%`, top: `${opponent.y}%` }}
                  {...(opponentsDraggable
                    ? {
                        role: 'button' as const,
                        tabIndex: 0,
                        'aria-label': `Opponent ${index + 1}${
                          selectedOpponent === index ? ', selected' : ''
                        }. Press Delete to remove.`,
                        onFocus: () => selectOpponent(index),
                        onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
                          event.preventDefault();
                          event.stopPropagation();
                          selectOpponent(index);
                          dragRef.current = { id: `opp-${index}` };
                        },
                      }
                    : { 'aria-hidden': true as const })}
                />
              ))}
              {/* A delete badge on whatever is selected. The toolbar button and
                  the Delete key do the same job; this one is here because on a
                  phone the thing you just tapped is where your thumb already
                  is. */}
              {selectedOpponentSpot && (
                <button
                  aria-label="Delete this opponent"
                  className="pitch-delete is-offset"
                  data-testid="button-delete-opponent-badge"
                  onClick={() => deleteOpponent(selectedOpponent!)}
                  onPointerDown={(event) => event.stopPropagation()}
                  style={{ left: `${selectedOpponentSpot.x}%`, top: `${selectedOpponentSpot.y}%` }}
                  type="button"
                >
                  <X size={12} />
                </button>
              )}
              {selectedArrowGeometry && (
                <button
                  aria-label="Delete this arrow"
                  className="pitch-delete"
                  data-testid="button-delete-arrow-badge"
                  onClick={() => deleteArrow(selectedArrowId!)}
                  onPointerDown={(event) => event.stopPropagation()}
                  style={{
                    left: `${selectedArrowGeometry.midX}%`,
                    top: `${selectedArrowGeometry.midY / PITCH_Y_SCALE}%`,
                  }}
                  type="button"
                >
                  <X size={12} />
                </button>
              )}
              {animCaption && (
                <div
                  className={`anim-caption ${ball && ball.y < 26 ? 'is-dodged' : ''}`}
                  data-testid="text-anim-caption"
                  aria-live="polite"
                >
                  {animCaption}
                </div>
              )}
            </div>
          </div>

          <div className="pitch-footer">
            <div className="drag-note" data-testid="text-drag-guidance">
              <Grip size={17} />
              Drag circles directly on the pitch. Touch works too.
            </div>
            <div className="actions">
              <button className="action-button" data-testid="button-clear-board" type="button" onClick={clearBoard}>
                <Eraser size={15} />
                Clear board
              </button>
              <button className="action-button primary-action" data-testid="button-reset-formation" type="button" onClick={resetFormation}>
                <RotateCcw size={15} />
                Reset shape
              </button>
            </div>
          </div>
          {visiblePhotoCredits.length > 0 && (
            <details className="pitch-credits" data-testid="details-photo-credits">
              <summary>Photo credits ({visiblePhotoCredits.length})</summary>
              <ul>
                {visiblePhotoCredits.map(({ name, photo }) => (
                  <li key={name}>
                    {name} —{' '}
                    <a href={photo.source} target="_blank" rel="noreferrer noopener">
                      Wikimedia Commons
                    </a>
                    , {photo.author},{' '}
                    <a href={photo.licenceUrl} target="_blank" rel="noreferrer noopener">
                      {photo.licence}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <div className="reset-message" data-testid="status-board-message" aria-live="polite">
            {message}
          </div>
        </section>

        {panelTab === 'guide' ? (
          <aside className="panel guide-panel" aria-label="The guide">
            <GuideArticle
              activeId={guideEntryId}
              backLabel={guideReturn === 'managers' ? 'the dugout' : 'the shapes'}
              onBack={() => setPanelTab(guideReturn)}
              onTogglePart={setGuidePartOpen}
              openParts={openGuideParts}
            />
          </aside>
        ) : (
        <aside className="panel inspector" aria-label="Selected player details">
          {selectedPlayerPhoto ? (
            <img
              className="inspector-portrait"
              data-testid="img-player-portrait"
              src={playerPhotoUrl(selectedPlayerPhoto.file)}
              alt={selectedXiName ?? 'Selected player'}
              decoding="async"
              width={64}
              height={64}
            />
          ) : (
            <div className="inspector-swatch" aria-hidden="true">
              {selectedPlayer ? <Shield size={23} /> : <Users size={23} />}
            </div>
          )}
          <div>
            <div className="eyebrow">Selected piece</div>
            <div className="inspector-name-field">
              <Pencil size={13} className="inspector-name-icon" aria-hidden="true" />
              <input
                className="inspector-name-input"
                data-testid="input-player-name"
                type="text"
                placeholder="Add a name..."
                maxLength={30}
                value={selectedPlayer?.name ?? ''}
                disabled={!selectedPlayer}
                onChange={(e) => selectedPlayer && renamePlayer(selectedPlayer.id, e.target.value)}
                aria-label="Player name"
              />
            </div>
            <div className="inspector-role">
              {selectedPlayer ? (
                <>
                  <input
                    aria-label="Position initials"
                    className="inspector-role-input"
                    data-testid="input-player-role"
                    maxLength={4}
                    onChange={(e) => setPlayerRole(selectedPlayer.id, e.target.value)}
                    type="text"
                    value={selectedPlayer.role}
                  />
                  <span className="inspector-role-name">{roleName(selectedPlayer.role)}</span>
                </>
              ) : (
                'Board is empty'
              )}
            </div>
            {selectedPlayerPhoto && (
              <p className="photo-credit">
                Photo:{' '}
                <a href={selectedPlayerPhoto.source} target="_blank" rel="noreferrer noopener">
                  Wikimedia Commons
                </a>{' '}
                — {selectedPlayerPhoto.author},{' '}
                <a href={selectedPlayerPhoto.licenceUrl} target="_blank" rel="noreferrer noopener">
                  {selectedPlayerPhoto.licence}
                </a>
              </p>
            )}
          </div>
          <div>
            <div className="inspector-stat">
              <span>Shirt number</span>
              <strong>{selectedPlayer ? `#${shirtNumber(selectedPlayer)}` : '—'}</strong>
            </div>
            <div className="inspector-stat">
              <span>Horizontal</span>
              <strong>{selectedPlayer ? `${Math.round(selectedPlayer.x)}%` : '—'}</strong>
            </div>
            <div className="inspector-stat">
              <span>Vertical</span>
              <strong>{selectedPlayer ? `${Math.round(selectedPlayer.y)}%` : '—'}</strong>
            </div>
          </div>
          <div className="inspector-rule" />
          {activeEra && (
            <div className="tip-box" data-testid="panel-player-facts">
              <strong>The player in that shirt</strong>
              {selectedPlayerFacts && selectedXiName ? (
                <>
                  <div className="core-row">
                    <span className="core-label">
                      {selectedXiName}
                      {selectedPlayer ? ` · ${roleName(selectedPlayer.role)}` : ''}
                    </span>
                  </div>
                  <ul className="tactics-list" data-testid="list-player-facts">
                    {selectedPlayerFacts.map((fact) => (
                      <li key={fact}>{fact}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="fact-text" data-testid="text-player-facts-empty">
                  Click a circle on the pitch to read about the player who wore that shirt.
                </p>
              )}
            </div>
          )}
          {content && (
            // Core Ideas starts closed so the pitch and the write-up lead;
            // keyed so switching formation or era re-collapses it.
            <details
              className="tip-box collapsible-box"
              data-testid="panel-core-ideas"
              key={activeEra ? activeEra.id : formation.name}
            >
              <summary>
                Core Ideas
                <span className="summary-hint">tap to show</span>
              </summary>
              <div className="core-row">
                <span className="core-label">In possession</span>
                <ul className="tactics-list">
                  {content.coreIdeas.inPossession.map((line) => (
                    <li key={line}>{glossify(line)}</li>
                  ))}
                </ul>
              </div>
              <div className="core-row">
                <span className="core-label">Out of possession</span>
                <ul className="tactics-list">
                  {content.coreIdeas.outOfPossession.map((line) => (
                    <li key={line}>{glossify(line)}</li>
                  ))}
                </ul>
              </div>
              <div className="core-row">
                <span className="core-label">Key principles</span>
                <ul className="tactics-list">
                  {content.coreIdeas.principles.map((principle) => (
                    <li key={principle}>{glossify(principle)}</li>
                  ))}
                </ul>
              </div>
              {activeEra && (
                <div className="core-row" data-testid="core-row-era-twist">
                  <span className="core-label">How {activeEra.club} played it</span>
                  <ul className="tactics-list">
                    {activeEra.points.map((point) => (
                      <li key={point}>{glossify(point)}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="core-row">
                <span className="core-label">The two roles that matter</span>
                <ul className="tactics-list">
                  {content.coreIdeas.keyRoles.map((keyRole) => (
                    <li key={keyRole.role}>
                      <em>{glossify(keyRole.role)}:</em> {glossify(keyRole.job)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="core-row">
                <span className="core-label">Main strength</span>
                <ul className="tactics-list">
                  <li>{glossify(content.coreIdeas.strength)}</li>
                </ul>
              </div>
              <div className="core-row">
                <span className="core-label">Main vulnerability</span>
                <ul className="tactics-list">
                  <li>{glossify(content.coreIdeas.vulnerability)}</li>
                </ul>
              </div>
              <GlossFooter terms={coreGlossTerms} />
            </details>
          )}
          {showShapePhases && (
            <div className="tip-box" data-testid="panel-shape-phases">
              <strong>See the shape move</strong>
              <p className="fact-text">
                Watch the same eleven players slide between the shape they take when they have the
                ball and the one they take when they do not.
              </p>
              <div className="tactic-buttons">
                <button
                  className="action-button primary-action"
                  data-testid="button-shape-attack"
                  type="button"
                  onClick={() => showShapePhase('attack')}
                >
                  <Play size={14} />
                  In possession
                </button>
                <button
                  className="action-button"
                  data-testid="button-shape-defend"
                  type="button"
                  onClick={() => showShapePhase('defend')}
                >
                  <Play size={14} />
                  Out of possession
                </button>
              </div>
              <p className="anim-disclaimer">
                A simplified textbook shape — real teams shift by opponent, scoreline and moment.
              </p>
            </div>
          )}
          {isCustom && (
            <div className="tip-box" data-testid="panel-clip-recorder">
              <strong>Make your own clip</strong>
              <p className="fact-text">
                Move the players and the ball where you want them, then capture a frame. Do that a
                few times and press play — the board slides between your frames in order.
              </p>
              <div className="clip-controls">
                <button
                  className="action-button primary-action"
                  data-testid="button-capture-frame"
                  disabled={animRunning || clipFrames.length >= MAX_CLIP_FRAMES}
                  onClick={captureFrame}
                  type="button"
                >
                  <CircleDot size={14} />
                  Capture frame
                </button>
                <button
                  className="action-button"
                  data-testid="button-play-clip"
                  disabled={clipFrames.length < 2 || animRunning}
                  onClick={playCustomClip}
                  type="button"
                >
                  <Play size={14} />
                  Play
                </button>
                <button
                  className="action-button"
                  data-testid="button-download-clip"
                  disabled={clipFrames.length < 2 || animRunning || clipSaving}
                  onClick={downloadClip}
                  type="button"
                >
                  <Download size={14} />
                  {clipSaving ? 'Building…' : 'Download GIF'}
                </button>
                <button
                  className="action-button"
                  data-testid="button-add-opponent"
                  disabled={animRunning}
                  onClick={addOpponent}
                  type="button"
                >
                  <Shield size={14} />
                  Add opponent
                </button>
                {clipOpponents.length > 0 && (
                  <button
                    className="action-button"
                    data-testid="button-clear-opponents"
                    disabled={animRunning}
                    onClick={() => setClipOpponents([])}
                    type="button"
                  >
                    <Eraser size={14} />
                    Clear opponents
                  </button>
                )}
              </div>
              {clipFrames.length ? (
                <>
                  <ol className="clip-frames" data-testid="list-clip-frames">
                    {clipFrames.map((frame, index) => (
                      <li className="clip-frame" key={frame.id}>
                        <button
                          className="clip-frame-index"
                          data-testid={`button-jump-frame-${index}`}
                          disabled={animRunning}
                          onClick={() => jumpToFrame(frame)}
                          title="Put the board back to this frame"
                          type="button"
                        >
                          {index + 1}
                        </button>
                        <input
                          aria-label={`Caption for frame ${index + 1}`}
                          className="clip-frame-note"
                          data-testid={`input-frame-note-${index}`}
                          maxLength={70}
                          onChange={(event) => setFrameNote(frame.id, event.target.value)}
                          placeholder="Say what happens here…"
                          value={frame.note}
                        />
                        <button
                          aria-label={`Delete frame ${index + 1}`}
                          className="clip-frame-delete"
                          data-testid={`button-delete-frame-${index}`}
                          disabled={animRunning}
                          onClick={() => deleteFrame(frame.id)}
                          type="button"
                        >
                          <X size={13} />
                        </button>
                      </li>
                    ))}
                  </ol>
                  <div className="clip-footer">
                    <span className="clip-speed" role="group" aria-label="Playback speed">
                      {CLIP_SPEEDS.map((option) => (
                        <button
                          className={`clip-speed-option ${clipSpeed === option.seconds ? 'is-active' : ''}`}
                          data-testid={`button-speed-${option.label.toLowerCase()}`}
                          key={option.label}
                          onClick={() => setClipSpeed(option.seconds)}
                          type="button"
                        >
                          {option.label}
                        </button>
                      ))}
                    </span>
                    <button
                      className="clip-clear"
                      data-testid="button-clear-clip"
                      disabled={animRunning}
                      onClick={clearClip}
                      type="button"
                    >
                      Clear clip
                    </button>
                  </div>
                  {clipFrames.length < 2 && (
                    <p className="anim-disclaimer">
                      One more frame and you can play it back.
                    </p>
                  )}
                  {clipFrames.length >= MAX_CLIP_FRAMES && (
                    <p className="anim-disclaimer">
                      That is {MAX_CLIP_FRAMES} frames — the most a clip holds. Delete one to add
                      another.
                    </p>
                  )}
                </>
              ) : (
                <p className="anim-disclaimer" data-testid="text-clip-empty">
                  No frames yet. Arrange the board, then capture your first one.
                </p>
              )}
            </div>
          )}
          {activeEra && activeManager && MANAGER_PLAYSTYLES[activeManager.name] && (
            <div className="tip-box" data-testid="panel-playstyle">
              <div className="playstyle-head">
                <ManagerPhoto manager={activeManager.name} size="large" />
                <strong>How {activeManager.name} plays</strong>
              </div>
              <p className="fact-text">{glossify(MANAGER_PLAYSTYLES[activeManager.name])}</p>
              {/* Every era has clips, so these render unconditionally — checking
                  ERA_ANIMATIONS here would pull in the lazy chunk on load. */}
              <div className="tactic-buttons">
                <button
                  className="action-button primary-action"
                  data-testid="button-play-attack"
                  type="button"
                  disabled={animLoading}
                  onClick={() => playTactic('attack')}
                >
                  <Play size={14} />
                  In possession
                </button>
                <button
                  className="action-button"
                  data-testid="button-play-defense"
                  type="button"
                  disabled={animLoading}
                  onClick={() => playTactic('defense')}
                >
                  <Play size={14} />
                  Out of possession
                </button>
              </div>
              <p className="anim-disclaimer">
                These clips are deliberate oversimplifications — quick sketches of the attacking
                and defensive ideas behind the shape, not full tactical recreations.
              </p>
              <GlossFooter terms={playstyleGlossTerms} />
              <ManagerPhotoCredit manager={activeManager.name} />
            </div>
          )}
          {didYouKnowFacts.length > 0 && (
            <div className="tip-box" data-testid="panel-fun-facts">
              <strong>
                <Lightbulb size={13} aria-hidden="true" /> Did You Know
              </strong>
              <p className="fact-text" data-testid="text-fun-fact">
                {currentFact ? glossify(currentFact) : null}
              </p>
              <GlossFooter terms={factGlossTerms} />
              <div className="fact-nav">
                <button
                  className="fact-nav-button"
                  data-testid="button-fact-prev"
                  type="button"
                  aria-label="Previous fact"
                  onClick={() =>
                    setFactIndex((current) => (current - 1 + didYouKnowFacts.length) % didYouKnowFacts.length)
                  }
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="fact-count">
                  {(factIndex % didYouKnowFacts.length) + 1} / {didYouKnowFacts.length}
                </span>
                <button
                  className="fact-nav-button"
                  data-testid="button-fact-next"
                  type="button"
                  aria-label="Next fact"
                  onClick={() => setFactIndex((current) => (current + 1) % didYouKnowFacts.length)}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
          <div className="reset-message">{message}</div>
        </aside>
        )}
      </div>
    </main>

  );
}

/** Sends anyone arriving at the site into the tutorial before anything else,
 *  once per visit, and remembers where they were going so skipping it puts
 *  them back on their way. Land on the tutorial yourself and it steps aside.
 *
 *  The decision is taken on the first render and never revisited: once the
 *  redirect has happened this component is inert, or leaving the tutorial
 *  would bounce you straight back into it. */
function FirstVisitTutorial({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const sendingRef = useRef(isNewVisit && location !== '/learn');
  useEffect(() => {
    if (!sendingRef.current) return;
    rememberReturn(location);
    // replace, so Back goes wherever they came from rather than round again.
    navigate('/learn', { replace: true });
    sendingRef.current = false;
    // Deliberately once, on mount: this is about how the visit started.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Nothing is drawn for the one frame before the redirect, so the board never
  // flashes up behind it.
  if (sendingRef.current) return null;
  return <>{children}</>;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <FirstVisitTutorial>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/match">
            <MatchGame />
          </Route>
          <Route path="/learn">
            <MatchGame tutorial />
          </Route>
          <Route path="/how-to-play" component={HowToPlay} />
          <Route component={NotFound} />
        </Switch>
      </FirstVisitTutorial>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
