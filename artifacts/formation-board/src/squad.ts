// ---------------------------------------------------------------------------
// Who the players are.
//
// The app assigns every attribute. Nobody is asked to rate twenty-two players
// before a match — that is admin, not tactics — and when you field Sacchi's
// Milan, Baresi has to be Baresi or there was no point picking them.
//
// So a player's numbers come from two places, in this order:
//
//   1. His position. A centre-back defends, a winger runs, a ten sees a pass.
//      This alone gives a complete, sensible team for any of the 29 shapes.
//   2. Who he actually was, when the side is a manager's real XI. Only where
//      the quality is the thing everyone knows him for — Xavi's passing,
//      Maldini's defending, Mbappé's pace. Everything else stays on the
//      positional baseline, because inventing a number for all 451 players
//      across 41 eras would be making it up.
//
// Every attribute has to do something visible in match-model.ts or it is
// decoration. See the block comment above `quality` there.
// ---------------------------------------------------------------------------

import type { Era, Manager } from './managers';
import { MANAGERS } from './managers';
import type { StanceId, StyleId } from './match-model';

/** Everything is on the familiar 1-20 scale, where 12 is an ordinary starter. */
export type Attributes = {
  /** Weight and accuracy of the ball he plays. */
  passing: number;
  /** Getting in behind, driving with it, breaking away. */
  pace: number;
  /** Taking it in and keeping it under pressure. */
  touch: number;
  /** Winning it back. For a keeper this is his shot-stopping. */
  tackling: number;
  /** Putting it away. */
  finishing: number;
};

export const AVERAGE = 12;

/** How far above or below an ordinary starter, as -0.92 … +0.67. */
export const edge = (value: number) => (value - AVERAGE) / AVERAGE;

const attrs = (
  passing: number,
  pace: number,
  touch: number,
  tackling: number,
  finishing: number,
): Attributes => ({ passing, pace, touch, tackling, finishing });

/**
 * The positional baseline. These are deliberately unremarkable: the shape of
 * a team, not a rating of one. A full-back is quicker than a centre-back and
 * worse at defending; a ten passes and touches well and does not tackle.
 */
const ROLE_BASE: Record<string, Attributes> = {
  //          pass pace touch tackle finish
  GK: attrs(9, 7, 11, 15, 2),
  CB: attrs(10, 10, 10, 16, 6),
  FB: attrs(12, 14, 11, 13, 6),
  WB: attrs(12, 15, 12, 12, 7),
  DM: attrs(14, 10, 13, 15, 7),
  CM: attrs(15, 12, 14, 12, 10),
  WM: attrs(13, 15, 13, 10, 10),
  AM: attrs(16, 13, 16, 8, 13),
  W: attrs(13, 17, 15, 7, 14),
  ST: attrs(11, 14, 14, 6, 17),
};

/** match-model's role vocabulary, folded onto the ten baselines above. */
const ROLE_GROUP: Record<string, keyof typeof ROLE_BASE> = {
  GK: 'GK',
  LB: 'FB',
  RB: 'FB',
  CB: 'CB',
  LCB: 'CB',
  RCB: 'CB',
  LWB: 'WB',
  RWB: 'WB',
  DM: 'DM',
  LDM: 'DM',
  RDM: 'DM',
  CM: 'CM',
  LCM: 'CM',
  RCM: 'CM',
  LM: 'WM',
  RM: 'WM',
  AM: 'AM',
  LAM: 'AM',
  RAM: 'AM',
  LW: 'W',
  RW: 'W',
  ST: 'ST',
  LST: 'ST',
  RST: 'ST',
};

export const baseAttributes = (role: string): Attributes => ({
  ...(ROLE_BASE[ROLE_GROUP[role] ?? 'CM'] ?? ROLE_BASE.CM),
});

/**
 * What a player is famous for, keyed by the name exactly as the era's XI
 * spells it. Only the qualities that are genuinely the first thing anyone says
 * about him — nothing here is a guess at a rating, and anyone not listed simply
 * keeps his positional baseline.
 *
 * A few surnames belong to two different players across the eras, so those are
 * keyed `eraId/Name`, which is checked before the bare name.
 */
