import { type PointerEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Eraser,
  Goal,
  Grip,
  LayoutGrid,
  Lightbulb,
  ListFilter,
  Minus,
  MoveUpRight,
  Pencil,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Spline,
  Trophy,
  Users,
} from 'lucide-react';
import { FORMATION_CONTENT, ERA_CONTENT } from './formation-content';
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

type Formation = {
  name: string;
  subtitle: string;
  shape: number[];
};

type Era = {
  id: string;
  club: string;
  years: string;
  formation: string;
  shape: number[];
  summary: string;
  points: string[];
  xi: string[];
};

type Manager = {
  name: string;
  eras: Era[];
};

type ArrowStyle = 'solid' | 'dashed' | 'curved';

type Arrow = {
  id: string;
  playerId: string;
  endX: number;
  endY: number;
  style: ArrowStyle;
  // Signed perpendicular bend for curved arrows, in viewBox units. Derived
  // from the point of the drag path that strays furthest from the straight
  // start-end line: sign picks the side, magnitude sets how deep the bow is.
  // Undefined (or tiny) means "near-straight drag" — use the default bow.
  bend?: number;
};

// Drag-path bends smaller than this (viewBox units) are treated as a
// straight-line drag, keeping the historical default curve direction.
const CURVE_BEND_THRESHOLD = 2;

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

const FORMATIONS: Formation[] = [
  { name: '4-4-2', subtitle: 'Balanced classic', shape: [4, 4, 2] },
  { name: '4-3-3', subtitle: 'Width + pressure', shape: [4, 3, 3] },
  { name: '4-2-3-1', subtitle: 'Control the middle', shape: [4, 2, 3, 1] },
  { name: '4-1-4-1', subtitle: 'Compact block', shape: [4, 1, 4, 1] },
  { name: '4-4-1-1', subtitle: 'Second striker link', shape: [4, 4, 1, 1] },
  { name: '4-5-1', subtitle: 'Midfield overload', shape: [4, 5, 1] },
  { name: '4-2-2-2', subtitle: 'Box midfield', shape: [4, 2, 2, 2] },
  { name: '4-3-1-2', subtitle: 'Narrow diamond', shape: [4, 3, 1, 2] },
  { name: '4-3-2-1', subtitle: 'Christmas tree', shape: [4, 3, 2, 1] },
  { name: '4-3-3 Attack', subtitle: 'Aggressive front three', shape: [4, 3, 3] },
  { name: '3-4-3', subtitle: 'High and wide', shape: [3, 4, 3] },
  { name: '3-4-1-2', subtitle: 'Playmaker behind two', shape: [3, 4, 1, 2] },
  { name: '3-4-2-1', subtitle: 'Two between lines', shape: [3, 4, 2, 1] },
  { name: '3-5-2', subtitle: 'Extra central body', shape: [3, 5, 2] },
  { name: '3-1-4-2', subtitle: 'Single pivot', shape: [3, 1, 4, 2] },
  { name: '5-3-2', subtitle: 'Wing-back security', shape: [5, 3, 2] },
  { name: '5-4-1', subtitle: 'Deep and patient', shape: [5, 4, 1] },
  { name: '5-2-3', subtitle: 'Counter-punch', shape: [5, 2, 3] },
  { name: '5-3-1-1', subtitle: 'Low-block diamond', shape: [5, 3, 1, 1] },
  { name: '4-2-4', subtitle: 'Full send', shape: [4, 2, 4] },
  { name: '4-1-2-1-2', subtitle: 'Midfield diamond', shape: [4, 1, 2, 1, 2] },
  { name: '4-2-1-3', subtitle: 'Three-lane attack', shape: [4, 2, 1, 3] },
  { name: '4-4-2 Diamond', subtitle: 'Narrow midfield', shape: [4, 4, 2] },
];

