// ---------------------------------------------------------------------------
// The rest of the squad.
//
// managers.ts holds each era's eleven. That is the side you see on the board,
// but it is never the side that won anything on its own.
//
// This module names everyone else who actually played, keyed by era id, the
// same way ERA_CONTENT in formation-content.ts is. The bar is more than ten
// appearances in the season the counts come from — below that a player was
// passing through, not part of the side.
//
// Counts were read off that season's squad-appearance table in the Wikipedia
// season article, so the shirt numbers are the ones actually worn. Three
// things vary and are recorded per era rather than smoothed over:
//
//   basis 'all'    — appearances in every competition. Most eras.
//   basis 'league' — that article only tabulates the league. Said on the page.
//   basis 'squad'  — no appearance table exists (Porto 2003-04), or the side
//                    is a national team, where a tournament is seven games and
//                    a ten-game bar is meaningless. Then it is the squad.
//
// A multi-season era gets one representative season — the one the board's
// eleven is drawn from — and `season` says which.
//
// Numbers are omitted, not invented, for sides that played before fixed squad
// numbers: English football before 1993, Serie A and La Liga before the
// mid-nineties.
// ---------------------------------------------------------------------------

/** A squad player who was not in the era's eleven but played for the side. */
export type SubPlayer = {
  name: string;
  /** Shirt number worn that season. Absent before fixed squad numbers. */
  number?: number;
  /** Position code, from the same vocabulary as the board's roles. */
  role: string;
  /** Appearances on the era's stated basis. Absent when basis is 'squad'. */
  apps?: number;
  goals?: number;
  /** Only where there is something to say. Most players need no sentence. */
  note?: string;
};

export type EraBench = {
  /** The single season these counts come from. */
  season: string;
  basis: 'all' | 'league' | 'squad';
  /** Ordered by appearances, most first. */
  players: SubPlayer[];
  /**
   * Under the bar, and still part of the story: the teenager who debuted, the
   * signing whose season was a knee ligament, the veteran on his farewell.
   * Filled from ERA_TAIL at the bottom of this file. Every entry here has to
   * say why it is here — an appearance count alone is not a reason.
   */
  tail?: SubPlayer[];
};

