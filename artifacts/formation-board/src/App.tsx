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
            // Manager eras lead with the story and the clips, so Core Ideas
            // starts closed there; keyed so switching era re-applies it.
            <details
              className="tip-box collapsible-box"
              data-testid="panel-core-ideas"
              key={activeEra ? activeEra.id : formation.name}
              open={!activeEra}
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