const STANDOUTS: Record<string, Partial<Attributes>> = {
  // --- keepers: tackling is shot-stopping, passing is distribution ---------
  Schmeichel: { tackling: 19 },
  Neuer: { tackling: 18, passing: 16 },
  Buffon: { tackling: 19 },
  Casillas: { tackling: 19 },
  Oblak: { tackling: 19 },
  Ederson: { tackling: 15, passing: 18 },
  Alisson: { tackling: 18, passing: 15 },
  'Van der Sar': { tackling: 17, passing: 15 },
  'De Gea': { tackling: 18 },
  Čech: { tackling: 18 },
  Donnarumma: { tackling: 18 },
  Courtois: { tackling: 18 },
  'Ter Stegen': { tackling: 17, passing: 17 },
  Zubizarreta: { tackling: 17 },
  Clemence: { tackling: 18 },
  Grobbelaar: { tackling: 16 },
  Navas: { tackling: 17 },
  Dida: { tackling: 16 },
  'Júlio César': { tackling: 17 },
  'Vítor Baía': { tackling: 17 },
  Raya: { tackling: 16, passing: 15 },
  Adán: { tackling: 16 },
  // Two different Martínezes and two different Gallis, so both are scoped.
  'emery-villa-24/Martínez': { tackling: 17 },
  'sacchi-milan-89/Galli': { tackling: 16 },

  // --- defenders ----------------------------------------------------------
  Baresi: { tackling: 20, passing: 16, touch: 14 },
  Maldini: { tackling: 19, pace: 15, touch: 15 },
  Nesta: { tackling: 19 },
  Cannavaro: { tackling: 19, pace: 14 },
  'Van Dijk': { tackling: 19, pace: 15, passing: 14 },
  Stam: { tackling: 19 },
  Godín: { tackling: 19 },
  Vidić: { tackling: 19 },
  Puyol: { tackling: 18 },
  Terry: { tackling: 18 },
  Ferdinand: { tackling: 18, passing: 14, pace: 14 },
  Ramos: { tackling: 18, finishing: 12 },
  Carvalho: { tackling: 18 },
  'Thiago Silva': { tackling: 18 },
  Samuel: { tackling: 18 },
  Campbell: { tackling: 18, pace: 15 },
  Piqué: { tackling: 17, passing: 15 },
  Costacurta: { tackling: 17 },
  Marquinhos: { tackling: 17 },
  Boateng: { tackling: 17, passing: 14 },
  Saliba: { tackling: 17, pace: 15 },
  Carragher: { tackling: 17 },
  Hyypiä: { tackling: 17 },
  Materazzi: { tackling: 17 },
  Lúcio: { tackling: 17, pace: 14 },
  Rüdiger: { tackling: 17, pace: 15 },
  Tah: { tackling: 17 },
  Kim: { tackling: 17, pace: 15 },
  Krol: { tackling: 17, passing: 15 },
  Hansen: { tackling: 17, passing: 15 },
  Koeman: { passing: 18, finishing: 14, tackling: 15 },
  Lahm: { tackling: 16, passing: 16, touch: 16 },
  Azpilicueta: { tackling: 16 },
  Gabriel: { tackling: 16 },
  Coates: { tackling: 16 },
  Upamecano: { pace: 16, tackling: 15 },
  Konsa: { tackling: 15 },
  'Pau Torres': { passing: 15, tackling: 15 },
  'Alexander-Arnold': { passing: 18, pace: 14 },
  Alaba: { passing: 15, pace: 14 },
  Davies: { pace: 19 },
  Walker: { pace: 19 },
  Hakimi: { pace: 18 },
  Frimpong: { pace: 18 },
  Alves: { pace: 15, passing: 15 },
  Marcelo: { pace: 15, touch: 15 },
  Robertson: { pace: 15, passing: 15 },
  Grimaldo: { passing: 16 },
  Trippier: { passing: 16 },

  // --- midfield -----------------------------------------------------------
  Xavi: { passing: 20, touch: 18 },
  Pirlo: { passing: 20, touch: 16 },
  'De Bruyne': { passing: 20, finishing: 15 },
  Iniesta: { touch: 19, passing: 18 },
  Kroos: { passing: 19, touch: 17 },
  Scholes: { passing: 19, finishing: 14 },
  'Xabi Alonso': { passing: 19 },
  Modrić: { passing: 18, touch: 18 },
  Thiago: { touch: 18, passing: 18 },
  Kimmich: { passing: 18, tackling: 15 },
  Sneijder: { passing: 18, finishing: 14 },
  Fàbregas: { passing: 18 },
  'van Hanegem': { passing: 18 },
  'D. Silva': { touch: 18, passing: 18 },
  Silva: { touch: 18, passing: 18 },
  Busquets: { passing: 17, touch: 17, tackling: 15 },
  Seedorf: { passing: 17, finishing: 14 },
  Gerrard: { passing: 17, finishing: 15, tackling: 15 },
  'Ødegaard': { passing: 17, touch: 17 },
  Jorginho: { passing: 17, touch: 16 },
  Deco: { passing: 17, touch: 16 },
  Banega: { passing: 17 },
  Vitinha: { passing: 17, touch: 17 },
  Schweinsteiger: { passing: 17, tackling: 16 },
  Albertini: { passing: 17 },
  Wirtz: { touch: 18, passing: 17 },
  Musiala: { touch: 18, pace: 16 },
  Kaká: { pace: 18, touch: 17, finishing: 15 },
  Barnes: { pace: 17, touch: 17 },
  Kanté: { tackling: 19, pace: 16 },
  Keane: { tackling: 18, passing: 15 },
  Makélélé: { tackling: 18 },
  Vieira: { tackling: 18, pace: 14, passing: 15 },
  Gattuso: { tackling: 18 },
  Casemiro: { tackling: 18 },
  Rijkaard: { tackling: 17, passing: 16 },
  Neeskens: { tackling: 17, pace: 15 },
  Fernandinho: { tackling: 17 },
  Cambiasso: { tackling: 17 },
  Senna: { tackling: 17, passing: 15 },
  Rice: { tackling: 17, passing: 15 },
  Zanetti: { tackling: 16, pace: 15 },
  Costinha: { tackling: 16 },
  Krychowiak: { tackling: 16 },
  'N’Zonzi': { tackling: 16 },
  Gabi: { tackling: 16 },
  McMahon: { tackling: 16 },
  Xhaka: { passing: 16 },
  Carrick: { passing: 16 },
  Koke: { passing: 16 },
  Tielemans: { passing: 16 },
  Lampard: { finishing: 16, passing: 15 },
  Rooney: { finishing: 16, passing: 16 },
  Hjulmand: { tackling: 15, passing: 15 },
  Ballack: { finishing: 14, passing: 15 },
  Palacios: { tackling: 15 },
  Pavlović: { tackling: 15 },
  Morita: { passing: 15 },
  Maniche: { passing: 15 },
  Whelan: { passing: 15 },
  Milne: { tackling: 15 },
  Case: { tackling: 15 },
  Saúl: { tackling: 14 },
  McGinn: { tackling: 14 },
  Goretzka: { pace: 14, finishing: 13 },

  // --- attack -------------------------------------------------------------
  Messi: { touch: 20, finishing: 19, passing: 18, pace: 16 },
  Cruyff: { touch: 19, passing: 18, pace: 17, finishing: 16 },
  Ronaldo: { finishing: 19, pace: 18 },
  'Van Basten': { finishing: 19, touch: 17 },
  'Romário': { finishing: 19 },
  Lewandowski: { finishing: 19 },
  Kane: { finishing: 19, passing: 17 },
  'Mbappé': { pace: 20, finishing: 17 },
  Henry: { pace: 19, finishing: 18 },
  Bale: { pace: 19, finishing: 16 },
  Bergkamp: { touch: 19, passing: 17, finishing: 16 },
  Neymar: { touch: 19, pace: 17, finishing: 15 },
  Drogba: { finishing: 18, touch: 15 },
  'Suárez': { finishing: 18, touch: 17 },
  'Agüero': { finishing: 18 },
  Inzaghi: { finishing: 18 },
  'Van Persie': { finishing: 18 },
  "Eto'o": { finishing: 18, pace: 16 },
  Beckham: { passing: 20 },
  Giggs: { pace: 18, touch: 16 },
  Salah: { pace: 18, finishing: 17 },
  'Mané': { pace: 18, finishing: 16 },
  Robben: { pace: 18, finishing: 16 },
  'Sané': { pace: 18 },
  Sterling: { pace: 18 },
  Coman: { pace: 18 },
  'Dembélé': { pace: 18, touch: 16 },
  Totti: { touch: 18, passing: 18, finishing: 16 },
  'Savićević': { touch: 18 },
  Kvaratskhelia: { touch: 18, pace: 16 },
  'Ribéry': { pace: 17, touch: 16 },
  Torres: { pace: 17, finishing: 16 },
  Martinelli: { pace: 17 },
  Carrasco: { pace: 17 },
  Werner: { pace: 17 },
  Diaby: { pace: 17 },
  Villa: { finishing: 17 },
  Stoichkov: { finishing: 17, pace: 16 },
  Benzema: { finishing: 17, touch: 17, passing: 16 },
  'Gyökeres': { finishing: 17, pace: 16 },
  'Diego Costa': { finishing: 17 },
  Aldridge: { finishing: 17 },
  Milito: { finishing: 17 },
  'Di María': { passing: 17, pace: 16 },
  Firmino: { touch: 17, passing: 16 },
  Beardsley: { touch: 17 },
  'João Félix': { touch: 17 },
  Olise: { touch: 17, passing: 16 },
  Isco: { touch: 17, passing: 16 },
  Gullit: { pace: 16, touch: 17, finishing: 15 },
  'Müller': { finishing: 16, touch: 15 },
  Keegan: { pace: 16, finishing: 16, touch: 16 },
  Watkins: { pace: 16, finishing: 16 },
  Anelka: { pace: 16, finishing: 16 },
  Rensenbrink: { touch: 16, pace: 16 },
  Saka: { pace: 16, touch: 16 },
  'Doué': { touch: 16, pace: 16 },
  Pires: { touch: 16, passing: 16 },
  Kagawa: { touch: 16 },
  'Arda Turan': { touch: 16 },
  Donadoni: { touch: 16, pace: 15 },
  Gnabry: { pace: 16, finishing: 15 },
  Pedro: { pace: 16 },
  Ljungberg: { pace: 16 },
  Duff: { pace: 16 },
  Heighway: { pace: 16 },
  Valencia: { pace: 16 },
  Llorente: { pace: 16 },
  Toni: { finishing: 16 },
  Boniface: { finishing: 15 },
  Havertz: { touch: 15 },
  'Tévez': { finishing: 15, touch: 15 },
  Yorke: { finishing: 15 },
  Cole: { finishing: 15 },
  'St John': { finishing: 15 },
  Hunt: { finishing: 15 },
  Massaro: { finishing: 15 },
  'Luis García': { finishing: 15 },
  Rep: { finishing: 15 },
  Derlei: { finishing: 15 },
  Gameiro: { finishing: 15 },
  'Mandžukić': { finishing: 15 },
  Paulinho: { finishing: 15 },
  'Trincão': { touch: 15 },
  Mount: { passing: 15 },
  Malouda: { pace: 15 },
  Vitolo: { pace: 15 },
  Bailey: { pace: 16 },
  Catamo: { pace: 15 },
  Camoranesi: { pace: 15 },
  Houghton: { pace: 14 },
  Pandev: { touch: 14 },
  Hofmann: { touch: 14 },
};

