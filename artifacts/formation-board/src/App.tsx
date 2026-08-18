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
  Eraser,
  Goal,
  Grip,
  LayoutGrid,
  Lightbulb,
  ListFilter,
  Minus,
  MoveUpRight,
  Pencil,
  Play,
  RotateCcw,
  Search,
  X,
  Shield,
  Sparkles,
  Spline,
  Trophy,
  Users,
} from 'lucide-react';
import {
  FORMATION_CONTENT,
  ERA_CONTENT,
  GLOSSARY,
  MANAGER_PLAYSTYLES,
} from './formation-content';
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
  // Real jersey numbers worn most often under this manager, parallel to xi.
  // Shown in brackets after the player's name on the pitch.
  numbers: number[];
};

type Manager = {
  name: string;
  eras: Era[];
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
        numbers: [1, 3, 5, 6, 2, 11, 16, 18, 7, 19, 9],
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
          'Ronaldo, Rooney and Tévez rotate freely across the front line',
          'Carrick dictates tempo while Hargreaves screens the back four',
          'Vidić and Ferdinand form one of the great centre-back pairings',
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
        numbers: [1, 3, 15, 5, 6, 18, 16, 4, 10, 32, 7],
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
        numbers: [1, 3, 15, 5, 21, 16, 23, 26, 10, 25, 20],
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
          'Lose the ball, win it back within six seconds — the press as a weapon',
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
        numbers: [1, 22, 5, 3, 2, 8, 16, 6, 7, 10, 17],
      },
      {
        id: 'pep-bayern',
        club: 'Bayern Munich',
        years: '2013-16',
        formation: '4-1-4-1',
        shape: [4, 1, 4, 1],
        summary:
          'The laboratory years. Inverted full-backs, positional play, and half-space overloads drilled to perfection.',
        points: [
          'Lahm and Alaba step into midfield when Bayern have the ball',
          'Xabi Alonso recycles possession as the lone pivot',
          'Robben and Ribéry isolate defenders one-v-one out wide',
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
        numbers: [1, 27, 17, 8, 21, 3, 7, 6, 25, 10, 9],
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
          'De Bruyne and Silva operate as twin free eights in the half-spaces',
          'Fernandinho covers the entire width behind the ball',
          'Sterling and Sané attack the back post on every cutback',
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
        numbers: [31, 18, 30, 5, 2, 21, 25, 17, 19, 10, 7],
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
        numbers: [99, 8, 4, 2, 22, 6, 18, 23, 10, 11, 19],
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
          'Makélélé redefines the holding role in front of Terry and Carvalho',
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
        numbers: [1, 13, 26, 6, 20, 8, 4, 30, 11, 15, 16],
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
          'Sneijder holds the only creative licence — everyone else has a job',
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
        numbers: [12, 26, 25, 6, 13, 19, 4, 27, 10, 9, 22],
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
          'The Christmas tree. Pirlo reinvented as a deep playmaker, with Kaká and Seedorf floating between the lines.',
        points: [
          'Pirlo drops in front of the defence and launches everything',
          'Kaká attacks the space between midfield and defence at full speed',
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
        numbers: [1, 18, 3, 13, 44, 8, 21, 23, 22, 20, 9],
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
        numbers: [1, 3, 26, 33, 2, 8, 12, 13, 15, 11, 39],
      },
      {
        id: 'carlo-decima',
        club: 'Real Madrid',
        years: '2013-14',
        formation: '4-3-3',
        shape: [4, 3, 3],
        summary:
          'La Décima. Ancelotti balanced a galaxy of stars into a lethal counter-attacking unit — and won it in minute 93.',
        points: [
          'Bale, Benzema and Ronaldo break at terrifying speed',
          'Di María carries the ball through midfield to launch transitions',
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
        numbers: [1, 5, 4, 3, 15, 22, 14, 19, 7, 9, 11],
      },
    ],
  },
  {
    name: 'Johan Cruyff',
    eras: [
      {
        id: 'cruyff-barca',
        club: 'Barcelona',
        years: '1993-94',
        formation: '3-4-3',
        shape: [3, 4, 3],
        summary:
          'The Dream Team. Cruyff’s 3-4-3 with Koeman stepping out of defence, Guardiola conducting, and Romário finishing everything.',
        points: [
          'Koeman starts attacks from the back and arrives for every free kick',
          'Guardiola, a Cruyff invention, is the pivot the whole system spins around',
          'Romário and Stoichkov terrorise the last line with runs in behind',
        ],
        xi: [
          'Zubizarreta',
          'Ferrer',
          'Koeman',
          'Nadal',
          'Sergi',
          'Guardiola',
          'Bakero',
          'Amor',
          'Stoichkov',
          'Romário',
          'Beguiristain',
        ],
        numbers: [1, 2, 4, 5, 7, 3, 6, 9, 8, 10, 11],
      },
    ],
  },
  {
    name: 'Arsène Wenger',
    eras: [
      {
        id: 'wenger-invincibles',
        club: 'Arsenal',
        years: '2003-04',
        formation: '4-4-2',
        shape: [4, 4, 2],
        summary:
          'The Invincibles. 38 league games, zero defeats — pace, power and one-touch football on the break.',
        points: [
          'Henry drifts left and attacks the space behind the right-back',
          'Vieira and Gilberto win the ball and release the counter in seconds',
          'Bergkamp drops between the lines to thread the final pass',
        ],
        xi: [
          'Lehmann',
          'A. Cole',
          'Campbell',
          'Touré',
          'Lauren',
          'Pires',
          'Vieira',
          'Gilberto',
          'Ljungberg',
          'Henry',
          'Bergkamp',
        ],
        numbers: [1, 3, 23, 28, 12, 7, 4, 19, 8, 14, 10],
      },
    ],
  },
  {
    name: 'Luis Enrique',
    eras: [
      {
        id: 'lucho-barca',
        club: 'Barcelona',
        years: '2014-15',
        formation: '4-3-3',
        shape: [4, 3, 3],
        summary:
          'The MSN treble. Messi, Suárez and Neymar scored 122 goals as Barcelona swept La Liga, the Copa and the Champions League.',
        points: [
          'Messi, Suárez and Neymar interchange freely and settle games alone',
          'Busquets and Iniesta keep the ball; Rakitić does the running',
          'More direct than Guardiola’s Barça — quicker to release the front three',
        ],
        xi: [
          'Ter Stegen',
          'Alba',
          'Piqué',
          'Mascherano',
          'Alves',
          'Iniesta',
          'Busquets',
          'Rakitić',
          'Neymar',
          'Suárez',
          'Messi',
        ],
        numbers: [1, 18, 3, 14, 22, 8, 5, 4, 11, 9, 10],
      },
      {
        id: 'lucho-psg',
        club: 'Paris Saint-Germain',
        years: '2024-26',
        formation: '4-3-3',
        shape: [4, 3, 3],
        summary:
          'The first European Cup. Luis Enrique moved on from the galácticos, trusted Europe’s youngest side, and demolished Inter 5-0 in the final.',
        points: [
          'Dembélé reinvented as a false nine — and Ballon d’Or winner',
          'Vitinha dictates everything as the smallest player on the pitch',
          'The whole team presses: Doué and Kvaratskhelia defend from the front',
        ],
        xi: [
          'Donnarumma',
          'Nuno Mendes',
          'Pacho',
          'Marquinhos',
          'Hakimi',
          'Vitinha',
          'Neves',
          'Ruiz',
          'Kvaratskhelia',
          'Dembélé',
          'Doué',
        ],
        numbers: [99, 25, 51, 5, 2, 17, 87, 8, 7, 10, 14],
      },
    ],
  },
  {
    name: 'Jürgen Klopp',
    eras: [
      {
        id: 'klopp-liverpool',
        club: 'Liverpool',
        years: '2018-20',
        formation: '4-3-3',
        shape: [4, 3, 3],
        summary:
          'Heavy metal football perfected. Champions of Europe in 2019, then a first league title in 30 years.',
        points: [
          'The front three press as the first line of defence',
          'Alexander-Arnold and Robertson supply the creativity from full-back',
          'Van Dijk lets the line squeeze high so everything compresses forward',
        ],
        xi: [
          'Alisson',
          'Robertson',
          'Van Dijk',
          'Matip',
          'Alexander-Arnold',
          'Wijnaldum',
          'Fabinho',
          'Henderson',
          'Mané',
          'Firmino',
          'Salah',
        ],
        numbers: [1, 26, 4, 32, 66, 5, 3, 14, 10, 9, 11],
      },
    ],
  },
  {
    name: 'Zinédine Zidane',
    eras: [
      {
        id: 'zidane-undecima',
        club: 'Real Madrid',
        years: '2015-16',
        formation: '4-3-3',
        shape: [4, 3, 3],
        summary:
          'La Undécima. Appointed in January, Zidane restored the BBC and won the Champions League five months into his first job.',
        points: [
          'The BBC — Bale, Benzema, Cristiano — stay high and finish everything',
          'Promoting Casemiro was Zidane’s first big call, and it balanced the team',
          'Ramos scores against Atlético in a final. Again.',
        ],
        xi: [
          'Navas',
          'Marcelo',
          'Ramos',
          'Pepe',
          'Carvajal',
          'Kroos',
          'Casemiro',
          'Modrić',
          'Ronaldo',
          'Benzema',
          'Bale',
        ],
        numbers: [1, 12, 4, 3, 15, 8, 14, 19, 7, 9, 11],
      },
      {
        id: 'zidane-madrid',
        club: 'Real Madrid',
        years: '2016-18',
        formation: '4-3-1-2',
        shape: [4, 3, 1, 2],
        summary:
          'The three-peat core. Zidane’s diamond won the 2017 double, retained the Champions League, then made it three in a row in Kyiv.',
        points: [
          'Isco in the hole unlocked the best football of the era',
          'Kroos and Modrić control both tempo and territory',
          'A rested Ronaldo saves his goals for the knockout rounds',
        ],
        xi: [
          'Navas',
          'Marcelo',
          'Ramos',
          'Varane',
          'Carvajal',
          'Kroos',
          'Casemiro',
          'Modrić',
          'Isco',
          'Ronaldo',
          'Benzema',
        ],
        numbers: [1, 12, 4, 5, 2, 8, 14, 19, 22, 7, 9],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Signature-tactic animations, keyed by era id. Each era carries a list of
// attacking clips and a list of out-of-possession clips — pressing the play
// button cycles through the variants, so repeat viewings differ. Every
// defensive clip runs in two parts: first the shape working as intended, then
// an "if they do play through it" branch showing how the back line recovers.
// The goalkeeper only joins that recovery for managers who genuinely used one
// as a sweeper behind a high line.
//
// Coordinates are pitch percentages (x: 0 left → 100 right, y: 0 opponent
// goal → 100 own goal). Each step glides the listed pieces to their new spots
// over `duration` seconds; pieces not listed stay put. Opponents are the dark,
// numberless markers. Player ids are era slots: p1 GK, then back to front,
// left to right. Narration describes the idea, never a specific match — these
// are simplified sketches, not recreations.
// ---------------------------------------------------------------------------

type AnimStep = {
  duration: number;
  note: string;
  players?: Record<string, Position>;
  ball?: Position;
  opponents?: Position[];
};

type TacticAnimation = {
  intro: string;
  opponents: Position[];
  steps: AnimStep[];
};

type EraAnimations = {
  attack: TacticAnimation[];
  defense: TacticAnimation[];
};

const ERA_ANIMATIONS: Record<string, EraAnimations> = {
  'fergie-99': {
    attack: [
      {
        intro: 'Wing play: get it wide early and flood the box.',
        opponents: [{ x: 32, y: 16 }, { x: 46, y: 17 }, { x: 60, y: 17 }, { x: 74, y: 20 }, { x: 52, y: 42 }],
        steps: [
          { duration: 1.0, note: 'The ball is won in midfield and goes wide at once', ball: { x: 44, y: 50 }, players: { p7: { x: 44, y: 48 } } },
          { duration: 1.0, note: 'Out to the right winger — no backwards passes', ball: { x: 82, y: 40 }, players: { p9: { x: 84, y: 38 } } },
          { duration: 1.1, note: 'The full-back overlaps to make it two against one', players: { p5: { x: 90, y: 48 }, p9: { x: 86, y: 28 } }, ball: { x: 86, y: 30 } },
          { duration: 1.2, note: 'The strike pair splits: one near post, one far', players: { p10: { x: 42, y: 12 }, p11: { x: 58, y: 13 }, p6: { x: 24, y: 20 } }, opponents: [{ x: 35, y: 12 }, { x: 47, y: 13 }, { x: 60, y: 13 }, { x: 74, y: 16 }, { x: 52, y: 38 }] },
          { duration: 1.0, note: 'The cross comes early, whipped behind the line', ball: { x: 46, y: 8 } },
          { duration: 0.8, note: 'Attacked at the near post', ball: { x: 50, y: 3 }, players: { p10: { x: 47, y: 6 } } },
        ],
      },
      {
        intro: 'The other route: switch the play and run at them.',
        opponents: [{ x: 35, y: 20 }, { x: 48, y: 20 }, { x: 62, y: 20 }, { x: 30, y: 38 }, { x: 55, y: 40 }],
        steps: [
          { duration: 1.0, note: 'The deeper midfielder finds a pocket and looks long', ball: { x: 58, y: 50 }, players: { p8: { x: 58, y: 48 } } },
          { duration: 1.1, note: 'The switch to the opposite flank, flat and fast', ball: { x: 18, y: 35 }, players: { p6: { x: 16, y: 33 } } },
          { duration: 1.2, note: 'Taken on the run — the defenders backpedal', players: { p6: { x: 28, y: 20 } }, ball: { x: 29, y: 21 }, opponents: [{ x: 33, y: 16 }, { x: 46, y: 16 }, { x: 60, y: 18 }, { x: 34, y: 26 }, { x: 52, y: 34 }] },
          { duration: 1.2, note: 'One drop of the shoulder, then another', players: { p6: { x: 40, y: 12 } }, ball: { x: 41, y: 13 } },
          { duration: 0.9, note: 'A striker peels off for the square ball', players: { p11: { x: 55, y: 9 } }, ball: { x: 54, y: 8 } },
          { duration: 0.8, note: 'Rolled in at the far post', ball: { x: 51, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: two banks of four, and a midfield that hunts.',
        opponents: [{ x: 50, y: 30 }, { x: 35, y: 35 }, { x: 65, y: 35 }, { x: 45, y: 48 }, { x: 60, y: 50 }],
        steps: [
          { duration: 1.1, note: 'Two banks of four form in seconds', players: { p6: { x: 20, y: 58 }, p7: { x: 40, y: 56 }, p8: { x: 60, y: 56 }, p9: { x: 80, y: 58 }, p10: { x: 40, y: 35 }, p11: { x: 55, y: 35 } }, ball: { x: 50, y: 30 } },
          { duration: 1.0, note: 'The strikers screen the pass back inside', ball: { x: 35, y: 35 }, players: { p10: { x: 36, y: 30 } } },
          { duration: 1.0, note: 'Forced wide, where the winger has already dropped', players: { p6: { x: 26, y: 48 } }, ball: { x: 30, y: 42 } },
          { duration: 0.9, note: 'The tackle arrives — that is the shape working', players: { p7: { x: 32, y: 46 } }, ball: { x: 32, y: 45 } },
          { duration: 1.0, note: 'Won, and United break the other way at once', ball: { x: 48, y: 40 }, players: { p8: { x: 50, y: 42 } } },
          { duration: 1.2, note: 'But if a one-two beats that midfield line…', ball: { x: 45, y: 62 }, opponents: [{ x: 50, y: 40 }, { x: 38, y: 55 }, { x: 65, y: 45 }, { x: 46, y: 64 }, { x: 60, y: 60 }] },
          { duration: 1.0, note: '…the back four takes over: narrow, calm, no diving in', players: { p2: { x: 30, y: 76 }, p3: { x: 44, y: 74 }, p4: { x: 57, y: 74 }, p5: { x: 70, y: 76 } } },
          { duration: 1.0, note: 'One centre-back steps out; the others cover behind him', players: { p4: { x: 50, y: 68 } }, ball: { x: 49, y: 67 } },
          { duration: 0.9, note: 'The ball is taken cleanly, not the man', ball: { x: 48, y: 70 } },
          { duration: 1.0, note: 'Headed clear, and the shape rebuilds', ball: { x: 45, y: 52 } },
        ],
      },
    ],
  },
  'fergie-08': {
    attack: [
      {
        intro: 'The fluid front three: no positions, no reference points.',
        opponents: [{ x: 40, y: 20 }, { x: 55, y: 20 }, { x: 68, y: 22 }, { x: 50, y: 35 }, { x: 35, y: 40 }],
        steps: [
          { duration: 1.0, note: 'The ball is intercepted and played forward in one motion', ball: { x: 50, y: 45 }, players: { p7: { x: 48, y: 44 } } },
          { duration: 1.1, note: 'The right winger drifts inside — who picks him up?', players: { p11: { x: 60, y: 25 } }, ball: { x: 58, y: 28 } },
          { duration: 1.0, note: 'A forward pulls wide to drag the shape apart', players: { p9: { x: 18, y: 22 } }, opponents: [{ x: 40, y: 18 }, { x: 52, y: 22 }, { x: 64, y: 24 }, { x: 44, y: 32 }, { x: 30, y: 32 }] },
          { duration: 1.0, note: 'The third forward links the one-two in the crowd', players: { p10: { x: 48, y: 18 } }, ball: { x: 47, y: 19 } },
          { duration: 1.0, note: 'Returned first time — through the middle', ball: { x: 56, y: 10 }, players: { p11: { x: 55, y: 9 } } },
          { duration: 0.8, note: 'Struck low and early', ball: { x: 50, y: 3 } },
        ],
      },
      {
        intro: 'Or the counter: box to box before they can reset.',
        opponents: [{ x: 45, y: 60 }, { x: 60, y: 62 }, { x: 35, y: 55 }, { x: 52, y: 70 }, { x: 65, y: 72 }],
        steps: [
          { duration: 1.0, note: 'A corner is headed clear from the six-yard box', ball: { x: 45, y: 60 }, players: { p3: { x: 42, y: 72 } } },
          { duration: 1.0, note: 'The winger is already ten metres clear of everyone', players: { p11: { x: 65, y: 45 } }, ball: { x: 62, y: 48 } },
          { duration: 1.3, note: 'The sprint: halfway gone in a few strides', players: { p11: { x: 58, y: 22 }, p9: { x: 30, y: 28 }, p10: { x: 45, y: 30 } }, ball: { x: 59, y: 24 }, opponents: [{ x: 45, y: 40 }, { x: 58, y: 42 }, { x: 35, y: 38 }, { x: 52, y: 50 }, { x: 63, y: 52 }] },
          { duration: 1.0, note: 'A teammate keeps pace on the left as the option', players: { p9: { x: 25, y: 15 } } },
          { duration: 0.9, note: 'No pass needed — the keeper has come too far', ball: { x: 52, y: 6 } },
          { duration: 0.8, note: 'Dropped in under the bar', ball: { x: 50, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: curved pressing runs and a brave back line.',
        opponents: [{ x: 45, y: 25 }, { x: 60, y: 28 }, { x: 35, y: 40 }, { x: 55, y: 45 }, { x: 48, y: 60 }],
        steps: [
          { duration: 1.1, note: 'The front three curve their runs to force play wide', players: { p9: { x: 30, y: 28 }, p10: { x: 47, y: 22 }, p11: { x: 63, y: 28 } }, ball: { x: 45, y: 25 } },
          { duration: 1.0, note: 'The midfield jumps onto the outlet in the half-space', players: { p8: { x: 40, y: 38 } }, ball: { x: 35, y: 40 } },
          { duration: 0.9, note: 'Nowhere forward, nowhere sideways', ball: { x: 34, y: 42 } },
          { duration: 0.9, note: 'Turned over high — the press has done its job', ball: { x: 38, y: 40 }, players: { p8: { x: 38, y: 38 } } },
          { duration: 1.2, note: 'But if the spin beats that first presser…', ball: { x: 48, y: 58 }, opponents: [{ x: 45, y: 30 }, { x: 60, y: 35 }, { x: 40, y: 52 }, { x: 50, y: 60 }, { x: 55, y: 66 }] },
          { duration: 1.1, note: '…one centre-back attacks the ball, the other covers behind', players: { p3: { x: 44, y: 66 }, p4: { x: 56, y: 72 } } },
          { duration: 0.9, note: 'The pass is bent around the challenge', ball: { x: 55, y: 70 } },
          { duration: 1.0, note: 'The covering defender was there all along', players: { p4: { x: 55, y: 72 } }, ball: { x: 55, y: 71 } },
          { duration: 1.0, note: 'Cleared long, and United break from their own box', ball: { x: 58, y: 46 } },
        ],
      },
    ],
  },
  'fergie-13': {
    attack: [
      {
        intro: 'Patient control, then one decisive ball over the top.',
        opponents: [{ x: 38, y: 25 }, { x: 52, y: 25 }, { x: 66, y: 27 }, { x: 45, y: 42 }, { x: 60, y: 45 }],
        steps: [
          { duration: 1.0, note: 'The deep midfielder collects from the back four, unhurried', ball: { x: 45, y: 60 }, players: { p6: { x: 42, y: 58 } } },
          { duration: 1.1, note: 'The second striker drops between the lines', players: { p9: { x: 40, y: 38 } }, ball: { x: 41, y: 40 } },
          { duration: 1.0, note: 'The run starts the moment he lifts his head', players: { p11: { x: 62, y: 18 } }, opponents: [{ x: 38, y: 22 }, { x: 52, y: 22 }, { x: 64, y: 22 }, { x: 45, y: 38 }, { x: 58, y: 40 }] },
          { duration: 1.1, note: 'The pass travels forty yards, over everything', ball: { x: 60, y: 12 } },
          { duration: 0.9, note: 'Met on the volley — first time', ball: { x: 52, y: 4 }, players: { p11: { x: 56, y: 8 } } },
        ],
      },
      {
        intro: 'Or the old reliable: the winger to the byline.',
        opponents: [{ x: 36, y: 16 }, { x: 50, y: 16 }, { x: 63, y: 17 }, { x: 74, y: 25 }, { x: 48, y: 38 }],
        steps: [
          { duration: 1.0, note: 'Slipped into the right winger’s path', ball: { x: 70, y: 40 }, players: { p8: { x: 45, y: 40 }, p10: { x: 74, y: 36 } } },
          { duration: 1.2, note: 'He powers outside his man', players: { p10: { x: 84, y: 20 } }, ball: { x: 84, y: 22 }, opponents: [{ x: 36, y: 14 }, { x: 50, y: 14 }, { x: 63, y: 15 }, { x: 78, y: 22 }, { x: 48, y: 32 }] },
          { duration: 1.0, note: 'One forward holds the edge of the box for the pull-back', players: { p9: { x: 52, y: 20 } } },
          { duration: 1.0, note: 'The other darts across the near post', players: { p11: { x: 45, y: 8 } } },
          { duration: 0.9, note: 'Driven low across the six-yard line', ball: { x: 48, y: 6 } },
          { duration: 0.8, note: 'Turned in at full stretch', ball: { x: 50, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: a narrow screen, then experience behind it.',
        opponents: [{ x: 50, y: 28 }, { x: 36, y: 35 }, { x: 64, y: 35 }, { x: 45, y: 50 }, { x: 58, y: 52 }],
        steps: [
          { duration: 1.1, note: 'Two holding midfielders screen the back four', players: { p6: { x: 42, y: 60 }, p7: { x: 58, y: 60 } }, ball: { x: 50, y: 28 } },
          { duration: 1.0, note: 'The wide players tuck in; the shape narrows', players: { p8: { x: 30, y: 42 }, p10: { x: 70, y: 42 } }, ball: { x: 36, y: 35 } },
          { duration: 1.0, note: 'The only pass left is the one they want to see', ball: { x: 44, y: 48 } },
          { duration: 0.9, note: 'Read early and stepped in front of', players: { p6: { x: 45, y: 52 } }, ball: { x: 45, y: 51 } },
          { duration: 1.0, note: 'Won, and released forward immediately', ball: { x: 60, y: 30 }, players: { p11: { x: 62, y: 25 } } },
          { duration: 1.2, note: 'But if a disguised pass splits both screens…', ball: { x: 50, y: 62 }, opponents: [{ x: 50, y: 34 }, { x: 40, y: 48 }, { x: 64, y: 40 }, { x: 50, y: 64 }, { x: 58, y: 58 }] },
          { duration: 1.1, note: '…the senior centre-back steps up on pure timing', players: { p4: { x: 52, y: 68 } } },
          { duration: 0.9, note: 'Intercepted before the shot can be set', ball: { x: 51, y: 67 } },
          { duration: 1.0, note: 'His partner clears the loose ball with interest', players: { p3: { x: 44, y: 70 } }, ball: { x: 40, y: 52 } },
        ],
      },
    ],
  },
  'pep-barca': {
    attack: [
      {
        intro: 'Positional play: pass them out of shape, then strike.',
        opponents: [{ x: 43, y: 74 }, { x: 57, y: 74 }, { x: 50, y: 56 }, { x: 34, y: 48 }, { x: 66, y: 48 }],
        steps: [
          { duration: 1.0, note: 'It starts with the keeper — build from the very back', ball: { x: 47, y: 84 }, players: { p3: { x: 38, y: 76 } } },
          { duration: 1.0, note: 'Into the pivot, splitting the first press', ball: { x: 50, y: 56 }, players: { p7: { x: 50, y: 54 } }, opponents: [{ x: 44, y: 70 }, { x: 55, y: 68 }, { x: 48, y: 60 }, { x: 34, y: 48 }, { x: 66, y: 48 }] },
          { duration: 1.1, note: 'The false nine drops off the front line — who follows?', players: { p10: { x: 52, y: 34 } }, ball: { x: 52, y: 36 }, opponents: [{ x: 44, y: 70 }, { x: 55, y: 68 }, { x: 48, y: 44 }, { x: 38, y: 42 }, { x: 62, y: 44 }] },
          { duration: 1.0, note: 'A midfielder runs beyond, into the space he opened', players: { p8: { x: 64, y: 28 } }, ball: { x: 64, y: 30 } },
          { duration: 1.1, note: 'The through ball, timed to the last defender', ball: { x: 30, y: 10 }, players: { p9: { x: 31, y: 11 } } },
          { duration: 0.9, note: 'Cut back, and tapped in', ball: { x: 49, y: 4 }, players: { p11: { x: 55, y: 9 } } },
        ],
      },
      {
        intro: 'Or the short game: one-touch triangles until the box opens.',
        opponents: [{ x: 40, y: 22 }, { x: 53, y: 22 }, { x: 66, y: 24 }, { x: 46, y: 34 }, { x: 58, y: 36 }],
        steps: [
          { duration: 1.0, note: 'The midfield pair start the one-touch spell', ball: { x: 35, y: 35 }, players: { p6: { x: 33, y: 33 }, p8: { x: 48, y: 32 } } },
          { duration: 0.9, note: 'Triangle one: around the corner and back', ball: { x: 48, y: 30 } },
          { duration: 0.9, note: 'Triangle two: the forward joins and wall-passes', players: { p10: { x: 55, y: 26 } }, ball: { x: 55, y: 28 } },
          { duration: 1.0, note: 'The defenders chase shadows — a gap appears', ball: { x: 44, y: 22 }, players: { p6: { x: 43, y: 20 } }, opponents: [{ x: 38, y: 18 }, { x: 52, y: 24 }, { x: 64, y: 22 }, { x: 48, y: 30 }, { x: 58, y: 32 }] },
          { duration: 1.0, note: 'A disguised ball puts the forward through', ball: { x: 55, y: 12 }, players: { p10: { x: 56, y: 11 } } },
          { duration: 0.9, note: 'Dinked over the keeper, gently', ball: { x: 50, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: six seconds to win it back.',
        opponents: [{ x: 40, y: 35 }, { x: 52, y: 40 }, { x: 65, y: 45 }, { x: 50, y: 55 }, { x: 35, y: 60 }],
        steps: [
          { duration: 1.0, note: 'The ball is lost — the six-second clock starts', players: { p10: { x: 44, y: 32 }, p8: { x: 48, y: 38 }, p6: { x: 35, y: 42 } }, ball: { x: 40, y: 35 } },
          { duration: 1.0, note: 'Passing lanes are cut first, the ball second', players: { p9: { x: 30, y: 28 }, p7: { x: 50, y: 46 } } },
          { duration: 0.9, note: 'The carrier looks up and finds nowhere to go', ball: { x: 41, y: 37 } },
          { duration: 0.9, note: 'Won back inside six seconds — and the rondo restarts', ball: { x: 45, y: 38 }, players: { p8: { x: 46, y: 38 } } },
          { duration: 1.2, note: 'But if one long ball escapes the swarm…', ball: { x: 60, y: 62 }, opponents: [{ x: 40, y: 30 }, { x: 52, y: 36 }, { x: 62, y: 60 }, { x: 50, y: 50 }, { x: 38, y: 52 }] },
          { duration: 1.0, note: '…the high line has left acres behind it', players: { p2: { x: 30, y: 68 } } },
          { duration: 1.1, note: 'So the keeper leaves his box as the spare defender', players: { p1: { x: 55, y: 74 } } },
          { duration: 0.9, note: 'Swept away thirty metres from his own line', ball: { x: 68, y: 60 }, players: { p1: { x: 58, y: 72 } } },
          { duration: 1.0, note: 'The centre-back tidies up; possession restored', players: { p3: { x: 62, y: 62 } }, ball: { x: 60, y: 58 } },
        ],
      },
    ],
  },
  'pep-bayern': {
    attack: [
      {
        intro: 'The laboratory: full-backs in midfield, wingers isolated.',
        opponents: [{ x: 40, y: 30 }, { x: 55, y: 30 }, { x: 30, y: 45 }, { x: 50, y: 48 }, { x: 65, y: 50 }],
        steps: [
          { duration: 1.1, note: 'Both full-backs invert into midfield beside the pivot', players: { p2: { x: 35, y: 58 }, p5: { x: 65, y: 58 } }, ball: { x: 46, y: 72 } },
          { duration: 1.0, note: 'Circulated calmly — the middle now outnumbers the press', ball: { x: 50, y: 60 }, players: { p6: { x: 50, y: 58 } } },
          { duration: 1.0, note: 'The forward finds space no one is watching', players: { p9: { x: 58, y: 30 } }, ball: { x: 57, y: 32 } },
          { duration: 1.0, note: 'Out to the winger: high, wide, one against one', ball: { x: 80, y: 25 }, players: { p10: { x: 82, y: 24 } } },
          { duration: 1.1, note: 'The move everyone knows and nobody stops: cut inside', players: { p10: { x: 68, y: 12 } }, ball: { x: 69, y: 13 }, opponents: [{ x: 40, y: 24 }, { x: 55, y: 22 }, { x: 34, y: 34 }, { x: 52, y: 36 }, { x: 72, y: 20 }] },
          { duration: 0.9, note: 'Curled into the far corner', ball: { x: 42, y: 4 } },
        ],
      },
      {
        intro: 'Or overload one flank, then switch to the free man.',
        opponents: [{ x: 36, y: 20 }, { x: 50, y: 20 }, { x: 63, y: 22 }, { x: 30, y: 32 }, { x: 46, y: 36 }],
        steps: [
          { duration: 1.0, note: 'Winger and full-back double up on the left', players: { p7: { x: 20, y: 28 }, p2: { x: 26, y: 38 } }, ball: { x: 24, y: 34 } },
          { duration: 1.0, note: 'Three defenders are dragged into one corner', opponents: [{ x: 28, y: 24 }, { x: 38, y: 28 }, { x: 63, y: 22 }, { x: 26, y: 34 }, { x: 46, y: 36 }], ball: { x: 18, y: 26 } },
          { duration: 1.0, note: 'Recycled inside, away from the crowd', ball: { x: 48, y: 34 }, players: { p8: { x: 48, y: 32 } } },
          { duration: 1.1, note: 'The forward drifts to the far post, unmarked', players: { p9: { x: 66, y: 12 } } },
          { duration: 1.0, note: 'The dinked cross finds him arriving', ball: { x: 64, y: 10 } },
          { duration: 0.8, note: 'Finished from close range', ball: { x: 51, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: a line at halfway, and a keeper who sweeps.',
        opponents: [{ x: 50, y: 25 }, { x: 35, y: 30 }, { x: 65, y: 32 }, { x: 48, y: 45 }, { x: 60, y: 55 }],
        steps: [
          { duration: 1.1, note: 'The line pushes to halfway — enormous space behind it', players: { p2: { x: 25, y: 55 }, p3: { x: 40, y: 52 }, p4: { x: 60, y: 52 }, p5: { x: 75, y: 55 } }, ball: { x: 48, y: 45 } },
          { duration: 1.0, note: 'The counter-press arrives before the counter can', players: { p8: { x: 45, y: 40 }, p6: { x: 50, y: 48 } } },
          { duration: 0.9, note: 'Surrounded, and the ball squirts loose', ball: { x: 47, y: 43 } },
          { duration: 0.9, note: 'Recovered instantly — the risk paid off', ball: { x: 50, y: 46 }, players: { p6: { x: 50, y: 45 } } },
          { duration: 1.2, note: 'But if one ball is lofted over everything…', ball: { x: 55, y: 70 }, opponents: [{ x: 50, y: 30 }, { x: 35, y: 32 }, { x: 58, y: 66 }, { x: 48, y: 50 }, { x: 60, y: 58 }] },
          { duration: 1.1, note: '…the race is on, and the keeper is the one favourite to win it', players: { p1: { x: 52, y: 76 } } },
          { duration: 0.9, note: 'Won outside his own penalty area', players: { p1: { x: 54, y: 72 } }, ball: { x: 54, y: 71 } },
          { duration: 1.0, note: 'Headed to a centre-back like a sweeper of old', ball: { x: 42, y: 62 }, players: { p3: { x: 42, y: 60 } } },
          { duration: 0.9, note: 'The line steps forward again, unbothered', ball: { x: 48, y: 55 } },
        ],
      },
    ],
  },
  'pep-city': {
    attack: [
      {
        intro: 'Control, half-space eights, and the cutback.',
        opponents: [{ x: 36, y: 18 }, { x: 50, y: 18 }, { x: 64, y: 18 }, { x: 45, y: 32 }, { x: 58, y: 35 }],
        steps: [
          { duration: 1.0, note: 'Build calmly — the keeper is an outfielder here', ball: { x: 48, y: 86 } },
          { duration: 1.1, note: 'Both eights occupy the half-spaces', players: { p6: { x: 35, y: 30 }, p8: { x: 65, y: 30 } }, ball: { x: 42, y: 48 } },
          { duration: 1.0, note: 'One receives between the lines, facing forward', ball: { x: 64, y: 32 }, players: { p8: { x: 66, y: 28 } } },
          { duration: 1.0, note: 'The winger sprints for the byline', players: { p11: { x: 85, y: 10 } }, ball: { x: 80, y: 14 } },
          { duration: 1.0, note: 'The cutback — never the hopeful cross', ball: { x: 62, y: 6 }, players: { p10: { x: 58, y: 8 } }, opponents: [{ x: 38, y: 12 }, { x: 50, y: 10 }, { x: 62, y: 12 }, { x: 48, y: 22 }, { x: 60, y: 24 }] },
          { duration: 0.8, note: 'Side-footed home. A training-ground goal.', ball: { x: 50, y: 3 } },
        ],
      },
      {
        intro: 'Or the specialist ball: the whipped low diagonal.',
        opponents: [{ x: 36, y: 16 }, { x: 49, y: 16 }, { x: 62, y: 17 }, { x: 44, y: 30 }, { x: 58, y: 32 }],
        steps: [
          { duration: 1.0, note: 'The keeper clips it sixty metres to feet', ball: { x: 40, y: 45 }, players: { p6: { x: 38, y: 42 } } },
          { duration: 1.0, note: 'Slipped round the corner, first time', ball: { x: 58, y: 35 }, players: { p8: { x: 60, y: 32 } } },
          { duration: 1.0, note: 'The creator shapes up on the half-turn', players: { p8: { x: 66, y: 26 } }, ball: { x: 66, y: 27 } },
          { duration: 1.0, note: 'The forwards attack different posts', players: { p10: { x: 44, y: 10 }, p9: { x: 30, y: 12 } }, opponents: [{ x: 40, y: 11 }, { x: 50, y: 12 }, { x: 62, y: 14 }, { x: 46, y: 22 }, { x: 58, y: 26 }] },
          { duration: 0.9, note: 'The low whip across the six-yard box', ball: { x: 43, y: 7 } },
          { duration: 0.8, note: 'First to it at the near post', ball: { x: 50, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: rest defence, the swarm, then recovery pace.',
        opponents: [{ x: 45, y: 30 }, { x: 58, y: 35 }, { x: 35, y: 45 }, { x: 52, y: 52 }, { x: 65, y: 58 }],
        steps: [
          { duration: 1.1, note: 'Rest defence: three stay home while the attack plays', players: { p3: { x: 42, y: 66 }, p4: { x: 58, y: 66 }, p7: { x: 50, y: 56 } }, ball: { x: 45, y: 30 } },
          { duration: 1.0, note: 'Ball lost — the nearest five swarm at once', players: { p6: { x: 42, y: 32 }, p8: { x: 56, y: 33 }, p10: { x: 48, y: 25 } } },
          { duration: 0.9, note: 'The escape pass is read before it is played', players: { p7: { x: 48, y: 38 } }, ball: { x: 47, y: 36 } },
          { duration: 0.9, note: 'Stopped at source — City keep it again', ball: { x: 45, y: 42 } },
          { duration: 1.2, note: 'But if a runner does break clear of the swarm…', ball: { x: 30, y: 60 }, opponents: [{ x: 45, y: 34 }, { x: 58, y: 38 }, { x: 28, y: 58 }, { x: 52, y: 55 }, { x: 62, y: 60 }] },
          { duration: 1.1, note: '…the full-back eats the ground behind him', players: { p5: { x: 35, y: 62 } } },
          { duration: 1.0, note: 'Shepherded wide, away from goal', ball: { x: 20, y: 72 }, opponents: [{ x: 45, y: 36 }, { x: 58, y: 40 }, { x: 21, y: 70 }, { x: 52, y: 58 }, { x: 62, y: 62 }] },
          { duration: 0.9, note: 'And the keeper claims the cross like a centre-back', players: { p1: { x: 45, y: 82 } }, ball: { x: 45, y: 80 } },
          { duration: 1.0, note: 'The next attack starts from his throw', ball: { x: 55, y: 65 } },
        ],
      },
    ],
  },
  'mou-porto': {
    attack: [
      {
        intro: 'The diamond: compact, direct, and a free man between the lines.',
        opponents: [{ x: 45, y: 50 }, { x: 60, y: 52 }, { x: 35, y: 58 }, { x: 52, y: 62 }, { x: 68, y: 64 }],
        steps: [
          { duration: 1.0, note: 'The anchor screens and wins the second ball', ball: { x: 48, y: 58 }, players: { p6: { x: 48, y: 56 } } },
          { duration: 1.0, note: 'Straight to the number ten — the one free role', ball: { x: 50, y: 40 }, players: { p9: { x: 51, y: 38 } } },
          { duration: 1.1, note: 'The strike pair stretches the last line apart', players: { p10: { x: 28, y: 20 }, p11: { x: 72, y: 20 } }, opponents: [{ x: 42, y: 40 }, { x: 58, y: 42 }, { x: 33, y: 30 }, { x: 52, y: 32 }, { x: 68, y: 30 }] },
          { duration: 1.0, note: 'The diagonal slides between two defenders', ball: { x: 68, y: 22 } },
          { duration: 1.0, note: 'Cut inside and squared across the six-yard box', ball: { x: 55, y: 8 }, players: { p11: { x: 58, y: 10 } } },
          { duration: 0.8, note: 'The other striker arrives to finish', ball: { x: 50, y: 3 }, players: { p10: { x: 47, y: 6 } } },
        ],
      },
      {
        intro: 'Or the set piece — rehearsed until it is automatic.',
        opponents: [{ x: 40, y: 10 }, { x: 50, y: 10 }, { x: 60, y: 10 }, { x: 46, y: 16 }, { x: 56, y: 16 }],
        steps: [
          { duration: 1.0, note: 'A corner is won, and everyone knows their spot', players: { p9: { x: 96, y: 4 } }, ball: { x: 96, y: 4 } },
          { duration: 1.1, note: 'Both centre-backs arrive late from deep', players: { p3: { x: 55, y: 14 }, p4: { x: 45, y: 14 } } },
          { duration: 1.0, note: 'The near-post block frees the back-post runner', players: { p10: { x: 42, y: 9 }, p3: { x: 60, y: 9 } }, opponents: [{ x: 40, y: 8 }, { x: 50, y: 9 }, { x: 58, y: 12 }, { x: 44, y: 14 }, { x: 56, y: 15 }] },
          { duration: 1.0, note: 'Whipped in, curling away from the keeper', ball: { x: 58, y: 8 } },
          { duration: 0.9, note: 'Met at the back stick', ball: { x: 52, y: 4 }, players: { p3: { x: 58, y: 7 } } },
          { duration: 0.8, note: 'Headed down and in', ball: { x: 50, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: the diamond closes, then the box holds.',
        opponents: [{ x: 50, y: 35 }, { x: 35, y: 40 }, { x: 65, y: 42 }, { x: 45, y: 55 }, { x: 58, y: 58 }],
        steps: [
          { duration: 1.1, note: 'The diamond narrows; the middle is simply closed', players: { p7: { x: 38, y: 55 }, p8: { x: 62, y: 55 }, p9: { x: 50, y: 45 }, p6: { x: 50, y: 62 } }, ball: { x: 50, y: 35 } },
          { duration: 1.0, note: 'Forced around the block, never through it', ball: { x: 35, y: 40 } },
          { duration: 1.0, note: 'The shuttler doubles up on the touchline', players: { p7: { x: 28, y: 45 } }, ball: { x: 30, y: 46 } },
          { duration: 0.9, note: 'Won in the corner — exactly where they wanted it', ball: { x: 32, y: 48 }, players: { p6: { x: 34, y: 52 } } },
          { duration: 1.2, note: 'But if a quick exchange breaks that first wall…', ball: { x: 40, y: 62 }, opponents: [{ x: 50, y: 40 }, { x: 38, y: 58 }, { x: 65, y: 45 }, { x: 42, y: 66 }, { x: 58, y: 60 }] },
          { duration: 1.1, note: '…the centre-backs attack everything that comes in', players: { p4: { x: 45, y: 72 }, p3: { x: 56, y: 72 } } },
          { duration: 0.9, note: 'The cross is met first and headed clear', ball: { x: 50, y: 62 }, players: { p4: { x: 47, y: 70 } } },
          { duration: 0.9, note: 'The follow-up shot is bravely blocked', ball: { x: 48, y: 66 }, players: { p6: { x: 47, y: 65 } } },
          { duration: 1.0, note: 'Another attack survived. On to the counter.', ball: { x: 55, y: 55 } },
        ],
      },
    ],
  },
  'mou-chelsea': {
    attack: [
      {
        intro: 'Direct and ruthless: a target man, then pace in behind.',
        opponents: [{ x: 50, y: 55 }, { x: 35, y: 58 }, { x: 65, y: 58 }, { x: 45, y: 68 }, { x: 60, y: 68 }],
        steps: [
          { duration: 1.1, note: 'The holding midfielder plugs the middle and wins it', players: { p7: { x: 50, y: 60 } }, ball: { x: 50, y: 56 } },
          { duration: 1.0, note: 'Long and hard into the striker’s chest — the outlet', ball: { x: 50, y: 30 }, players: { p10: { x: 50, y: 28 } } },
          { duration: 1.1, note: 'He holds off two defenders on his own', opponents: [{ x: 45, y: 32 }, { x: 55, y: 33 }, { x: 65, y: 50 }, { x: 45, y: 62 }, { x: 60, y: 62 }] },
          { duration: 1.0, note: 'Laid off to the winger at full sprint', ball: { x: 70, y: 28 }, players: { p11: { x: 72, y: 26 } } },
          { duration: 1.1, note: 'Sixty metres covered in a handful of seconds', players: { p11: { x: 60, y: 10 } }, ball: { x: 61, y: 11 } },
          { duration: 0.8, note: 'Slotted low into the corner', ball: { x: 51, y: 4 } },
        ],
      },
      {
        intro: 'Or width and patience, with a midfielder arriving late.',
        opponents: [{ x: 38, y: 16 }, { x: 51, y: 16 }, { x: 64, y: 18 }, { x: 44, y: 30 }, { x: 58, y: 32 }],
        steps: [
          { duration: 1.0, note: 'Rotated side to side, probing for the opening', ball: { x: 60, y: 40 }, players: { p8: { x: 62, y: 38 } } },
          { duration: 1.1, note: 'Switched to the left winger, isolated one-v-one', ball: { x: 22, y: 28 }, players: { p9: { x: 20, y: 26 } } },
          { duration: 1.0, note: 'He skips past the first challenge', players: { p9: { x: 26, y: 14 } }, ball: { x: 27, y: 15 }, opponents: [{ x: 32, y: 14 }, { x: 48, y: 14 }, { x: 62, y: 16 }, { x: 42, y: 26 }, { x: 56, y: 30 }] },
          { duration: 1.0, note: 'The striker drags both centre-backs to the near post', players: { p10: { x: 42, y: 10 } } },
          { duration: 1.0, note: 'The pull-back finds the midfielder, late as ever', players: { p6: { x: 47, y: 18 } }, ball: { x: 46, y: 17 } },
          { duration: 0.8, note: 'Swept in from the edge of the box', ball: { x: 50, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: the meanest block in the league.',
        opponents: [{ x: 50, y: 40 }, { x: 35, y: 45 }, { x: 65, y: 45 }, { x: 45, y: 58 }, { x: 58, y: 60 }],
        steps: [
          { duration: 1.1, note: 'The block sets: compact, disciplined, patient', players: { p6: { x: 35, y: 55 }, p7: { x: 50, y: 52 }, p8: { x: 65, y: 55 }, p9: { x: 28, y: 48 }, p11: { x: 72, y: 48 } }, ball: { x: 50, y: 40 } },
          { duration: 1.0, note: 'The holder patrols the zone in front of the centre-backs', players: { p7: { x: 50, y: 58 } }, ball: { x: 65, y: 45 } },
          { duration: 0.9, note: 'The pass inside is cut out without a tackle', players: { p7: { x: 56, y: 52 } }, ball: { x: 56, y: 50 } },
          { duration: 0.9, note: 'Won, and worked calmly out to the left', ball: { x: 35, y: 55 } },
          { duration: 1.2, note: 'But if they do work it past the midfield…', ball: { x: 60, y: 64 }, opponents: [{ x: 50, y: 44 }, { x: 35, y: 48 }, { x: 62, y: 62 }, { x: 48, y: 62 }, { x: 58, y: 66 }] },
          { duration: 1.1, note: '…the full-back closes the angle, the centre-back covers inside', players: { p5: { x: 66, y: 70 }, p4: { x: 52, y: 70 } } },
          { duration: 0.9, note: 'The shot is fired from a narrowing angle', ball: { x: 58, y: 74 } },
          { duration: 0.9, note: 'The captain throws himself in front of it', players: { p3: { x: 55, y: 73 } }, ball: { x: 55, y: 72 } },
          { duration: 1.0, note: 'Blocked and cleared. Reset. Again.', ball: { x: 45, y: 55 } },
        ],
      },
    ],
  },
  'mou-inter': {
    attack: [
      {
        intro: 'Absorb, then release: two runners and one killer pass.',
        opponents: [{ x: 50, y: 58 }, { x: 34, y: 62 }, { x: 66, y: 62 }, { x: 42, y: 72 }, { x: 58, y: 72 }, { x: 28, y: 55 }],
        steps: [
          { duration: 1.2, note: 'The block sets: two tight lines, no space between', players: { p8: { x: 30, y: 58 }, p9: { x: 50, y: 55 }, p10: { x: 70, y: 58 }, p11: { x: 50, y: 42 }, p6: { x: 38, y: 68 }, p7: { x: 62, y: 68 } }, ball: { x: 50, y: 58 } },
          { duration: 1.0, note: 'Shown sideways — nothing through the middle', ball: { x: 34, y: 62 }, players: { p9: { x: 44, y: 57 }, p6: { x: 33, y: 70 } } },
          { duration: 0.9, note: 'Intercepted — the trap snaps shut', ball: { x: 36, y: 66 } },
          { duration: 0.9, note: 'First pass to the ten, the only free role', ball: { x: 50, y: 46 }, players: { p9: { x: 52, y: 44 } } },
          { duration: 1.2, note: 'Both strikers are already sprinting', players: { p10: { x: 74, y: 22 }, p11: { x: 50, y: 18 } }, ball: { x: 68, y: 28 }, opponents: [{ x: 50, y: 42 }, { x: 34, y: 46 }, { x: 66, y: 45 }, { x: 42, y: 32 }, { x: 58, y: 34 }, { x: 28, y: 40 }] },
          { duration: 1.0, note: 'Finished cold', ball: { x: 51, y: 4 }, players: { p11: { x: 49, y: 8 } } },
        ],
      },
      {
        intro: 'Or down the right: the wing-back arrives like a train.',
        opponents: [{ x: 38, y: 18 }, { x: 51, y: 18 }, { x: 64, y: 20 }, { x: 44, y: 32 }, { x: 30, y: 35 }],
        steps: [
          { duration: 1.0, note: 'The ten draws three shirts towards the ball', ball: { x: 45, y: 35 }, players: { p9: { x: 44, y: 33 } }, opponents: [{ x: 40, y: 28 }, { x: 48, y: 30 }, { x: 64, y: 20 }, { x: 44, y: 36 }, { x: 30, y: 35 }] },
          { duration: 1.0, note: 'A striker pulls wide right, selfless as ever', players: { p10: { x: 82, y: 28 } }, ball: { x: 80, y: 30 } },
          { duration: 1.2, note: 'And the full-back overlaps at full steam', players: { p5: { x: 88, y: 18 } } },
          { duration: 1.0, note: 'Fed into the gallop — no one is catching him', ball: { x: 87, y: 16 } },
          { duration: 1.0, note: 'One holds the near post, one the far', players: { p11: { x: 44, y: 8 }, p8: { x: 60, y: 12 } } },
          { duration: 0.9, note: 'Drilled across and turned in', ball: { x: 47, y: 4 }, players: { p11: { x: 46, y: 6 } } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: everyone behind the ball, every zone filled.',
        opponents: [{ x: 50, y: 45 }, { x: 35, y: 50 }, { x: 65, y: 50 }, { x: 42, y: 62 }, { x: 58, y: 62 }, { x: 50, y: 70 }],
        steps: [
          { duration: 1.2, note: 'Ten men behind the ball — every zone accounted for', players: { p8: { x: 30, y: 62 }, p9: { x: 50, y: 60 }, p10: { x: 70, y: 62 }, p11: { x: 50, y: 50 }, p6: { x: 40, y: 70 }, p7: { x: 60, y: 70 } }, ball: { x: 50, y: 45 } },
          { duration: 1.0, note: 'They pass across the front of it, looking for a seam', ball: { x: 35, y: 50 } },
          { duration: 0.9, note: 'There isn’t one — the pass is intercepted', players: { p8: { x: 36, y: 56 } }, ball: { x: 36, y: 54 } },
          { duration: 0.9, note: 'Cleared to safety, and the block reforms', ball: { x: 45, y: 40 } },
          { duration: 1.2, note: 'But if a through ball does reach the box…', ball: { x: 45, y: 68 }, opponents: [{ x: 50, y: 50 }, { x: 38, y: 60 }, { x: 65, y: 55 }, { x: 44, y: 70 }, { x: 58, y: 66 }, { x: 50, y: 74 }] },
          { duration: 1.1, note: '…the centre-back reads it and commits to the tackle', players: { p4: { x: 48, y: 74 } } },
          { duration: 0.9, note: 'Timed to the centimetre — ball first, always', ball: { x: 49, y: 73 } },
          { duration: 0.9, note: 'It breaks loose and the second defender hacks it away', players: { p3: { x: 44, y: 76 } }, ball: { x: 38, y: 66 } },
          { duration: 1.0, note: 'The lead survives another wave', ball: { x: 40, y: 58 } },
        ],
      },
    ],
  },
  'carlo-milan': {
    attack: [
      {
        intro: 'Freedom for the artists: the deep playmaker paints.',
        opponents: [{ x: 40, y: 48 }, { x: 60, y: 48 }, { x: 50, y: 36 }, { x: 35, y: 22 }, { x: 65, y: 22 }],
        steps: [
          { duration: 1.0, note: 'The playmaker drops in front of the defence', players: { p7: { x: 50, y: 66 } }, ball: { x: 44, y: 72 } },
          { duration: 1.1, note: 'One look up, then the sixty-metre diagonal', ball: { x: 74, y: 30 }, players: { p10: { x: 74, y: 28 } } },
          { duration: 1.0, note: 'Taken on the half-turn between the lines', players: { p9: { x: 44, y: 24 } }, ball: { x: 70, y: 24 } },
          { duration: 1.0, note: 'Slipped inside to the runner', ball: { x: 46, y: 20 } },
          { duration: 1.1, note: 'He drives at the backpedalling line', players: { p9: { x: 52, y: 10 } }, ball: { x: 52, y: 11 }, opponents: [{ x: 40, y: 36 }, { x: 60, y: 36 }, { x: 50, y: 26 }, { x: 38, y: 14 }, { x: 62, y: 14 }] },
          { duration: 0.9, note: 'The striker was moving before anyone else', players: { p11: { x: 44, y: 6 } }, ball: { x: 45, y: 5 } },
        ],
      },
      {
        intro: 'Or one man in full flight — the counter nobody stops.',
        opponents: [{ x: 45, y: 55 }, { x: 58, y: 58 }, { x: 40, y: 40 }, { x: 55, y: 35 }, { x: 48, y: 22 }],
        steps: [
          { duration: 1.0, note: 'The ball is ripped away in their own half', ball: { x: 40, y: 62 }, players: { p6: { x: 40, y: 60 } } },
          { duration: 1.0, note: 'Given to the attacking midfielder, forty metres out', ball: { x: 48, y: 48 }, players: { p9: { x: 49, y: 46 } } },
          { duration: 1.2, note: 'The first touch beats the first man', players: { p9: { x: 52, y: 34 } }, ball: { x: 53, y: 35 }, opponents: [{ x: 45, y: 42 }, { x: 58, y: 48 }, { x: 46, y: 36 }, { x: 55, y: 30 }, { x: 48, y: 20 }] },
          { duration: 1.2, note: 'Pure speed does the rest — two more left behind', players: { p9: { x: 50, y: 18 } }, ball: { x: 51, y: 19 } },
          { duration: 1.0, note: 'The keeper commits; he waits', ball: { x: 50, y: 10 } },
          { duration: 0.8, note: 'Rolled past him into the empty net', ball: { x: 52, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: one hunts, and the great defenders clean up.',
        opponents: [{ x: 48, y: 30 }, { x: 35, y: 38 }, { x: 62, y: 38 }, { x: 50, y: 50 }, { x: 40, y: 58 }],
        steps: [
          { duration: 1.0, note: 'The ball-winner hunts it down in midfield', players: { p6: { x: 35, y: 42 } }, ball: { x: 48, y: 30 } },
          { duration: 1.0, note: 'The playmaker screens behind him — reading, never chasing', players: { p7: { x: 50, y: 58 } }, ball: { x: 35, y: 38 } },
          { duration: 0.9, note: 'Crowded out, and the ball comes loose', ball: { x: 37, y: 44 } },
          { duration: 0.9, note: 'Collected, and the artists have it back', ball: { x: 45, y: 52 }, players: { p7: { x: 46, y: 54 } } },
          { duration: 1.2, note: 'But if a flick releases their runner past midfield…', ball: { x: 45, y: 60 }, opponents: [{ x: 48, y: 34 }, { x: 38, y: 44 }, { x: 62, y: 42 }, { x: 46, y: 62 }, { x: 42, y: 60 }] },
          { duration: 1.1, note: '…the centre-back glides across — never a lunge', players: { p4: { x: 48, y: 68 } } },
          { duration: 0.9, note: 'The tackle, timed to perfection', ball: { x: 47, y: 67 }, players: { p4: { x: 46, y: 66 } } },
          { duration: 1.0, note: 'His partner sweeps the loose ball away', players: { p3: { x: 42, y: 70 } }, ball: { x: 38, y: 62 } },
          { duration: 1.0, note: 'Out from the back, calm as ever', ball: { x: 48, y: 60 }, players: { p7: { x: 48, y: 58 } } },
        ],
      },
    ],
  },
  'carlo-chelsea': {
    attack: [
      {
        intro: 'Veterans off the leash, with a target man leading the charge.',
        opponents: [{ x: 38, y: 20 }, { x: 52, y: 20 }, { x: 66, y: 22 }, { x: 45, y: 35 }, { x: 60, y: 38 }],
        steps: [
          { duration: 1.0, note: 'Won in midfield, and they pour forward in numbers', ball: { x: 60, y: 50 }, players: { p8: { x: 62, y: 48 } } },
          { duration: 1.1, note: 'The left winger takes the touchline route at pace', ball: { x: 22, y: 30 }, players: { p9: { x: 20, y: 28 } } },
          { duration: 1.0, note: 'The striker drags both centre-backs to the near post', players: { p10: { x: 42, y: 12 } }, opponents: [{ x: 40, y: 14 }, { x: 50, y: 13 }, { x: 64, y: 18 }, { x: 45, y: 28 }, { x: 58, y: 30 }] },
          { duration: 1.0, note: 'The cross comes early and hard', ball: { x: 45, y: 10 } },
          { duration: 1.0, note: 'The midfielder arrives late — his trademark', players: { p6: { x: 50, y: 14 } }, ball: { x: 51, y: 12 } },
          { duration: 0.8, note: 'Swept in from twelve yards', ball: { x: 50, y: 4 }, players: { p6: { x: 49, y: 9 } } },
        ],
      },
      {
        intro: 'Or no build-up at all: a strike from thirty yards.',
        opponents: [{ x: 40, y: 22 }, { x: 53, y: 22 }, { x: 65, y: 24 }, { x: 46, y: 35 }, { x: 58, y: 38 }],
        steps: [
          { duration: 1.0, note: 'The second forward drops in and links with one touch', ball: { x: 55, y: 32 }, players: { p11: { x: 56, y: 30 } } },
          { duration: 1.0, note: 'The give-and-go around the corner', ball: { x: 48, y: 26 }, players: { p10: { x: 49, y: 25 } } },
          { duration: 1.0, note: 'The striker squares up, thirty yards out', players: { p10: { x: 50, y: 22 } }, ball: { x: 50, y: 23 }, opponents: [{ x: 42, y: 18 }, { x: 53, y: 18 }, { x: 64, y: 20 }, { x: 47, y: 28 }, { x: 57, y: 32 }] },
          { duration: 0.9, note: 'Nobody closes him down. Big mistake.', players: { p6: { x: 38, y: 24 } } },
          { duration: 0.9, note: 'Launched — swerving, dipping, violent', ball: { x: 48, y: 8 } },
          { duration: 0.8, note: 'Top corner. The keeper never moved.', ball: { x: 46, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: old heads, two lines, zero panic.',
        opponents: [{ x: 50, y: 32 }, { x: 36, y: 40 }, { x: 64, y: 40 }, { x: 45, y: 52 }, { x: 58, y: 55 }],
        steps: [
          { duration: 1.1, note: 'Experienced heads drop into two calm lines', players: { p6: { x: 35, y: 52 }, p8: { x: 65, y: 52 }, p9: { x: 25, y: 48 }, p11: { x: 75, y: 48 }, p7: { x: 50, y: 58 } }, ball: { x: 50, y: 32 } },
          { duration: 1.0, note: 'The holder breaks up what the runners leave behind', players: { p7: { x: 45, y: 50 } }, ball: { x: 45, y: 52 } },
          { duration: 0.9, note: 'A shoulder, a foot in — and the ball is theirs', ball: { x: 44, y: 54 } },
          { duration: 0.9, note: 'Fed forward to the striker holding it up alone', ball: { x: 52, y: 36 }, players: { p10: { x: 52, y: 34 } } },
          { duration: 1.2, note: 'But if a clipped ball finds a runner past midfield…', ball: { x: 60, y: 64 }, opponents: [{ x: 50, y: 36 }, { x: 40, y: 45 }, { x: 62, y: 62 }, { x: 46, y: 56 }, { x: 58, y: 60 }] },
          { duration: 1.1, note: '…the full-back squeezes him toward the corner flag', players: { p5: { x: 68, y: 70 } } },
          { duration: 0.9, note: 'The cross comes in and both centre-backs rise', ball: { x: 50, y: 76 }, players: { p3: { x: 46, y: 75 }, p4: { x: 55, y: 75 } } },
          { duration: 0.9, note: 'Headed clear with interest', ball: { x: 52, y: 55 } },
          { duration: 1.0, note: 'And the striker holds it up so everyone can climb', players: { p10: { x: 52, y: 35 } }, ball: { x: 52, y: 38 } },
        ],
      },
    ],
  },
  'carlo-decima': {
    attack: [
      {
        intro: 'Counter-attacking at terrifying speed.',
        opponents: [{ x: 42, y: 38 }, { x: 58, y: 40 }, { x: 30, y: 50 }, { x: 52, y: 55 }, { x: 68, y: 58 }],
        steps: [
          { duration: 1.0, note: 'Won deep — and the carrier is already running', ball: { x: 40, y: 60 }, players: { p6: { x: 38, y: 58 } } },
          { duration: 1.2, note: 'Fifty metres with the ball glued to his foot', players: { p6: { x: 35, y: 38 } }, ball: { x: 34, y: 38 } },
          { duration: 1.0, note: 'The right winger flies down the flank', players: { p11: { x: 80, y: 20 } }, opponents: [{ x: 42, y: 30 }, { x: 58, y: 32 }, { x: 34, y: 40 }, { x: 52, y: 44 }, { x: 66, y: 46 }] },
          { duration: 1.0, note: 'Two more attackers flood the box', players: { p9: { x: 40, y: 12 }, p10: { x: 55, y: 12 } } },
          { duration: 1.0, note: 'Released into his stride', ball: { x: 76, y: 16 } },
          { duration: 0.9, note: 'Cut across goal, and someone arrives', ball: { x: 48, y: 5 }, players: { p9: { x: 46, y: 8 } } },
        ],
      },
      {
        intro: 'Or late in the game: everyone forward for the corner.',
        opponents: [{ x: 40, y: 9 }, { x: 50, y: 9 }, { x: 60, y: 9 }, { x: 45, y: 15 }, { x: 56, y: 15 }],
        steps: [
          { duration: 1.0, note: 'A corner, deep into stoppage time', players: { p8: { x: 96, y: 4 } }, ball: { x: 96, y: 4 } },
          { duration: 1.1, note: 'Both centre-backs march into the box', players: { p3: { x: 48, y: 16 }, p4: { x: 58, y: 16 } } },
          { duration: 1.0, note: 'A forward blocks the keeper’s path out', players: { p10: { x: 44, y: 8 } } },
          { duration: 1.0, note: 'The outswinger, flighted perfectly', ball: { x: 52, y: 10 } },
          { duration: 0.9, note: 'The captain hangs in the air', players: { p3: { x: 52, y: 8 } }, ball: { x: 52, y: 8 } },
          { duration: 0.8, note: 'The header goes in', ball: { x: 49, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: a patient block hiding a loaded spring.',
        opponents: [{ x: 50, y: 30 }, { x: 35, y: 38 }, { x: 65, y: 38 }, { x: 48, y: 50 }, { x: 60, y: 55 }],
        steps: [
          { duration: 1.1, note: 'The block sets mid-pitch; the stars save their legs', players: { p6: { x: 30, y: 48 }, p8: { x: 70, y: 48 }, p7: { x: 50, y: 52 }, p9: { x: 25, y: 25 } }, ball: { x: 50, y: 30 } },
          { duration: 1.0, note: 'The deep midfielder organises every metre of it', players: { p7: { x: 50, y: 55 } }, ball: { x: 35, y: 38 } },
          { duration: 0.9, note: 'The pass inside is stepped on and won', players: { p7: { x: 42, y: 48 } }, ball: { x: 41, y: 46 } },
          { duration: 1.0, note: 'And the spring releases instantly', ball: { x: 60, y: 32 }, players: { p11: { x: 65, y: 26 } } },
          { duration: 1.2, note: 'But if a slick combination carries them past midfield…', ball: { x: 42, y: 62 }, opponents: [{ x: 50, y: 34 }, { x: 40, y: 56 }, { x: 65, y: 42 }, { x: 44, y: 64 }, { x: 58, y: 58 }] },
          { duration: 1.1, note: '…the captain steps out to meet it, fearless as ever', players: { p3: { x: 44, y: 66 } } },
          { duration: 0.9, note: 'He wins the ball and the collision', ball: { x: 44, y: 65 } },
          { duration: 1.0, note: 'His partner mops up behind him', players: { p4: { x: 52, y: 70 } }, ball: { x: 50, y: 68 } },
          { duration: 1.0, note: 'And it is fired forward for the counter again', ball: { x: 35, y: 45 }, players: { p6: { x: 32, y: 42 } } },
        ],
      },
    ],
  },
  'cruyff-barca': {
    attack: [
      {
        intro: 'Total Football: the spare man steps out and everyone rotates.',
        opponents: [{ x: 45, y: 62 }, { x: 60, y: 56 }, { x: 32, y: 46 }, { x: 55, y: 36 }, { x: 47, y: 20 }],
        steps: [
          { duration: 1.0, note: 'The spare centre-back steps into midfield with it', players: { p3: { x: 50, y: 62 } }, ball: { x: 50, y: 64 } },
          { duration: 1.0, note: 'A triangle appears — there is always an angle', players: { p6: { x: 41, y: 52 } }, ball: { x: 41, y: 53 } },
          { duration: 1.1, note: 'Width is sacred: the winger hugs the chalk', ball: { x: 20, y: 30 }, players: { p9: { x: 19, y: 28 } } },
          { duration: 1.0, note: 'Rotation: the striker drops, the full-back overlaps', players: { p10: { x: 38, y: 28 }, p5: { x: 11, y: 30 } }, opponents: [{ x: 45, y: 50 }, { x: 55, y: 44 }, { x: 30, y: 36 }, { x: 50, y: 28 }, { x: 44, y: 16 }] },
          { duration: 1.0, note: 'One-two around the corner', ball: { x: 38, y: 26 } },
          { duration: 1.0, note: 'The striker spins and finishes', ball: { x: 48, y: 4 }, players: { p10: { x: 46, y: 9 } } },
        ],
      },
      {
        intro: 'Or a dead ball on the edge — everyone knows whose it is.',
        opponents: [{ x: 42, y: 14 }, { x: 48, y: 14 }, { x: 54, y: 14 }, { x: 60, y: 14 }, { x: 50, y: 30 }],
        steps: [
          { duration: 1.0, note: 'A free kick, twenty yards out', ball: { x: 47, y: 20 }, players: { p9: { x: 44, y: 22 } } },
          { duration: 1.1, note: 'The wall lines up. The centre-back walks up from the back.', players: { p3: { x: 45, y: 28 } } },
          { duration: 1.0, note: 'A teammate stands over it as the decoy', players: { p7: { x: 50, y: 24 } } },
          { duration: 0.9, note: 'The ball is rolled sideways', ball: { x: 45, y: 24 }, players: { p3: { x: 44, y: 26 } } },
          { duration: 0.9, note: 'And struck as hard as a human can strike it', ball: { x: 52, y: 8 } },
          { duration: 0.8, note: 'Into the top corner', ball: { x: 53, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: squeeze the pitch, and trust the keeper behind.',
        opponents: [{ x: 45, y: 30 }, { x: 58, y: 32 }, { x: 35, y: 42 }, { x: 52, y: 48 }, { x: 60, y: 58 }],
        steps: [
          { duration: 1.0, note: 'Lose it? Hunt it back immediately — the first rule', players: { p9: { x: 40, y: 28 }, p10: { x: 50, y: 30 }, p6: { x: 42, y: 40 } }, ball: { x: 45, y: 30 } },
          { duration: 1.0, note: 'The pitch is made small: everyone squeezes up', players: { p2: { x: 28, y: 55 }, p3: { x: 50, y: 52 }, p4: { x: 72, y: 55 } } },
          { duration: 1.0, note: 'The line steps forward as one — the offside trap', players: { p2: { x: 28, y: 50 }, p3: { x: 50, y: 48 }, p4: { x: 72, y: 50 } }, ball: { x: 52, y: 48 } },
          { duration: 0.9, note: 'The flag goes up, or the panicked pass is intercepted', players: { p6: { x: 45, y: 42 } }, ball: { x: 45, y: 43 } },
          { duration: 1.2, note: 'But if the ball is chipped over that trap…', ball: { x: 55, y: 62 }, opponents: [{ x: 45, y: 26 }, { x: 58, y: 58 }, { x: 35, y: 44 }, { x: 52, y: 50 }, { x: 60, y: 60 }] },
          { duration: 1.0, note: '…only three defenders remain, so they jockey and delay', players: { p2: { x: 35, y: 62 }, p3: { x: 54, y: 62 }, p4: { x: 68, y: 62 } } },
          { duration: 1.1, note: 'And the keeper sprints out as the last defender', players: { p1: { x: 52, y: 78 } } },
          { duration: 0.9, note: 'Swept away at the striker’s toe', ball: { x: 40, y: 68 }, players: { p1: { x: 50, y: 76 } } },
          { duration: 1.0, note: 'Straight back to work. The ball is theirs again.', ball: { x: 42, y: 55 } },
        ],
      },
    ],
  },
  'wenger-invincibles': {
    attack: [
      {
        intro: 'Win it, then four passes and it is in the net.',
        opponents: [{ x: 50, y: 46 }, { x: 38, y: 36 }, { x: 62, y: 32 }, { x: 45, y: 18 }, { x: 58, y: 16 }],
        steps: [
          { duration: 0.9, note: 'The duel is won in central midfield', players: { p7: { x: 43, y: 49 } }, ball: { x: 43, y: 50 } },
          { duration: 1.0, note: 'The second striker drops between the lines to link', players: { p11: { x: 60, y: 30 } }, ball: { x: 59, y: 32 } },
          { duration: 1.0, note: 'The nine drifts into the left channel — his runway', players: { p10: { x: 20, y: 20 } } },
          { duration: 1.0, note: 'The reverse ball in behind, played first time', ball: { x: 24, y: 10 } },
          { duration: 1.1, note: 'He cuts inside at full sprint', players: { p10: { x: 36, y: 8 } }, ball: { x: 37, y: 9 }, opponents: [{ x: 50, y: 34 }, { x: 40, y: 24 }, { x: 60, y: 22 }, { x: 47, y: 12 }, { x: 58, y: 11 }] },
          { duration: 0.8, note: 'Passed into the far corner, never smashed', ball: { x: 53, y: 3 } },
        ],
      },
      {
        intro: 'Or the full sweep: one-touch football, back to front.',
        opponents: [{ x: 38, y: 18 }, { x: 51, y: 18 }, { x: 64, y: 20 }, { x: 44, y: 32 }, { x: 57, y: 34 }],
        steps: [
          { duration: 1.0, note: 'Full-back and winger interchange on the left', players: { p2: { x: 20, y: 40 }, p6: { x: 28, y: 30 } }, ball: { x: 24, y: 36 } },
          { duration: 1.0, note: 'Clipped inside to the forward — one touch', ball: { x: 50, y: 28 }, players: { p11: { x: 51, y: 26 } } },
          { duration: 1.0, note: 'Around the corner for the overlapping full-back', ball: { x: 22, y: 18 }, players: { p2: { x: 20, y: 16 } }, opponents: [{ x: 36, y: 14 }, { x: 50, y: 15 }, { x: 63, y: 17 }, { x: 40, y: 26 }, { x: 55, y: 30 }] },
          { duration: 1.0, note: 'The right midfielder starts his late dart', players: { p9: { x: 62, y: 16 } } },
          { duration: 0.9, note: 'The cutback finds shirts queuing up', ball: { x: 50, y: 8 } },
          { duration: 0.8, note: 'Slid home from six yards', ball: { x: 51, y: 3 }, players: { p9: { x: 54, y: 7 } } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: a spine of iron under all that silk.',
        opponents: [{ x: 48, y: 32 }, { x: 35, y: 40 }, { x: 62, y: 40 }, { x: 50, y: 52 }, { x: 40, y: 60 }],
        steps: [
          { duration: 1.1, note: 'The two central midfielders close the middle of the pitch', players: { p7: { x: 45, y: 50 }, p8: { x: 55, y: 50 } }, ball: { x: 48, y: 32 } },
          { duration: 1.0, note: 'The centre-backs hold a high, brave line', players: { p3: { x: 40, y: 62 }, p4: { x: 60, y: 62 } }, ball: { x: 35, y: 40 } },
          { duration: 1.0, note: 'The winger is shepherded inside, into traffic', ball: { x: 42, y: 48 } },
          { duration: 0.9, note: 'One stride, one tackle, ball won', players: { p7: { x: 43, y: 50 } }, ball: { x: 44, y: 50 } },
          { duration: 1.2, note: 'But if a flick sends their striker in behind…', ball: { x: 30, y: 66 }, opponents: [{ x: 48, y: 36 }, { x: 28, y: 64 }, { x: 62, y: 44 }, { x: 50, y: 56 }, { x: 42, y: 62 }] },
          { duration: 1.1, note: '…the centre-back matches him stride for stride', players: { p3: { x: 32, y: 68 } } },
          { duration: 1.0, note: 'Forced wider with every step, angle shrinking', ball: { x: 22, y: 72 }, players: { p3: { x: 26, y: 70 } } },
          { duration: 0.9, note: 'Muscled off the ball on the touchline', ball: { x: 20, y: 74 } },
          { duration: 1.0, note: 'His partner mops up, and Arsenal break', players: { p4: { x: 32, y: 70 } }, ball: { x: 40, y: 58 } },
        ],
      },
    ],
  },
  'lucho-barca': {
    attack: [
      {
        intro: 'Get the front three the ball, then get out of the way.',
        opponents: [{ x: 40, y: 25 }, { x: 54, y: 25 }, { x: 68, y: 27 }, { x: 47, y: 40 }, { x: 60, y: 42 }],
        steps: [
          { duration: 1.0, note: 'The pivot escapes the press with one touch', ball: { x: 50, y: 55 }, players: { p7: { x: 50, y: 52 } } },
          { duration: 1.1, note: 'The right winger drops in — the magnet', players: { p11: { x: 65, y: 32 } }, ball: { x: 63, y: 34 } },
          { duration: 1.0, note: 'The full-back is already sprinting the far touchline', players: { p2: { x: 25, y: 16 } }, opponents: [{ x: 40, y: 22 }, { x: 54, y: 22 }, { x: 64, y: 28 }, { x: 47, y: 36 }, { x: 58, y: 38 }] },
          { duration: 1.1, note: 'The ball is clipped over everything into his run', ball: { x: 25, y: 12 } },
          { duration: 1.0, note: 'Cut back to the striker between the posts', ball: { x: 48, y: 6 }, players: { p10: { x: 47, y: 8 }, p9: { x: 38, y: 8 } } },
          { duration: 0.8, note: 'Finished. The third one was free too.', ball: { x: 51, y: 3 } },
        ],
      },
      {
        intro: 'Or clear the left side and let the winger go to work.',
        opponents: [{ x: 38, y: 18 }, { x: 51, y: 18 }, { x: 64, y: 20 }, { x: 30, y: 30 }, { x: 55, y: 34 }],
        steps: [
          { duration: 1.0, note: 'Found on the left, and the flank empties for him', ball: { x: 24, y: 30 }, players: { p6: { x: 32, y: 40 }, p9: { x: 22, y: 28 } } },
          { duration: 1.1, note: 'One against one. The full-back is alone.', opponents: [{ x: 38, y: 16 }, { x: 51, y: 16 }, { x: 64, y: 18 }, { x: 26, y: 24 }, { x: 55, y: 30 }] },
          { duration: 1.1, note: 'The touch inside — the defender buys the fake', players: { p9: { x: 32, y: 16 } }, ball: { x: 33, y: 17 } },
          { duration: 1.0, note: 'The striker makes the near-post dart to open space', players: { p10: { x: 42, y: 9 } } },
          { duration: 0.9, note: 'He keeps it himself — why not?', players: { p9: { x: 40, y: 9 } }, ball: { x: 41, y: 10 } },
          { duration: 0.8, note: 'Bent around the keeper into the far side', ball: { x: 54, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: the front three press, the keeper sweeps.',
        opponents: [{ x: 45, y: 20 }, { x: 58, y: 22 }, { x: 35, y: 32 }, { x: 50, y: 38 }, { x: 62, y: 45 }],
        steps: [
          { duration: 1.1, note: 'The front three press the first pass — no clean exits', players: { p9: { x: 30, y: 26 }, p10: { x: 46, y: 16 }, p11: { x: 60, y: 24 } }, ball: { x: 45, y: 20 } },
          { duration: 1.0, note: 'A midfielder jumps onto the spare man', players: { p8: { x: 60, y: 35 } }, ball: { x: 58, y: 22 } },
          { duration: 0.9, note: 'Rushed, and hooked straight out of play', ball: { x: 62, y: 18 } },
          { duration: 0.9, note: 'Their throw, deep in their own half — job done', ball: { x: 55, y: 25 } },
          { duration: 1.2, note: 'But if a long diagonal escapes the press…', ball: { x: 30, y: 58 }, opponents: [{ x: 45, y: 24 }, { x: 58, y: 26 }, { x: 28, y: 56 }, { x: 50, y: 42 }, { x: 62, y: 48 }] },
          { duration: 1.0, note: '…the converted midfielder arrives at centre-back', players: { p4: { x: 34, y: 62 } } },
          { duration: 1.0, note: 'He forces it wide, but the ball goes over him', ball: { x: 40, y: 72 } },
          { duration: 0.9, note: 'So the keeper races out as the spare defender', players: { p1: { x: 45, y: 78 } }, ball: { x: 43, y: 74 } },
          { duration: 1.0, note: 'Swept clear, and the ball is theirs again', ball: { x: 50, y: 60 }, players: { p7: { x: 50, y: 56 } } },
        ],
      },
    ],
  },
  'lucho-psg': {
    attack: [
      {
        intro: 'Press to steal high, then release the front three at once.',
        opponents: [{ x: 50, y: 10 }, { x: 33, y: 15 }, { x: 67, y: 15 }, { x: 50, y: 24 }, { x: 38, y: 30 }],
        steps: [
          { duration: 1.0, note: 'The front three trap the build-up high', players: { p9: { x: 27, y: 18 }, p10: { x: 46, y: 12 }, p11: { x: 62, y: 17 } }, ball: { x: 50, y: 10 } },
          { duration: 1.0, note: 'Forced wide — the trap tightens on the touchline', ball: { x: 33, y: 15 }, players: { p9: { x: 29, y: 15 }, p6: { x: 30, y: 28 } } },
          { duration: 0.9, note: 'Stolen, thirty metres from goal', ball: { x: 32, y: 17 } },
          { duration: 1.0, note: 'The false nine takes it between the centre-backs', ball: { x: 47, y: 13 }, players: { p10: { x: 48, y: 12 } } },
          { duration: 1.0, note: 'The far winger arrives at the back post', players: { p11: { x: 60, y: 7 } }, ball: { x: 58, y: 8 } },
          { duration: 0.8, note: 'Finished before the defence can reform', ball: { x: 51, y: 3 } },
        ],
      },
      {
        intro: 'Or through the little conductors in midfield.',
        opponents: [{ x: 40, y: 20 }, { x: 53, y: 20 }, { x: 66, y: 22 }, { x: 45, y: 34 }, { x: 58, y: 36 }],
        steps: [
          { duration: 1.0, note: 'The pivot demands it under pressure — always', ball: { x: 45, y: 45 }, players: { p6: { x: 44, y: 43 } } },
          { duration: 0.9, note: 'The wall pass, played in a phone box', ball: { x: 52, y: 40 }, players: { p7: { x: 53, y: 39 } } },
          { duration: 1.0, note: 'Two pressers beaten by two touches', ball: { x: 46, y: 34 }, players: { p6: { x: 46, y: 32 } }, opponents: [{ x: 42, y: 26 }, { x: 55, y: 26 }, { x: 66, y: 24 }, { x: 48, y: 40 }, { x: 58, y: 40 }] },
          { duration: 1.1, note: 'The left winger starts his diagonal run inside', players: { p9: { x: 35, y: 15 } } },
          { duration: 1.0, note: 'Threaded with the outside of the boot', ball: { x: 37, y: 13 } },
          { duration: 0.8, note: 'Opened up and curled home', ball: { x: 52, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: all eleven press, and the defenders recover.',
        opponents: [{ x: 50, y: 15 }, { x: 35, y: 20 }, { x: 65, y: 20 }, { x: 48, y: 30 }, { x: 58, y: 38 }],
        steps: [
          { duration: 1.2, note: 'The whole team crosses halfway to press', players: { p2: { x: 20, y: 40 }, p5: { x: 80, y: 40 }, p3: { x: 40, y: 50 }, p4: { x: 60, y: 50 }, p6: { x: 35, y: 25 }, p7: { x: 50, y: 30 }, p8: { x: 62, y: 28 } }, ball: { x: 50, y: 15 } },
          { duration: 1.0, note: 'Even the forwards lead the charge from the front', players: { p10: { x: 48, y: 12 } }, ball: { x: 35, y: 20 } },
          { duration: 0.9, note: 'Every option is shadowed before the pass exists', players: { p9: { x: 28, y: 18 }, p11: { x: 68, y: 18 } } },
          { duration: 0.9, note: 'The panicked touch is pounced on', ball: { x: 40, y: 22 }, players: { p6: { x: 38, y: 22 } } },
          { duration: 1.2, note: 'But if one long punt clears the entire press…', ball: { x: 60, y: 60 }, opponents: [{ x: 50, y: 18 }, { x: 35, y: 24 }, { x: 62, y: 58 }, { x: 48, y: 34 }, { x: 58, y: 42 }] },
          { duration: 1.1, note: '…the centre-back runs it down: calm, physical, first', players: { p4: { x: 62, y: 64 } } },
          { duration: 1.0, note: 'Shoulder to shoulder, he takes the ball cleanly', ball: { x: 62, y: 66 } },
          { duration: 0.9, note: 'His partner steps across to cover the rebound', players: { p3: { x: 52, y: 66 } }, ball: { x: 55, y: 64 } },
          { duration: 1.0, note: 'Played out short. The press resets in seconds.', ball: { x: 45, y: 55 } },
        ],
      },
    ],
  },
  'klopp-liverpool': {
    attack: [
      {
        intro: 'Gegenpressing: lose the ball, then hunt it in a pack.',
        opponents: [{ x: 36, y: 32 }, { x: 50, y: 38 }, { x: 64, y: 44 }, { x: 45, y: 54 }, { x: 60, y: 64 }],
        steps: [
          { duration: 1.0, note: 'Possession lost in the opponent half — the trigger', ball: { x: 37, y: 33 } },
          { duration: 1.2, note: 'The nearest three hunt it as a pack', players: { p9: { x: 31, y: 27 }, p6: { x: 33, y: 39 }, p2: { x: 24, y: 42 }, p10: { x: 44, y: 28 } } },
          { duration: 0.9, note: 'Won back within five seconds', ball: { x: 34, y: 36 } },
          { duration: 1.0, note: 'The first pass is vertical — always', ball: { x: 68, y: 22 }, players: { p11: { x: 70, y: 20 } } },
          { duration: 1.1, note: 'In behind at full speed — heavy metal football', players: { p11: { x: 60, y: 9 } }, ball: { x: 61, y: 10 }, opponents: [{ x: 38, y: 22 }, { x: 50, y: 26 }, { x: 62, y: 28 }, { x: 47, y: 40 }, { x: 58, y: 48 }] },
          { duration: 0.9, note: 'Turnover to goal in four passes or fewer', ball: { x: 49, y: 3 }, players: { p10: { x: 46, y: 10 } } },
        ],
      },
      {
        intro: 'Or full-back to full-back: the creators are at the back.',
        opponents: [{ x: 38, y: 16 }, { x: 51, y: 16 }, { x: 64, y: 18 }, { x: 45, y: 30 }, { x: 58, y: 32 }],
        steps: [
          { duration: 1.0, note: 'The right-back surveys it from deep', ball: { x: 80, y: 40 }, players: { p5: { x: 80, y: 38 } } },
          { duration: 1.2, note: 'The seventy-yard diagonal, flat as a laser', ball: { x: 18, y: 22 }, players: { p2: { x: 16, y: 20 } } },
          { duration: 1.0, note: 'Taken in stride on the left, no touch wasted', players: { p2: { x: 20, y: 12 } }, ball: { x: 21, y: 13 }, opponents: [{ x: 34, y: 12 }, { x: 48, y: 13 }, { x: 62, y: 15 }, { x: 42, y: 24 }, { x: 56, y: 28 }] },
          { duration: 1.0, note: 'The nine vacates the middle; a winger fills it', players: { p10: { x: 58, y: 20 }, p9: { x: 42, y: 9 } } },
          { duration: 0.9, note: 'The low cross, fizzed through the corridor', ball: { x: 42, y: 7 } },
          { duration: 0.8, note: 'First time, from full-back to full-back to net', ball: { x: 50, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: the highest line — with a keeper to match.',
        opponents: [{ x: 48, y: 25 }, { x: 35, y: 30 }, { x: 62, y: 32 }, { x: 50, y: 42 }, { x: 58, y: 52 }],
        steps: [
          { duration: 1.1, note: 'The line pushes up and squeezes the whole pitch', players: { p2: { x: 25, y: 50 }, p3: { x: 43, y: 48 }, p4: { x: 57, y: 48 }, p5: { x: 75, y: 50 } }, ball: { x: 48, y: 25 } },
          { duration: 1.0, note: 'The touchline trap: full-back plus two hunters', players: { p2: { x: 28, y: 34 }, p6: { x: 38, y: 34 }, p9: { x: 28, y: 24 } }, ball: { x: 35, y: 30 } },
          { duration: 0.9, note: 'Five seconds of fury, and the ball is won', ball: { x: 33, y: 32 } },
          { duration: 0.9, note: 'Counter-press becomes counter-attack', ball: { x: 55, y: 25 }, players: { p11: { x: 65, y: 20 } } },
          { duration: 1.2, note: 'But if a ball over the top beats that line…', ball: { x: 55, y: 62 }, opponents: [{ x: 48, y: 28 }, { x: 35, y: 34 }, { x: 57, y: 60 }, { x: 50, y: 46 }, { x: 58, y: 55 }] },
          { duration: 1.1, note: '…the centre-back glides across, never rushed', players: { p3: { x: 52, y: 62 } } },
          { duration: 1.0, note: 'He steers the runner wide with one arm', ball: { x: 68, y: 72 }, players: { p3: { x: 62, y: 68 } } },
          { duration: 1.0, note: 'And the keeper spreads himself at the near post', players: { p1: { x: 55, y: 87 } }, ball: { x: 58, y: 84 } },
          { duration: 1.0, note: 'Claimed, and thrown straight into the next attack', ball: { x: 55, y: 86 }, players: { p1: { x: 54, y: 87 } } },
        ],
      },
    ],
  },
  'zidane-undecima': {
    attack: [
      {
        intro: 'Control the middle, then release the cavalry.',
        opponents: [{ x: 44, y: 40 }, { x: 58, y: 42 }, { x: 34, y: 50 }, { x: 52, y: 56 }, { x: 66, y: 58 }],
        steps: [
          { duration: 1.0, note: 'The destroyer wins it ugly; the passer makes it clean', ball: { x: 52, y: 58 }, players: { p7: { x: 52, y: 56 } } },
          { duration: 1.0, note: 'One pass to the other metronome and the pressure dissolves', ball: { x: 66, y: 48 }, players: { p8: { x: 68, y: 46 } } },
          { duration: 1.1, note: 'The right winger attacks the channel at a gallop', players: { p11: { x: 80, y: 22 } }, ball: { x: 74, y: 30 } },
          { duration: 1.0, note: 'The striker occupies both centre-backs alone', players: { p10: { x: 50, y: 15 } }, opponents: [{ x: 46, y: 16 }, { x: 56, y: 16 }, { x: 34, y: 40 }, { x: 52, y: 44 }, { x: 66, y: 46 }] },
          { duration: 1.0, note: 'The left winger ghosts in at the far post', players: { p9: { x: 35, y: 10 } } },
          { duration: 0.9, note: 'The cross, and the header', ball: { x: 45, y: 5 }, players: { p9: { x: 43, y: 7 } } },
        ],
      },
      {
        intro: 'Or down the left, where the full-back and winger combine.',
        opponents: [{ x: 38, y: 18 }, { x: 52, y: 18 }, { x: 65, y: 20 }, { x: 32, y: 32 }, { x: 55, y: 34 }],
        steps: [
          { duration: 1.0, note: 'The left-back dances infield with the ball', players: { p2: { x: 28, y: 35 } }, ball: { x: 28, y: 36 } },
          { duration: 1.0, note: 'The one-two with the winger, at samba tempo', ball: { x: 22, y: 24 }, players: { p9: { x: 20, y: 22 } } },
          { duration: 1.0, note: 'Returned into his run — the defence is spinning', ball: { x: 30, y: 16 }, players: { p2: { x: 31, y: 15 } }, opponents: [{ x: 36, y: 14 }, { x: 50, y: 16 }, { x: 64, y: 18 }, { x: 34, y: 24 }, { x: 54, y: 30 }] },
          { duration: 1.0, note: 'The winger checks his run and waits on the spot', players: { p9: { x: 48, y: 10 } } },
          { duration: 0.9, note: 'Stood up to the back post', ball: { x: 47, y: 8 } },
          { duration: 0.8, note: 'Thumped home', ball: { x: 50, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: a compact block with the star excused.',
        opponents: [{ x: 50, y: 30 }, { x: 36, y: 36 }, { x: 64, y: 38 }, { x: 46, y: 50 }, { x: 58, y: 55 }],
        steps: [
          { duration: 1.1, note: 'The block forms; the winger stays high, saving his legs', players: { p6: { x: 30, y: 50 }, p8: { x: 70, y: 50 }, p7: { x: 50, y: 55 }, p9: { x: 25, y: 30 } }, ball: { x: 50, y: 30 } },
          { duration: 1.0, note: 'The destroyer eats whatever comes through the middle', players: { p7: { x: 48, y: 52 } }, ball: { x: 46, y: 50 } },
          { duration: 0.9, note: 'Won with a shoulder and a long leg', ball: { x: 47, y: 53 } },
          { duration: 0.9, note: 'And given straight to a midfielder to start again', ball: { x: 35, y: 48 }, players: { p6: { x: 33, y: 46 } } },
          { duration: 1.2, note: 'But if a cute flick sneaks a runner past midfield…', ball: { x: 55, y: 64 }, opponents: [{ x: 50, y: 34 }, { x: 36, y: 40 }, { x: 57, y: 62 }, { x: 46, y: 54 }, { x: 58, y: 58 }] },
          { duration: 1.1, note: '…both centre-backs close the door together', players: { p3: { x: 48, y: 68 }, p4: { x: 58, y: 68 } } },
          { duration: 0.9, note: 'The captain gets his body in the way', ball: { x: 56, y: 66 }, players: { p4: { x: 56, y: 65 } } },
          { duration: 1.0, note: 'Hacked clear by his partner — no elegance required', players: { p3: { x: 50, y: 68 } }, ball: { x: 40, y: 55 } },
          { duration: 1.0, note: 'Block reset. Again and again and again.', ball: { x: 42, y: 48 } },
        ],
      },
    ],
  },
  'zidane-madrid': {
    attack: [
      {
        intro: 'The diamond: midfield masters, then one lightning strike.',
        opponents: [{ x: 44, y: 42 }, { x: 58, y: 44 }, { x: 32, y: 52 }, { x: 52, y: 58 }, { x: 68, y: 62 }],
        steps: [
          { duration: 1.1, note: 'Pressed? The midfield simply keeps the ball', players: { p8: { x: 72, y: 54 } }, ball: { x: 72, y: 56 } },
          { duration: 1.0, note: 'The switch — from one metronome to the other', ball: { x: 28, y: 54 }, players: { p6: { x: 27, y: 53 } } },
          { duration: 1.0, note: 'The ten appears in the pocket', players: { p9: { x: 38, y: 38 } }, ball: { x: 38, y: 40 } },
          { duration: 1.2, note: 'One striker drops, the other attacks the space', players: { p11: { x: 55, y: 26 }, p10: { x: 20, y: 14 } }, opponents: [{ x: 44, y: 30 }, { x: 58, y: 32 }, { x: 34, y: 38 }, { x: 52, y: 44 }, { x: 66, y: 48 }] },
          { duration: 1.0, note: 'The ball in behind — decided in one moment', ball: { x: 24, y: 9 } },
          { duration: 1.0, note: 'Individual brilliance finishes it', ball: { x: 52, y: 4 }, players: { p10: { x: 42, y: 6 } } },
        ],
      },
      {
        intro: 'Or the set piece: a perfect delivery, a centre-back rising.',
        opponents: [{ x: 40, y: 10 }, { x: 50, y: 10 }, { x: 60, y: 10 }, { x: 45, y: 16 }, { x: 56, y: 16 }],
        steps: [
          { duration: 1.0, note: 'A corner, and the ball is placed just so', players: { p6: { x: 4, y: 4 } }, ball: { x: 4, y: 4 } },
          { duration: 1.1, note: 'The centre-backs cross their runs to lose the markers', players: { p3: { x: 44, y: 15 }, p4: { x: 56, y: 15 } } },
          { duration: 1.0, note: 'A forward screens the keeper’s route out', players: { p11: { x: 46, y: 8 } } },
          { duration: 1.0, note: 'The inswinger, dropped on a coin', ball: { x: 50, y: 9 } },
          { duration: 0.9, note: 'The captain climbs highest — he always does', players: { p3: { x: 51, y: 7 } }, ball: { x: 51, y: 7 } },
          { duration: 0.8, note: 'Powered in off the underside of the bar', ball: { x: 49, y: 3 } },
        ],
      },
    ],
    defense: [
      {
        intro: 'Out of possession: the diamond collapses into a sealed block.',
        opponents: [{ x: 48, y: 32 }, { x: 35, y: 40 }, { x: 62, y: 40 }, { x: 50, y: 52 }, { x: 42, y: 60 }],
        steps: [
          { duration: 1.1, note: 'The diamond collapses into a narrow block', players: { p9: { x: 50, y: 45 }, p6: { x: 32, y: 52 }, p8: { x: 68, y: 52 }, p7: { x: 50, y: 58 } }, ball: { x: 48, y: 32 } },
          { duration: 1.0, note: 'Full-backs tuck in; the middle stays sealed', players: { p2: { x: 25, y: 62 }, p5: { x: 75, y: 62 } }, ball: { x: 35, y: 40 } },
          { duration: 1.0, note: 'They pass around it and get nowhere', ball: { x: 62, y: 40 } },
          { duration: 0.9, note: 'The anchor wins it back. He always does.', players: { p7: { x: 58, y: 50 } }, ball: { x: 58, y: 48 } },
          { duration: 1.2, note: 'But if a give-and-go slips through the seam…', ball: { x: 58, y: 64 }, opponents: [{ x: 48, y: 36 }, { x: 35, y: 44 }, { x: 60, y: 62 }, { x: 50, y: 56 }, { x: 44, y: 62 }] },
          { duration: 1.1, note: '…the centre-back recovers with those impossible strides', players: { p4: { x: 60, y: 68 } } },
          { duration: 0.9, note: 'He gets a toe in as the shot is struck', ball: { x: 58, y: 70 } },
          { duration: 1.0, note: 'Deflected wide by the covering defender', players: { p3: { x: 52, y: 70 } }, ball: { x: 70, y: 74 } },
          { duration: 1.0, note: 'Survived — and one pass makes them lethal again', ball: { x: 40, y: 58 }, players: { p10: { x: 30, y: 40 } } },
        ],
      },
    ],
  },
};

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

// Glossary patterns come first so they take priority at the same position.
const EMPHASIS_REGEX = new RegExp(
  [...GLOSS_PATTERNS.map(([source]) => source), ...KEY_TERM_SOURCES]
    .map((source) => `(?:\\b(?:${source})\\b)`)
    .join('|'),
  'gi',
);

// Renders text with glossary terms starred and other key words bolded.
function glossify(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(EMPHASIS_REGEX)) {
    const index = match.index ?? 0;
    const glossKey = glossKeyFor(match[0]);
    parts.push(text.slice(last, index));
    parts.push(
      glossKey && GLOSSARY[glossKey] ? (
        <span key={`${index}-${match[0]}`} className="gloss-term">
          {match[0]}*
        </span>
      ) : (
        <strong key={`${index}-${match[0]}`} className="key-term">
          {match[0]}
        </strong>
      ),
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
      <rect className="formation-thumb-pitch" x="1" y="1" width="98" height="120" rx="6" />
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
        const start = arrowStart(arrow, players);
        if (!start) return null;
        const anchor = players.find((player) => player.id === arrow.playerId);
        // Pitch coordinates are percentages; the viewBox matches the pitch
        // aspect ratio, so y scales by PITCH_Y_SCALE.
        const sx = start.x;
        const sy = start.y * PITCH_Y_SCALE;
        const ex = arrow.endX;
        const ey = arrow.endY * PITCH_Y_SCALE;
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
    <svg className="pitch-lines" viewBox={PITCH_VIEWBOX} aria-hidden="true">
      <rect className="pitch-line" x="1" y="1" width="98" height="120" rx="1.2" />
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
  const [ball, setBall] = useState<Position | null>(null);
  const [showNumbersNote, setShowNumbersNote] = useState(false);
  const [factIndex, setFactIndex] = useState(0);
  const [opponents, setOpponents] = useState<Position[]>([]);
  const [animRunning, setAnimRunning] = useState(false);
  const [animCaption, setAnimCaption] = useState('');
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

  const playTactic = (kind: 'attack' | 'defense') => {
    const variants = activeEra ? ERA_ANIMATIONS[activeEra.id]?.[kind] : undefined;
    if (!variants?.length || !activeEra) return;
    const variantKey = `${activeEra.id}:${kind}`;
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

  const selectFormation = (nextFormation: Formation) => {
    stopTactic(false);
    setFormation(nextFormation);
    setActiveEra(null);
    setPlayers(formationPlayers(nextFormation));
    setSelectedId('p1');
    clearArrows();
    setFactIndex(0);
    setMessage(`${nextFormation.name} loaded. Drag to make it yours.`);
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
    setBall(null);
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
    const x = Math.max(4, Math.min(96, point.x));
    const y = Math.max(4, Math.min(96, point.y));
    if (drag.id === 'ball') {
      setBall({ x, y });
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
                <p className="panel-copy">Nine serial winners, each frozen at a defining moment of their career.</p>
              </div>
              <div className="formation-list manager-list">
                {MANAGERS.map((manager) => (
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
                    if (animRunning) return;
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
                  {photoFor(player) && (
                    <img
                      className="player-photo"
                      src={playerPhotoUrl(photoFor(player)!.file)}
                      alt=""
                      loading="lazy"
                      width={26}
                      height={26}
                      draggable={false}
                    />
                  )}
                  <span className="player-number">{shirtNumber(player)}</span>
                  {player.name && (
                    <span className="player-label">
                      {player.name}
                      {eraJersey(player) !== undefined ? ` (${eraJersey(player)})` : ''}
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
                    dragRef.current = { id: 'ball' };
                  }}
                />
              )}
              {opponents.map((opponent, index) => (
                <div
                  key={`opp-${index}`}
                  className="opponent-marker"
                  style={{ left: `${opponent.x}%`, top: `${opponent.y}%` }}
                  aria-hidden="true"
                />
              ))}
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

        <aside className="panel inspector" aria-label="Selected player details">
          {selectedPlayerPhoto ? (
            <img
              className="inspector-portrait"
              data-testid="img-player-portrait"
              src={playerPhotoUrl(selectedPlayerPhoto.file)}
              alt={selectedXiName ?? 'Selected player'}
              loading="lazy"
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
            <div className="inspector-role">{selectedPlayer ? roleName(selectedPlayer.role) : 'Board is empty'}</div>
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
            <details className="tip-box collapsible-box" data-testid="panel-core-ideas" open>
              <summary>Core Ideas</summary>
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
          {!activeEra && content && (
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
          {activeEra && activeManager && MANAGER_PLAYSTYLES[activeManager.name] && (
            <div className="tip-box" data-testid="panel-playstyle">
              <div className="playstyle-head">
                <ManagerPhoto manager={activeManager.name} size="large" />
                <strong>How {activeManager.name} plays</strong>
              </div>
              <p className="fact-text">{glossify(MANAGER_PLAYSTYLES[activeManager.name])}</p>
              {ERA_ANIMATIONS[activeEra.id] && (
                <>
                  <div className="tactic-buttons">
                    <button
                      className="action-button primary-action"
                      data-testid="button-play-attack"
                      type="button"
                      onClick={() => playTactic('attack')}
                    >
                      <Play size={14} />
                      In possession
                    </button>
                    <button
                      className="action-button"
                      data-testid="button-play-defense"
                      type="button"
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
                </>
              )}
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