const MANAGERS: Manager[] = [
  {
    name: 'Alex Ferguson',
    eras: [
      {
        id: 'fergie-99',
        club: 'Manchester United',
        years: '1998-99',
        formation: '4-4-2',
        shape: [4, 4, 2],
        summary:
          'The Treble machine. Two genuine wingers, a warrior midfield, and a strike pair that never stopped moving.',
        points: [
          'Beckham and Giggs stretch the pitch and deliver early crosses',
          'Keane and Scholes dominate the middle with steel and passing range',
          'Fergie time: relentless late pressure until the final whistle',
        ],
        xi: [
          'Schmeichel',
          'Irwin',
          'Johnsen',
          'Stam',
          'G. Neville',
          'Giggs',
          'Keane',
          'Scholes',
          'Beckham',
          'Yorke',
          'Cole',
        ],
      },
      {
        id: 'fergie-08',
        club: 'Manchester United',
        years: '2007-08',
        formation: '4-3-3',
        shape: [4, 3, 3],
        summary:
          'Champions League winners with a fluid, interchanging front three that defenders could never pin down.',
        points: [
          'Ronaldo, Rooney and Tevez rotate freely across the front line',
          'Carrick dictates tempo while Hargreaves screens the back four',
          'Vidic and Ferdinand form one of the great centre-back pairings',
        ],
        xi: [
          'Van der Sar',
          'Evra',
          'Vidić',
          'Ferdinand',
          'Brown',
          'Scholes',
          'Carrick',
          'Hargreaves',
          'Rooney',
          'Tévez',
          'Ronaldo',
        ],
      },
      {
        id: 'fergie-13',
        club: 'Manchester United',
        years: '2012-13',
        formation: '4-2-3-1',
        shape: [4, 2, 3, 1],
        summary:
          'The farewell title. A pragmatic double pivot behind Rooney, all built to feed Van Persie in the box.',
        points: [
          'Van Persie is the focal point: 26 league goals in the title run',
          'Carrick quietly controls games from deep',
          'Wide players tuck in so full-backs supply the width',
        ],
        xi: [
          'De Gea',
          'Evra',
          'Vidić',
          'Ferdinand',
          'Rafael',
          'Carrick',
          'Cleverley',
          'Kagawa',
          'Rooney',
          'Valencia',
          'Van Persie',
        ],
      },
    ],
  },
  {
    name: 'Pep Guardiola',
    eras: [
      {
        id: 'pep-barca',
        club: 'Barcelona',
        years: '2008-11',
        formation: '4-3-3',
        shape: [4, 3, 3],
        summary:
          'Tiki-taka at its peak. Messi as a false nine, endless triangles, and a six-second press to win the ball back.',
        points: [
          'Messi drops from the nine into midfield, dragging defenders into chaos',
          'Xavi and Iniesta play one-touch keep-ball in tight spaces',
          'Lose the ball, win it back within six seconds - press as a weapon',
        ],
        xi: [
          'Valdés',
          'Abidal',
          'Puyol',
          'Piqué',
          'Alves',
          'Iniesta',
          'Busquets',
          'Xavi',
          'Villa',
          'Messi',
          'Pedro',
        ],
      },
      {
        id: 'pep-bayern',
        club: 'Bayern Munich',
        years: '2013-16',
        formation: '4-1-4-1',
        shape: [4, 1, 4, 1],
        summary:
          'The laboratory years. Inverted full-backs, positional play, and halfspace overloads drilled to perfection.',
        points: [
          'Lahm and Alaba step into midfield when Bayern have the ball',
          'Xabi Alonso recycles possession as the lone pivot',
          'Robben and Ribery isolate defenders one-on-one out wide',
        ],
        xi: [
          'Neuer',
          'Alaba',
          'Boateng',
          'Martínez',
          'Lahm',
          'Xabi Alonso',
          'Ribéry',
          'Thiago',
          'Müller',
          'Robben',
          'Lewandowski',
        ],
      },
      {
        id: 'pep-city',
        club: 'Manchester City',
        years: '2017-19',
        formation: '4-3-3',
        shape: [4, 3, 3],
        summary:
          'The Centurions. 100 points, rondo control in the final third, and a high line that suffocated the league.',
        points: [
          'De Bruyne and Silva operate as twin free eights in the halfspaces',
          'Fernandinho covers the entire width behind the ball',
          'Sterling and Sane attack the back post on every cross',
        ],
        xi: [
          'Ederson',
          'Delph',
          'Otamendi',
          'Stones',
          'Walker',
          'D. Silva',
          'Fernandinho',
          'De Bruyne',
          'Sané',
          'Agüero',
          'Sterling',
        ],
      },
    ],
  },
  {
    name: 'José Mourinho',
    eras: [
      {
        id: 'mou-porto',
        club: 'FC Porto',
        years: '2002-04',
        formation: '4-1-2-1-2',
        shape: [4, 1, 2, 1, 2],
        summary:
          'The arrival. A narrow diamond that won the UEFA Cup and Champions League back to back with ruthless organisation.',
        points: [
          'Deco is the free man between the lines, feeding two strikers',
          'Costinha destroys attacks in front of a disciplined back four',
          'Compact without the ball, direct and vertical with it',
        ],
        xi: [
          'Vítor Baía',
          'Valente',
          'Carvalho',
          'Jorge Costa',
          'P. Ferreira',
          'Costinha',
          'Maniche',
          'Mendes',
          'Deco',
          'Derlei',
          'C. Alberto',
        ],
      },
      {
        id: 'mou-chelsea',
        club: 'Chelsea',
        years: '2004-06',
        formation: '4-3-3',
        shape: [4, 3, 3],
        summary:
          'Back-to-back titles built on the meanest defence in Premier League history: 15 goals conceded in a season.',
        points: [
          'Makelele redefines the holding role in front of Terry and Carvalho',
          'Drogba wins everything in the air and holds the ball up alone',
          'Robben and Duff break at speed the moment the ball turns over',
        ],
        xi: [
          'Čech',
          'Gallas',
          'Terry',
          'Carvalho',
          'P. Ferreira',
          'Lampard',
          'Makélélé',
          'Tiago',
          'Duff',
          'Drogba',
          'Robben',
        ],
      },
      {
        id: 'mou-inter',
        club: 'Inter Milan',
        years: '2009-10',
        formation: '4-2-3-1',
        shape: [4, 2, 3, 1],
        summary:
          'The Treble. A masterclass in defensive structure, capped by the 10-man siege of the Camp Nou.',
        points: [
          'Sneijder is the only creative license - everyone else has a job',
          'Cambiasso and Zanetti shield the back four without the ball',
          'Milito converts the few chances that matter: both goals in the final',
        ],
        xi: [
          'Júlio César',
          'Chivu',
          'Samuel',
          'Lúcio',
          'Maicon',
          'Cambiasso',
          'Zanetti',
          'Pandev',
          'Sneijder',
          "Eto'o",
          'Milito',
        ],
      },
    ],
  },
  {
    name: 'Carlo Ancelotti',
    eras: [
      {
        id: 'carlo-milan',
        club: 'AC Milan',
        years: '2002-07',
        formation: '4-3-2-1',
        shape: [4, 3, 2, 1],
        summary:
          'The Christmas tree. Pirlo reinvented as a deep playmaker, with Kaka and Seedorf floating between the lines.',
        points: [
          'Pirlo drops in front of the defence and launches everything',
          'Kaka attacks the space between midfield and defence at full speed',
          'Gattuso does the running so the artists can paint',
        ],
        xi: [
          'Dida',
          'Jankulovski',
          'Maldini',
          'Nesta',
          'Oddo',
          'Gattuso',
          'Pirlo',
          'Ambrosini',
          'Kaká',
          'Seedorf',
          'Inzaghi',
        ],
      },
      {
        id: 'carlo-chelsea',
        club: 'Chelsea',
        years: '2009-10',
        formation: '4-3-3',
        shape: [4, 3, 3],
        summary:
          'The double, with 103 league goals. Ancelotti let a veteran squad off the leash and Drogba led the stampede.',
        points: [
          'Drogba spearheads everything: 29 league goals that season',
          'Lampard arrives late in the box, again and again',
          'Powerful, direct wing play from Malouda and Anelka',
        ],
        xi: [
          'Čech',
          'A. Cole',
          'Terry',
          'Alex',
          'Ivanović',
          'Lampard',
          'Mikel',
          'Ballack',
          'Malouda',
          'Drogba',
          'Anelka',
        ],
      },
      {
        id: 'carlo-decima',
        club: 'Real Madrid',
        years: '2013-14',
        formation: '4-3-3',
        shape: [4, 3, 3],
        summary:
          'La Decima. Ancelotti balanced a galaxy of stars into a lethal counter-attacking unit - and won it in minute 93.',
        points: [
          'Bale, Benzema and Ronaldo break at terrifying speed',
          'Di Maria carries the ball through midfield to launch transitions',
          'Ramos in minute 93 of the final: never stop believing',
        ],
        xi: [
          'Casillas',
          'Coentrão',
          'Ramos',
          'Pepe',
          'Carvajal',
          'Di María',
          'Xabi Alonso',
          'Modrić',
          'Ronaldo',
          'Benzema',
          'Bale',
        ],
      },
    ],
  },
];

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
    { id: 'p1', number: 1, role: 'GK', name: names?.[0], x: 50, y: 94 },
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
    <svg className="arrow-layer" viewBox="0 0 100 140" role="group" aria-label="Tactical arrows">
      <defs>
        <marker id="arrowhead" markerWidth="7" markerHeight="7" refX="5.4" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 Z" className="arrow-head" />
        </marker>
        <marker id="arrowhead-selected" markerWidth="7" markerHeight="7" refX="5.4" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 Z" className="arrow-head is-selected" />
        </marker>
      </defs>
      {arrows.map((arrow) => {
        const start = players.find((player) => player.id === arrow.playerId);
        if (!start) return null;
        // Pitch coordinates are percentages; the viewBox is 100x140 to match
        // the pitch aspect ratio, so y scales by 1.4.
        const sx = start.x;
        const sy = start.y * 1.4;
        const ex = arrow.endX;
        const ey = arrow.endY * 1.4;
        let d = `M ${sx} ${sy} L ${ex} ${ey}`;
        if (arrow.style === 'curved') {
          const mx = (sx + ex) / 2;
          const my = (sy + ey) / 2;
          const dx = ex - sx;
          const dy = ey - sy;
          const length = Math.hypot(dx, dy) || 1;
          // Bow along the unit normal (-dy, dx)/length. A recorded bend from
          // the drag path picks the side and depth; near-straight drags fall
          // back to the historical default bow of a quarter of the length.
          const bend =
            arrow.bend !== undefined && Math.abs(arrow.bend) >= CURVE_BEND_THRESHOLD
              ? Math.max(-length * 0.5, Math.min(length * 0.5, arrow.bend))
              : length * 0.25;
          const cx = mx - (dy / length) * bend;
          const cy = my + (dx / length) * bend;
          d = `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`;
        }
        const isSelected = arrow.id === selectedArrowId;
        return (
          <g key={arrow.id}>
            <path
              className="arrow-hit"
              d={d}
              data-testid={`arrow-${arrow.id}`}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`${arrow.style} arrow from ${roleName(start.role)}${isSelected ? ', selected' : ''}. Press Delete to remove.`}
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
            <path
              className={`arrow-path ${arrow.style === 'dashed' ? 'is-dashed' : ''} ${isSelected ? 'is-selected' : ''}`}
              d={d}
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
    <svg className="pitch-lines" viewBox="0 0 100 140" aria-hidden="true">
      <rect className="pitch-line" x="1" y="1" width="98" height="138" rx="1.2" />
      <line className="pitch-line" x1="1" y1="70" x2="99" y2="70" />
      <circle className="pitch-line" cx="50" cy="70" r="9.15" />
      <circle className="pitch-dot" cx="50" cy="70" r="0.7" />
      <rect className="pitch-line" x="17" y="1" width="66" height="18" />
      <rect className="pitch-line" x="31" y="1" width="38" height="7" />
      <circle className="pitch-line" cx="50" cy="12" r="0.7" />
      <path className="pitch-line" d="M38 19 A12 12 0 0 0 62 19" />
      <rect className="pitch-line" x="17" y="121" width="66" height="18" />
      <rect className="pitch-line" x="31" y="132" width="38" height="7" />
      <circle className="pitch-line" cx="50" cy="128" r="0.7" />
      <path className="pitch-line" d="M38 121 A12 12 0 0 1 62 121" />
      <path className="pitch-line" d="M1 5 A4 4 0 0 1 5 1 M95 1 A4 4 0 0 1 99 5 M1 135 A4 4 0 0 0 5 139 M95 139 A4 4 0 0 0 99 135" />
    </svg>
  );
}

function Home() {
  const [panelTab, setPanelTab] = useState<'shapes' | 'managers'>('shapes');
  const [formation, setFormation] = useState(FORMATIONS[1]);
  const [activeEra, setActiveEra] = useState<Era | null>(null);
  const [players, setPlayers] = useState<Player[]>(() => formationPlayers(FORMATIONS[1]));
  const [selectedId, setSelectedId] = useState('p1');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('Ready for a shape change.');
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [arrowMode, setArrowMode] = useState(false);
  const [arrowStyle, setArrowStyle] = useState<ArrowStyle>('solid');
  const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null);
  const [arrowDraft, setArrowDraft] = useState<Arrow | null>(null);
  const [factIndex, setFactIndex] = useState(0);
  const arrowCounter = useRef(0);
  const pitchRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string } | null>(null);
  // Sampled drag-path points (viewBox coords) for the arrow being drawn,
  // used to decide which way a curved arrow should bow.
  const draftSamplesRef = useRef<Position[]>([]);

  const filteredFormations = useMemo(
    () =>
      FORMATIONS.filter((item) =>
        `${item.name} ${item.subtitle}`.toLowerCase().includes(query.toLowerCase().trim()),
      ),
    [query],
  );

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
  // The Did You Know box talks about the team when an era is active, and
  // about the formation itself only in the Shapes tab.
  const didYouKnowFacts = activeEra ? eraContent?.teamFacts ?? [] : content?.funFacts ?? [];

  const clearArrows = () => {
    setArrows([]);
    setSelectedArrowId(null);
    setArrowDraft(null);
  };

  const selectFormation = (nextFormation: Formation) => {
    setFormation(nextFormation);
    setActiveEra(null);
    setPlayers(formationPlayers(nextFormation));
    setSelectedId('p1');
    clearArrows();
    setFactIndex(0);
    setMessage(`${nextFormation.name} loaded. Drag to make it yours.`);
  };

  const selectEra = (era: Era, managerName: string) => {
    setActiveEra(era);
    setPlayers(eraPlayers(era));
    setSelectedId('p1');
    clearArrows();
    setFactIndex(0);
    setMessage(`${managerName}'s ${era.club} ${era.years} loaded in a ${era.formation}.`);
  };

  const resetFormation = () => {
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
    setPlayers([]);
    setSelectedId('');
    clearArrows();
    setMessage('Board cleared. Choose reset when you want the shape back.');
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
      x: Math.max(1, Math.min(99, ((event.clientX - bounds.left) / bounds.width) * 100)),
      y: Math.max(1, Math.min(99, ((event.clientY - bounds.top) / bounds.height) * 100)),
    };
  };

  const updatePosition = (event: PointerEvent<HTMLDivElement>) => {
    const point = pitchPoint(event);
    if (!point) return;
    if (arrowDraft) {
      let bend = arrowDraft.bend;
      const start = players.find((player) => player.id === arrowDraft.playerId);
      if (start) {
        if (draftSamplesRef.current.length < 400) {
          draftSamplesRef.current.push({ x: point.x, y: point.y * 1.4 });
        }
        const sx = start.x;
        const sy = start.y * 1.4;
        const dx = point.x - sx;
        const dy = point.y * 1.4 - sy;
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
    const x = Math.max(4, Math.min(96, point.x));
    const y = Math.max(4, Math.min(96, point.y));
    setPlayers((current) =>
      current.map((player) => (player.id === drag.id ? { ...player, x, y } : player)),
    );
  };

  const commitArrowDraft = () => {
    if (!arrowDraft) return;
    const start = players.find((player) => player.id === arrowDraft.playerId);
    if (start) {
      const length = Math.hypot(arrowDraft.endX - start.x, arrowDraft.endY - start.y);
      if (length > 4) {
        setArrows((current) => [...current, arrowDraft]);
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
      if (!selectedArrowId) return;
      event.preventDefault();
      setArrows((current) => current.filter((arrow) => arrow.id !== selectedArrowId));
      setSelectedArrowId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedArrowId]);

  const boardLabel = activeEra
    ? `${activeEra.club} ${activeEra.years} / ${activeEra.formation}`
    : formation.name;

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
              onClick={() => setPanelTab('managers')}
            >
              <BookOpen size={14} />
              Managers
            </button>
          </div>

          {panelTab === 'shapes' ? (
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
                {filteredFormations.length ? (
                  filteredFormations.map((item) => (
                    <button
                      className={`formation-item ${!activeEra && formation.name === item.name ? 'is-active' : ''}`}
                      data-testid={`button-formation-${item.name.replaceAll(' ', '-').toLowerCase()}`}
                      key={item.name}
                      type="button"
                      onClick={() => selectFormation(item)}
                    >
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
                  <div className="empty-search" data-testid="empty-formation-search">
                    <strong>No shape found</strong>
                    Try a number like 3-5-2 or clear the search.
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="panel-heading">
                <div className="eyebrow">The dugout</div>
                <h2 className="panel-title">Steal a blueprint</h2>
                <p className="panel-copy">Four serial winners, each frozen at a defining moment of their career.</p>
              </div>
              <div className="formation-list manager-list">
                {MANAGERS.map((manager) => (
                  <div className="manager-group" key={manager.name}>
                    <div className="manager-name">
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
                        <span>
                          <span className="formation-item-name">
                            {era.club} <span className="era-years">{era.years}</span>
                          </span>
                          <span className="formation-item-meta">{era.formation}</span>
                        </span>
                        {activeEra?.id === era.id ? <Crosshair size={15} /> : <ListFilter size={14} />}
                      </button>
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
              <h1 className="pitch-title">{activeEra ? 'Study the idea.' : 'Move the idea.'}</h1>
              <p className="pitch-caption">
                {activeEra
                  ? `${activeEra.summary}`
                  : 'A clean starting point for messy thinking. Pull any player into space and see the shape change.'}
              </p>
            </div>
            <div className="pitch-count" data-testid="text-player-count">
              {players.length} / 11 players
            </div>
          </div>

          <div className="pitch-toolbar" role="toolbar" aria-label="Arrow tools">
            <button
              className={`tool-button ${arrowMode ? 'is-active' : ''}`}
              data-testid="button-arrow-mode"
              type="button"
              aria-pressed={arrowMode}
              onClick={() => {
                setArrowMode((current) => !current);
                setArrowDraft(null);
                setMessage(
                  arrowMode
                    ? 'Arrow mode off. Drag circles to move players.'
                    : 'Arrow mode on. Drag from a player circle to draw an arrow.',
                );
              }}
            >
              <MoveUpRight size={14} />
              {arrowMode ? 'Drawing arrows' : 'Draw arrows'}
            </button>
            <div className="tool-group" role="group" aria-label="Arrow style">
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
              className="pitch"
              data-testid="pitch-board"
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
                onSelect={setSelectedArrowId}
                onDelete={(id) => {
                  setArrows((current) => current.filter((arrow) => arrow.id !== id));
                  setSelectedArrowId((current) => (current === id ? null : current));
                }}
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
                    event.preventDefault();
                    event.stopPropagation();
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
                  <span className="player-number">{shirtNumber(player)}</span>
                  {player.name && <span className="player-label">{player.name}</span>}
                </button>
              ))}
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
          <div className="reset-message" data-testid="status-board-message" aria-live="polite">
            {message}
          </div>
        </section>

        <aside className="panel inspector" aria-label="Selected player details">
          <div className="inspector-swatch" aria-hidden="true">
            {selectedPlayer ? <Shield size={23} /> : <Users size={23} />}
          </div>
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
            <div className="inspector-role">{selectedPlayer ? roleName(selectedPlayer.role) : 'Board is empty'}</div>
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
          {activeEra ? (
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
          ) : (
            <div className="tip-box">
              <strong>Try the uncomfortable pass.</strong>
              Move a midfielder beyond the line, pull a full-back inside, or make the front three asymmetric.
            </div>
          )}
          {content && (
            <div className="tip-box" data-testid="panel-core-ideas">
              <strong>Core Ideas</strong>
              <div className="core-row">
                <span className="core-label">In possession</span>
                {content.coreIdeas.inPossession}
              </div>
              <div className="core-row">
                <span className="core-label">Out of possession</span>
                {content.coreIdeas.outOfPossession}
              </div>
              <div className="core-row">
                <span className="core-label">Key principles</span>
                <ul className="tactics-list">
                  {content.coreIdeas.principles.map((principle) => (
                    <li key={principle}>{principle}</li>
                  ))}
                </ul>
              </div>
              {activeEra && (
                <div className="core-row" data-testid="core-row-era-twist">
                  <span className="core-label">How {activeEra.club} played it</span>
                  <ul className="tactics-list">
                    {activeEra.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="core-row">
                <span className="core-label">The two roles that matter</span>
                <ul className="tactics-list">
                  {content.coreIdeas.keyRoles.map((keyRole) => (
                    <li key={keyRole.role}>
                      <em>{keyRole.role}:</em> {keyRole.job}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="core-row">
                <span className="core-label">Main strength</span>
                {content.coreIdeas.strength}
              </div>
              <div className="core-row">
                <span className="core-label">Main vulnerability</span>
                {content.coreIdeas.vulnerability}
              </div>
            </div>
          )}
          {didYouKnowFacts.length > 0 && (
            <div className="tip-box" data-testid="panel-fun-facts">
              <strong>
                <Lightbulb size={13} aria-hidden="true" /> Did You Know
              </strong>
              <p className="fact-text" data-testid="text-fun-fact">
                {didYouKnowFacts[factIndex % didYouKnowFacts.length]}
              </p>
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
      </div>
    </main>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
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