/** One player of an era's XI, ready to be built into a team. */
export type SquadEntry = {
  name: string;
  number: number;
  /** Only what he is famous for; the rest comes from the position he fills. */
  standout: Partial<Attributes>;
};

/**
 * An era's XI in the order buildTeam lays a shape out — keeper, then the back
 * line left to right, then each line in front of it. The editorial `xi` arrays
 * are already written in exactly that order, which is how the board has always
 * placed them on the pitch.
 */
export function squadForEra(era: Era): SquadEntry[] {
  return era.xi.map((name, index) => ({
    name,
    number: era.numbers[index] ?? index + 1,
    standout: STANDOUTS[`${era.id}/${name}`] ?? STANDOUTS[name] ?? {},
  }));
}

// ---------------------------------------------------------------------------
// How a manager's side plays
// ---------------------------------------------------------------------------

/**
 * A manager's identity is their style, not their shape. Mourinho's 4-2-3-1 and
 * Flick's 4-2-3-1 are not the same team, so the shape alone cannot decide it.
 */
const MANAGER_STYLE: Record<string, StyleId> = {
  'Alex Ferguson': 'direct',
  'Pep Guardiola': 'possession',
  'José Mourinho': 'pragmatic',
  'Carlo Ancelotti': 'possession',
  'Johan Cruyff': 'possession',
  'Arsène Wenger': 'possession',
  'Luis Enrique': 'possession',
  'Jürgen Klopp': 'direct',
  'Zinédine Zidane': 'pragmatic',
  'Mikel Arteta': 'possession',
  'Unai Emery': 'pragmatic',
  'Xabi Alonso': 'possession',
  'Rúben Amorim': 'possession',
  'Hansi Flick': 'direct',
  'Diego Simeone': 'pragmatic',
  'Vincent Kompany': 'possession',
  'Thomas Tuchel': 'pragmatic',
  'Luis Aragonés': 'possession',
  'Rafael Benítez': 'pragmatic',
  'Fabio Capello': 'pragmatic',
  'Kenny Dalglish': 'direct',
  'Vicente del Bosque': 'possession',
  'Jupp Heynckes': 'direct',
  'Marcello Lippi': 'pragmatic',
  'Rinus Michels': 'possession',
  'Bob Paisley': 'possession',
  'Arrigo Sacchi': 'direct',
  'Bill Shankly': 'direct',
};