export const ERA_BENCH: Record<string, EraBench> = {
  'fergie-99': {
    season: '1998-99',
    basis: 'all',
    players: [
      { name: 'Nicky Butt', number: 8, role: 'CM', apps: 47, goals: 2, note: 'Started the 1999 final in central midfield with Keane suspended.' },
      { name: 'Phil Neville', number: 12, role: 'LB', apps: 44, goals: 1 },
      { name: 'Jesper Blomqvist', number: 15, role: 'LM', apps: 38, goals: 1, note: 'Started the final on the left so Giggs could switch to the right.' },
      { name: 'Ole Gunnar Solskjær', number: 20, role: 'ST', apps: 37, goals: 18, note: 'The winner in the 1999 final, ninety seconds after coming on.' },
      { name: 'Henning Berg', number: 21, role: 'CB', apps: 29, goals: 0 },
      { name: 'Teddy Sheringham', number: 10, role: 'SS', apps: 27, goals: 5, note: 'Came off the bench in both finals and scored in each.' },
      { name: 'Wes Brown', number: 24, role: 'CB', apps: 21, goals: 0 },
      { name: 'Jordi Cruyff', number: 14, role: 'AM', apps: 11, goals: 2 },
    ],
  },

  'fergie-08': {
    season: '2007-08',
    basis: 'all',
    players: [
      { name: 'Ryan Giggs', number: 11, role: 'LM', apps: 43, goals: 4, note: 'Equalled Bobby Charlton’s appearance record in the final itself.' },
      { name: 'Nani', number: 17, role: 'RW', apps: 41, goals: 4 },
      { name: 'John O’Shea', number: 22, role: 'DEF', apps: 38, goals: 0, note: 'Filled in at both full-back slots and centre-half.' },
      { name: 'Anderson', number: 8, role: 'CM', apps: 38, goals: 0 },
      { name: 'Louis Saha', number: 9, role: 'ST', apps: 24, goals: 5 },
      { name: 'Darren Fletcher', number: 24, role: 'CM', apps: 24, goals: 2, note: 'Sent off in the semi-final against Barcelona, so missed the final.' },
      { name: 'Park Ji-sung', number: 13, role: 'RM', apps: 18, goals: 1, note: 'Left out of the matchday squad in Moscow after playing the semi-final.' },
      { name: 'Tomasz Kuszczak', number: 29, role: 'GK', apps: 16, goals: 0 },
      { name: 'Gerard Piqué', number: 19, role: 'CB', apps: 13, goals: 2, note: 'Twenty, and back at Barcelona within a year.' },
    ],
  },

  'fergie-13': {
    season: '2012-13',
    basis: 'all',
    players: [
      { name: 'Danny Welbeck', number: 19, role: 'ST', apps: 40, goals: 2 },
      { name: 'Javier Hernández', number: 14, role: 'ST', apps: 36, goals: 18, note: 'Third choice up front and still 18 goals, most of them from the bench.' },
      { name: 'Ryan Giggs', number: 11, role: 'CM', apps: 32, goals: 5, note: 'Thirty-nine, and by now a central midfielder.' },
      { name: 'Jonny Evans', number: 6, role: 'CB', apps: 30, goals: 4, note: 'Played more than Vidić as the pair ahead of him broke down.' },
      { name: 'Anderson', number: 8, role: 'CM', apps: 26, goals: 2 },
      { name: 'Phil Jones', number: 4, role: 'DEF', apps: 24, goals: 0 },
      { name: 'Ashley Young', number: 18, role: 'LM', apps: 23, goals: 0 },
      { name: 'Chris Smalling', number: 12, role: 'CB', apps: 22, goals: 0 },
      { name: 'Nani', number: 17, role: 'RW', apps: 21, goals: 3 },
      { name: 'Paul Scholes', number: 22, role: 'CM', apps: 21, goals: 1, note: 'Came out of retirement the season before, and retired again at the end of this one.' },
      { name: 'Alexander Büttner', number: 28, role: 'LB', apps: 13, goals: 2 },
      { name: 'Anders Lindegaard', number: 13, role: 'GK', apps: 13, goals: 0 },
    ],
  },

  'pep-barca': {
    season: '2010-11',
    basis: 'all',
    players: [
      { name: 'Javier Mascherano', number: 14, role: 'DM', apps: 35, goals: 0, note: 'Bought as a midfielder, turned into a centre-back, and started the 2011 final there.' },
      { name: 'Maxwell', number: 19, role: 'LB', apps: 31, goals: 0 },
      { name: 'Seydou Keita', number: 15, role: 'CM', apps: 27, goals: 6, note: 'The extra midfielder for three seasons without ever owning a shirt.' },
      { name: 'Adriano', number: 21, role: 'LB', apps: 23, goals: 0, note: 'Covered both full-back positions and the left wing.' },
      { name: 'Bojan Krkić', number: 9, role: 'ST', apps: 17, goals: 7 },
      { name: 'José Manuel Pinto', number: 13, role: 'GK', apps: 17, goals: 0, note: 'Valdés’s deputy, and the cup goalkeeper.' },
      { name: 'Gabriel Milito', number: 18, role: 'CB', apps: 12, goals: 1 },
    ],
  },

  'pep-bayern': {
    season: '2014-15',
    basis: 'all',
    players: [
      { name: 'Juan Bernat', number: 18, role: 'LB', apps: 44, goals: 1, note: 'Left-back for most of the season with Alaba moved inside.' },
      { name: 'Mario Götze', number: 19, role: 'AM', apps: 42, goals: 15, note: 'Bought to give Guardiola a second player between the lines.' },
      { name: 'Rafinha', number: 13, role: 'RB', apps: 39, goals: 0, note: 'Took right-back whenever Lahm was moved into midfield.' },
      { name: 'Dante', number: 4, role: 'CB', apps: 38, goals: 0 },
      { name: 'Sebastian Rode', number: 20, role: 'CM', apps: 30, goals: 3 },
      { name: 'Bastian Schweinsteiger', number: 31, role: 'CM', apps: 26, goals: 5, note: 'The club captain, by now a rotation midfielder rather than a fixture.' },
      { name: 'Medhi Benatia', number: 5, role: 'CB', apps: 22, goals: 2 },
      { name: 'Claudio Pizarro', number: 14, role: 'ST', apps: 17, goals: 1, note: 'Lewandowski’s understudy at 36.' },
      { name: 'Mitchell Weiser', number: 30, role: 'RB', apps: 16, goals: 1 },
      { name: 'Xherdan Shaqiri', number: 11, role: 'RW', apps: 14, goals: 2 },
      { name: 'Holger Badstuber', number: 28, role: 'CB', apps: 13, goals: 1 },
      { name: 'Pierre-Emile Højbjerg', number: 34, role: 'CM', apps: 11, goals: 0 },
    ],
  },

  'pep-city': {
    season: '2017-18',
    basis: 'all',
    players: [
      { name: 'Bernardo Silva', number: 20, role: 'RW', apps: 53, goals: 9, note: 'More games than anyone, and no settled position — wide right, then central.' },
      { name: 'İlkay Gündoğan', number: 8, role: 'CM', apps: 48, goals: 6 },
      { name: 'Gabriel Jesus', number: 33, role: 'ST', apps: 42, goals: 17, note: 'Agüero’s alternative, and sometimes his partner.' },
      { name: 'Danilo', number: 3, role: 'RB', apps: 38, goals: 3 },
      { name: 'Vincent Kompany', number: 4, role: 'CB', apps: 21, goals: 2, note: 'The captain, by then fit for about half a season at a time.' },
      { name: 'Yaya Touré', number: 42, role: 'CM', apps: 17, goals: 0, note: 'Last season at the club, eight years after arriving.' },
      { name: 'Eliaquim Mangala', number: 15, role: 'CB', apps: 15, goals: 0 },
      { name: 'Oleksandr Zinchenko', number: 35, role: 'LB', apps: 14, goals: 0, note: 'A midfielder converted to left-back to cover for Mendy’s knee.' },
      { name: 'Aymeric Laporte', number: 14, role: 'CB', apps: 13, goals: 0, note: 'Signed in January and first-choice centre-half the season after.' },
      { name: 'Claudio Bravo', number: 1, role: 'GK', apps: 13, goals: 0 },
    ],
  },

  'mou-porto': {
    season: '2003-04',
    basis: 'squad',
    players: [
      { name: 'Benni McCarthy', number: 77, role: 'ST', note: 'Top scorer with 20 in the league, and both goals in the home win over Manchester United.' },
      { name: 'Dmitri Alenichev', number: 15, role: 'AM', note: 'Came on in the 2004 final and scored the third.' },
      { name: 'Edgaras Jankauskas', number: 9, role: 'ST', note: 'The target man for when Porto needed to hold the ball up.' },
      { name: 'Sérgio Conceição', number: 14, role: 'RM', note: 'Wide midfield cover, and later the manager who won Porto the league.' },
      { name: 'Pedro Emanuel', number: 3, role: 'CB', note: 'Third centre-half behind Jorge Costa and Carvalho.' },
      { name: 'José Bosingwa', number: 17, role: 'RB', note: 'Twenty-one, and full-back cover behind Paulo Ferreira.' },
      { name: 'Nuno', number: 13, role: 'GK', note: 'Vítor Baía’s deputy, and later the manager of Porto, Wolves and Forest.' },
      { name: 'Ricardo Costa', number: 5, role: 'CB' },
      { name: 'Carlos Secretário', number: 7, role: 'RB' },
      { name: 'César Peixoto', number: 16, role: 'LB' },
      { name: 'Maciel', number: 21, role: 'ST' },
      { name: 'Bruno Moraes', number: 28, role: 'ST' },
      { name: 'Marco Ferreira', number: 20, role: 'CM' },
      { name: 'Ricardo Fernandes', number: 25, role: 'CM' },
    ],
  },

  'mou-chelsea': {
    season: '2004-05',
    basis: 'all',
    players: [
      { name: 'Eiður Guðjohnsen', number: 22, role: 'SS', apps: 47, goals: 16, note: 'The forward who dropped in behind Drogba.' },
      { name: 'Mateja Kežman', number: 9, role: 'ST', apps: 38, goals: 6, note: 'Signed after 100 goals in Holland and used almost entirely from the bench.' },
      { name: 'Joe Cole', number: 10, role: 'LW', apps: 35, goals: 9, note: 'Brought on when a closed game needed opening up.' },
      { name: 'Wayne Bridge', number: 18, role: 'LB', apps: 22, goals: 0, note: 'Left-back until a broken ankle in February ended his season.' },
      { name: 'Glen Johnson', number: 2, role: 'RB', apps: 22, goals: 0 },
      { name: 'Alexey Smertin', number: 5, role: 'CM', apps: 19, goals: 1 },
      { name: 'Geremi', number: 14, role: 'RM', apps: 16, goals: 0 },
      { name: 'Jiří Jarošík', number: 27, role: 'CM', apps: 16, goals: 0 },
      { name: 'Robert Huth', number: 29, role: 'CB', apps: 12, goals: 0 },
      { name: 'Carlo Cudicini', number: 23, role: 'GK', apps: 11, goals: 0, note: 'Lost the shirt to Čech and became the cup goalkeeper.' },
    ],
  },

  'mou-inter': {
    season: '2009-10',
    basis: 'league',
    players: [
      { name: 'Dejan Stanković', number: 5, role: 'CM', apps: 24, goals: 3, note: 'The fourth midfielder in a four-man rotation.' },
      { name: 'Thiago Motta', number: 8, role: 'DM', apps: 18, goals: 4, note: 'Sent off early in the semi-final at the Camp Nou, which is why Inter defended with ten.' },
      { name: 'Sulley Muntari', number: 11, role: 'CM', apps: 16, goals: 2 },
      { name: 'Iván Córdoba', number: 2, role: 'CB', apps: 15, goals: 0 },
      { name: 'Mario Balotelli', number: 45, role: 'ST', apps: 13, goals: 9, note: 'Nineteen, and used whenever Milito or Eto’o needed resting.' },
    ],
  },

  'carlo-milan': {
    season: '2006-07',
    basis: 'league',
    players: [
      { name: 'Alberto Gilardino', number: 11, role: 'ST', apps: 29, goals: 12, note: 'Inzaghi’s alternative, and the league’s form striker that winter.' },
      { name: 'Daniele Bonera', number: 25, role: 'CB', apps: 29, goals: 0 },
      { name: 'Cristian Brocchi', number: 32, role: 'DM', apps: 29, goals: 1 },
      { name: 'Cafu', number: 2, role: 'RB', apps: 28, goals: 0, note: 'Right-back for four of the five years, until Oddo arrived in January.' },
      { name: 'Ricardo Oliveira', number: 7, role: 'RM', apps: 26, goals: 3 },
      { name: 'Dario Šimić', number: 17, role: 'CB', apps: 23, goals: 0 },
      { name: 'Yoann Gourcuff', number: 20, role: 'AM', apps: 21, goals: 1 },
      { name: 'Kakhaber Kaladze', number: 4, role: 'CB', apps: 18, goals: 1, note: 'Left-sided centre-half behind Nesta and Maldini.' },
      { name: 'Giuseppe Favalli', number: 19, role: 'LB', apps: 15, goals: 2 },
      { name: 'Željko Kalac', number: 16, role: 'GK', apps: 13, goals: 0 },
      { name: 'Ronaldo', number: 99, role: 'ST', apps: 12, goals: 7, note: 'Joined in January and was cup-tied for the whole European run.' },
    ],
  },

  'carlo-chelsea': {
    season: '2009-10',
    basis: 'all',
    players: [
      { name: 'Salomon Kalou', number: 21, role: 'RW', apps: 34, goals: 12 },
      { name: 'Joe Cole', number: 10, role: 'AM', apps: 34, goals: 2, note: 'Last season at the club after seven years.' },
      { name: 'Ricardo Carvalho', number: 6, role: 'CB', apps: 27, goals: 0, note: 'Terry’s partner of five years, down to 27 games as Alex took the shirt.' },
      { name: 'Deco', number: 20, role: 'AM', apps: 23, goals: 3 },
      { name: 'Yuri Zhirkov', number: 18, role: 'LM', apps: 22, goals: 0 },
      { name: 'Paulo Ferreira', number: 19, role: 'RB', apps: 20, goals: 1 },
      { name: 'Daniel Sturridge', number: 23, role: 'ST', apps: 19, goals: 5 },
      { name: 'Michael Essien', number: 5, role: 'CM', apps: 19, goals: 4, note: 'Out for half the season, which is why Mikel and Ballack played.' },
      { name: 'Juliano Belletti', number: 35, role: 'RB', apps: 16, goals: 0 },
    ],
  },

  'carlo-decima': {
    season: '2013-14',
    basis: 'all',
    players: [
      { name: 'Diego López', number: 25, role: 'GK', apps: 36, goals: 0, note: 'Played more than Casillas, who was given the cups instead.' },
      { name: 'Isco', number: 23, role: 'AM', apps: 35, goals: 8, note: 'Signed that summer for 30m as the extra man in midfield.' },
      { name: 'Marcelo', number: 12, role: 'LB', apps: 32, goals: 1, note: 'Left-back for most of the season, with Coentrão preferred for the final.' },
      { name: 'Asier Illarramendi', number: 24, role: 'DM', apps: 27, goals: 2, note: 'Bought as Xabi Alonso’s successor at 22.' },
      { name: 'Álvaro Arbeloa', number: 17, role: 'RB', apps: 26, goals: 0 },
      { name: 'Raphaël Varane', number: 2, role: 'CB', apps: 17, goals: 0, note: 'Twenty-one, and started the final ahead of Pepe.' },
      { name: 'Sami Khedira', number: 6, role: 'DM', apps: 17, goals: 1, note: 'Started the 2014 final because Xabi Alonso was suspended for it.' },
      { name: 'Nacho', number: 18, role: 'DEF', apps: 13, goals: 0 },
      { name: 'Jesé', number: 20, role: 'ST', apps: 12, goals: 5, note: 'Ruptured a cruciate in March, which cost him the final.' },
    ],
  },

  'cruyff-barca': {
    season: '1993-94',
    basis: 'all',
    players: [
      { name: 'Jon Andoni Goikoetxea', role: 'RM', apps: 33, goals: 0 },
      { name: 'Michael Laudrup', role: 'AM', apps: 32, goals: 6, note: 'Left out of the 1994 final by the four-foreigner rule, and at Real Madrid by August.' },
      { name: 'Iván Iglesias', role: 'CM', apps: 28, goals: 4 },
      { name: 'Eusebio Sacristán', role: 'CM', apps: 22, goals: 1 },
      { name: 'Quique Estebaranz', role: 'RW', apps: 17, goals: 4 },
    ],
  },

  'wenger-invincibles': {
    season: '2003-04',
    basis: 'all',
    players: [
      { name: 'Edu', number: 17, role: 'CM', apps: 48, goals: 7, note: 'Understudy to both Vieira and Gilberto, and still 48 games.' },
      { name: 'Ray Parlour', number: 15, role: 'CM', apps: 37, goals: 0, note: 'The last of the side that won the double in 1998.' },
      { name: 'Nwankwo Kanu', number: 25, role: 'ST', apps: 24, goals: 3 },
      { name: 'Pascal Cygan', number: 18, role: 'CB', apps: 24, goals: 0 },
      { name: 'Gaël Clichy', number: 22, role: 'LB', apps: 22, goals: 0, note: 'Eighteen, and Ashley Cole’s replacement three years later.' },
      { name: 'José Antonio Reyes', number: 9, role: 'LW', apps: 21, goals: 5, note: 'Signed in January and went straight into the front line.' },
      { name: 'Sylvain Wiltord', number: 11, role: 'ST', apps: 20, goals: 4 },
      { name: 'Martin Keown', number: 5, role: 'CB', apps: 15, goals: 0, note: 'Wenger played him ten league games so he would qualify for a medal.' },
      { name: 'Jérémie Aliadière', number: 24, role: 'ST', apps: 15, goals: 4 },
    ],
  },

  'lucho-barca': {
    season: '2014-15',
    basis: 'all',
    players: [
      { name: 'Pedro', number: 7, role: 'RW', apps: 41, goals: 11, note: 'Fourth forward behind Messi, Suárez and Neymar, and still 41 games.' },
      { name: 'Claudio Bravo', number: 13, role: 'GK', apps: 37, goals: 0, note: 'Played the league and won the Zamora; ter Stegen played the cups.' },
      { name: 'Xavi', number: 6, role: 'CM', apps: 34, goals: 2, note: 'In his last season he was the substitute, and he came on in the final.' },
      { name: 'Jérémy Mathieu', number: 24, role: 'CB', apps: 32, goals: 3, note: 'Headed the opening goal in the 2-1 Clásico.' },
      { name: 'Rafinha', number: 12, role: 'CM', apps: 30, goals: 2 },
      { name: 'Marc Bartra', number: 15, role: 'CB', apps: 21, goals: 1 },
      { name: 'Adriano', number: 21, role: 'LB', apps: 21, goals: 2 },
      { name: 'Sergi Roberto', number: 20, role: 'CM', apps: 13, goals: 2 },
      { name: 'Martín Montoya', number: 2, role: 'RB', apps: 12, goals: 0 },
      { name: 'Munir El Haddadi', number: 31, role: 'ST', apps: 11, goals: 1 },
    ],
  },

  'lucho-psg': {
    season: '2024-25',
    basis: 'all',
    players: [
      { name: 'Bradley Barcola', number: 29, role: 'LW', apps: 47, goals: 21, note: 'The forward the front three rotates around.' },
      { name: 'Lee Kang-in', number: 19, role: 'AM', apps: 42, goals: 8 },
      { name: 'Warren Zaïre-Emery', number: 33, role: 'CM', apps: 38, goals: 3, note: 'Academy midfielder, behind Vitinha, Neves and Ruiz.' },
      { name: 'Lucas Beraldo', number: 4, role: 'CB', apps: 32, goals: 1 },
      { name: 'Gonçalo Ramos', number: 9, role: 'ST', apps: 31, goals: 19, note: 'The centre-forward when PSG want one, and scored in the 2025 final.' },
      { name: 'Lucas Hernández', number: 21, role: 'LB', apps: 20, goals: 0 },
      { name: 'Matvey Safonov', number: 39, role: 'GK', apps: 16, goals: 0 },
      { name: 'Senny Mayulu', number: 24, role: 'CM', apps: 16, goals: 6, note: 'Eighteen, and scored the fifth goal in the 2025 final.' },
      { name: 'Marco Asensio', number: 11, role: 'AM', apps: 14, goals: 2 },
      { name: 'Randal Kolo Muani', number: 23, role: 'ST', apps: 14, goals: 2 },
      { name: 'Ibrahim Mbaye', number: 49, role: 'RW', apps: 11, goals: 1 },
    ],
  },

  'klopp-liverpool': {
    season: '2018-19',
    basis: 'all',
    players: [
      { name: 'James Milner', number: 7, role: 'CM', apps: 45, note: 'Filled in at right-back, left-back and central midfield.' },
      { name: 'Naby Keïta', number: 8, role: 'CM', apps: 33 },
      { name: 'Xherdan Shaqiri', number: 23, role: 'RW', apps: 30, note: 'Two goals off the bench against Manchester United.' },
      { name: 'Daniel Sturridge', number: 15, role: 'ST', apps: 27 },
      { name: 'Joe Gomez', number: 12, role: 'CB', apps: 25, note: 'Van Dijk’s other partner until a broken leg in December.' },
      { name: 'Divock Origi', number: 27, role: 'ST', apps: 20, note: 'Two against Barcelona in the semi-final, and the second in the final.' },
      { name: 'Dejan Lovren', number: 6, role: 'CB', apps: 18 },
      { name: 'Adam Lallana', number: 20, role: 'AM', apps: 16 },
    ],
  },

  'zidane-undecima': {
    season: '2015-16',
    basis: 'all',
    players: [
      { name: 'Isco', number: 22, role: 'AM', apps: 39, goals: 3, note: 'Came on in the 2016 final.' },
      { name: 'Jesé', number: 20, role: 'ST', apps: 37, goals: 6 },
      { name: 'Mateo Kovačić', number: 16, role: 'CM', apps: 33, goals: 1 },
      { name: 'James Rodríguez', number: 10, role: 'AM', apps: 29, goals: 8, note: 'Increasingly a substitute once Zidane took over in January.' },
      { name: 'Lucas Vázquez', number: 18, role: 'RW', apps: 27, goals: 4, note: 'Took the first penalty of the shootout that won it.' },
      { name: 'Raphaël Varane', number: 2, role: 'CB', apps: 26, goals: 0 },
      { name: 'Danilo', number: 23, role: 'RB', apps: 24, goals: 2 },
      { name: 'Nacho', number: 6, role: 'DEF', apps: 17, goals: 2 },
    ],
  },

  'zidane-madrid': {
    season: '2016-17',
    basis: 'league',
    players: [
      { name: 'Lucas Vázquez', number: 17, role: 'RW', apps: 33, goals: 2 },
      { name: 'Nacho', number: 6, role: 'DEF', apps: 28, goals: 2, note: 'Played centre-half and both full-back positions.' },
      { name: 'Mateo Kovačić', number: 16, role: 'CM', apps: 27, goals: 1 },
      { name: 'Álvaro Morata', number: 21, role: 'ST', apps: 26, goals: 15, note: '15 league goals as Benzema’s replacement, then sold to Chelsea.' },
      { name: 'Marco Asensio', number: 20, role: 'LW', apps: 23, goals: 3, note: 'Twenty-one, and came on to score the fourth in the 2017 final.' },
      { name: 'James Rodríguez', number: 10, role: 'AM', apps: 22, goals: 8 },
      { name: 'Gareth Bale', number: 11, role: 'RW', apps: 19, goals: 7, note: 'Injured for much of it, and then scored twice off the bench in the 2018 final.' },
      { name: 'Danilo', number: 23, role: 'RB', apps: 17, goals: 1 },
      { name: 'Pepe', number: 3, role: 'CB', apps: 15, goals: 2, note: 'Last of ten seasons, with Varane now ahead of him.' },
      { name: 'Kiko Casilla', number: 13, role: 'GK', apps: 11, goals: 0 },
    ],
  },

  'arteta-arsenal-24': {
    season: '2023-24',
    basis: 'all',
    players: [
      { name: 'Leandro Trossard', number: 19, role: 'LW', apps: 46, note: '25 starts and 21 appearances off the bench — the most-used attacker.' },
      { name: 'Eddie Nketiah', number: 14, role: 'ST', apps: 37, note: '24 appearances from the bench, more than anyone else at the club.' },
      { name: 'Gabriel Jesus', number: 9, role: 'ST', apps: 36, note: 'Started the season as the centre-forward and ended it behind Havertz.' },
      { name: 'Jakub Kiwior', number: 15, role: 'CB', apps: 32, note: 'Third centre-half, and played left-back through the run-in.' },
      { name: 'Takehiro Tomiyasu', number: 18, role: 'RB', apps: 30, note: 'Cover at both full-back positions.' },
      { name: 'Reiss Nelson', number: 24, role: 'RW', apps: 23 },
      { name: 'Emile Smith Rowe', number: 10, role: 'AM', apps: 19 },
      { name: 'Thomas Partey', number: 5, role: 'DM', apps: 16, note: 'Out until March, which is why Jorginho played.' },
      { name: 'Fábio Vieira', number: 21, role: 'AM', apps: 16 },
      { name: 'Aaron Ramsdale', number: 1, role: 'GK', apps: 11, note: 'Lost the shirt to Raya in September and played the cups.' },
    ],
  },

  'emery-sevilla-16': {
    season: '2015-16',
    basis: 'all',
    players: [
      { name: 'Timothée Kolodziejczak', number: 5, role: 'CB', apps: 44, goals: 1 },
      { name: 'Coke', number: 23, role: 'RB', apps: 39, goals: 5, note: 'Scored twice in the 2016 Europa League final.' },
      { name: 'Benoît Trémoulinas', number: 2, role: 'LB', apps: 37, goals: 1 },
      { name: 'Vicente Iborra', number: 8, role: 'CM', apps: 33, goals: 8, note: 'Eight goals from midfield, most of them headers.' },
      { name: 'Michael Krohn-Dehli', number: 7, role: 'LM', apps: 29, goals: 4 },
      { name: 'Fernando Llorente', number: 24, role: 'ST', apps: 28, goals: 7, note: 'The target man behind Gameiro.' },
      { name: 'Sebastián Cristóforo', number: 14, role: 'CM', apps: 25, goals: 0 },
      { name: 'José Antonio Reyes', number: 10, role: 'RW', apps: 23, goals: 3, note: 'The only player to win the Europa League five times.' },
      { name: 'David Soria', number: 31, role: 'GK', apps: 13, goals: 0 },
    ],
  },

  'emery-villa-24': {
    season: '2023-24',
    basis: 'all',
    players: [
      { name: 'Nicolò Zaniolo', number: 22, role: 'AM', apps: 39, note: 'On loan from Galatasaray, across the front line.' },
      { name: 'Diego Carlos', number: 3, role: 'CB', apps: 38, note: 'The centre-half who played when Torres or Konsa did not.' },
      { name: 'Jhon Durán', number: 24, role: 'ST', apps: 37, note: 'Watkins’s understudy, with a habit of scoring in the last ten minutes.' },
      { name: 'Boubacar Kamara', number: 44, role: 'DM', apps: 30, note: 'Ruptured a cruciate in December.' },
      { name: 'Àlex Moreno', number: 15, role: 'LB', apps: 29 },
      { name: 'Clément Lenglet', number: 17, role: 'CB', apps: 25, note: 'On loan from Barcelona as the left-sided centre-half.' },
      { name: 'Jacob Ramsey', number: 41, role: 'CM', apps: 21 },
      { name: 'Morgan Rogers', number: 27, role: 'AM', apps: 16 },
      { name: 'Leander Dendoncker', number: 32, role: 'CM', apps: 15 },
      { name: 'Tim Iroegbunam', number: 47, role: 'CM', apps: 15 },
    ],
  },

  'xabi-leverkusen-24': {
    season: '2023-24',
    basis: 'all',
    players: [
      { name: 'Amine Adli', number: 21, role: 'LW', apps: 36, goals: 10 },
      { name: 'Adam Hložek', number: 23, role: 'ST', apps: 33, goals: 7 },
      { name: 'Robert Andrich', number: 8, role: 'CM', apps: 32, goals: 6, note: 'The third central midfielder with Xhaka and Palacios.' },
      { name: 'Josip Stanišić', number: 2, role: 'RB', apps: 32, goals: 4, note: 'On loan from Bayern, covering right-back and centre-half.' },
      { name: 'Nathan Tella', number: 19, role: 'RW', apps: 32, goals: 6 },
      { name: 'Odilon Kossounou', number: 6, role: 'CB', apps: 29, goals: 1 },
      { name: 'Patrik Schick', number: 14, role: 'ST', apps: 29, goals: 13, note: 'Boniface’s replacement when injury cost him half the season.' },
      { name: 'Matěj Kovář', number: 17, role: 'GK', apps: 17, goals: 0 },
    ],
  },

  'amorim-sporting-24': {
    season: '2023-24',
    basis: 'all',
    players: [
      { name: 'Paulinho', number: 20, role: 'ST', apps: 42, goals: 21, note: 'Gyökeres’s partner and alternative, and 21 goals of his own.' },
      { name: 'Daniel Bragança', number: 23, role: 'CM', apps: 39, goals: 5 },
      { name: 'Marcus Edwards', number: 10, role: 'RW', apps: 35, goals: 6 },
      { name: 'Ricardo Esgaio', number: 47, role: 'RM', apps: 32, goals: 0, note: 'The other right wing-back to Catamo.' },
      { name: 'Matheus Reis', number: 2, role: 'LB', apps: 30, goals: 0, note: 'Left wing-back, and the left of the back three when Inácio pushed on.' },
      { name: 'Eduardo Quaresma', number: 72, role: 'CB', apps: 25, goals: 1 },
      { name: 'Franco Israel', number: 12, role: 'GK', apps: 23, goals: 0, note: 'Took the gloves from Adán for the second half of the season.' },
      { name: 'Jerry St. Juste', number: 3, role: 'CB', apps: 11, goals: 1 },
    ],
  },

  'flick-bayern-20': {
    season: '2019-20',
    basis: 'all',
    players: [
      { name: 'Philippe Coutinho', number: 10, role: 'AM', apps: 37, goals: 11, note: 'On loan from Barcelona, and scored twice against them in the 8-2.' },
      { name: 'Thiago Alcântara', number: 6, role: 'CM', apps: 36, goals: 3, note: 'Started the 2020 final, and left for Liverpool weeks later.' },
      { name: 'Ivan Perišić', number: 14, role: 'LW', apps: 30, goals: 8, note: 'On loan from Inter, on either flank.' },
      { name: 'Corentin Tolisso', number: 24, role: 'CM', apps: 22, goals: 4 },
      { name: 'Lucas Hernández', number: 21, role: 'CB', apps: 22, goals: 0, note: 'The world’s most expensive defender at the time, and mostly cover.' },
      { name: 'Javi Martínez', number: 8, role: 'DM', apps: 21, goals: 0 },
      { name: 'Niklas Süle', number: 4, role: 'CB', apps: 16, goals: 0, note: 'Ruptured a cruciate in October and came back for the run-in.' },
      { name: 'Joshua Zirkzee', number: 35, role: 'ST', apps: 12, goals: 4 },
    ],
  },

  'simeone-atleti-14': {
    season: '2013-14',
    basis: 'all',
    players: [
      { name: 'Raúl García', number: 8, role: 'CM', apps: 53, goals: 18, note: 'The midfielder whose job was to arrive in the box.' },
      { name: 'Adrián López', number: 7, role: 'ST', apps: 33, goals: 3, note: 'On nine minutes into the 2014 final when Costa pulled up.' },
      { name: 'Cristian Rodríguez', number: 11, role: 'LM', apps: 25, goals: 1 },
      { name: 'Mario Suárez', number: 4, role: 'DM', apps: 24, goals: 0 },
      { name: 'Toby Alderweireld', number: 12, role: 'CB', apps: 19, goals: 2, note: 'On loan from Ajax as the fourth centre-half.' },
      { name: 'José Sosa', number: 24, role: 'AM', apps: 17, goals: 0 },
      { name: 'Diego Ribas', number: 21, role: 'AM', apps: 12, goals: 2, note: 'Came back on loan in January for the run-in.' },
      { name: 'Emiliano Insúa', number: 22, role: 'LB', apps: 12, goals: 0 },
    ],
  },

  'simeone-atleti-21': {
    season: '2020-21',
    basis: 'all',
    players: [
      { name: 'Ángel Correa', number: 10, role: 'ST', apps: 48, goals: 9, note: 'More games than any other outfield player, nearly all as a substitute.' },
      { name: 'Felipe', number: 18, role: 'CB', apps: 38, goals: 0, note: 'The third centre-half, in a back three or a back four.' },
      { name: 'Thomas Lemar', number: 11, role: 'LW', apps: 36, goals: 2 },
      { name: 'Renan Lodi', number: 12, role: 'LB', apps: 33, goals: 1, note: 'Left wing-back when Carrasco played further forward.' },
      { name: 'Geoffrey Kondogbia', number: 4, role: 'DM', apps: 27, goals: 0 },
      { name: 'Lucas Torreira', number: 5, role: 'CM', apps: 26, goals: 1 },
      { name: 'Héctor Herrera', number: 16, role: 'CM', apps: 21, goals: 0 },
      { name: 'Vitolo', number: 20, role: 'LW', apps: 15, goals: 0 },
    ],
  },

  'kompany-bayern-25': {
    season: '2024-25',
    basis: 'all',
    players: [
      { name: 'Thomas Müller', number: 25, role: 'AM', apps: 38, goals: 8, note: 'His last season, after seventeen years in the first team.' },
      { name: 'Leroy Sané', number: 10, role: 'RW', apps: 37, goals: 13, note: 'Also his last season, and gone on a free that summer.' },
      { name: 'Raphaël Guerreiro', number: 22, role: 'LB', apps: 30, goals: 5, note: 'Cover for Davies at left-back, and a midfielder when asked.' },
      { name: 'Serge Gnabry', number: 7, role: 'RW', apps: 27, goals: 7 },
      { name: 'Leon Goretzka', number: 8, role: 'CM', apps: 27, goals: 6, note: 'Told in the summer he could leave, and played 27 games anyway.' },
      { name: 'Eric Dier', number: 15, role: 'CB', apps: 25, goals: 3 },
      { name: 'João Palhinha', number: 16, role: 'DM', apps: 21, goals: 0 },
      { name: 'Josip Stanišić', number: 44, role: 'RB', apps: 19, goals: 0 },
      { name: 'Sacha Boey', number: 23, role: 'RB', apps: 17, goals: 1 },
      { name: 'Jonas Urbig', number: 40, role: 'GK', apps: 12, goals: 0 },
      { name: 'Mathys Tel', number: 39, role: 'ST', apps: 11, goals: 0 },
    ],
  },

  'tuchel-psg-20': {
    season: '2019-20',
    basis: 'all',
    players: [
      { name: 'Pablo Sarabia', number: 19, role: 'RW', apps: 27, goals: 14, note: '14 goals in his first season in Paris.' },
      { name: 'Mauro Icardi', number: 18, role: 'ST', apps: 27, goals: 20, note: 'On loan from Inter, and 20 goals from 27 games.' },
      { name: 'Marco Verratti', number: 6, role: 'CM', apps: 26, goals: 0, note: 'The side’s first-choice midfielder, and not in the eleven for the final.' },
      { name: 'Thomas Meunier', number: 12, role: 'RB', apps: 24, goals: 1, note: 'Contract expired before the final, so he did not play it.' },
      { name: 'Leandro Paredes', number: 8, role: 'DM', apps: 19, goals: 1 },
      { name: 'Layvin Kurzawa', number: 20, role: 'LB', apps: 18, goals: 1 },
      { name: 'Abdou Diallo', number: 22, role: 'CB', apps: 18, goals: 0 },
      { name: 'Eric Maxim Choupo-Moting', number: 17, role: 'ST', apps: 13, goals: 6, note: 'Scored in the 93rd minute against Atalanta to reach the semi-final.' },
      { name: 'Julian Draxler', number: 23, role: 'AM', apps: 12, goals: 0 },
      { name: 'Colin Dagba', number: 31, role: 'RB', apps: 12, goals: 0 },
      { name: 'Edinson Cavani', number: 9, role: 'ST', apps: 12, goals: 7, note: 'The club’s record scorer, in a final season mostly out of the side.' },
    ],
  },

  'tuchel-chelsea-21': {
    season: '2020-21',
    basis: 'all',
    players: [
      { name: 'Christian Pulisic', number: 10, role: 'LW', apps: 43, goals: 6, note: 'The away goal at Real Madrid that settled the semi-final.' },
      { name: 'Mateo Kovačić', number: 17, role: 'CM', apps: 42, goals: 0, note: 'A three-man rotation with Kanté and Jorginho.' },
      { name: 'Hakim Ziyech', number: 22, role: 'RW', apps: 39, goals: 6, note: 'The winner in the FA Cup semi-final against Manchester City.' },
      { name: 'Callum Hudson-Odoi', number: 20, role: 'RW', apps: 37, goals: 5 },
      { name: 'Kurt Zouma', number: 15, role: 'CB', apps: 36, goals: 5 },
      { name: 'Tammy Abraham', number: 9, role: 'ST', apps: 32, goals: 12, note: '12 goals, and then left out of the matchday squad for the final.' },
      { name: 'Olivier Giroud', number: 18, role: 'ST', apps: 31, goals: 11, note: 'The overhead kick that won the game at Atlético.' },
      { name: 'Andreas Christensen', number: 4, role: 'CB', apps: 27, goals: 0, note: 'Came on in the final when Thiago Silva pulled up, and finished it.' },
      { name: 'Marcos Alonso', number: 3, role: 'LB', apps: 17, goals: 2 },
      { name: 'Emerson', number: 33, role: 'LB', apps: 15, goals: 1 },
      { name: 'Kepa Arrizabalaga', number: 1, role: 'GK', apps: 14, goals: 0 },
      { name: 'Billy Gilmour', number: 23, role: 'CM', apps: 11, goals: 0 },
    ],
  },

  'aragones-spain-08': {
    season: 'Euro 2008',
    basis: 'squad',
    players: [
      { name: 'David Villa', number: 7, role: 'ST', note: 'The tournament’s top scorer with four, and injured in the semi-final, which is why Fàbregas started the final.' },
      { name: 'Xabi Alonso', number: 14, role: 'CM', note: 'Behind Senna and Xavi, and a starter in the dead group game.' },
      { name: 'Dani Güiza', number: 17, role: 'ST', note: 'Came on for Torres in the knockout games and scored in the semi-final.' },
      { name: 'Santi Cazorla', number: 12, role: 'LW', note: 'Brought on to change games in the second half.' },
      { name: 'Rubén de la Red', number: 22, role: 'CM', note: 'Scored against Greece in the one match the reserves played.' },
      { name: 'Sergio García', number: 16, role: 'ST', note: 'A starter in that same Greece game.' },
      { name: 'Raúl Albiol', number: 2, role: 'CB' },
      { name: 'Álvaro Arbeloa', number: 18, role: 'RB' },
      { name: 'Juanito', number: 20, role: 'CB' },
      { name: 'Fernando Navarro', number: 3, role: 'LB' },
      { name: 'Pepe Reina', number: 23, role: 'GK' },
      { name: 'Andrés Palop', number: 13, role: 'GK' },
    ],
  },

  'benitez-liverpool-05': {
    season: '2004-05',
    basis: 'all',
    players: [
      { name: 'Dietmar Hamann', number: 16, role: 'DM', apps: 43, goals: 1, note: 'The half-time substitution in Istanbul that changed the final.' },
      { name: 'Igor Biščan', number: 25, role: 'DM', apps: 35, goals: 2 },
      { name: 'Stephen Warnock', number: 28, role: 'LB', apps: 30, goals: 0 },
      { name: 'Antonio Núñez', number: 18, role: 'RW', apps: 26, goals: 1 },
      { name: 'Florent Sinama Pongolle', number: 24, role: 'ST', apps: 26, goals: 4, note: 'Came on at half-time against Olympiacos and started the comeback.' },
      { name: 'Djibril Cissé', number: 9, role: 'ST', apps: 25, goals: 5, note: 'Broke his leg in October, came back for the final, and scored his penalty.' },
      { name: 'Josemi', number: 17, role: 'RB', apps: 23, goals: 0 },
      { name: 'Vladimír Šmicer', number: 11, role: 'CM', apps: 19, goals: 1, note: 'Came on for the injured Kewell, scored the second, and left that summer.' },
      { name: 'Neil Mellor', number: 33, role: 'ST', apps: 16, goals: 5, note: 'Scored the second in that same Olympiacos game.' },
      { name: 'Fernando Morientes', number: 19, role: 'ST', apps: 15, goals: 3, note: 'Signed in January and cup-tied for the whole European run.' },
      { name: 'Salif Diao', number: 15, role: 'DM', apps: 14, goals: 1 },
      { name: 'Chris Kirkland', number: 22, role: 'GK', apps: 14, goals: 0 },
      { name: 'Mauricio Pellegrino', number: 12, role: 'CB', apps: 13, goals: 0 },
    ],
  },

  'capello-milan-94': {
    season: '1993-94',
    basis: 'all',
    players: [
      { name: 'Jean-Pierre Papin', role: 'ST', apps: 26, goals: 9, note: 'A Ballon d’Or winner reduced to squad forward by the three-foreigner rule.' },
      { name: 'Christian Panucci', role: 'RB', apps: 26, goals: 3, note: 'Twenty, and into the 1994 final with both Baresi and Costacurta suspended.' },
      { name: 'Stefano Eranio', role: 'RM', apps: 26, goals: 2 },
      { name: 'Marco Simone', role: 'ST', apps: 24, goals: 5 },
      { name: 'Brian Laudrup', role: 'AM', apps: 17, goals: 2, note: 'One season in the side, squeezed out by the same limit on foreign players.' },
      { name: 'Massimo Orlando', role: 'AM', apps: 15, goals: 2 },
      { name: 'Filippo Galli', role: 'CB', apps: 12, goals: 0, note: 'Played the final alongside Maldini with the first-choice pair banned.' },
    ],
  },

  'dalglish-liverpool-88': {
    season: '1987-88',
    basis: 'all',
    players: [
      { name: 'Craig Johnston', role: 'RM', apps: 35, goals: 6, note: 'Retired at 27 at the end of it, to look after his sister.' },
      { name: 'Nigel Spackman', role: 'CM', apps: 33, goals: 0 },
      { name: 'Barry Venison', role: 'RB', apps: 22, goals: 0 },
      { name: 'Mark Lawrenson', role: 'CB', apps: 19, goals: 0, note: 'A snapped Achilles in March ended his season and his career.' },
    ],
  },

  'delbosque-spain-10': {
    season: '2010 World Cup',
    basis: 'squad',
    players: [
      { name: 'Cesc Fàbregas', number: 10, role: 'CM', note: 'Came on in every knockout round, and put Iniesta through for the goal that won it.' },
      { name: 'Fernando Torres', number: 9, role: 'ST', note: 'Started the tournament as the centre-forward and lost the shirt to Pedro.' },
      { name: 'David Silva', number: 21, role: 'RW', note: 'Started the opening defeat to Switzerland and did not start again.' },
      { name: 'Jesús Navas', number: 22, role: 'RW', note: 'Brought on to stretch tired defences down the right.' },
      { name: 'Fernando Llorente', number: 19, role: 'ST', note: 'The target man for when Spain needed a different kind of forward.' },
      { name: 'Carlos Marchena', number: 4, role: 'CB', note: 'Third centre-half, on a 50-game unbeaten run for Spain.' },
      { name: 'Javi Martínez', number: 20, role: 'DM' },
      { name: 'Raúl Albiol', number: 2, role: 'CB' },
      { name: 'Álvaro Arbeloa', number: 17, role: 'RB' },
      { name: 'Juan Mata', number: 13, role: 'AM' },
      { name: 'Víctor Valdés', number: 12, role: 'GK' },
      { name: 'Pepe Reina', number: 23, role: 'GK' },
    ],
  },

  'heynckes-bayern-13': {
    season: '2012-13',
    basis: 'all',
    players: [
      { name: 'Toni Kroos', number: 39, role: 'AM', apps: 32, goals: 9, note: 'Injured in the run-in, which moved Müller inside for the final.' },
      { name: 'Luiz Gustavo', number: 30, role: 'DM', apps: 25, goals: 4, note: 'Lost his place to Javi Martínez and left in the summer.' },
      { name: 'Mario Gómez', number: 33, role: 'ST', apps: 23, goals: 19, note: '19 goals as Mandžukić’s alternative, in his last season at the club.' },
      { name: 'Daniel Van Buyten', number: 5, role: 'CB', apps: 21, goals: 0, note: 'The fourth centre-half at 34.' },
      { name: 'Holger Badstuber', number: 28, role: 'CB', apps: 17, goals: 0, note: 'Ruptured a cruciate in December and missed the treble.' },
      { name: 'Xherdan Shaqiri', number: 11, role: 'RW', apps: 17, goals: 8 },
      { name: 'Rafinha', number: 13, role: 'RB', apps: 14, goals: 2 },
      { name: 'Claudio Pizarro', number: 14, role: 'ST', apps: 11, goals: 13, note: 'Thirteen goals from eleven games, including four in one half against Hamburg.' },
    ],
  },

  'lippi-italy-06': {
    season: '2006 World Cup',
    basis: 'squad',
    players: [
      { name: 'Alessandro Del Piero', number: 7, role: 'SS', note: 'Scored in the 119th minute of the semi-final, and his penalty in the final shootout.' },
      { name: 'Alessandro Nesta', number: 13, role: 'CB', note: 'Started the tournament and pulled up in the third game, which put Materazzi in the side.' },
      { name: 'Daniele De Rossi', number: 4, role: 'DM', note: 'Banned four games for an elbow against the United States, and back for the final.' },
      { name: 'Filippo Inzaghi', number: 18, role: 'ST', note: 'Came on and scored against the Czech Republic to send Italy through.' },
      { name: 'Alberto Gilardino', number: 11, role: 'ST', note: 'Scored the first in that same Czech Republic game.' },
      { name: 'Vincenzo Iaquinta', number: 15, role: 'ST', note: 'Scored against Ghana in the opening game.' },
      { name: 'Massimo Oddo', number: 22, role: 'RB' },
      { name: 'Andrea Barzagli', number: 6, role: 'CB' },
      { name: 'Cristian Zaccardo', number: 2, role: 'RB', note: 'His own goal against the United States is the only one Italy conceded from open play.' },
      { name: 'Simone Barone', number: 17, role: 'CM' },
      { name: 'Angelo Peruzzi', number: 12, role: 'GK' },
      { name: 'Marco Amelia', number: 14, role: 'GK' },
    ],
  },

  'michels-netherlands-74': {
    season: '1974 World Cup',
    basis: 'squad',
    players: [
      { name: 'Piet Keizer', number: 9, role: 'LW', note: 'The Ajax winger of the three European Cups, and a substitute by 1974.' },
      { name: 'René van de Kerkhof', number: 10, role: 'RW', note: 'Came on in the final, and started the next one four years later.' },
      { name: 'Theo de Jong', number: 7, role: 'CM', note: 'Replaced the injured Rijsbergen in the final.' },
      { name: 'Willy van de Kerkhof', number: 11, role: 'CM', note: 'René’s twin brother, in the same squad.' },
      { name: 'Ruud Geels', number: 1, role: 'ST', note: 'Centre-forward cover in a side that mostly played without one.' },
      { name: 'Piet Schrijvers', number: 18, role: 'GK', note: 'Michels picked Jongbloed, a 33-year-old part-timer, ahead of him.' },
      { name: 'Rinus Israël', number: 5, role: 'CB' },
      { name: 'Pleun Strik', number: 19, role: 'CB' },
      { name: 'Kees van Ierssel', number: 4, role: 'CB' },
      { name: 'Harry Vos', number: 22, role: 'CB' },
      { name: 'Eddy Treijtel', number: 21, role: 'GK' },
    ],
  },

  'paisley-liverpool-77': {
    season: '1976-77',
    basis: 'all',
    players: [
      { name: 'Phil Thompson', role: 'CB', apps: 36, goals: 2, note: 'Injured before the final, so Tommy Smith played it and scored.' },
      { name: 'John Toshack', role: 'ST', apps: 30, goals: 13, note: 'Keegan’s partner for four years, cut down by the thigh injury that ended his career.' },
      { name: 'David Johnson', role: 'ST', apps: 28, goals: 8 },
      { name: 'David Fairclough', role: 'ST', apps: 20, goals: 5, note: 'The first player called a super sub, and his goal knocked out Saint-Étienne.' },
    ],
  },

  'sacchi-milan-89': {
    season: '1988-89',
    basis: 'all',
    players: [
      { name: 'Alberigo Evani', role: 'LM', apps: 38, goals: 3, note: 'Came on in the 1989 final.' },
      { name: 'Pietro Paolo Virdis', role: 'ST', apps: 35, goals: 14, note: 'Third forward behind Van Basten and Gullit.' },
      { name: 'Roberto Mussi', role: 'RB', apps: 28, goals: 0 },
      { name: 'Graziano Mannari', role: 'ST', apps: 22, goals: 7 },
      { name: 'Filippo Galli', role: 'CB', apps: 16, goals: 0, note: 'Fifth defender behind the famous four, and stayed a decade.' },
    ],
  },

  'shankly-liverpool-66': {
    season: '1965-66',
    basis: 'all',
    players: [
      { name: 'Geoff Strong', role: 'CM', apps: 27, goals: 7, note: 'The only reserve Shankly used: fourteen players took the title, and this was the fourteenth.' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Under ten games, and still part of the story.
//
// The ten-game bar is a reasonable line for "was he in the side", and a bad
// one for "did he matter". It cuts the seventeen-year-old on his debut, the
// signing whose season was a knee ligament, the veteran playing his last few
// games, and the man whose absence is the reason somebody else played.
//
// So those are listed separately, and every one of them carries the reason.
// A small appearance count on its own is not a reason and does not belong
// here. Eras with basis 'squad' have no counts at all, so they have no tail.
// ---------------------------------------------------------------------------
const ERA_TAIL: Record<string, SubPlayer[]> = {
  'fergie-99': [
    { name: 'Raimond van der Gouw', number: 17, role: 'GK', apps: 8, note: 'The only other goalkeeper at the club all season.' },
    { name: 'David May', number: 4, role: 'CB', apps: 9, note: 'Fifth-choice defender, and front and centre of the trophy photograph in Barcelona.' },
  ],

  'fergie-08': [
    { name: 'Mikaël Silvestre', number: 27, role: 'CB', apps: 6, note: 'Last of nine seasons at the club, spent almost entirely out of the side.' },
  ],

  'fergie-13': [
    { name: 'Darren Fletcher', number: 24, role: 'CM', apps: 10, note: 'Ulcerative colitis cost him two years; these ten games were the comeback.' },
  ],

  'pep-barca': [
    { name: 'Ibrahim Afellay', number: 20, role: 'RW', apps: 10, note: 'Set up the second goal in the semi-final at the Bernabéu.' },
    { name: 'Thiago Alcântara', number: 30, role: 'CM', apps: 10, goals: 3, note: 'Nineteen, and three goals from ten appearances.' },
    { name: 'Sergi Roberto', number: 28, role: 'CM', apps: 1, note: 'His first appearance for the club, eleven years before his last.' },
  ],

  'pep-bayern': [
    { name: 'Pepe Reina', number: 23, role: 'GK', apps: 3, note: 'Signed as Neuer’s deputy and played three games all season.' },
    { name: 'Gianluca Gaudino', number: 16, role: 'CM', apps: 10, note: 'Seventeen, and handed a debut in Guardiola’s opening game of the season.' },
  ],

  'pep-city': [
    { name: 'Benjamin Mendy', number: 22, role: 'LB', apps: 8, note: 'Ruptured a cruciate in September, which is why Delph spent a season at left-back.' },
    { name: 'Phil Foden', number: 47, role: 'CM', apps: 10, note: 'Seventeen, and the youngest player to win a Premier League medal.' },
    { name: 'Brahim Díaz', number: 55, role: 'AM', apps: 10, note: 'Eighteen, and sold to Real Madrid the following January.' },
  ],

  'mou-chelsea': [
    { name: 'Adrian Mutu', number: 7, role: 'SS', apps: 2, note: 'Sacked in October after a failed drugs test, and sued for the fee.' },
    { name: 'Scott Parker', number: 19, role: 'CM', apps: 7, note: 'Young Player of the Year the season before, and behind Makélélé from the day Mourinho arrived.' },
  ],

  'mou-inter': [
    { name: 'Davide Santon', number: 39, role: 'RB', apps: 8, note: 'Eighteen, and already Maicon’s deputy in a treble side.' },
    { name: 'Marco Materazzi', number: 23, role: 'CB', apps: 7, note: 'Fourth centre-half in his last season, ten years after arriving.' },
    { name: 'Patrick Vieira', number: 14, role: 'CM', apps: 7, note: 'Signed in January at 33 for the run-in, and came on in the final.' },
  ],

  'carlo-milan': [
    { name: 'Marco Borriello', number: 15, role: 'ST', apps: 9, note: 'Fourth forward, and the club’s top scorer two seasons later.' },
    { name: 'Serginho', number: 27, role: 'LB', apps: 6, note: 'Left-back through the 2003 and 2005 finals, down to six games by the third one.' },
    { name: 'Alessandro Costacurta', number: 5, role: 'CB', apps: 3, note: 'Forty-one, and scored a penalty in his farewell game.' },
    { name: 'Matteo Darmian', number: 36, role: 'RB', apps: 1, note: 'Seventeen, one appearance, and an Italy full-back within five years.' },
  ],

  'carlo-chelsea': [
    { name: 'José Bosingwa', number: 17, role: 'RB', apps: 8, note: 'A knee injury took most of his season, which is why Ivanović moved to right-back.' },
    { name: 'Fabio Borini', number: 45, role: 'ST', apps: 7, note: 'Nineteen, and an academy forward in a double-winning squad.' },
    { name: 'Nemanja Matić', number: 24, role: 'DM', apps: 3, note: 'Three games, then sold to Benfica — and bought back for four times the fee.' },
  ],

  'carlo-decima': [
    { name: 'Álvaro Morata', number: 21, role: 'ST', apps: 6, note: 'Sold to Juventus that summer, and bought back three years later.' },
    { name: 'Casemiro', number: 16, role: 'DM', apps: 4, note: 'Four games here, then loaned out — and the pivot of the three finals after this one.' },
  ],

  'cruyff-barca': [
    { name: 'Juan Carlos', role: 'LM', apps: 10, note: 'Ten games as the alternative down the left.' },
    { name: 'Julio Salinas', role: 'ST', apps: 9, goals: 4, note: 'Romário’s understudy here, and Spain’s centre-forward at the 1994 World Cup.' },
    { name: 'Carles Busquets', role: 'GK', apps: 8, note: 'A sweeper-keeper two decades early, and Sergio’s father.' },
  ],

  'wenger-invincibles': [
    { name: 'David Bentley', number: 32, role: 'RM', apps: 8, note: 'Nineteen, and scored a hat-trick in the FA Cup during the unbeaten season.' },
    { name: 'Cesc Fàbregas', number: 57, role: 'CM', apps: 3, goals: 1, note: 'Sixteen, and the youngest player and youngest scorer in the club’s history.' },
  ],

  'lucho-barca': [
    { name: 'Sandro Ramírez', number: 29, role: 'ST', apps: 10, goals: 4, note: 'Nineteen, and four goals from ten appearances in a treble season.' },
    { name: 'Adama Traoré', number: 27, role: 'RW', apps: 2, goals: 1, note: 'Nineteen, and scored in one of his two appearances before leaving for England.' },
    { name: 'Thomas Vermaelen', number: 23, role: 'CB', apps: 1, note: 'Signed for £15m and injured all season: one appearance, in May.' },
  ],

  'lucho-psg': [
    { name: 'Milan Škriniar', number: 37, role: 'CB', apps: 5, note: 'A free transfer on huge wages, out of the side by the autumn and loaned to Fenerbahçe.' },
    { name: 'Presnel Kimpembe', number: 3, role: 'CB', apps: 2, note: 'Academy centre-half and club captain, back for two games after two years of Achilles trouble.' },
  ],

  'klopp-liverpool': [
    { name: 'Nathaniel Clyne', number: 2, role: 'RB', apps: 5, note: 'First-choice right-back two seasons earlier, and displaced entirely by Alexander-Arnold.' },
    { name: 'Alberto Moreno', number: 18, role: 'LB', apps: 5, note: 'Left-back before Robertson, and out of contract at the end of it.' },
    { name: 'Alex Oxlade-Chamberlain', number: 21, role: 'CM', apps: 2, note: 'A cruciate injury in the previous semi-final cost him all but the last two games.' },
    { name: 'Simon Mignolet', number: 22, role: 'GK', apps: 2, note: 'Liverpool’s keeper for four years, reduced to two games by Alisson’s arrival.' },
  ],

  'zidane-undecima': [
    { name: 'Álvaro Arbeloa', number: 17, role: 'RB', apps: 8, note: 'Last of seven seasons, and he left with a fifth European Cup.' },
    { name: 'Kiko Casilla', number: 13, role: 'GK', apps: 6, note: 'Signed as Navas’s deputy in the summer Madrid tried to replace him.' },
    { name: 'Denis Cheryshev', number: 21, role: 'LW', apps: 5, note: 'Played while suspended in the Copa del Rey, and Madrid were thrown out of the competition for it.' },
  ],

  'zidane-madrid': [
    { name: 'Mariano Díaz', number: 18, role: 'ST', apps: 8, goals: 1, note: 'Academy forward who scored on his league debut, then sold to Lyon.' },
    { name: 'Fábio Coentrão', number: 15, role: 'LB', apps: 3, note: 'Left-back in the 2014 final, down to three league games three years later.' },
  ],

  'arteta-arsenal-24': [
    { name: 'Mohamed Elneny', number: 25, role: 'CM', apps: 6, note: 'Last of eight seasons, and the squad’s longest-serving midfielder.' },
    { name: 'Cédric Soares', number: 17, role: 'RB', apps: 5, note: 'Full-back cover, and gone to Fulham in January.' },
    { name: 'Jurriën Timber', number: 12, role: 'RB', apps: 3, note: 'Ruptured a cruciate on the opening day, in his first game for the club.' },
    { name: 'Ethan Nwaneri', number: 63, role: 'AM', apps: 1, note: 'The youngest player ever to appear in the Premier League, at fifteen.' },
  ],

  'emery-sevilla-16': [
    { name: 'Ciro Immobile', number: 11, role: 'ST', apps: 10, goals: 4, note: 'On loan from Dortmund, gone by January, and Serie A’s top scorer two years later.' },
    { name: 'Marco Andreolli', number: 17, role: 'CB', apps: 9, note: 'Fourth centre-half on loan from Inter.' },
    { name: 'Beto', number: 13, role: 'GK', apps: 5, note: 'The keeper who won the 2014 final shootout, now Sergio Rico’s deputy.' },
  ],

  'emery-villa-24': [
    { name: 'Robin Olsen', number: 25, role: 'GK', apps: 10, note: 'Martínez’s deputy, and the cup goalkeeper.' },
    { name: 'Calum Chambers', number: 16, role: 'CB', apps: 8, note: 'Fifth defender, in a season Villa needed only four.' },
    { name: 'Philippe Coutinho', number: 23, role: 'AM', apps: 2, note: 'A £17m signing eighteen months earlier, and loaned to Qatar in January.' },
    { name: 'Tyrone Mings', number: 5, role: 'CB', apps: 1, note: 'Ruptured a cruciate in the opening game, which is what let Pau Torres settle in.' },
  ],

  'xabi-leverkusen-24': [
    { name: 'Borja Iglesias', number: 9, role: 'ST', apps: 9, note: 'On loan from Betis in January as the fourth forward.' },
    { name: 'Gustavo Puerta', number: 32, role: 'CM', apps: 9, note: 'Twenty, and a squad midfielder through an unbeaten season.' },
  ],

  'amorim-sporting-24': [
    { name: 'Luís Neto', number: 13, role: 'CB', apps: 9, note: 'Thirty-five, and the fourth centre-half in a title-winning back three.' },
    { name: 'Iván Fresneda', number: 22, role: 'RB', apps: 7, note: 'Eighteen, signed for €10m in the summer, and behind Esgaio all season.' },
  ],

  'flick-bayern-20': [
    { name: 'Michaël Cuisance', number: 11, role: 'CM', apps: 10, note: 'Twenty, and a treble medal from ten appearances.' },
    { name: 'Álvaro Odriozola', number: 2, role: 'RB', apps: 3, note: 'On loan from Real Madrid, and behind Kimmich and Pavard from the day he arrived.' },
    { name: 'Sven Ulreich', number: 26, role: 'GK', apps: 1, note: 'Neuer’s deputy for five years, down to a single game.' },
  ],

  'simeone-atleti-14': [
    { name: 'Óliver Torres', number: 16, role: 'AM', apps: 10, goals: 1, note: 'Nineteen, and the academy’s next number ten.' },
    { name: 'Daniel Aranzubia', number: 1, role: 'GK', apps: 4, note: 'Courtois played 56 games, so his understudy played four.' },
    { name: 'José Giménez', number: 18, role: 'CB', apps: 1, note: 'Nineteen, one appearance, and Atlético’s centre-half for the decade that followed.' },
  ],

  'simeone-atleti-21': [
    { name: 'Šime Vrsaljko', number: 24, role: 'RB', apps: 10, note: 'Right-back of the 2016 side, by now behind Trippier and repeatedly injured.' },
    { name: 'Diego Costa', number: 19, role: 'ST', apps: 7, goals: 2, note: 'Back for a second spell, and released at his own request in December.' },
    { name: 'Thomas Partey', number: 5, role: 'DM', apps: 3, note: 'The midfield’s first name for four years, gone to Arsenal on deadline day for his release clause.' },
  ],

  'kompany-bayern-25': [
    { name: 'Hiroki Itō', number: 21, role: 'CB', apps: 6, note: 'Broke the same metatarsal twice, either side of a two-month comeback.' },
    { name: 'Daniel Peretz', number: 18, role: 'GK', apps: 4, note: 'Second keeper until Urbig arrived in January.' },
    { name: 'Sven Ulreich', number: 26, role: 'GK', apps: 1, note: 'Neuer’s understudy across two spells and eight seasons.' },
  ],

  'tuchel-psg-20': [
    { name: 'Tanguy Kouassi', number: 35, role: 'CB', apps: 10, goals: 3, note: 'Seventeen, three goals from centre-half, and let go to Bayern on a free.' },
    { name: 'Sergio Rico', number: 16, role: 'GK', apps: 9, note: 'On loan from Sevilla as Navas’s deputy.' },
    { name: 'Alphonse Areola', number: 16, role: 'GK', apps: 4, note: 'The academy keeper who had played the season before, loaned to Madrid in September.' },
  ],

  'tuchel-chelsea-21': [
    { name: 'Fikayo Tomori', number: 14, role: 'CB', apps: 4, note: 'Loaned to Milan in January, and a Serie A title winner within eighteen months.' },
    { name: 'Ross Barkley', number: 8, role: 'AM', apps: 3, note: 'A £15m midfielder reduced to three appearances before a loan to Aston Villa.' },
    { name: 'Ruben Loftus-Cheek', number: 12, role: 'CM', apps: 1, note: 'Academy midfielder, one appearance, then loaned to Fulham.' },
  ],

  'benitez-liverpool-05': [
    { name: 'Darren Potter', number: 34, role: 'CM', apps: 10, note: 'Academy midfielder given the early European qualifiers that started the run.' },
    { name: 'Scott Carson', number: 20, role: 'GK', apps: 5, note: 'Nineteen, third keeper, and an England international two years later.' },
  ],

  'capello-milan-94': [
    { name: 'Florin Răducioiu', role: 'ST', apps: 10, goals: 3, note: 'Signed after a strong World Cup qualifying campaign and squeezed out by the foreigner limit.' },
    { name: 'Benito Carbone', role: 'AM', apps: 10, note: 'Twenty-two, in the last of three seasons at the club without ever holding a place.' },
    { name: 'Mario Ielpo', role: 'GK', apps: 8, note: 'Rossi’s deputy, and he conceded seven goals in eight games.' },
    { name: 'Gianluigi Lentini', role: 'RW', apps: 4, note: 'The world’s most expensive player two years earlier, and never the same after a car crash the previous August.' },
    { name: 'Marco van Basten', role: 'ST', apps: 0, note: 'Did not play once. The ankle that stopped him here ended his career at 28.' },
  ],

  'dalglish-liverpool-88': [
    { name: 'Paul Walsh', role: 'ST', apps: 9, note: 'Forward cover, and sold to Tottenham in February.' },
    { name: 'Jan Mølby', role: 'CM', apps: 8, note: 'The passer of the side, out for almost all of it with a foot injury.' },
    { name: 'Mike Hooper', role: 'GK', apps: 4, note: 'Grobbelaar’s deputy, in a season Grobbelaar barely missed.' },
  ],

  'heynckes-bayern-13': [
    { name: 'Anatoliy Tymoshchuk', number: 44, role: 'DM', apps: 9, note: 'Midfield and centre-half cover, and a treble medal in his last season.' },
    { name: 'Emre Can', number: 36, role: 'CM', apps: 4, goals: 1, note: 'Nineteen, and scored in one of his four games before leaving for Leverkusen.' },
    { name: 'Pierre-Emile Højbjerg', number: 34, role: 'CM', apps: 2, note: 'Seventeen, and the youngest player Bayern had ever fielded in the Bundesliga.' },
  ],

  'paisley-liverpool-77': [
    { name: 'Alec Lindsay', role: 'LB', apps: 1, note: 'Left-back of the 1974 side, down to one appearance and sold that summer.' },
    { name: 'Brian Kettle', role: 'RB', apps: 2, note: 'Two games, and the only cover Paisley used at full-back all season.' },
  ],

  'sacchi-milan-89': [
    { name: 'Daniele Massaro', role: 'ST', apps: 5, note: 'Five games here, and the man who scored twice in the 1994 final.' },
    { name: 'Demetrio Albertini', role: 'CM', apps: 1, note: 'Eighteen, one appearance, and Milan’s midfielder for the decade after.' },
    { name: 'Francesco Antonioli', role: 'GK', apps: 1, note: 'Twenty, and the only other keeper Sacchi used.' },
  ],

  'shankly-liverpool-66': [
    { name: 'Alf Arrowsmith', role: 'ST', apps: 6, goals: 1, note: 'Twenty goals two seasons earlier, and never the same after a knee injury in the Charity Shield.' },
    { name: 'Bobby Graham', role: 'ST', apps: 1, note: 'One appearance in a title season, having scored a hat-trick on his debut two years before.' },
    { name: 'Phil Chisnall', role: 'AM', apps: 1, note: 'Still the last player transferred directly between Liverpool and Manchester United.' },
  ],
};

// The tail is stored apart from the main list to keep both readable, and
// merged here once per era so the object identity stays stable and the board's
// memoised Bench does not re-render for nothing.
const merged = new Map<string, EraBench>();

export const benchForEra = (eraId: string): EraBench | null => {
  const bench = ERA_BENCH[eraId];
  if (!bench) return null;
  let entry = merged.get(eraId);
  if (!entry) {
    entry = ERA_TAIL[eraId] ? { ...bench, tail: ERA_TAIL[eraId] } : bench;
    merged.set(eraId, entry);
  }
  return entry;
};