/** The shape they default to without the ball, which is the other half of it. */
const MANAGER_STANCE: Record<string, StanceId> = {
  'Alex Ferguson': 'press',
  'Pep Guardiola': 'press',
  'José Mourinho': 'drop',
  'Carlo Ancelotti': 'narrow',
  'Johan Cruyff': 'squeeze',
  'Arsène Wenger': 'press',
  'Luis Enrique': 'press',
  'Jürgen Klopp': 'press',
  'Zinédine Zidane': 'drop',
  'Mikel Arteta': 'press',
  'Unai Emery': 'narrow',
  'Xabi Alonso': 'squeeze',
  'Rúben Amorim': 'press',
  'Hansi Flick': 'squeeze',
  'Diego Simeone': 'drop',
  'Vincent Kompany': 'squeeze',
  'Thomas Tuchel': 'narrow',
  'Luis Aragonés': 'press',
  'Rafael Benítez': 'narrow',
  'Fabio Capello': 'trap',
  'Kenny Dalglish': 'press',
  'Vicente del Bosque': 'press',
  'Jupp Heynckes': 'press',
  'Marcello Lippi': 'man',
  'Rinus Michels': 'squeeze',
  'Bob Paisley': 'narrow',
  'Arrigo Sacchi': 'trap',
  'Bill Shankly': 'press',
};

export const styleForManager = (name: string): StyleId => MANAGER_STYLE[name] ?? 'possession';
export const stanceForManager = (name: string): StanceId => MANAGER_STANCE[name] ?? 'squeeze';

/** An era plus the manager who ran it, which is what a side really is. */
export type Dugout = { era: Era; manager: Manager };

export const DUGOUTS: Dugout[] = MANAGERS.flatMap((manager) =>
  manager.eras.map((era) => ({ era, manager })),
).sort(
  (a, b) =>
    a.manager.sortName.localeCompare(b.manager.sortName) ||
    a.era.years.localeCompare(b.era.years),
);

export const dugoutById = (id: string) => DUGOUTS.find((entry) => entry.era.id === id) ?? null;

/** 'Sacchi — AC Milan 1988-90' — how a side is named in the picker. */
export const dugoutLabel = (entry: Dugout) =>
  `${entry.manager.sortName} — ${entry.era.club} ${entry.era.years}`;
