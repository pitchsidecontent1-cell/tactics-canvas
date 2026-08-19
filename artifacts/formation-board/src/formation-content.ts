// Editorial content for each formation, keyed by formation name (the ID used
// throughout the app). Edit copy here without touching any UI code.

export type KeyRole = {
  role: string;
  job: string;
};

// Written for readers who are new to tactics: short bullets, everyday words,
// and the reason behind each idea rather than the jargon name for it.
export type CoreIdeas = {
  inPossession: string[];
  outOfPossession: string[];
  principles: string[];
  keyRoles: [KeyRole, KeyRole];
  strength: string;
  vulnerability: string;
};

export type FormationContent = {
  coreIdeas: CoreIdeas;
  funFacts: string[];
};

export const FORMATION_CONTENT: Record<string, FormationContent> = {
  '4-4-2': {
    coreIdeas: {
      inPossession: [
        'The two wide midfielders stay near the touchlines to stretch the pitch',
        'Both full-backs push up, so it becomes almost four attackers across the front',
      ],
      outOfPossession: [
        'Two straight lines of four players, one behind the other',
        'The two strikers stand in front of the opposition’s deepest midfielder',
      ],
      principles: [
        'Width comes from the wingers, so the full-backs only join when someone covers behind',
        'Of the two central midfielders, one stays home while the other gets forward',
        'The two strikers work as a pair: one comes short, one runs in behind',
        'Most chances come from crosses and from winning the loose ball after them',
      ],
      keyRoles: [
        { role: 'The strike pair', job: 'Play off each other, keep both centre-backs busy, and start the pressing together' },
        { role: 'The holding midfielder', job: 'Sit in front of the defence and keep the ball moving — only two players protect the middle' },
      ],
      strength: 'Simple to organise, hard to pull apart, and dangerous from wide areas',
      vulnerability: 'A team playing three central midfielders can outnumber the two in here',
    },
    funFacts: [
      'The 4-4-2 grew out of English football in the 1960s, with Alf Ramsey\u2019s England popularising a four-man midfield on the way to the 1966 World Cup.',
      'Arrigo Sacchi\u2019s AC Milan of the late 1980s is the most celebrated 4-4-2, winning back-to-back European Cups with a hyper-compact, high-pressing version.',
      'Unlike the textbook two flat banks, Sacchi\u2019s version defended with barely 25 metres between the striker and the last defender, squeezing opponents into a tiny playing area.',
    ],
  },
  '4-3-3': {
    coreIdeas: {
      inPossession: [
        'The two wingers stay high and wide, pinning the opposition full-backs back',
        'The full-backs and midfielders push up to add an extra line of attackers',
      ],
      outOfPossession: [
        'The wingers drop back alongside the midfield to make a bank of four or five',
        'The front players press first, before the ball reaches midfield',
      ],
      principles: [
        'The wingers hold the width, which frees the full-backs to pick their moments',
        'One deep midfielder shields the defence and sets the passing tempo',
        'The two midfielders ahead of him run forward into the gaps either side of the centre',
        'Pressing starts with the front three, as the first line of defence',
      ],
      keyRoles: [
        { role: 'The deep midfielder', job: 'Protect the space in front of the defence and start most attacks with his passing' },
        { role: 'The wingers', job: 'Stay high and wide so they get one-against-one chances against the full-backs' },
      ],
      strength: 'Players are always spread into passing triangles, so there is usually an easy option',
      vulnerability: 'If the two forward midfielders push on too far, the deep one is left alone',
    },
    funFacts: [
      'The 4-3-3 became famous through Rinus Michels\u2019 Ajax and the Dutch national team of the early 1970s, the sides that gave the world Total Football.',
      'Johan Cruyff carried the idea to Barcelona, and his 4-3-3 with a patient positional game became the house style of La Masia.',
      'Where the textbook 4-3-3 uses a flat midfield three, Cruyff\u2019s version staggered it around a deep organiser — a role later defined by Pep Guardiola the player.',
    ],
  },
  '4-2-3-1': {
    coreIdeas: {
      inPossession: [
        'The two deep midfielders split apart to help the defenders start attacks',
        'The wingers cut inside while the full-backs overlap around them',
      ],
      outOfPossession: [
        'A compact block, with the creative midfielder marking the opponent’s deepest passer',
        'The wingers drop back to help the full-backs',
      ],
      principles: [
        'Width comes from the full-backs, because the wingers attack the inside channels',
        'Two deep midfielders share the defending, so one can always step forward',
        'The creative midfielder connects midfield to attack by finding gaps between the lines',
        'The lone striker occupies both centre-backs to keep space free behind them',
      ],
      keyRoles: [
        { role: 'The number ten', job: 'Find pockets of space between their midfield and defence, and turn to face goal' },
        { role: 'The two deep midfielders', job: 'One breaks up play, the other passes — together they free up the four attackers' },
      ],
      strength: 'Plenty of attackers, but still two dedicated protectors in front of the defence',
      vulnerability: 'If the creative midfielder is marked out, attack and midfield lose their link',
    },
    funFacts: [
      'The 4-2-3-1 spread through Spanish and French football in the 1990s and became Europe\u2019s default shape by the 2010 World Cup, which Spain won using it.',
      'Jos\u00e9 Mourinho\u2019s Real Madrid of 2011-12 rode a devastating counter-attacking 4-2-3-1 to a 100-point La Liga title.',
      'Unlike the possession-first textbook version, Mourinho\u2019s Madrid used the shape as a launch pad for vertical transitions, going from box to box in a handful of passes.',
    ],
  },
  '4-1-4-1': {
    coreIdeas: {
      inPossession: [
        'The single deep midfielder drops between or in front of the centre-backs to help build',
        'The two central midfielders push forward to support the striker',
      ],
      outOfPossession: [
        'Two tight lines of four and five, with one player patrolling the gap between them',
        'The striker presses alone and forces play towards the touchline',
      ],
      principles: [
        'The wide midfielders stay disciplined near the touchline to keep the shape',
        'The single deep midfielder shields the defence and is the safe pass under pressure',
        'The two central midfielders arrive in the box late rather than starting high up',
        'The lone striker steers the opposition sideways instead of chasing everywhere',
      ],
      keyRoles: [
        { role: 'The anchor', job: 'Hold the space in front of the defence and begin nearly every attack' },
        { role: 'The two central midfielders', job: 'Cover ground box to box and get into the penalty area late' },
      ],
      strength: 'Extremely difficult to play through down the middle',
      vulnerability: 'The lone striker can be left isolated with no one near him',
    },
    funFacts: [
      'The 4-1-4-1 rose to prominence as a pressing shape in the 2000s, prized for the clean five-man second line it creates without the ball.',
      'Pep Guardiola leaned on a 4-1-4-1 at Bayern Munich, often listing it as the nominal shape behind his fluid positional attacks.',
      'Guardiola\u2019s twist was inverting his full-backs into midfield, so the nominal 4-1-4-1 became a 2-3-2-3 the moment Bayern had the ball.',
    ],
  },
  '4-4-1-1': {
    coreIdeas: {
      inPossession: [
        'The second striker drops into the space behind the front man to link play',
        'The wide midfielders push high to support the attack',
      ],
      outOfPossession: [
        'It looks like two banks of four, with an extra forward just in front',
        'That withdrawn forward blocks passes into the opponent’s deepest midfielder',
      ],
      principles: [
        'Width comes from the two wide midfielders, not from the full-backs',
        'The second striker is the free man — finding him is the whole plan',
        'The central midfielders stay disciplined; the forward runs come from wide',
        'Quick one-twos between the two forwards spring the attack',
      ],
      keyRoles: [
        { role: 'The withdrawn forward', job: 'Drift into gaps, link the play, and arrive unmarked in the box' },
        { role: 'The wide midfielders', job: 'Provide the width going forward and cover the full-backs behind' },
      ],
      strength: 'A player floating between the lines is very awkward for a back four to pick up',
      vulnerability: 'With only one true striker, there can be too few bodies in the box',
    },
    funFacts: [
      'The 4-4-1-1 is the classic vehicle for a deep-lying forward, a role Italian football romanticised as the fantasista playing "between the lines".',
      'Alex Ferguson\u2019s mid-90s Manchester United often played a 4-4-1-1 in practice, with Eric Cantona dropping off the front line as the creative hub.',
      'Rather than a pure playmaker, Cantona\u2019s version of the role mixed goal-scoring with creation — he finished as United\u2019s top scorer while playing as the link man.',
    ],
  },
  '4-5-1': {
    coreIdeas: {
      inPossession: [
        'The wide midfielders push up and it starts to look like a front three',
        'The striker holds the ball up so the rest of the team can move up the pitch',
      ],
      outOfPossession: [
        'A wall of five midfielders in front of a flat back four',
        'The whole block slides side to side together',
      ],
      principles: [
        'Width comes from the wide midfielders sprinting forward when possession is won',
        'Three central midfielders win the numbers game in the middle',
        'The striker holds the ball alone to buy time for support to arrive',
        'Staying compact matters more than pressing high',
      ],
      keyRoles: [
        { role: 'The target striker', job: 'Occupy the defenders alone, hold up long balls, and wait for runners' },
        { role: 'The central three', job: 'Outnumber the opposition midfield and shield the back four' },
      ],
      strength: 'Controls the centre of the pitch and is very hard to break down',
      vulnerability: 'Can drop too deep and leave the striker with no support at all',
    },
    funFacts: [
      'The 4-5-1 became a staple of European away performances in the 2000s, when packing midfield was the accepted way to survive on the road.',
      'Rafael Ben\u00edtez\u2019s Liverpool used a disciplined 4-5-1 on the run to the 2005 Champions League title, including the famous comeback in Istanbul.',
      'Ben\u00edtez\u2019s version was really a 4-2-3-1 in disguise — Steven Gerrard was pushed up behind the striker rather than sitting in a flat five.',
    ],
  },
  '4-2-2-2': {
    coreIdeas: {
      inPossession: [
        'Four midfielders form a box: two sitting, two attacking',
        'The two attacking midfielders play in the gaps between the centre and the wings',
      ],
      outOfPossession: [
        'A narrow shape that gives up the flanks to protect the middle',
        'The two strikers stay central, ready for the counter',
      ],
      principles: [
        'Almost all the width comes from the full-backs running forward',
        'The two attacking midfielders stay inside, never out by the touchline',
        'Forward passes through the box of four midfielders break lines quickly',
        'The two strikers stay central to finish the chances that creates',
      ],
      keyRoles: [
        { role: 'The attacking midfield pair', job: 'Roam the inside channels, combine through the middle, and slide passes to the strikers' },
        { role: 'The full-backs', job: 'Supply every bit of width — the shape fails if they cannot get forward' },
      ],
      strength: 'Floods the centre and creates quick, direct combinations',
      vulnerability: 'Leaves huge space behind the full-backs when possession is lost',
    },
    funFacts: [
      'The 4-2-2-2 with its "magic square" midfield is a Brazilian and South American classic, associated with Tel\u00ea Santana\u2019s beloved 1982 Brazil side.',
      'Ralf Rangnick championed a pressing version of the 4-2-2-2 at Hoffenheim and RB Leipzig, using the narrow front four to hunt central turnovers.',
      'Where the Brazilian original was built for artistry on the ball, Rangnick\u2019s version weaponised the same shape against the ball, cutting the pitch in half to force mistakes.',
    ],
  },
  '4-3-1-2': {
    coreIdeas: {
      inPossession: [
        'A narrow attack, with a creative midfielder feeding two strikers',
        'The full-backs provide all the width by overlapping high',
      ],
      outOfPossession: [
        'The creator drops onto the opponent’s deepest midfielder',
        'It becomes a tight, narrow block through the middle',
      ],
      principles: [
        'All the width comes from the full-backs; the midfield stays deliberately narrow',
        'The creative midfielder plays in the space just behind the two strikers',
        'The midfield three shuffle across to cover the flanks when full-backs go forward',
        'Goals come from central overloads and quick one-twos',
      ],
      keyRoles: [
        { role: 'The number ten', job: 'Play the final pass to two strikers making opposite runs' },
        { role: 'The full-backs', job: 'Deliver the width that the narrow midfield deliberately gives up' },
      ],
      strength: 'Outnumbers almost any midfield in the middle of the pitch',
      vulnerability: 'Very exposed out wide if the full-backs are pinned back',
    },
    funFacts: [
      'The 4-3-1-2 is a staple of Italian football, where narrow midfields and playmakers in the hole have a long tradition.',
      'Carlo Ancelotti used a 4-3-1-2 at Juventus and early AC Milan, before famously bending his systems around the players available.',
      'Ancelotti\u2019s twist at Milan was dropping the playmaker to the base instead of the hole — moving Andrea Pirlo deep created the modern deep-lying playmaker role.',
    ],
  },
  '4-3-2-1': {
    coreIdeas: {
      inPossession: [
        'Two creative players float behind a lone striker, in a narrow, tapering shape',
        'The full-backs and midfielders step wide when width is needed',
      ],
      outOfPossession: [
        'The two creators tuck inside to clog the middle',
        'It becomes a compact block with five across midfield',
      ],
      principles: [
        'Width comes only from the full-backs and from midfielders stepping out',
        'The two attacking midfielders crowd the space in front of the opposition’s deep midfielder',
        'The striker keeps the centre-backs busy so those two can receive facing goal',
        'Chances come from patient passing through the middle, not from crosses',
      ],
      keyRoles: [
        { role: 'The two creators', job: 'Share the creative work and swap positions so neither can be man-marked' },
        { role: 'The lone striker', job: 'Occupy the whole back line and finish the moves built through the middle' },
      ],
      strength: 'Two free creators are very hard for a standard back four to track',
      vulnerability: 'Very narrow, so a team that switches play quickly can stretch it apart',
    },
    funFacts: [
      'The 4-3-2-1 is nicknamed the "Christmas tree" for its tapering rows of four, three, two and one.',
      'Carlo Ancelotti\u2019s AC Milan made the shape famous in the mid-2000s, fitting Kak\u00e1, Seedorf and Rui Costa into the same side on the way to Champions League finals.',
      'Ancelotti adopted the tree partly out of pragmatism — it was less a tactical ideal than the only geometry that let all his playmakers coexist.',
    ],
  },
  '4-3-3 Attack': {
    coreIdeas: {
      inPossession: [
        'An all-out attacking shape, with both midfielders and both wingers high up',
        'The full-backs step into midfield rather than staying home',
      ],
      outOfPossession: [
        'The ball is hunted immediately, high up the pitch',
        'The shape gambles on winning it back before the opponent can counter',
      ],
      principles: [
        'The wingers stay on the last defender to constantly threaten in behind',
        'Both central midfielders attack the box while one player holds the centre alone',
        'The full-backs step inside or run beyond, instead of sitting back',
        'Losing the ball triggers an immediate swarm to win it straight back',
      ],
      keyRoles: [
        { role: 'The advanced midfielders', job: 'Arrive in the box as extra attackers, effectively making a front five' },
        { role: 'The lone holder', job: 'Deal with counter-attacks by himself — the most exposed job on the pitch' },
      ],
      strength: 'Overwhelms deep defences with sheer numbers in the final third',
      vulnerability: 'One failed press leaves the holder and centre-backs badly outnumbered',
    },
    funFacts: [
      'The attacking 4-3-3 with high eights is the signature of Jürgen Klopp\u2019s Liverpool and Pep Guardiola\u2019s Manchester City, the sides that defined the Premier League\u2019s late-2010s duopoly.',
      'Klopp\u2019s version pushed both full-backs into playmaking roles, with Trent Alexander-Arnold and Andy Robertson leading the team\u2019s assist charts.',
      'Unlike the patient textbook 4-3-3, Klopp\u2019s "heavy metal" interpretation treated the counter-press itself as the playmaker, creating chances from turnovers rather than build-up.',
    ],
  },
  '3-4-3': {
    coreIdeas: {
      inPossession: [
        'Three defenders build from the back while the wing-backs provide the width',
        'A fluid front three interchange positions ahead of them',
      ],
      outOfPossession: [
        'The wing-backs drop back to make a back five',
        'The front players screen the middle in a compact block',
      ],
      principles: [
        'All the width comes from the two wing-backs, who cover the whole touchline',
        'The back three spread wide to invite pressure, then pass around it',
        'The two central midfielders shield the defence and switch play side to side',
        'The wide forwards play inside, between the full-back and centre-back',
      ],
      keyRoles: [
        { role: 'The wing-backs', job: 'Own an entire flank each — defend like full-backs, attack like wingers' },
        { role: 'The central striker', job: 'Link the two inside forwards and occupy the middle centre-back' },
      ],
      strength: 'An extra man in build-up, plus real width high up the pitch',
      vulnerability: 'If the wing-backs are caught forward, the back three is exposed out wide',
    },
    funFacts: [
      'The 3-4-3 has deep Dutch roots — Johan Cruyff used a diamond-midfield version at Barcelona to free an extra attacker.',
      'Antonio Conte revived the back-three 3-4-3 at Chelsea in 2016-17, switching mid-season and then winning 13 straight league games.',
      'Conte\u2019s version was more defensive than Cruyff\u2019s ideal: his wide forwards tucked in to form a 5-4-1 without the ball, prioritising the clean sheet over constant attack.',
    ],
  },
  '3-4-1-2': {
    coreIdeas: {
      inPossession: [
        'A creator links the wing-backs’ width to two central strikers',
        'The wide centre-backs step out with the ball to start attacks',
      ],
      outOfPossession: [
        'It becomes a back five with three in midfield',
        'The creator drops onto the opponent’s deepest midfielder',
      ],
      principles: [
        'The wing-backs supply all the width so the front three can stay central',
        'The creator finds space behind the strikers while they occupy the defenders',
        'The two central midfielders stay home to protect the back three',
        'Long diagonal passes from the wide centre-backs find the wing-backs running',
      ],
      keyRoles: [
        { role: 'The number ten', job: 'Operate between the lines and feed two strikers' },
        { role: 'The outside centre-backs', job: 'Step forward with the ball and defend the space behind the wing-backs' },
      ],
      strength: 'Two strikers plus a creator gives a constant threat through the middle',
      vulnerability: 'Only two central midfielders sit behind a very attacking front three',
    },
    funFacts: [
      'The 3-4-1-2 flourished in Serie A in the late 1990s and 2000s, when back-three systems remained mainstream in Italy long after they faded elsewhere.',
      'Carlo Ancelotti fielded a 3-4-1-2 at Parma in the late 1990s, famously struggling to fit an unwilling Gianfranco Zola into its rigid roles.',
      'Ancelotti later called that rigidity a lesson — his mature teams bent the system to the players, the opposite of his Parma years.',
    ],
  },
  '3-4-2-1': {
    coreIdeas: {
      inPossession: [
        'Two free attackers float behind a lone striker',
        'The wing-backs stay wide to stretch the pitch',
      ],
      outOfPossession: [
        'A back five with four in front, and the two creators tucking inside',
        'Very few gaps are left through the middle',
      ],
      principles: [
        'Width comes from the wing-backs; the two attackers live in the inside channels',
        'The striker occupies the central defender so those two can receive facing goal',
        'The back three and two midfielders form a secure base against counter-attacks',
        'Passing combinations through the inside channels unlock deep defences',
      ],
      keyRoles: [
        { role: 'The two free attackers', job: 'Swap sides constantly to overload whichever flank the ball is on' },
        { role: 'The midfield pair', job: 'Keep possession ticking and snuff out counter-attacks before they start' },
      ],
      strength: 'Overloads the inside channels while staying very secure at the back',
      vulnerability: 'The lone striker can be starved if the two creators are tracked',
    },
    funFacts: [
      'The 3-4-2-1 became one of Europe\u2019s most fashionable shapes in the late 2010s, blending the security of a back five with two free creators.',
      'Thomas Tuchel switched Chelsea to a 3-4-2-1 on arrival in January 2021 and won the Champions League with it four months later.',
      'Tuchel\u2019s version was defined by its rest defence — the back three and double pivot barely crossed halfway, which is why that Chelsea conceded just twice in the knockout rounds.',
    ],
  },
  '3-5-2': {
    coreIdeas: {
      inPossession: [
        'Five midfielders dominate the centre while the wing-backs stretch the pitch',
        'The spare centre-back steps forward with the ball',
      ],
      outOfPossession: [
        'The wing-backs drop in to complete a back five',
        'Three midfielders screen in front of them',
      ],
      principles: [
        'Width comes only from the wing-backs, on both sides',
        'Three central midfielders control the tempo and win the loose balls',
        'The two strikers split the centre-backs and attack crosses together',
        'The spare centre-back can step into midfield when his team has the ball',
      ],
      keyRoles: [
        { role: 'The wing-backs', job: 'Run the full length of the flank all game — the engine of the system' },
        { role: 'The midfield three', job: 'Outnumber the opposition in the middle and feed the wing-backs’ runs' },
      ],
      strength: 'Extra men both in central midfield and at the back',
      vulnerability: 'If the wing-backs tire or lack pace, the team has no width at all',
    },
    funFacts: [
      'Carlos Bilardo\u2019s Argentina popularised the 3-5-2 at the 1986 World Cup, building the midfield five around Diego Maradona.',
      'Antonio Conte turned Juventus into a 3-5-2 machine from 2011, going unbeaten in Serie A in his first season with the shape.',
      'Conte\u2019s twist on Bilardo\u2019s original was the regista: instead of a destroyer at the base, Andrea Pirlo conducted the entire game from the deepest midfield slot.',
    ],
  },
  '3-1-4-2': {
    coreIdeas: {
      inPossession: [
        'One deep midfielder links a back three to an aggressive line of four',
        'Two strikers stay high, with midfielders running past them',
      ],
      outOfPossession: [
        'The midfield four drops in alongside the deep midfielder',
        'The whole team presses high to pin opponents in their own half',
      ],
      principles: [
        'Width comes from the wide midfielders pushing on like extra wing-backs',
        'The single deep midfielder connects defence to attack and covers both sides',
        'The inside midfielders run beyond the strikers, not just up to them',
        'Pressing from the front six keeps the game in the opponent’s half',
      ],
      keyRoles: [
        { role: 'The anchor', job: 'Alone at the base — shield, pass, and read every counter-attack' },
        { role: 'The inside midfielders', job: 'Run past the two strikers to turn a front two into a front four' },
      ],
      strength: 'A ferocious pressing shape with runners arriving from everywhere',
      vulnerability: 'Physically brutal to play — gaps appear as legs tire',
    },
    funFacts: [
      'The 3-1-4-2 is closely associated with Marcelo Bielsa, whose sides at Athletic Bilbao and Leeds pressed man-for-man from this aggressive base.',
      'Bielsa\u2019s famous rule was the spare man: he switched between a back four and back three depending on how many strikers the opponent fielded.',
      'Unlike the containing back-three systems of Italian tradition, Bielsa\u2019s version used the shape to chase the ball — his Leeds side routinely posted the league\u2019s highest running numbers.',
    ],
  },
  '5-3-2': {
    coreIdeas: {
      inPossession: [
        'The wing-backs push forward while a back three and midfield trio stay safe',
        'Attacks often come from long passes and the strikers running the channels',
      ],
      outOfPossession: [
        'A disciplined line of five defenders with three midfielders in front',
        'The team sits deep and gives up space out wide',
      ],
      principles: [
        'Width comes from the wing-backs picking their moments to go',
        'The back five defends the width of the penalty box; wide areas are conceded early',
        'The midfield three block the middle before worrying about the flanks',
        'Counter-attacks start with long diagonals and the strikers running in behind',
      ],
      keyRoles: [
        { role: 'The middle centre-back', job: 'Organise the line, cover behind it, and start attacks with forward passes' },
        { role: 'The strike pair', job: 'Stay connected on the counter — one holds the ball, one runs beyond' },
      ],
      strength: 'Extremely solid through the middle',
      vulnerability: 'Naturally sits deep and can struggle to get out of its own half',
    },
    funFacts: [
      'The 5-3-2 with a sweeper carried West Germany to the 1990 World Cup, with Franz Beckenbauer coaching the shape he had once defined as a player.',
      'The modern zonal 5-3-2 owes much to Antonio Conte\u2019s Italy at Euro 2016, which outperformed far more talented squads with drilled defensive choreography.',
      'Where the classic version used a libero sweeping behind man-markers, Conte\u2019s flat back five defends space zonally — the sweeper role has effectively moved to the goalkeeper.',
    ],
  },
  '5-4-1': {
    coreIdeas: {
      inPossession: [
        'Direct passes to the lone striker, with wing-backs joining only when safe',
        'Set pieces and long throws become genuine scoring chances',
      ],
      outOfPossession: [
        'Two deep lines of five and four — the classic defensive wall',
        'Nine players sit behind the ball',
      ],
      principles: [
        'Deny space behind first; the defence only steps up on clear signals',
        'Wide midfielders double up with wing-backs against dangerous wingers',
        'The striker defends the front zone alone and starts every counter',
        'Set pieces are treated as a main route to goal, not an afterthought',
      ],
      keyRoles: [
        { role: 'The lone striker', job: 'Chase alone, hold the ball under pressure, and win the free kicks that matter' },
        { role: 'The wide midfielders', job: 'Sprint the length of the pitch both ways to link defence and counter' },
      ],
      strength: 'With nine behind the ball, clear chances are rare',
      vulnerability: 'Almost no attacking presence — going a goal down means chasing the game',
    },
    funFacts: [
      'The 5-4-1 low block is the great equaliser of knockout football, the default shape for underdogs protecting a result.',
      'Diego Simeone\u2019s Atl\u00e9tico Madrid have dropped into a 5-4-1 for famous Champions League defences, though their base shape remains a 4-4-2.',
      'The purest version may be Greece at Euro 2004 under Otto Rehhagel, who mixed the deep block with old-fashioned man-marking — and won the whole tournament with it.',
    ],
  },
  '5-2-3': {
    coreIdeas: {
      inPossession: [
        'A front three stays high while the wing-backs push on',
        'Fast counter-attacks release the front three the moment the ball is won',
      ],
      outOfPossession: [
        'The front three press while a back five stays as insurance',
        'The wide forwards drop back when the team needs a deeper block',
      ],
      principles: [
        'The front three press high while the back five stays safe behind',
        'Attacking width comes from wing-backs running inside the wide forwards',
        'Only two midfielders cover the whole central area, so positioning must be perfect',
        'The front three break at speed the instant possession is won',
      ],
      keyRoles: [
        { role: 'The wide forwards', job: 'Counter-attack from high positions and trap the opponent’s build-up' },
        { role: 'The midfield pair', job: 'Hold the huge space in the middle between defence and attack' },
      ],
      strength: 'Combines a back-five safety net with a genuine three-man counter threat',
      vulnerability: 'Only two midfielders — teams that play through the middle find gaps',
    },
    funFacts: [
      'The 5-2-3 is really a 3-4-3 with the handbrake on, and coaches switch between the two labels depending on where the wing-backs start.',
      'Roberto Mancini\u2019s Inter used back-five shapes with a front three to end Juventus\u2019 domestic dominance in the mid-2000s.',
      'Modern versions, like Antonio Conte\u2019s Inter title side of 2020-21, defended in a 5-2-3 but attacked as a 3-2-5 — the same eleven players drawing two different shapes.',
    ],
  },
  '5-3-1-1': {
    coreIdeas: {
      inPossession: [
        'A creator links the lone striker to a midfield three breaking forward',
        'The wing-backs join only when the counter is clearly on',
      ],
      outOfPossession: [
        'A back five and midfield three form the block',
        'The two forwards stay high, ready for the counter',
      ],
      principles: [
        'The back five and midfield three do the defending; the front two stay up',
        'The creator is the escape route — every clearance looks for his feet',
        'The wing-backs only commit forward when the counter is clearly on',
        'The striker runs the channels to drag defenders away from the creator',
      ],
      keyRoles: [
        { role: 'The creator', job: 'Turn defending into attacking by carrying the ball or playing the first pass' },
        { role: 'The middle centre-back', job: 'Command the deepest line and keep the whole block connected' },
      ],
      strength: 'Very solid, but still keeps a creative outlet for the counter',
      vulnerability: 'The front two can go long spells without touching the ball',
    },
    funFacts: [
      'The 5-3-1-1 is a favourite tournament shape for underdogs who still want a playmaker on the pitch rather than a pure front two.',
      'It shares DNA with the sweeper systems of 1990s international football, where a libero played behind man-markers and a fantasista floated in front.',
      'Unlike the flat 5-4-1, the 5-3-1-1 concedes one defensive body to keep the ten high — a bet that one moment of creativity outweighs an extra man in the block.',
    ],
  },
  '4-2-4': {
    coreIdeas: {
      inPossession: [
        'Four permanent attackers stretched right across the front',
        'The ball goes forward early — this shape is built for the final third',
      ],
      outOfPossession: [
        'The wingers reluctantly drop back to make a bank of four',
        'The middle of the pitch stays badly outnumbered',
      ],
      principles: [
        'Two wingers and two strikers pin the entire opposition back four',
        'The two central midfielders must win their duels — there is no help coming',
        'Get the ball forward early rather than building patiently',
        'The full-backs stay honest to avoid total exposure on the counter',
      ],
      keyRoles: [
        { role: 'The wingers', job: 'Beat their man one-against-one and deliver — the whole shape feeds them' },
        { role: 'The midfield pair', job: 'Cover the biggest workload in football: two against three or more' },
      ],
      strength: 'Overwhelming attacking presence in the final third',
      vulnerability: 'A two-man midfield is permanently outnumbered',
    },
    funFacts: [
      'The 4-2-4 was developed in Brazil and Hungary in the 1950s and swept the world after Brazil won the 1958 World Cup with it.',
      'Brazil\u2019s 1970 side nominally lined up in a 4-2-4 built around Pel\u00e9, though its stars interchanged so freely the numbers barely mattered.',
      'The textbook 4-2-4 relied on one winger dropping back in defence to make a 4-3-3 — Mário Zagallo performed exactly that shuttle in 1958 before later coaching the 1970 team.',
    ],
  },
  '4-1-2-1-2': {
    coreIdeas: {
      inPossession: [
        'A diamond in midfield: one deep, two either side, one attacking',
        'The full-backs supply all the width by overlapping',
      ],
      outOfPossession: [
        'The diamond shifts across as a unit to block the middle',
        'The flanks are deliberately given up',
      ],
      principles: [
        'All the width comes from the full-backs — the diamond never leaves the centre',
        'The deep midfielder covers behind while the two beside him press wide',
        'The attacking midfielder plays the final pass between two strikers',
        'Crowding the middle creates four-against-three against most midfields',
      ],
      keyRoles: [
        { role: 'The tip of the diamond', job: 'Create everything from the space just behind the strikers' },
        { role: 'The base of the diamond', job: 'Protect the back four alone and switch play to whichever full-back is free' },
      ],
      strength: 'Total control of central midfield, with two strikers to finish',
      vulnerability: 'The flanks belong to the opposition full-backs all game',
    },
    funFacts: [
      'The midfield diamond has recurred for decades, from Brazil\u2019s 1994 World Cup winners to Carlo Ancelotti\u2019s AC Milan of the mid-2000s.',
      'Ancelotti\u2019s Milan diamond put Andrea Pirlo at the base and Kak\u00e1 at the tip, winning the 2007 Champions League with it.',
      'The classic diamond puts its playmaker at the tip; Ancelotti\u2019s inversion put a second one at the base, forcing opponents to defend creators at both ends of the midfield.',
    ],
  },
  '4-2-1-3': {
    coreIdeas: {
      inPossession: [
        'A creator connects two deep midfielders to a fixed front three',
        'The wingers stay high and wide to isolate defenders',
      ],
      outOfPossession: [
        'The wingers drop back and the creator shadows the opponent’s deep midfielder',
        'It becomes a compact block with two banks of four',
      ],
      principles: [
        'The wingers stay high and wide to get one-against-one chances',
        'The creator floats behind the striker as the free man',
        'Two deep midfielders give cover so both full-backs can overlap',
        'Quick forward passes through the creator release the front three early',
      ],
      keyRoles: [
        { role: 'The number ten', job: 'Receive between the lines and slide passes into three runners' },
        { role: 'The centre-forward', job: 'Occupy the back line so the others attack space instead of bodies' },
      ],
      strength: 'A stable base with four players permanently committed to attacking',
      vulnerability: 'Can be bypassed by teams that pass around the block rather than through it',
    },
    funFacts: [
      'The 4-2-1-3 is best understood as a 4-2-3-1 with the wide men pushed all the way up into a true front three.',
      'Jos\u00e9 Mourinho\u2019s treble-winning Inter of 2010 often took this staggered form, with Wesley Sneijder behind a three of Eto\u2019o, Milito and Pandev.',
      'Mourinho\u2019s twist was asking his wide forwards to defend like full-backs in the biggest games — Eto\u2019o famously spent the Champions League semi-final at Camp Nou defending the right flank.',
    ],
  },
  '4-4-2 Diamond': {
    coreIdeas: {
      inPossession: [
        'A narrow diamond in midfield feeds two strikers',
        'The full-backs provide all the width',
      ],
      outOfPossession: [
        'The diamond squeezes the middle and forces play out wide',
        'Wide areas are deliberately left open',
      ],
      principles: [
        'The deepest player shields, the two beside him press, the top one creates',
        'The full-backs must attack in turns — one goes, one stays',
        'The two strikers make opposite runs: one to the ball, one in behind',
        'Winning the middle matters more than protecting the flanks',
      ],
      keyRoles: [
        { role: 'The tip of the diamond', job: 'The main creator, playing between the lines with two strikers to aim at' },
        { role: 'The strike partnership', job: 'Stretch the defence so the diamond has room to play' },
      ],
      strength: 'Extra men in central midfield, plus a genuine front two',
      vulnerability: 'The wide areas are permanently under-defended',
    },
    funFacts: [
      'The diamond 4-4-2 has been a recurring answer to fitting two strikers and a playmaker into one team without sacrificing midfield numbers.',
      'Carlo Ancelotti\u2019s AC Milan used the diamond to reach three Champions League finals in five seasons during the 2000s.',
      'Unlike the flat 4-4-2\u2019s wing play, the diamond deliberately abandons the flanks — Milan\u2019s only width came from Cafu and Serginho charging forward from full-back.',
    ],
  },
  '3-4-3 Diamond': {
    coreIdeas: {
      inPossession: [
        'The four midfielders sit in a diamond: one behind, two either side, one ahead',
        'With no natural wingers in midfield, the wide forwards hold the touchlines instead',
      ],
      outOfPossession: [
        'The diamond tilts towards the ball, so the near side is always crowded',
        'The three at the back stay narrow and let the front three lead the press',
      ],
      principles: [
        'The player at the bottom of the diamond screens the back three and never joins the attack',
        'The two on the sides shuttle: one presses, the other covers the space behind',
        'The player at the top plays between the lines, close enough to support the striker',
        'Because the middle is stacked, switches of play out to the wide forwards are the release',
      ],
      keyRoles: [
        { role: 'The point of the diamond', job: 'Find the pocket between the opponent’s midfield and defence, and turn forward whenever nobody follows' },
        { role: 'The base of the diamond', job: 'Screen the back three alone — every counter-attack comes through this space' },
      ],
      strength: 'Overloads the centre completely, so a team that plays through the middle is smothered',
      vulnerability: 'The flanks are left to two players, so quick switches can find space out wide',
    },
    funFacts: [
      'A diamond and a flat four use the same number of midfielders, but the diamond covers about twice the vertical distance and half the width — which is why teams using it defend the middle well and the touchlines badly.',
      'The shape asks the wide forwards to defend far more than usual: with nobody outside them in midfield, they drop to help the wing-backs, and the 3-4-3 quietly becomes a 5-4-1.',
      'Diamonds fell out of fashion as pressing grew: the base of the diamond is isolated against teams that attack in wide areas, which is where most modern build-up starts.',
    ],
  },
  '3-2-4-1': {
    coreIdeas: {
      inPossession: [
        'Two midfielders sit just in front of the three defenders to give safe passing angles',
        'Four attackers spread across the pitch ahead of them, with a lone striker highest',
      ],
      outOfPossession: [
        'The front players press in a line, trying to force play towards a touchline',
        'If the press is beaten the shape drops into a back five with four in front',
      ],
      principles: [
        'The two in front of the defence form a square with two centre-backs — always an easy pass available',
        'Keeping five players across the attacking line stretches the opponent’s defence flat',
        'The wide attackers stay high and wide until the ball arrives, then attack the space inside',
        'Because so many players are forward, losing the ball must be met by an immediate counter-press',
      ],
      keyRoles: [
        { role: 'The two holding midfielders', job: 'Sit between the lines to receive under pressure, and cover the counter-attack the instant possession is lost' },
        { role: 'The wide attackers', job: 'Hold the touchline to stretch the defence, then attack the gap between full-back and centre-back' },
      ],
      strength: 'Creates passing triangles everywhere, so a well-drilled side can play out of almost any press',
      vulnerability: 'Only three defenders stay back, so one turnover can leave them exposed to runners',
    },
    funFacts: [
      'This is less a starting line-up than a shape teams move into with the ball: many sides begin in a 4-3-3 and become a 3-2-4-1 when a full-back steps inside into midfield.',
      'Pep Guardiola’s Manchester City used it through the 2022-23 treble season, with a centre-back stepping into midfield in possession and dropping back out of it.',
      'The idea behind it is older than it looks: putting two players in front of the defence to make a square with the centre-backs was a staple of Dutch coaching long before it had a number.',
    ],
  },
  '4-1-3-2': {
    coreIdeas: {
      inPossession: [
        'One midfielder holds while the three ahead push up to support the two strikers',
        'The full-backs supply the width, since the wide midfielders tuck in towards goal',
      ],
      outOfPossession: [
        'The holding midfielder screens the space in front of the back four',
        'The three ahead press the ball while the strikers block passes back inside',
      ],
      principles: [
        'The single holder decides how brave everyone else can be — if they hold, the other three attack',
        'The two strikers split the centre-backs so the midfield runners have somewhere to run',
        'Width has to come from the full-backs, so they push high while the holder covers behind',
        'The player in the middle of the three is the link: always available between the lines',
      ],
      keyRoles: [
        { role: 'The anchor', job: 'Screen the back four alone, break up attacks early, and start again with a simple pass' },
        { role: 'The central attacking midfielder', job: 'Sit between the opposition midfield and defence, and get on the ball facing forward' },
      ],
      strength: 'Gets numbers around the strikers quickly while still leaving a player protecting the defence',
      vulnerability: 'One holding midfielder against two can be overrun, leaving the back four exposed',
    },
    funFacts: [
      'The role at the base of this shape is often called the anchor, and Claude Makélélé defined it so completely at Real Madrid and Chelsea that it became known simply as the Makélélé role.',
      'Coaches often reach for this shape when they have two strikers worth building around but only one midfielder they trust to defend alone.',
      'It is one number away from a 4-4-2 and one away from a 4-3-3, which is why teams slide between all three during a match without anyone changing position much.',
    ],
  },
  '5-2-1-2': {
    coreIdeas: {
      inPossession: [
        'The wing-backs push high up the touchlines, turning the five at the back into a three',
        'One creative player sits behind two strikers, in the space defenders hate to follow into',
      ],
      outOfPossession: [
        'The wing-backs drop in to make a flat five across the back',
        'The two in midfield stay narrow, protecting the middle and inviting play wide',
      ],
      principles: [
        'The wing-backs are the whole attack down the sides — nobody else is out there',
        'Three centre-backs mean one can step out to follow a striker without breaking the line',
        'The two central midfielders must cover the whole width when the wing-backs are forward',
        'With two strikers pinned high, counter-attacks start with one long, direct pass',
      ],
      keyRoles: [
        { role: 'The wing-backs', job: 'Provide all the width going forward and all the cover coming back — the hardest running job on the pitch' },
        { role: 'The number ten', job: 'Find the gap between midfield and defence, and link the two strikers to the rest of the team' },
      ],
      strength: 'Very hard to break down centrally, and dangerous on the counter with two strikers already high',
      vulnerability: 'Tired wing-backs leave the whole flank empty, and only two players cover the middle',
    },
    funFacts: [
      'A back five is usually a back three in disguise: as soon as the team has the ball, the wing-backs push up and only three defenders remain.',
      'Because the wing-backs cover the entire touchline in both directions, sides using this shape often record the highest distances of any outfield players in a league.',
      'Italian football has returned to a back three repeatedly for eighty years, from the catenaccio of the 1960s to the wing-back sides of the 2010s.',
    ],
  },
  '3-3-3-1': {
    coreIdeas: {
      inPossession: [
        'The pitch is split into even thirds, with three players across each line',
        'Nobody stands in the same lane as a team-mate, so passing angles are always open',
      ],
      outOfPossession: [
        'The lines step forward together to squeeze the opponent into a smaller space',
        'The nearest three press the ball while the lines behind slide across to cover',
      ],
      principles: [
        'Even spacing is the whole idea: three across each line means no part of the pitch is empty',
        'Because everyone has a near team-mate, the ball can be moved out of pressure in one or two passes',
        'The middle three must rotate — one drops to help build, one holds, one pushes on',
        'The lone striker occupies both centre-backs so the players behind can run past them',
      ],
      keyRoles: [
        { role: 'The central midfielder', job: 'Sit in the middle of the grid, receive on the half-turn, and switch play before pressure arrives' },
        { role: 'The lone striker', job: 'Hold the ball up under pressure and give the three behind time to arrive' },
      ],
      strength: 'Superb spacing, so the ball can be circulated calmly against even an aggressive press',
      vulnerability: 'Demands constant movement, and one player out of position leaves a whole lane open',
    },
    funFacts: [
      'This shape is taught more as a set of spacing rules than as a line-up: the point is that no two players occupy the same vertical lane or the same horizontal line.',
      'Coaches often draw it on a gridded pitch, which is where the idea of dividing the field into zones and assigning each one an occupant comes from.',
      'It is rarely written on a team sheet, but many possession sides pass through it: a 4-3-3 in which a full-back inverts and a winger stays wide arrives at exactly these positions.',
    ],
  },
  '3-5-1-1': {
    coreIdeas: {
      inPossession: [
        'Five midfielders give the team numbers in the middle and two outlets out wide',
        'One player supports the striker directly, so counter-attacks have two runners not one',
      ],
      outOfPossession: [
        'The wide midfielders drop right back, making a five at the back and four in front',
        'The two forwards stay central, screening passes into the opposition midfield',
      ],
      principles: [
        'The shape is built to defend deep, keep its lines close, and break quickly',
        'The supporting forward is the first pass out — everything on the counter goes through them',
        'Wide midfielders must cover the whole flank, defending as full-backs and attacking as wingers',
        'Central midfielders stay compact and refuse to be pulled out of position',
      ],
      keyRoles: [
        { role: 'The second striker', job: 'Give the deep block an out-ball, hold it up, and bring the wide runners into the attack' },
        { role: 'The central midfield three', job: 'Stay tight together and block the middle — the whole plan depends on the centre staying shut' },
      ],
      strength: 'Extremely hard to play through, with two forwards left up for the counter',
      vulnerability: 'Concedes territory and possession, so long spells without the ball are guaranteed',
    },
    funFacts: [
      'Deep blocks like this are not a sign of a weaker team so much as a choice about where to defend: the further from your own goal you press, the more space is left behind you.',
      'Keeping two forwards high while defending deep is the compromise at the heart of the shape — it costs a defender or midfielder, but means the team is not defending for the whole match.',
      'Underdogs favour it in knockout football, where conceding possession matters far less than conceding goals.',
    ],
  },
};

// ---------------------------------------------------------------------------
// Manager-era content, keyed by era ID (see MANAGERS in App.tsx).
// teamFacts feed the "Did You Know" box in the managers section; playerFacts
// are keyed by the player's name exactly as it appears in the era's XI.
// ---------------------------------------------------------------------------

export type EraContent = {
  teamFacts: string[];
  playerFacts: Record<string, string[]>;
};

export const ERA_CONTENT: Record<string, EraContent> = {
  'fergie-99': {
    teamFacts: [
      'This side won the 1998-99 Treble — Premier League, FA Cup and Champions League — the first time an English men\u2019s club had ever done it.',
      'The Champions League final against Bayern Munich was won with two goals in stoppage time, from Sheringham and Solskj\u00e6r, after trailing since the sixth minute.',
      'Both Roy Keane and Paul Scholes missed that final through suspension, Keane after dragging United back from 2-0 down in the semi-final in Turin.',
    ],
    playerFacts: {
      Schmeichel: [
        'Peter Schmeichel captained United in the 1999 Champions League final in his last game for the club.',
        'He had already won an international title before arriving: the shock Euro 1992 triumph with Denmark.',
      ],
      Irwin: [
        'Denis Irwin was United\u2019s regular penalty and free-kick taker despite playing full-back.',
        'Signed from Oldham for a modest fee, he made over 500 appearances and is often cited by Ferguson among his best-ever signings.',
      ],
      Johnsen: [
        'Ronny Johnsen was equally comfortable at centre-back or in defensive midfield, and Ferguson used him in both roles.',
        'The Norwegian started all three finals-deciding matches of the 1999 Treble run-in despite a career plagued by knee injuries.',
      ],
      Stam: [
        'Jaap Stam arrived from PSV in 1998 for what was then a world-record fee for a defender.',
        'He was named in the PFA Team of the Year in each of his three seasons in England.',
      ],
      'G. Neville': [
        'Gary Neville spent his entire career at United, making over 600 appearances, almost all at right-back.',
        'He came through the famous "Class of \u201992" youth team alongside Beckham, Scholes, Giggs and his brother Phil.',
      ],
      Giggs: [
        'Ryan Giggs is the most decorated player in English football history, with 13 league titles among his honours.',
        'His extra-time solo goal against Arsenal in the 1999 FA Cup semi-final replay — shirt-swinging celebration included — kept the Treble alive.',
      ],
      Keane: [
        'Roy Keane produced one of the great captain\u2019s performances in the 1999 semi-final against Juventus, scoring and driving United back from 2-0 down while knowing a booking had ruled him out of the final.',
        'He captained United to nine major trophies across twelve seasons.',
      ],
      Scholes: [
        'Paul Scholes, like Keane, was suspended for the 1999 Champions League final after a booking in the semi.',
        'He retired, changed his mind, and returned in 2012 to win one more league title under Ferguson.',
      ],
      Beckham: [
        'With Keane and Scholes suspended, David Beckham played central midfield in the 1999 final and took the corners that led to both goals.',
        'He finished runner-up for the 1999 Ballon d\u2019Or behind Rivaldo.',
      ],
      Yorke: [
        'Dwight Yorke joined from Aston Villa in August 1998 and top-scored for United in the Treble season.',
        'The Trinidadian later helped his country qualify for their first World Cup in 2006 as captain.',
      ],
      Cole: [
        'Andy Cole\u2019s telepathic partnership with Yorke became one of the most celebrated strike pairings in Premier League history.',
        'His delicate chip against Tottenham on the final day of 1998-99 clinched the league leg of the Treble.',
      ],
    },
  },
  'fergie-08': {
    teamFacts: [
      'United won the 2008 Champions League final on penalties against Chelsea in the rain of Moscow, after Ronaldo had scored and then missed in the shoot-out.',
      'This team won back-to-back Premier League titles in 2006-07 and 2007-08, ending Chelsea\u2019s brief dominance.',
      'The front three of Ronaldo, Rooney and T\u00e9vez had no fixed positions, an approach that helped Ronaldo score 42 goals in all competitions that season.',
    ],
    playerFacts: {
      'Van der Sar': [
        'Edwin van der Sar saved Nicolas Anelka\u2019s penalty to win the 2008 Champions League final shoot-out.',
        'In 2008-09 he set a then-record for the longest run without conceding a Premier League goal.',
      ],
      Evra: [
        'Patrice Evra endured a difficult debut in the Manchester derby in 2006 but became one of the league\u2019s best left-backs and later United\u2019s captain.',
        'He reached five Champions League finals across spells with Monaco, United and Juventus.',
      ],
      'Vidi\u0107': [
        'Nemanja Vidi\u0107 was twice named Premier League Player of the Season, a rarity for a centre-back.',
        'Signed quietly from Spartak Moscow in January 2006, he cost a fraction of what contemporaries paid for defenders of his level.',
      ],
      Ferdinand: [
        'Rio Ferdinand\u2019s 2002 move from Leeds made him the world\u2019s most expensive defender at the time.',
        'His partnership with Vidi\u0107 anchored a defence that reached three Champions League finals in four seasons.',
      ],
      Brown: [
        'Wes Brown, a Manchester-born academy graduate, made the cross for Ronaldo\u2019s header in the 2008 Champions League final.',
        'Ferguson repeatedly described him as the best natural defender the club had produced in his time.',
      ],
      Scholes: [
        'Paul Scholes scored the only goal of the 2008 semi-final against Barcelona, sending United to Moscow.',
        'Xavi and Iniesta both repeatedly named him the best central midfielder of their generation.',
      ],
      Carrick: [
        'Michael Carrick was the quiet metronome of the side, signed from Tottenham in 2006 to replace Roy Keane\u2019s number 16 if not his temperament.',
        'He won five Premier League titles at United and later joined the coaching staff.',
      ],
      Hargreaves: [
        'Owen Hargreaves joined from Bayern Munich in 2007 and was outstanding in the 2008 Moscow final.',
        'Chronic knee tendon problems restricted him to a handful of appearances after that single brilliant season.',
      ],
      Rooney: [
        'Wayne Rooney announced himself at United with a hat-trick on his debut, in a Champions League tie against Fenerbah\u00e7e in 2004.',
        'He willingly played wide and deep in this system so Ronaldo could attack the most dangerous spaces.',
      ],
      'T\u00e9vez': [
        'Carlos T\u00e9vez scored United\u2019s first penalty in the 2008 final shoot-out and never stopped pressing defenders all season.',
        'His 2009 move across town to City — marked by the infamous "Welcome to Manchester" billboard — turned him from favourite to rival overnight.',
      ],
      Ronaldo: [
        'Cristiano Ronaldo scored 42 goals in all competitions in 2007-08, including the opening header in the Champions League final.',
        'That season won him the first of his five Ballons d\u2019Or.',
      ],
    },
  },
  'fergie-13': {
    teamFacts: [
      'This was Ferguson\u2019s farewell: he announced his retirement in May 2013 after 26 years, with the title already secured.',
      'The championship was United\u2019s 20th English title, moving them two clear of Liverpool\u2019s then-record 18.',
      'Robin van Persie clinched the title against Aston Villa with a hat-trick, including a famous first-time volley from Rooney\u2019s long pass.',
    ],
    playerFacts: {
      'De Gea': [
        'David de Gea arrived from Atl\u00e9tico Madrid as a 20-year-old in 2011 and grew into United\u2019s undisputed number one.',
        'He went on to be voted the club\u2019s Player of the Year four times, a first for a goalkeeper.',
      ],
      Evra: [
        'Patrice Evra was one of only a few players to feature in both the 2008 Champions League-winning side and Ferguson\u2019s final title team.',
        'He scored in his final season at United and left in 2014 having won five league titles with the club.',
      ],
      'Vidi\u0107': [
        'Nemanja Vidi\u0107 captained United through Ferguson\u2019s final seasons, having recovered from a serious knee injury suffered in 2011.',
        'He left for Inter Milan in 2014 with five Premier League titles to his name.',
      ],
      Ferdinand: [
        'Rio Ferdinand won his sixth and final league title in 2012-13, a decade after his first with the club.',
        'He was named in the PFA Team of the Year that season at the age of 34.',
      ],
      Rafael: [
        'Rafael da Silva and his twin brother F\u00e1bio were spotted by United at a youth tournament and signed together from Fluminense.',
        'The Brazilian right-back scored a memorable curling strike at Anfield during the 2012-13 title season.',
      ],
      Carrick: [
        'Michael Carrick was voted into the PFA Team of the Year for 2012-13, belated recognition for his role in Ferguson\u2019s final title.',
        'Teammates voted him Players\u2019 Player of the Year at the club that season.',
      ],
      Cleverley: [
        'Tom Cleverley was a Manchester United academy graduate who broke into the England squad during this period.',
        'His energetic pressing made him a regular starter alongside Carrick in the double pivot for much of the title run.',
      ],
      Kagawa: [
        'Shinji Kagawa joined from Borussia Dortmund in 2012, fresh from back-to-back Bundesliga titles.',
        'He became the first Japanese player to score a Premier League hat-trick, against Norwich in March 2013.',
      ],
      Rooney: [
        'Wayne Rooney supplied the raking pass for Van Persie\u2019s famous title-clinching volley against Aston Villa.',
        'He would later become both England\u2019s and Manchester United\u2019s all-time record goalscorer.',
      ],
      Valencia: [
        'Antonio Valencia was handed the number 7 shirt for 2012-13, the season after being voted the club\u2019s Player of the Year.',
        'The Ecuadorian winger later reinvented himself as a right-back and captained the club.',
      ],
      'Van Persie': [
        'Robin van Persie scored 26 league goals in 2012-13 and won the Golden Boot in his first United season.',
        'Ferguson signed him from Arsenal at 29 precisely to turn narrow title defeats into a decisive winning margin.',
      ],
    },
  },
  'pep-barca': {
    teamFacts: [
      'In 2009 this team won six trophies in a single calendar year — La Liga, Copa del Rey, Champions League, both Super Cups and the Club World Cup — a first in football.',
      'The 5-0 demolition of Mourinho\u2019s Real Madrid in November 2010 is widely cited as the definitive tiki-taka performance.',
      'Barcelona beat Manchester United in both the 2009 and 2011 Champions League finals, with Messi scoring in each.',
    ],
    playerFacts: {
      'Vald\u00e9s': [
        'V\u00edctor Vald\u00e9s came through La Masia and won five Zamora trophies as La Liga\u2019s best goalkeeper.',
        'His composure playing out from the back was essential to Guardiola\u2019s build-up play, years before it became standard for keepers.',
      ],
      Abidal: [
        '\u00c9ric Abidal returned from surgery for a liver tumour in 2011 and, in an iconic gesture, was given the captain\u2019s armband to lift the Champions League trophy at Wembley.',
        'The Frenchman could play left-back or centre-back and rarely missed a big match under Guardiola.',
      ],
      Puyol: [
        'Carles Puyol spent his entire career at Barcelona and captained the club through its greatest era.',
        'His header against Germany sent Spain to the 2010 World Cup final, one of six Barcelona players who started that final.',
      ],
      'Piqu\u00e9': [
        'Gerard Piqu\u00e9 returned to Barcelona from Manchester United in 2008 and won the Champions League in consecutive seasons with different clubs.',
        'He won the World Cup and two European Championships with Spain while anchoring Guardiola\u2019s high defensive line.',
      ],
      Alves: [
        'Dani Alves arrived from Sevilla in 2008 and effectively played as a winger in possession, such was Barcelona\u2019s control.',
        'He retired as one of the most decorated players in the history of the game, with over 40 senior trophies.',
      ],
      Iniesta: [
        'Andr\u00e9s Iniesta scored the stoppage-time semi-final goal at Stamford Bridge in 2009 and the winner in the 2010 World Cup final.',
        'He was named man of the match in the 2015 Champions League final and finished runner-up for the 2010 Ballon d\u2019Or.',
      ],
      Busquets: [
        'Sergio Busquets was playing for Barcelona\u2019s B team in the third tier when Guardiola promoted him in 2008; a year later he was a Champions League winner.',
        'His father, Carles Busquets, had been a Barcelona goalkeeper under Johan Cruyff.',
      ],
      Xavi: [
        'Xavi Hern\u00e1ndez was the metronome of both Barcelona\u2019s and Spain\u2019s golden eras, winning three consecutive player-of-the-tournament style awards at major tournaments between 2008 and 2012.',
        'He finished third in the Ballon d\u2019Or three years running behind Messi and Ronaldo.',
      ],
      Villa: [
        'David Villa is Spain\u2019s all-time record goalscorer.',
        'He scored Barcelona\u2019s third goal in the 2011 Champions League final at Wembley with a curling strike from outside the box.',
      ],
      Messi: [
        'Lionel Messi\u2019s false-nine role was unveiled in a 6-2 win at the Bernab\u00e9u in May 2009 after Guardiola showed him the plan the night before.',
        'He scored 47 goals in all competitions in 2008-09 and won his first Ballon d\u2019Or that year, aged 22.',
      ],
      Pedro: [
        'In 2009 Pedro scored in six different official competitions in a single season, believed to be a first in Spanish football.',
        'He rose from Barcelona\u2019s B team in the fourth tier to a World Cup winner\u2019s medal in barely three years.',
      ],
    },
  },
  'pep-bayern': {
    teamFacts: [
      'Guardiola\u2019s Bayern won the Bundesliga in all three of his seasons, including the 2013-14 title sealed in March — the earliest in league history.',
      'For all the domestic dominance, this side never reached a Champions League final, falling in the semi-finals in all three seasons.',
      'The inverted full-back experiment with Lahm and Alaba became one of the most copied tactical ideas of the decade.',
    ],
    playerFacts: {
      Neuer: [
        'Manuel Neuer redefined the sweeper-keeper role, at times operating almost as an eleventh outfielder behind Bayern\u2019s high line.',
        'He won the Golden Glove at the 2014 World Cup and finished third in that year\u2019s Ballon d\u2019Or voting — extraordinary for a goalkeeper.',
      ],
      Alaba: [
        'David Alaba, an Austrian raised in Vienna, was converted by Guardiola from left-back into a hybrid midfielder and later became a centre-back.',
        'He went on to win the Champions League with two clubs: Bayern in 2013 and 2020, then Real Madrid in 2022 and 2024.',
      ],
      Boateng: [
        'J\u00e9r\u00f4me Boateng\u2019s long diagonal passes became a genuine creative weapon in Guardiola\u2019s build-up play.',
        'He and his half-brother Kevin-Prince Boateng faced each other at the 2010 World Cup playing for Germany and Ghana respectively.',
      ],
      'Mart\u00ednez': [
        'Javi Mart\u00ednez cost Bayern a then-club-record fee when he arrived from Athletic Bilbao in 2012.',
        'Guardiola often used the Spaniard as an auxiliary centre-back, valuing his ability to step into midfield with the ball.',
      ],
      Lahm: [
        'Philipp Lahm captained Germany to the 2014 World Cup, retiring from international football immediately afterwards at his peak.',
        'Guardiola moved the veteran right-back into central midfield, arguing his positional intelligence was wasted on the touchline.',
      ],
      'Xabi Alonso': [
        'Xabi Alonso joined from Real Madrid in 2014 and once recorded over 200 touches in a single Bundesliga match, a league record at the time.',
        'He later returned to management and won the 2023-24 Bundesliga unbeaten with Bayer Leverkusen.',
      ],
      'Rib\u00e9ry': [
        'Franck Rib\u00e9ry was named UEFA\u2019s Best Player in Europe for 2012-13 after Bayern\u2019s treble.',
        'He spent twelve years at Bayern, winning nine Bundesliga titles.',
      ],
      Thiago: [
        'Thiago Alc\u00e2ntara was Guardiola\u2019s first and most insistent signing request at Bayern, brought from Barcelona in 2013.',
        'His father, Mazinho, won the 1994 World Cup with Brazil.',
      ],
      'M\u00fcller': [
        'Thomas M\u00fcller coined his own role name — the "Raumdeuter", or space interpreter — to describe his knack for appearing unmarked.',
        'He won the Golden Boot at the 2010 World Cup as a 20-year-old and lifted the trophy itself in 2014.',
      ],
      Robben: [
        'Arjen Robben scored the 89th-minute winner in the 2013 Champions League final at Wembley, redemption for his missed penalty in the 2012 final.',
        'His cut-inside-and-curl move from the right wing was known to every defender in Europe and stopped by almost none of them.',
      ],
      Lewandowski: [
        'Robert Lewandowski once scored five goals in nine minutes as a substitute against Wolfsburg in 2015, a Bundesliga record.',
        'He arrived from Borussia Dortmund on a free transfer, having scored four against Real Madrid in a Champions League semi-final for them.',
      ],
    },
  },
  'pep-city': {
    teamFacts: [
      'The 2017-18 "Centurions" became the first Premier League team to reach 100 points, adding records for wins (32) and goals scored along the way.',
      'City retained the title in 2018-19 with 98 points, edging Liverpool\u2019s 97 in one of the great title races.',
      'That second season completed an unprecedented domestic treble of Premier League, FA Cup and League Cup — a first for an English men\u2019s team.',
    ],
    playerFacts: {
      Ederson: [
        'Ederson\u2019s distribution changed goalkeeping expectations: he could hit a striker\u2019s chest from 70 metres, and City built attacks around it.',
        'He once held the Guinness World Record for the longest drop-kick in football.',
      ],
      Delph: [
        'Fabian Delph, a career central midfielder, was reinvented by Guardiola as an inverted left-back during the Centurions season.',
        'He stepped in after Benjamin Mendy\u2019s injury and made the PFA shortlist conversations despite playing out of position.',
      ],
      Otamendi: [
        'Nicol\u00e1s Otamendi made more passes in 2017-18 than any other Premier League defender, an emblem of City\u2019s dominance of the ball.',
        'The Argentine later won the 2022 World Cup as a starting centre-back.',
      ],
      Stones: [
        'John Stones\u2019s composure on the ball made him a Guardiola signing target within weeks of the manager\u2019s arrival in 2016.',
        'Guardiola later converted him into a hybrid defender-midfielder, another echo of the inverted-full-back idea.',
      ],
      Walker: [
        'Kyle Walker joined from Tottenham in 2017 for what was then a record fee for an English defender.',
        'His recovery pace let City defend enormous spaces behind their high line almost single-handedly.',
      ],
      'D. Silva': [
        'David Silva won four Premier League titles at City and has a statue outside the Etihad Stadium.',
        'Nicknamed "El Mago" — the magician — he played much of the Centurions season while his son was in intensive care in Spain, later calling it his hardest year.',
      ],
      Fernandinho: [
        'Fernandinho was the lone pivot who covered the width of the pitch behind City\u2019s free eights, a role Guardiola said was almost impossible to fill.',
        'Signed from Shakhtar Donetsk, he won five Premier League titles and later captained the club.',
      ],
      'De Bruyne': [
        'Kevin De Bruyne was famously sold by Chelsea after just three league starts before returning to England with City in 2015.',
        'He recorded 16 league assists in the Centurions season and later twice won the PFA Player of the Year award.',
      ],
      'San\u00e9': [
        'Leroy San\u00e9 was voted PFA Young Player of the Year in the Centurions season of 2017-18.',
        'Signed from Schalke as a teenager, he later returned to Germany with Bayern Munich.',
      ],
      'Ag\u00fcero': [
        'Sergio Ag\u00fcero is Manchester City\u2019s all-time record goalscorer.',
        'His stoppage-time title-winning goal against QPR in 2012 — "AGUERO\u0398O93:20" — remains the Premier League\u2019s most famous moment.',
      ],
      Sterling: [
        'Raheem Sterling scored 18 league goals in the Centurions season, many of them back-post tap-ins engineered by Guardiola\u2019s cut-back patterns.',
        'His 2015 move from Liverpool made him the most expensive English player at the time.',
      ],
    },
  },
  'mou-porto': {
    teamFacts: [
      'Porto won the UEFA Cup in 2003 and the Champions League in 2004 back to back — the last club from outside Europe\u2019s big five leagues to win the latter.',
      'The 2004 run included Costinha\u2019s last-second equaliser at Old Trafford, which sent Mourinho sprinting down the touchline in celebration.',
      'Porto beat Monaco 3-0 in the 2004 final in Gelsenkirchen, and Mourinho left for Chelsea days later.',
    ],
    playerFacts: {
      'V\u00edtor Ba\u00eda': [
        'V\u00edtor Ba\u00eda won trophies with Porto across three different decades, interrupted by a spell at Barcelona where he won the Cup Winners\u2019 Cup.',
        'By the 2004 Champions League triumph he was the most decorated goalkeeper in Portuguese football history.',
      ],
      Valente: [
        'Nuno Valente was an ever-present at left-back through both European triumphs and joined Everton in 2005.',
        'He was part of the Portugal squad that reached the Euro 2004 final on home soil.',
      ],
      Carvalho: [
        'Ricardo Carvalho was named the Champions League\u2019s best defender in 2004 and followed Mourinho to Chelsea that summer.',
        'He would reunite with Mourinho twice more, at Chelsea and Real Madrid — a rare three-club partnership between one player and one coach.',
      ],
      'Jorge Costa': [
        'Jorge Costa, nicknamed "The Tank", captained Porto to the 2004 Champions League title.',
        'He made over 350 appearances for Porto and lifted both European trophies of the Mourinho era.',
      ],
      'P. Ferreira': [
        'Paulo Ferreira played every minute of the 2004 Champions League knockout rounds and followed Mourinho to Chelsea that summer.',
        'He stayed at Stamford Bridge for nine seasons, retiring with a Champions League winner\u2019s medal from 2012 as well.',
      ],
      Costinha: [
        'Costinha scored the stoppage-time goal at Old Trafford in March 2004 that knocked out Manchester United and triggered Mourinho\u2019s famous touchline sprint.',
        'He also scored in the quarter-final against Lyon, remarkable output for a purely defensive midfielder.',
      ],
      Maniche: [
        'Maniche scored in the 2003 UEFA Cup final against Celtic and added Porto\u2019s second in the 2004 Champions League final.',
        'Months later he scored one of the goals of Euro 2004, a swerving strike against the Netherlands in the semi-final.',
      ],
      Mendes: [
        'Pedro Mendes was the deep-lying passer of Porto\u2019s diamond and moved to Tottenham after the 2004 triumph.',
        'In England he became infamous for a "goal" at Old Trafford in 2005 that clearly crossed the line but was never given — an incident often credited with accelerating goal-line technology.',
      ],
      Deco: [
        'Deco was named man of the match in the 2004 Champions League final, scoring Porto\u2019s second goal against Monaco.',
        'He remains one of few players to win the Champions League with two clubs, adding the 2006 title with Barcelona.',
      ],
      Derlei: [
        'Derlei was the top scorer of Porto\u2019s victorious 2002-03 UEFA Cup campaign, including the opener in the final against Celtic.',
        'A serious knee injury in late 2003 cost the Brazilian most of the Champions League-winning season, yet he returned for the run-in.',
      ],
      'C. Alberto': [
        'Carlos Alberto opened the scoring in the 2004 Champions League final aged just 19.',
        'The Brazilian had arrived from Fluminense only the previous summer, one of the youngest finalists in the competition\u2019s modern history.',
      ],
    },
  },
  'mou-chelsea': {
    teamFacts: [
      'Chelsea\u2019s 2004-05 title was the club\u2019s first English championship in 50 years, won with a then-record 95 points.',
      'The 15 goals conceded that season remain the fewest in a Premier League campaign.',
      'Mourinho introduced himself to England at his first press conference as "a special one" — the nickname never left.',
    ],
    playerFacts: {
      '\u010cech': [
        'Petr \u010cech kept a record 24 clean sheets in the 2004-05 Premier League season, going over 1,000 minutes without conceding at one stage.',
        'After a fractured skull in 2006 he wore his distinctive protective headguard for the rest of his career.',
      ],
      Gallas: [
        'William Gallas could play anywhere across the back four and spent much of 2004-05 as an emergency left-back without the defence missing a beat.',
        'He later played for all three of Chelsea, Arsenal and Tottenham — a rare London hat-trick.',
      ],
      Terry: [
        'John Terry was named PFA Player of the Year in 2005, one of the few defenders ever to win it.',
        'A product of Chelsea\u2019s academy, he captained the club for over a decade and lifted five league titles.',
      ],
      Carvalho: [
        'Ricardo Carvalho followed Mourinho from Porto in 2004 and slotted seamlessly alongside Terry in England\u2019s best defence.',
        'He won league titles under Mourinho in three different countries: Portugal, England and Spain.',
      ],
      'P. Ferreira': [
        'Paulo Ferreira was Mourinho\u2019s first-choice right-back in both title-winning seasons after joining from Porto.',
        'He made over 200 appearances for Chelsea across nine years at the club.',
      ],
      Lampard: [
        'Frank Lampard scored both goals at Bolton on the day Chelsea clinched the 2004-05 title, then was named FWA Footballer of the Year.',
        'He finished runner-up to Ronaldinho in the 2005 Ballon d\u2019Or and remains Chelsea\u2019s all-time record goalscorer — from midfield.',
      ],
      'Mak\u00e9l\u00e9l\u00e9': [
        'Claude Mak\u00e9l\u00e9l\u00e9 gave his name to a position: the deep destroyer role is still called "the Mak\u00e9l\u00e9l\u00e9 role" in England.',
        'Real Madrid sold him in 2003 to fund gal\u00e1cticos, a decision widely blamed for their subsequent decline.',
      ],
      Tiago: [
        'Tiago Mendes was a regular starter in the 2004-05 title season, his only year in England before moving to Lyon.',
        'He later won league titles in Portugal, England, Italy and Spain across a long career.',
      ],
      Duff: [
        'Damien Duff arrived from Blackburn for a club-record fee in 2003 and gave Mourinho\u2019s counter-attacks their left-sided thrust.',
        'The Irishman won back-to-back Premier League titles before later becoming a manager in Dublin.',
      ],
      Drogba: [
        'Didier Drogba built a reputation as Chelsea\u2019s big-game player, scoring in a remarkable string of FA Cup and League Cup finals at Wembley.',
        'He finished his Chelsea career in 2012 by scoring the equaliser and the winning penalty in the Champions League final.',
      ],
      Robben: [
        'Arjen Robben\u2019s electric first season in 2004-05 saw Chelsea win 13 of the 14 league games he started.',
        'Injuries limited him in London, but he left to win league titles in Spain and Germany and a Champions League with Bayern.',
      ],
    },
  },
  'mou-inter': {
    teamFacts: [
      'Inter\u2019s 2009-10 side won the first treble in Italian football history: Serie A, Coppa Italia and the Champions League.',
      'The semi-final second leg at Camp Nou, defended for an hour with ten men after Thiago Motta\u2019s red card, is remembered as Mourinho\u2019s defensive masterpiece.',
      'Mourinho left for Real Madrid within days of the final in Madrid — his tearful embrace with Marco Materazzi in the car park became an iconic image.',
    ],
    playerFacts: {
      'J\u00falio C\u00e9sar': [
        'J\u00falio C\u00e9sar was named Serie A Goalkeeper of the Year in the treble season and made a famous double save in the final against Bayern.',
        'He later kept goal for Brazil at two World Cups.',
      ],
      Chivu: [
        'Cristian Chivu played much of the treble season in a protective headguard after fracturing his skull in January 2010.',
        'The Romanian had captained Ajax before his move to Italy, one of the youngest captains in the Dutch club\u2019s history.',
      ],
      Samuel: [
        'Walter Samuel\u2019s uncompromising defending earned him the nickname "The Wall".',
        'He formed the treble season\u2019s meanest central pairing with L\u00facio, another veteran written off before Mourinho arrived.',
      ],
      'L\u00facio': [
        'L\u00facio won the 2002 World Cup with Brazil and completed the club treble with Inter eight years later.',
        'He famously loved carrying the ball out of defence on marauding runs, which Mourinho tolerated because he almost never lost it.',
      ],
      Maicon: [
        'Maicon was widely rated the world\u2019s best right-back in 2010 and scored one of Serie A\u2019s great goals that season, an outrageous angled volley against Juventus.',
        'His duel with Gareth Bale in that season\u2019s Champions League is still cited as the night Bale announced himself.',
      ],
      Cambiasso: [
        'Esteban Cambiasso joined Inter on a free transfer from Real Madrid in 2004, arguably the best free signing of the decade.',
        'He won ten major trophies at Inter, running the midfield throughout the Mourinho years.',
      ],
      Zanetti: [
        'Javier Zanetti holds Inter\u2019s all-time appearance record with over 850 matches and captained the treble side at 36.',
        'He played the 2010 Champions League final in central midfield, having spent most of his career at full-back — Mourinho called him a man for every position.',
      ],
      Pandev: [
        'Goran Pandev joined on a free transfer in January 2010 and slotted straight into the treble run-in.',
        'The Macedonian later scored Champions League goals past 40 and is his country\u2019s record scorer.',
      ],
      Sneijder: [
        'Wesley Sneijder won the treble with Inter and reached the World Cup final with the Netherlands in the same summer of 2010.',
        'Despite that season, he finished only fourth in the 2010 Ballon d\u2019Or — still one of the award\u2019s most debated outcomes.',
      ],
      "Eto'o": [
        'Samuel Eto\u2019o is the only player to win back-to-back continental trebles, with Barcelona in 2009 and Inter in 2010.',
        'Mourinho asked the great striker to play as a defensive right-winger at Camp Nou, and Eto\u2019o called it one of the proudest shifts of his career.',
      ],
      Milito: [
        'Diego Milito scored both goals in the 2010 Champions League final against Bayern Munich.',
        'He scored in the Coppa Italia final, the title-clinching league match and the Champions League final that May — the man for every decisive moment.',
      ],
    },
  },
  'carlo-milan': {
    teamFacts: [
      'This Milan won the 2003 Champions League on penalties against Juventus in the first all-Italian final, then lifted it again in 2007.',
      'The 2005 final in Istanbul, lost on penalties after leading Liverpool 3-0 at half-time, remains the most infamous collapse in a European final.',
      'The 2007 win over Liverpool in Athens was direct revenge, with Inzaghi scoring both goals.',
    ],
    playerFacts: {
      Dida: [
        'Dida won two Champions Leagues with Milan and saved three penalties in the 2003 final shoot-out against Juventus.',
        'He was a rarity for his era: a Brazilian goalkeeper trusted as first choice at the very top of the European game, playing over 200 matches for Milan.',
      ],
      Jankulovski: [
        'Marek Jankulovski became the first Czech player to win the Champions League with Milan in 2007.',
        'Ancelotti converted the former winger into an attacking left-back for the Christmas-tree system.',
      ],
      Maldini: [
        'Paolo Maldini played 25 seasons and over 900 matches for Milan, his only club, and captained both the 2003 and 2007 Champions League-winning sides.',
        'He lifted the trophy in 2007 at 38, having scored in the 2005 final after just 50 seconds — still among the fastest goals in a final.',
      ],
      Nesta: [
        'Alessandro Nesta joined from Lazio in 2002 when his boyhood club\u2019s finances collapsed, and won the Champions League in his first Milan season.',
        'He is regularly named among the most elegant defenders ever, winning four Serie A defender-of-the-year awards.',
      ],
      Oddo: [
        'Massimo Oddo joined from Lazio in January 2007 and won the Champions League within five months.',
        'He remains one of the highest-scoring full-backs of his Serie A generation thanks to his penalty taking.',
      ],
      Gattuso: [
        'Gennaro Gattuso did the destroying that let Pirlo, Seedorf and Kak\u00e1 create, and won the 2006 World Cup with Italy in the same era.',
        'He later managed Milan himself, returning to the bench where Ancelotti once stood.',
      ],
      Pirlo: [
        'Andrea Pirlo had stalled as an attacking midfielder until Ancelotti dropped him to the base of midfield, inventing the modern deep-lying playmaker.',
        'He won two Champions Leagues with Milan and the 2006 World Cup, where he was named man of the match in the final.',
      ],
      Ambrosini: [
        'Massimo Ambrosini spent 18 seasons at Milan and captained the club after Maldini retired.',
        'His extra-time header against PSV in the 2005 semi-final sent Milan to the Istanbul final.',
      ],
      'Kak\u00e1': [
        'Kak\u00e1 won the 2007 Ballon d\u2019Or, the last player to win it before the Messi-Ronaldo duopoly began.',
        'His solo run past Manchester United in the 2007 semi-final at Old Trafford is one of the great individual Champions League performances.',
      ],
      Seedorf: [
        'Clarence Seedorf is the only player to win the Champions League with three different clubs: Ajax, Real Madrid and Milan (twice).',
        'The Dutchman played over 400 matches for Milan across ten seasons in the hole behind the striker.',
      ],
      Inzaghi: [
        'Filippo Inzaghi scored both goals in the 2007 Champions League final against Liverpool.',
        'A pure penalty-box predator, he retired having scored 70 goals in European club competition, then among the highest totals ever.',
      ],
    },
  },
  'carlo-chelsea': {
    teamFacts: [
      'Ancelotti\u2019s 2009-10 Chelsea won the club\u2019s first league and FA Cup double.',
      'Their 103 league goals were the most in the English top flight since the 1960s and a Premier League record at the time.',
      'The title was sealed with an 8-0 demolition of Wigan on the final day.',
    ],
    playerFacts: {
      '\u010cech': [
        'Petr \u010cech kept goal through both the Mourinho and Ancelotti title eras and later won the Champions League with Chelsea in 2012.',
        'He retired as the Premier League\u2019s record clean-sheet holder, then took up professional ice hockey as a goaltender.',
      ],
      'A. Cole': [
        'Ashley Cole has won the FA Cup seven times, more than any other player in the competition\u2019s history.',
        'For a decade he was regarded as the world\u2019s premier left-back, famously subduing Cristiano Ronaldo in big matches.',
      ],
      Terry: [
        'John Terry captained the double-winning side and scored twice in the title run-in from centre-back.',
        'He ended his career with five Premier League titles, all with Chelsea.',
      ],
      Alex: [
        'Alex\u2019s free kicks were among the most feared in England — his thunderbolt against Arsenal in 2010 is still replayed.',
        'The Brazilian centre-back deputised superbly whenever Terry or Carvalho was absent during the double season.',
      ],
      'Ivanovi\u0107': [
        'Branislav Ivanovi\u0107 could play right-back or centre-back and became one of the Premier League\u2019s most reliable defenders for a decade.',
        'He scored the winning goal in the 2013 Europa League final as Chelsea captain on the night.',
      ],
      Lampard: [
        'Frank Lampard scored 22 league goals from midfield in 2009-10, his most prolific season.',
        'He also finished the campaign with the most assists at the club — creator and finisher in the same body.',
      ],
      Mikel: [
        'John Obi Mikel was converted from an attacking prodigy into a pure holding midfielder at Chelsea.',
        'He won the Champions League in 2012 and captained Nigeria to Olympic bronze in 2016.',
      ],
      Ballack: [
        'Michael Ballack captained Germany to the 2002 World Cup final and Euro 2008 final during his career.',
        'The double season was his last at Chelsea before returning to Bayer Leverkusen.',
      ],
      Malouda: [
        'Florent Malouda had his best season in 2009-10, finishing as one of the league\u2019s most productive wide players.',
        'The Frenchman scored in the FA Cup final win over Portsmouth that completed the double.',
      ],
      Drogba: [
        'Didier Drogba won the 2009-10 Golden Boot with 29 league goals, his second time winning it.',
        'He scored in the FA Cup final that season, extending his extraordinary record of scoring in finals at Wembley.',
      ],
      Anelka: [
        'Nicolas Anelka had won the Golden Boot himself the season before, making Chelsea\u2019s front line back-to-back winners of the award.',
        'His career took in nine clubs across five countries, including title wins in three of them.',
      ],
    },
  },
  'carlo-decima': {
    teamFacts: [
      'La D\u00e9cima — Real Madrid\u2019s tenth European Cup — arrived after a twelve-year wait, secured 4-1 after extra time against Atl\u00e9tico Madrid in Lisbon.',
      'Sergio Ramos\u2019s equalising header arrived in the 93rd minute, timestamped 92:48 — a number Madrid fans still quote.',
      'Ronaldo\u2019s 17 goals in that Champions League campaign remain the record for a single edition of the competition.',
    ],
    playerFacts: {
      Casillas: [
        'Iker Casillas captained Spain through their golden era, winning the 2010 World Cup and the 2008 and 2012 European Championships.',
        'He had lifted Madrid\u2019s ninth European Cup in 2002 as a 21-year-old substitute hero, and the tenth twelve years later.',
      ],
      'Coentr\u00e3o': [
        'F\u00e1bio Coentr\u00e3o started the 2014 final at left-back ahead of Marcelo, a selection Ancelotti made for defensive balance.',
        'The Portuguese was a converted winger, which showed in his surging runs down the flank.',
      ],
      Ramos: [
        'Sergio Ramos\u2019s 93rd-minute header in Lisbon is the most celebrated goal in Real Madrid\u2019s modern history.',
        'He made scoring in finals a habit — he also scored in the 2016 final and converted in its shoot-out.',
      ],
      Pepe: [
        'Pepe formed the battle-hardened half of Madrid\u2019s centre-back pairing and won three Champions Leagues with the club.',
        'Born in Brazil, he chose to play for Portugal and won Euro 2016 alongside Ronaldo.',
      ],
      Carvajal: [
        'Daniel Carvajal came through Madrid\u2019s academy, was sold to Bayer Leverkusen, and was bought back in 2013 — just in time to start the D\u00e9cima final.',
        'He went on to win six Champions Leagues with the club.',
      ],
      'Di Mar\u00eda': [
        '\u00c1ngel Di Mar\u00eda was named man of the match in the 2014 final, his dribble creating Bale\u2019s decisive goal in extra time.',
        'Madrid sold him to Manchester United weeks later for a then-British-record fee, a decision many at the club regretted.',
      ],
      'Xabi Alonso': [
        'Xabi Alonso was suspended for the 2014 final after a booking in the semi against Bayern — the game went to extra time without its metronome.',
        'He left for Bayern Munich that summer, and Toni Kroos arrived to inherit the role.',
      ],
      'Modri\u0107': [
        'Luka Modri\u0107\u2019s outswinging corner set up Ramos\u2019s 93rd-minute equaliser in Lisbon.',
        'In 2018 he broke the ten-year Messi-Ronaldo grip on the Ballon d\u2019Or.',
      ],
      Ronaldo: [
        'Cristiano Ronaldo scored 17 goals in the 2013-14 Champions League, still the record for one campaign, finishing with the final\u2019s last-minute penalty.',
        'He left Madrid in 2018 as the club\u2019s all-time record goalscorer with 450 goals in nine seasons.',
      ],
      Benzema: [
        'Karim Benzema scored Madrid\u2019s goal in the 1-0 semi-final first leg against Bayern on the road to Lisbon.',
        'He stayed long after Ronaldo left and won the 2022 Ballon d\u2019Or as Madrid\u2019s central figure.',
      ],
      Bale: [
        'Gareth Bale\u2019s header in extra time put Madrid ahead in the D\u00e9cima final, in his debut season after a world-record transfer from Tottenham.',
        'Weeks earlier he had won the Copa del Rey final with a legendary solo sprint around Barcelona\u2019s Bartra from inside his own half.',
      ],
    },
  },
  'cruyff-barca': {
    teamFacts: [
      'Cruyff\u2019s Dream Team won four straight La Liga titles from 1991 to 1994, the last arriving on a dramatic final day when Deportivo missed a last-minute penalty.',
      'Barcelona\u2019s first-ever European Cup came under Cruyff at Wembley in 1992, won by a Ronald Koeman free kick in extra time.',
      'Cruyff rebuilt the club around the Ajax principles of his playing days \u2014 the philosophy that shaped La Masia and, through Guardiola, modern football itself.',
    ],
    playerFacts: {
      Zubizarreta: [
        'Andoni Zubizarreta retired as Spain\u2019s most-capped player and appeared at four World Cups.',
        'He later returned to Barcelona as sporting director, overseeing the signings of Neymar and Su\u00e1rez.',
      ],
      Ferrer: [
        'Albert Ferrer came through La Masia and won Olympic gold with Spain at the Barcelona 1992 Games.',
        'He was the Dream Team\u2019s first-choice right-back for all four league titles before later joining Chelsea.',
      ],
      Koeman: [
        'Ronald Koeman scored the extra-time free kick that won Barcelona\u2019s first European Cup in 1992.',
        'He is one of the highest-scoring defenders in football history, with over 250 career goals.',
      ],
      Nadal: [
        'Miguel \u00c1ngel Nadal\u2019s physical dominance earned him the nickname "The Beast of Barcelona".',
        'His nephew is the 22-time Grand Slam tennis champion Rafael Nadal.',
      ],
      Sergi: [
        'Sergi Barju\u00e1n came through La Masia and owned Barcelona\u2019s left flank for a decade.',
        'He returned to the club in 2021 as interim head coach after Koeman\u2019s dismissal.',
      ],
      Guardiola: [
        'Pep Guardiola was promoted from La Masia by Cruyff as a skinny 19-year-old many considered too weak for the position.',
        'He later returned as coach and won 14 trophies in four seasons, extending Cruyff\u2019s ideas into a new era.',
      ],
      Bakero: [
        'Jos\u00e9 Mari Bakero\u2019s last-minute header away at Kaiserslautern in 1991 kept alive the run that ended at Wembley.',
        'He arrived from Real Sociedad in 1988 as part of Cruyff\u2019s first rebuilding wave.',
      ],
      Amor: [
        'Guillermo Amor was one of La Masia\u2019s first great midfield products, making over 400 appearances for the club.',
        'He later ran Barcelona\u2019s youth academy, mentoring the generation of Xavi and Iniesta.',
      ],
      Stoichkov: [
        'Hristo Stoichkov won the 1994 Ballon d\u2019Or after firing Bulgaria to the World Cup semi-finals.',
        'His temper was as famous as his left foot \u2014 he was banned for two months in his first season after stamping on a referee\u2019s foot.',
      ],
      'Rom\u00e1rio': [
        'Rom\u00e1rio scored 30 league goals in his debut season, including a hat-trick in a 5-0 Cl\u00e1sico demolition of Real Madrid.',
        'He won the 1994 World Cup with Brazil that summer and was named the tournament\u2019s best player.',
      ],
      Beguiristain: [
        'Txiki Beguiristain was Cruyff\u2019s left winger across all four Dream Team title seasons.',
        'He later became the transfer architect of Guardiola\u2019s Barcelona and Manchester City as director of football.',
      ],
    },
  },
  'wenger-invincibles': {
    teamFacts: [
      'Arsenal went the entire 2003-04 Premier League season unbeaten \u2014 26 wins, 12 draws \u2014 the only 38-game unbeaten campaign in English top-flight history.',
      'The unbeaten run eventually stretched to 49 league games, still an English record, before ending at Old Trafford in October 2004.',
      'The Premier League commissioned a unique golden trophy to mark the achievement.',
    ],
    playerFacts: {
      Lehmann: [
        'Jens Lehmann played every minute of the unbeaten league season in his first year in England.',
        'He was sent off inside 20 minutes of the 2006 Champions League final, Arsenal\u2019s closest brush with the trophy.',
      ],
      'A. Cole': [
        'Ashley Cole came through Arsenal\u2019s academy and won two league titles before his controversial move to Chelsea in 2006.',
        'He retired as England\u2019s most-capped full-back with 107 caps.',
      ],
      Campbell: [
        'Sol Campbell crossed the north London divide from Tottenham on a free transfer in 2001, one of the most controversial moves in Premier League history.',
        'He scored Arsenal\u2019s goal in the 2006 Champions League final, a towering header from a corner.',
      ],
      'Tour\u00e9': [
        'Kolo Tour\u00e9 earned his Arsenal deal after a trial in which he famously clattered into Wenger himself with a flying tackle.',
        'He and his younger brother Yaya later won a Premier League title together at Manchester City.',
      ],
      Lauren: [
        'Lauren was a midfielder whom Wenger converted into the Invincibles\u2019 right-back.',
        'He won Olympic gold with Cameroon at Sydney 2000 and back-to-back Africa Cup of Nations titles.',
      ],
      Pires: [
        'Robert Pires scored 14 league goals from the left wing in the unbeaten season.',
        'He was voted Footballer of the Year in 2002, only his second season in England.',
      ],
      Vieira: [
        'Patrick Vieira captained the Invincibles and scored the goal at Tottenham that clinched the title.',
        'His final kick for Arsenal was the winning penalty in the 2005 FA Cup final shoot-out.',
      ],
      Gilberto: [
        'Gilberto Silva was nicknamed "the Invisible Wall" for the quiet way he shielded the back four.',
        'He joined Arsenal weeks after winning the 2002 World Cup with Brazil.',
      ],
      Ljungberg: [
        'Freddie Ljungberg\u2019s red-streaked hair and late runs into the box made him a Highbury cult hero.',
        'He scored in consecutive FA Cup finals, in 2001 and 2002.',
      ],
      Henry: [
        'Thierry Henry scored 30 league goals in the unbeaten season and won the European Golden Shoe.',
        'He is Arsenal\u2019s record scorer with 228 goals, and his statue stands outside the Emirates.',
      ],
      Bergkamp: [
        'Dennis Bergkamp\u2019s fear of flying earned him the nickname "the Non-Flying Dutchman" \u2014 he skipped most European away trips.',
        'His spinning flick-and-finish against Newcastle in 2002 is regularly voted the Premier League\u2019s greatest goal.',
      ],
    },
  },
  'lucho-barca': {
    teamFacts: [
      'Barcelona became the first European club to win the continental treble twice, adding 2014-15 to Guardiola\u2019s 2008-09.',
      'The MSN front three of Messi, Su\u00e1rez and Neymar scored 122 goals in all competitions in 2014-15, then a Spanish record for a trio.',
      'Luis Enrique won the treble in his first season in charge, beating Juventus 3-1 in the Berlin final.',
    ],
    playerFacts: {
      'Ter Stegen': [
        'Marc-Andr\u00e9 ter Stegen was the cup and Champions League keeper in his debut season while Claudio Bravo played the league games.',
        'He lifted the trophy in Berlin \u2014 in his home country \u2014 at just 23.',
      ],
      Alba: [
        'Jordi Alba was released by Barcelona\u2019s academy as a teenager and returned from Valencia as one of Europe\u2019s fastest left-backs.',
        'His over-the-top connection with Messi produced goals for more than a decade.',
      ],
      'Piqu\u00e9': [
        'Gerard Piqu\u00e9 won the 2015 treble six years after winning the first one under Guardiola.',
        'Off the pitch he bought FC Andorra and reshaped tennis\u2019s Davis Cup while still an active player.',
      ],
      Mascherano: [
        'Javier Mascherano, a career defensive midfielder, was converted into a centre-back at Barcelona.',
        'He won 147 caps for Argentina, long the national record.',
      ],
      Alves: [
        'Dani Alves\u2019s overlaps from right-back supplied Messi for eight seasons across two great Barcelona eras.',
        'He retired as the most decorated footballer in history, with over 40 senior trophies.',
      ],
      Iniesta: [
        'Andr\u00e9s Iniesta was named man of the match in the 2015 Champions League final, six years after running the 2009 final in Rome.',
        'He left Barcelona in 2018 with 32 trophies, then the most in the club\u2019s history.',
      ],
      Busquets: [
        'Sergio Busquets anchored both of Barcelona\u2019s treble-winning midfields, in 2009 and 2015.',
        'Vicente del Bosque said of him: "You watch the game, you don\u2019t see Busquets. You watch Busquets, you see the whole game."',
      ],
      'Rakiti\u0107': [
        'Ivan Rakiti\u0107 opened the scoring in the 2015 Champions League final against Juventus.',
        'He arrived from Sevilla having just captained them to a Europa League title.',
      ],
      Neymar: [
        'Neymar finished the 2014-15 Champions League as joint top scorer and sealed the final with its last goal.',
        'His \u20ac222 million move to PSG in 2017 remains the world transfer record.',
      ],
      'Su\u00e1rez': [
        'Luis Su\u00e1rez joined in 2014 while serving a four-month ban and scored the decisive second goal in the Berlin final.',
        'The following season he won the European Golden Shoe with 40 league goals, breaking the Messi-Ronaldo duopoly.',
      ],
      Messi: [
        'Lionel Messi\u2019s solo goal past Boateng and chip over Neuer in the 2015 semi-final is among his most replayed moments.',
        'The 2015 treble sits in the middle of the run that brought him a record eight Ballons d\u2019Or.',
      ],
    },
  },
  'klopp-liverpool': {
    teamFacts: [
      'Liverpool overturned a 3-0 first-leg deficit against Barcelona at Anfield in the 2019 semi-final \u2014 "corner taken quickly" \u2014 on the way to a sixth European Cup.',
      'The 2019-20 championship was Liverpool\u2019s first league title in 30 years, sealed with seven games to spare, the earliest in Premier League history.',
      'Klopp\u2019s side posted 97 and 99 points in successive league seasons and added the UEFA Super Cup and Club World Cup in between.',
    ],
    playerFacts: {
      Alisson: [
        'Alisson arrived in 2018 as the world\u2019s most expensive goalkeeper and won the Golden Glove in his first Premier League season.',
        'In 2021 he scored a stoppage-time headed winner at West Brom \u2014 the first goal by a goalkeeper in Liverpool\u2019s history.',
      ],
      Robertson: [
        'Andy Robertson was playing amateur football for Queen\u2019s Park in 2012 and joined Liverpool for just \u00a38 million five years later.',
        'He captained Scotland while setting Premier League assist records for a defender alongside Alexander-Arnold.',
      ],
      'Van Dijk': [
        'Virgil van Dijk\u2019s \u00a375 million move from Southampton transformed Liverpool\u2019s defence overnight.',
        'In 2019 he was UEFA Men\u2019s Player of the Year and missed the Ballon d\u2019Or by seven votes.',
      ],
      Matip: [
        'Jo\u00ebl Matip joined on a free transfer from Schalke and became a cult hero for his deadpan humour and marauding dribbles.',
        'He started the 2019 Champions League final and set up Origi\u2019s clinching goal.',
      ],
      'Alexander-Arnold': [
        'Trent Alexander-Arnold\u2019s quickly taken corner for Origi against Barcelona is one of the most famous assists in football history.',
        'A West Derby academy product, he redefined the right-back position as a playmaking role.',
      ],
      Wijnaldum: [
        'Gini Wijnaldum came off the bench at half-time against Barcelona in 2019 and scored twice in nine minutes.',
        'Signed from relegated Newcastle, he became the tireless connector of Klopp\u2019s midfield.',
      ],
      Fabinho: [
        'Fabinho needed months on the bench to learn Klopp\u2019s system after arriving from Monaco, then became undroppable.',
        'Teammates nicknamed him "the Dyson" for the way he hoovered up loose balls in front of the defence.',
      ],
      Henderson: [
        'Jordan Henderson captained Liverpool to every major trophy available between 2019 and 2022.',
        'His shuffle-then-lift of the Champions League trophy in Madrid became an instant celebration classic.',
      ],
      'Man\u00e9': [
        'Sadio Man\u00e9 shared the 2018-19 Premier League Golden Boot with Salah and Aubameyang.',
        'He was named African Footballer of the Year in 2019 and later led Senegal to their first Africa Cup of Nations title.',
      ],
      Firmino: [
        'Roberto Firmino\u2019s false-nine role made the front three work \u2014 pressing first, scoring second, and creating space for both wide men.',
        'He scored the winner in both the semi-final and final of the 2019 Club World Cup.',
      ],
      Salah: [
        'Mohamed Salah broke the record for goals in a 38-game Premier League season with 32 in his debut year.',
        'He converted the penalty that put Liverpool ahead inside two minutes of the 2019 Champions League final.',
      ],
    },
  },
  'zidane-madrid': {
    teamFacts: [
      'Real Madrid in 2016-17 became the first club to retain the Champions League since the competition\u2019s 1992 rebrand, beating Juventus 4-1 in Cardiff \u2014 then made it three in a row in Kyiv in 2018.',
      'Zidane won the Champions League in each of his first three seasons as a head coach \u2014 a feat no other manager has matched. Five days after the Kyiv final, he resigned at the very top.',
      'The 2016-17 season was Madrid\u2019s first league and European Cup double since 1958, and Bale\u2019s overhead kick in the 2018 final is widely called the greatest goal ever scored in one.',
    ],
    playerFacts: {
      Navas: [
        'Keylor Navas won three straight Champions Leagues as Madrid\u2019s number one.',
        'His breakout 2014 World Cup with Costa Rica, conceding twice in five games, earned him the move to Madrid.',
      ],
      Marcelo: [
        'Marcelo inherited Roberto Carlos\u2019s flank and left as Madrid\u2019s most decorated player at the time, with 25 trophies.',
        'He captained the club to another Champions League in 2022 in his final match before leaving.',
      ],
      Ramos: [
        'Sergio Ramos captained Madrid to four Champions Leagues in five seasons between 2014 and 2018.',
        'He scored 101 goals for the club \u2014 an extraordinary total for a centre-back.',
      ],
      Varane: [
        'Rapha\u00ebl Varane was signed at 18 on Zidane\u2019s personal recommendation, before Zidane had even become a coach.',
        'In 2018 he won the Champions League and the World Cup in the same summer.',
      ],
      Carvajal: [
        'Dani Carvajal was forced off injured and in tears in both the 2016 and 2018 finals, yet started every final of the three-peat.',
        'He later captained Madrid and scored in the 2024 Champions League final against Dortmund.',
      ],
      Kroos: [
        'Toni Kroos cost under \u20ac30 million from Bayern in 2014, one of the great bargains of the decade.',
        'He retired in 2024 immediately after winning a sixth Champions League, leaving at the very top.',
      ],
      Casemiro: [
        'Casemiro scored Madrid\u2019s second goal in the 2017 Cardiff final with a deflected long-range strike.',
        'He was the destroyer who freed Kroos and Modri\u0107 \u2014 the balance of the midfield depended on him.',
      ],
      'Modri\u0107': [
        'Luka Modri\u0107 was voted La Liga\u2019s worst signing of 2012 in a newspaper poll \u2014 and left over a decade later as a club legend.',
        'He was still starting and winning Champions League finals for Madrid past his 38th birthday.',
      ],
      Isco: [
        'Isco stepped in for the injured Bale during the 2017 run-in, and his form in the diamond made him undroppable for the final.',
        'He was the star of Spain\u2019s 2013 European Under-21 Championship win alongside Thiago and De Gea.',
      ],
      Ronaldo: [
        'Cristiano Ronaldo scored twice in the Cardiff final and collected his fifth Ballon d\u2019Or later that year.',
        'That spring he became the first player to reach 100 Champions League goals.',
      ],
      Benzema: [
        'Karim Benzema sacrificed goals for the system in 2016-17, his movement creating the space Isco and Ronaldo attacked.',
        'Zidane repeatedly called him the best number nine in the world \u2014 and the 2022 Ballon d\u2019Or eventually proved him right.',
      ],
    },
  },
  'zidane-undecima': {
    teamFacts: [
      'Zidane replaced Rafa Ben\u00edtez in January 2016 and won the Champions League barely five months into his first head-coaching job.',
      'La Und\u00e9cima was settled on penalties against Atl\u00e9tico in Milan, with Ronaldo converting the winning kick.',
      'Madrid also chased La Liga to the final day, closing with a 12-game winning run to finish a single point behind Barcelona.',
    ],
    playerFacts: {
      Navas: [
        'Keylor Navas kept a clean sheet through 120 minutes of the Milan final before the shoot-out.',
        'He nearly left for Manchester United on deadline day in 2015 \u2014 the paperwork famously failed at the last minute, and he stayed to win three European Cups.',
      ],
      Marcelo: [
        'Marcelo converted Madrid\u2019s third penalty in the Milan shoot-out.',
        'His triangle with Ronaldo on the left flank defined Madrid\u2019s attack throughout the era.',
      ],
      Ramos: [
        'Sergio Ramos scored Madrid\u2019s goal in the 2016 final \u2014 both of Atl\u00e9tico\u2019s final defeats came with a Ramos goal against them.',
        'He captained the side through all three consecutive Champions League triumphs.',
      ],
      Pepe: [
        'Pepe played the full 120 minutes of the Milan final at 33.',
        'He left in 2017 with three Champions Leagues and kept playing at Porto into his forties.',
      ],
      Carvajal: [
        'Dani Carvajal tore a ligament in extra time of the Milan final and left the pitch in tears.',
        'The injury cost him Euro 2016 with Spain; he recovered to start the next two finals.',
      ],
      Kroos: [
        'Toni Kroos\u2019s metronomic passing let Zidane\u2019s 4-3-3 switch between control and chaos.',
        'The 2016 title was his second Champions League, after winning it with Bayern in 2013.',
      ],
      Casemiro: [
        'Promoting Casemiro to starter was Zidane\u2019s first major decision as coach \u2014 the move that balanced the galaxy of attackers.',
        'A year earlier he had been on loan at Porto.',
      ],
      'Modri\u0107': [
        'Luka Modri\u0107 outran and outpassed Atl\u00e9tico\u2019s double pivot in the Milan final.',
        'By 2016 he was already regarded as the best midfielder in the competition \u2014 the Ballon d\u2019Or followed two years later.',
      ],
      Ronaldo: [
        'Cristiano Ronaldo buried the winning penalty in the Milan shoot-out and ripped his shirt off in celebration.',
        'He top-scored in that Champions League campaign with 16 goals.',
      ],
      Benzema: [
        'Karim Benzema\u2019s hold-up play released Ronaldo and Bale into space \u2014 the BBC\u2019s quiet engine.',
        'He played in all three of the era\u2019s winning finals without ever demanding the spotlight.',
      ],
      Bale: [
        'Gareth Bale converted his penalty in the Milan shoot-out despite carrying an injury.',
        'Weeks later he carried Wales to the semi-finals of Euro 2016, their first major tournament in 58 years.',
      ],
    },
  },
  'lucho-psg': {
    teamFacts: [
      'PSG\u2019s 5-0 demolition of Inter in the 2025 Munich final is the biggest winning margin in the history of European Cup and Champions League finals.',
      'Luis Enrique joined Pep Guardiola as the only coaches to win the continental treble with two different clubs.',
      'The club had chased the trophy for a decade with gal\u00e1cticos \u2014 it finally arrived the season after Mbapp\u00e9 left, won by the youngest average starting XI in the knockout rounds.',
    ],
    playerFacts: {
      Donnarumma: [
        'Gianluigi Donnarumma\u2019s shoot-out saves against Liverpool and heroics against Arsenal carried PSG through the knockout rounds.',
        'He was named Player of the Tournament at Euro 2020 after saving two penalties in the final shoot-out.',
      ],
      'Nuno Mendes': [
        'Nuno Mendes was widely rated the world\u2019s best left-back by the end of the treble season, winning his duels against Europe\u2019s elite wingers.',
        'PSG signed him from Sporting at 19, and he racked up four straight Ligue 1 titles.',
      ],
      Pacho: [
        'Willian Pacho arrived from Eintracht Frankfurt in 2024 and played virtually every minute of the Champions League run.',
        'He became the first Ecuadorian ever to win the Champions League.',
      ],
      Marquinhos: [
        'Marquinhos captained PSG for nearly a decade before finally lifting the trophy the project was built to win.',
        'He joined from Roma in 2013 \u2014 the Champions League arrived in his twelfth season at the club.',
      ],
      Hakimi: [
        'Achraf Hakimi opened the scoring in the 2025 final against Inter, his former club.',
        'He reached a World Cup semi-final with Morocco in 2022, a first for any African nation.',
      ],
      Vitinha: [
        'Vitinha conducted the final from the base of midfield, the heartbeat of Luis Enrique\u2019s press-and-possess machine.',
        'He finished third in the 2025 Ballon d\u2019Or, behind teammate Demb\u00e9l\u00e9.',
      ],
      Neves: [
        'Jo\u00e3o Neves joined from Benfica at 19 for one of the biggest fees ever paid for a teenage midfielder.',
        'He and Vitinha gave PSG two press-resistant conductors barely 1.75m tall \u2014 the anti-gal\u00e1ctico midfield.',
      ],
      Ruiz: [
        'Fabi\u00e1n Ruiz completed the midfield trio a year after being named in the team of the tournament at Euro 2024.',
        'He became a European champion at both international and club level within twelve months.',
      ],
      Kvaratskhelia: [
        'Khvicha Kvaratskhelia arrived in January 2025, and PSG\u2019s European campaign transformed after his debut.',
        'At Napoli he was nicknamed "Kvaradona", winning the 2023 Scudetto and Serie A\u2019s MVP award.',
      ],
      'Demb\u00e9l\u00e9': [
        'Ousmane Demb\u00e9l\u00e9 won the 2025 Ballon d\u2019Or after Luis Enrique reinvented him as a false nine \u2014 over 30 goals from a winger once written off as inconsistent.',
        'Luis Enrique publicly campaigned for his Ballon d\u2019Or, citing his pressing as much as his goals.',
      ],
      'Dou\u00e9': [
        'D\u00e9sir\u00e9 Dou\u00e9 scored twice in the 2025 final at 19, one of the great final performances by a teenager.',
        'PSG beat Bayern Munich to his signature when they signed him from Rennes in 2024.',
      ],
    },
  },
  'arteta-arsenal-24': {
    teamFacts: [
      'This Arsenal side conceded 29 goals in the league, the fewest in the division, and took the title race to the final day before finishing two points behind Manchester City.',
      'They scored 91 goals — the club’s highest league tally since the Invincibles season of 2003-04.',
      'Set pieces became a signature: Arsenal scored more goals from dead balls than any other Premier League side that season, coached by a dedicated set-piece specialist.',
    ],
    playerFacts: {
      Raya: [
        'David Raya arrived on loan and took the gloves mid-season, going on to win the Golden Glove for the most clean sheets.',
      ],
      Saliba: [
        'William Saliba played every minute of the league season, having spent three earlier years on loan away from the club.',
      ],
      Gabriel: [
        'Gabriel Magalhães is a repeated set-piece threat, regularly among the highest-scoring defenders in the league.',
      ],
      Rice: [
        'Declan Rice joined for a club record fee and was used both as the holding midfielder and further forward.',
      ],
      'Ødegaard': [
        'Martin Ødegaard captains the side and, unusually for a number ten, starts much of the pressing from the front.',
      ],
      Saka: [
        'Bukayo Saka holds the right touchline to stretch the pitch, then attacks the space inside the full-back.',
      ],
      Havertz: [
        'Kai Havertz began the season in midfield and finished it leading the line, scoring regularly once moved forward.',
      ],
      Martinelli: [
        'Gabriel Martinelli came through Arsenal’s system after arriving from Brazilian fourth-tier football.',
      ],
    },
  },
  'emery-sevilla-16': {
    teamFacts: [
      'This was Sevilla’s third Europa League title in a row, a run no other club has managed.',
      'Emery won the competition four times in total, more than any other manager.',
      'The side finished only seventh in La Liga that season, saving its best football entirely for Europe.',
    ],
    playerFacts: {
      Banega: [
        'Éver Banega was the side’s creative pivot, dictating tempo from deep before joining Inter that summer.',
      ],
      Krychowiak: [
        'Grzegorz Krychowiak formed the defensive half of the double pivot and left for PSG after the final.',
      ],
      'N’Zonzi': [
        'Steven N’Zonzi arrived from Stoke and became the screen in front of the back four.',
      ],
      Gameiro: [
        'Kevin Gameiro scored in the final, capping the most prolific season of his Sevilla spell.',
      ],
      Rami: [
        'Adil Rami anchored a back four that Emery rebuilt almost every summer as players were sold on.',
      ],
      Vitolo: [
        'Vitolo attacked from the left in all three of Sevilla’s consecutive Europa League final wins.',
      ],
    },
  },
  'emery-villa-24': {
    teamFacts: [
      'Aston Villa finished fourth to reach the Champions League for the first time in over four decades, having been in a relegation fight when Emery arrived.',
      'Villa’s defence pushed higher than any other side in the division and caught opponents offside far more often than anyone else.',
      'The approach is deliberately high-risk: the same high line that wins the ball early leaves a large space behind the defence if the trap fails.',
    ],
    playerFacts: {
      'Martínez': [
        'Emiliano Martínez sweeps well outside his box to cover the space the high line leaves behind.',
      ],
      Watkins: [
        'Ollie Watkins recorded the most assists of any forward in the league that season alongside his goals.',
      ],
      McGinn: [
        'John McGinn captains the side and covers enormous distances from midfield.',
      ],
      'Pau Torres': [
        'Pau Torres followed Emery from Villarreal, having played under him in Spain.',
      ],
      Konsa: [
        'Ezri Konsa’s recovery pace is what makes the extreme high line survivable.',
      ],
    },
  },
  'xabi-leverkusen-24': {
    teamFacts: [
      'Leverkusen won the 2023-24 Bundesliga without losing a single match — the first unbeaten league season in German top-flight history.',
      'The club had never won the Bundesliga before, having finished runners-up five times, a record that earned them the nickname Neverkusen.',
      'The team scored repeatedly in the closing minutes, rescuing points so often that the late goal became the season’s defining feature.',
    ],
    playerFacts: {
      Wirtz: [
        'Florian Wirtz returned from a serious knee injury to become the creative centre of the unbeaten season.',
      ],
      Grimaldo: [
        'Álex Grimaldo arrived on a free transfer and contributed goals and assists in numbers rarely seen from a wing-back.',
      ],
      Frimpong: [
        'Jeremie Frimpong attacks from the right wing-back position almost as an extra forward.',
      ],
      Xhaka: [
        'Granit Xhaka joined from Arsenal and was moved deeper, controlling tempo from in front of the back three.',
      ],
      Tah: [
        'Jonathan Tah anchored the middle of a back three that conceded fewer goals than any other side in the league.',
      ],
      Boniface: [
        'Victor Boniface led the line in his first season in Germany after arriving from the Belgian league.',
      ],
    },
  },
  'amorim-sporting-24': {
    teamFacts: [
      'Amorim won the Portuguese league with Sporting having ended a nineteen-year title drought in his first full season at the club.',
      'The 3-4-3 is used throughout Sporting’s academy as well as the first team, so players arrive already knowing the movements.',
      'Viktor Gyökeres scored more than forty goals across the season, having arrived from the English Championship.',
    ],
    playerFacts: {
      'Gyökeres': [
        'Viktor Gyökeres joined from Coventry City and became one of the most prolific strikers in Europe within a season.',
      ],
      Coates: [
        'Sebastián Coates captains the side from the middle of the back three, years after a short spell at Liverpool.',
      ],
      Hjulmand: [
        'Morten Hjulmand controls the midfield in front of the back three and captained Lecce before joining.',
      ],
      'Trincão': [
        'Francisco Trincão returned to Portugal after spells at Barcelona and elsewhere to play as an inside forward.',
      ],
      'Nuno Santos': [
        'Nuno Santos provides the entire width down the left as a wing-back.',
      ],
    },
  },
  'flick-bayern-20': {
    teamFacts: [
      'Bayern won every competition they entered in 2020, taking the treble with a perfect record in the Champions League — eleven wins from eleven.',
      'They beat Barcelona 8-2 in the quarter-final, the heaviest defeat in Barcelona’s modern European history.',
      'Flick was promoted from assistant coach mid-season, and the side lost only a handful of matches after he took charge.',
    ],
    playerFacts: {
      Neuer: [
        'Manuel Neuer sweeps so far from goal that he effectively acts as the last defender behind an extremely high line.',
      ],
      Lewandowski: [
        'Robert Lewandowski scored 55 goals in all competitions that season, including in every Champions League round bar the final.',
      ],
      Davies: [
        'Alphonso Davies converted from winger to left-back and became known for recovery runs at extraordinary speed.',
      ],
      Kimmich: [
        'Joshua Kimmich moved from right-back into defensive midfield and controlled the team from there.',
      ],
      'Müller': [
        'Thomas Müller plays a role he calls the Raumdeuter — the space interpreter — arriving in gaps rather than holding a position.',
      ],
      Coman: [
        'Kingsley Coman scored the only goal of the 2020 Champions League final against Paris Saint-Germain, the club that developed him.',
      ],
    },
  },
  'simeone-atleti-14': {
    teamFacts: [
      'Atlético won La Liga in 2013-14, breaking a run of nine consecutive titles shared between Barcelona and Real Madrid.',
      'They reached the Champions League final the same season and conceded an equaliser in the third minute of stoppage time before losing in extra time.',
      'The title was sealed with a draw at Barcelona on the final day, in a season where Atlético conceded fewer league goals than anyone.',
    ],
    playerFacts: {
      Courtois: [
        'Thibaut Courtois spent three seasons on loan at Atlético from Chelsea, winning the league in the last of them.',
      ],
      'Godín': [
        'Diego Godín scored the goal at Barcelona that clinched the title, and again in the Champions League final.',
      ],
      'Diego Costa': [
        'Diego Costa scored 27 league goals that season and left for Chelsea the following summer.',
      ],
      Koke: [
        'Koke came through the academy and has spent his entire career at the club, later becoming captain.',
      ],
      Gabi: [
        'Gabi captained the side from central midfield and set the tone for the team’s defensive intensity.',
      ],
      Villa: [
        'David Villa joined from Barcelona and formed a strike pair with Diego Costa in the title season.',
      ],
    },
  },
  'kompany-bayern-25': {
    teamFacts: [
      'Kompany won the Bundesliga in his first season at Bayern, reclaiming a title the club had lost the year before.',
      'He arrived having been relegated from the Premier League with Burnley the previous season, an unusual route to the Bayern job.',
      'As a player Kompany captained Manchester City through the start of their dominant era, under Guardiola among others.',
    ],
    playerFacts: {
      Kane: [
        'Harry Kane won the first major club trophy of his career in this season, having joined Bayern from Tottenham.',
      ],
      Musiala: [
        'Jamal Musiala came through Chelsea’s academy before moving to Bayern as a teenager and choosing Germany over England.',
      ],
      Olise: [
        'Michael Olise joined from Crystal Palace and was given freedom to drift inside from the right.',
      ],
      Kimmich: [
        'Joshua Kimmich has played almost every position across defence and midfield during his Bayern career.',
      ],
      Davies: [
        'Alphonso Davies remains one of the fastest players in the league, which is what allows the high line to work.',
      ],
    },
  },
  'tuchel-psg-20': {
    teamFacts: [
      'Tuchel took PSG to the club’s first Champions League final in 2020, losing 1-0 to Bayern Munich.',
      'The same season PSG won every domestic competition available to them.',
      'The knockout rounds were played in a single-venue tournament in Lisbon because of the pandemic, with matches decided over one leg rather than two.',
    ],
    playerFacts: {
      Neymar: [
        'Neymar was freed from defensive duties so he could stay high for counter-attacks, with the midfield covering behind him.',
      ],
      'Mbappé': [
        'Kylian Mbappé had already won a World Cup before this run to the Champions League final, aged 21.',
      ],
      Marquinhos: [
        'Marquinhos moved from centre-back into midfield in this side, giving the defence an extra passer in build-up.',
      ],
      'Thiago Silva': [
        'Thiago Silva captained PSG in the 2020 final and joined Chelsea weeks later, winning the trophy the following season.',
      ],
      Navas: [
        'Keylor Navas arrived having already won three consecutive Champions Leagues with Real Madrid.',
      ],
    },
  },
  'tuchel-chelsea-21': {
    teamFacts: [
      'Tuchel took over in January and won the Champions League in May, beating Manchester City in the final.',
      'Chelsea conceded only two goals across the entire knockout stage of that campaign.',
      'He faced Guardiola’s City three times in six weeks that spring and won all three, including the final.',
    ],
    playerFacts: {
      Mendy: [
        'Édouard Mendy set a record for clean sheets in a debut Champions League campaign.',
      ],
      'Thiago Silva': [
        'Thiago Silva won the Champions League a year after losing the final with PSG, against the same opponent who beat him.',
      ],
      'Kanté': [
        'N’Golo Kanté was named player of the match in the semi-final and the final, covering ground on both sides of the pitch.',
      ],
      Havertz: [
        'Kai Havertz scored the only goal of the 2021 Champions League final.',
      ],
      James: [
        'Reece James came through Chelsea’s academy and provided the width on the right as a wing-back.',
      ],
      'Rüdiger': [
        'Antonio Rüdiger had been close to leaving before Tuchel arrived and became a fixture in the back three.',
      ],
      Jorginho: [
        'Jorginho anchored the midfield and won the European Championship with Italy weeks after the final.',
      ],
    },
  },
  "simeone-atleti-21": {
    teamFacts: [
      "Atlético won the 2020-21 title by two points from Real Madrid, having led by ten at one stage and nearly let it slip.",
      "Luis Suárez was signed from Barcelona, who had decided he was finished, and scored 21 league goals in the title season.",
      "Simeone switched from his usual back four to a back three during the season, an unusually large change for a manager known for consistency.",
    ],
    playerFacts: {
      "Oblak": [
        "Jan Oblak won the award for the league’s best goalkeeper in five of six consecutive seasons.",
      ],
      "Suárez": [
        "Luis Suárez scored the goal that clinched the title on the final day, having been told he was surplus at Barcelona.",
      ],
      "Llorente": [
        "Marcos Llorente was converted from a defensive midfielder into a runner from deep and became one of the season’s outstanding players.",
      ],
      "Koke": [
        "Koke won a second league title nearly a decade after the first, having spent his whole career at the club.",
      ],
      "Trippier": [
        "Kieran Trippier moved from Tottenham and won a league title in Spain before returning to England.",
      ],
      "João Félix": [
        "João Félix arrived as one of the most expensive teenagers in history and had to adapt to a system built on defensive work.",
      ],
    },
  },
  "shankly-liverpool-66": {
    teamFacts: [
      "Liverpool won the 1965-66 title using only fourteen players across the entire league season.",
      "Shankly had taken over in 1959 with the club in the Second Division and a training ground he described as a wasteland.",
      "The side reached the European Cup Winners’ Cup final the same season, losing to Borussia Dortmund after extra time.",
    ],
    playerFacts: {
      "Lawrence": [
        "Tommy Lawrence was nicknamed the Flying Pig and swept far off his line, decades before that became standard.",
      ],
      "Yeats": [
        "Ron Yeats was introduced by Shankly to reporters with an invitation to walk around him and admire the size of him.",
      ],
      "Hunt": [
        "Roger Hunt remains Liverpool’s record league goalscorer and won the World Cup with England the same summer.",
      ],
      "St John": [
        "Ian St John scored the winning goal in the 1965 FA Cup final, the club’s first.",
      ],
      "Callaghan": [
        "Ian Callaghan made more appearances for Liverpool than any other player in the club’s history.",
      ],
      "Smith": [
        "Tommy Smith was said by Shankly to have been born a man rather than a boy.",
      ],
    },
  },
  "paisley-liverpool-77": {
    teamFacts: [
      "Paisley won the league and Liverpool’s first European Cup in 1976-77, then two more European Cups within four years.",
      "He won six league titles and three European Cups in nine seasons, and never wanted the job in the first place.",
      "He had been at the club since 1939 as player, physiotherapist and coach before taking charge.",
    ],
    playerFacts: {
      "Clemence": [
        "Ray Clemence conceded only sixteen league goals in the 1978-79 season, a record that still stands.",
      ],
      "Keegan": [
        "Kevin Keegan played his last match for Liverpool in the 1977 European Cup final before joining Hamburg.",
      ],
      "Hughes": [
        "Emlyn Hughes captained the side and was nicknamed Crazy Horse for the way he threw himself into challenges.",
      ],
      "Neal": [
        "Phil Neal scored in the 1977 final and went on to win four European Cups, more than any other English player.",
      ],
      "Callaghan": [
        "Ian Callaghan was still in the side more than a decade after winning the title under Shankly.",
      ],
      "Heighway": [
        "Steve Heighway joined from university football rather than an apprenticeship, which was highly unusual.",
      ],
    },
  },
  "sacchi-milan-89": {
    teamFacts: [
      "Milan won back-to-back European Cups in 1989 and 1990, beating Steaua Bucharest 4-0 in the first final.",
      "Sacchi never played professional football, and answered doubts by pointing out that a jockey does not need to have been a horse.",
      "The team trained the offside trap and the press without any opposition at all, moving as a unit against imaginary opponents.",
    ],
    playerFacts: {
      "Baresi": [
        "Franco Baresi organised the offside line and is regarded as one of the greatest defenders the game has produced.",
      ],
      "Maldini": [
        "Paolo Maldini was barely twenty and would still be playing at the top level twenty years later.",
      ],
      "Van Basten": [
        "Marco van Basten won three Ballon d’Or awards before injury ended his career at twenty-eight.",
      ],
      "Gullit": [
        "Ruud Gullit could play in defence, midfield or attack, which was central to how Sacchi wanted the team to work.",
      ],
      "Rijkaard": [
        "Frank Rijkaard scored the winning goal in the 1990 European Cup final and later managed Barcelona.",
      ],
      "Ancelotti": [
        "Carlo Ancelotti played in this midfield and went on to manage AC Milan to two European Cups of his own.",
      ],
    },
  },
  "capello-milan-94": {
    teamFacts: [
      "Milan conceded fifteen goals in the entire 1993-94 league season, a record for a European top division.",
      "They beat Barcelona 4-0 in the Champions League final while missing both first-choice centre-backs through suspension.",
      "Capello won four league titles in five seasons at Milan, having never managed a club before taking the job.",
    ],
    playerFacts: {
      "Maldini": [
        "Paolo Maldini played centre-back in the 1994 final having spent most of his career at left-back.",
      ],
      "Savićević": [
        "Dejan Savićević scored from the halfway line in the 1994 final, a goal replayed ever since.",
      ],
      "Desailly": [
        "Marcel Desailly won the European Cup in consecutive years with two different clubs.",
      ],
      "Massaro": [
        "Daniele Massaro scored twice in the 1994 final having been considered a squad player.",
      ],
      "Albertini": [
        "Demetrio Albertini controlled the tempo from deep midfield throughout Capello’s Milan side.",
      ],
      "Boban": [
        "Zvonimir Boban joined from Dinamo Zagreb and later became a senior football administrator.",
      ],
    },
  },
  "delbosque-spain-10": {
    teamFacts: [
      "Spain lost their opening match of the 2010 World Cup to Switzerland and still won the tournament.",
      "They won every knockout match 1-0, and scored only eight goals in seven games in total.",
      "Del Bosque had already won two Champions Leagues with Real Madrid before taking the national team.",
    ],
    playerFacts: {
      "Casillas": [
        "Iker Casillas captained Spain to the World Cup and made a decisive save with his foot in the final.",
      ],
      "Iniesta": [
        "Andrés Iniesta scored the winning goal in the 116th minute of the final against the Netherlands.",
      ],
      "Xavi": [
        "Xavi completed more passes than any other player at the tournament, by a wide margin.",
      ],
      "Puyol": [
        "Carles Puyol scored the only goal of the semi-final against Germany, from a corner.",
      ],
      "Villa": [
        "David Villa scored five of Spain’s eight goals at the tournament.",
      ],
      "Busquets": [
        "Sergio Busquets was twenty-one and playing in only his first major tournament.",
      ],
      "Xabi Alonso": [
        "Xabi Alonso played in the double pivot here and is now a manager in his own right.",
      ],
    },
  },
  "heynckes-bayern-13": {
    teamFacts: [
      "Bayern won the treble in 2012-13 and took the Bundesliga with a record points total and six matches to spare.",
      "They beat Barcelona 7-0 on aggregate in the semi-final.",
      "Heynckes retired at the end of the season, having lost the previous year’s final at Bayern’s own stadium.",
    ],
    playerFacts: {
      "Neuer": [
        "Manuel Neuer’s sweeping from goal changed expectations of what a goalkeeper does with the ball at his feet.",
      ],
      "Robben": [
        "Arjen Robben scored the winning goal in the 2013 final, a year after missing a penalty in the final Bayern lost.",
      ],
      "Ribéry": [
        "Franck Ribéry attacked from the left all season and was named European footballer of the year.",
      ],
      "Lahm": [
        "Philipp Lahm played at full-back and in midfield, often within the same match.",
      ],
      "Schweinsteiger": [
        "Bastian Schweinsteiger anchored the midfield and later won the World Cup with Germany.",
      ],
      "Javi Martínez": [
        "Javi Martínez was signed as a record transfer for the club and converted into a defensive midfielder.",
      ],
    },
  },
  "lippi-italy-06": {
    teamFacts: [
      "Italy conceded two goals in seven matches at the 2006 World Cup: a penalty and an own goal.",
      "The tournament was played while a match-fixing scandal was unfolding at home, involving several of the players’ clubs.",
      "The final against France was decided on penalties after Zinédine Zidane was sent off in extra time.",
    ],
    playerFacts: {
      "Buffon": [
        "Gianluigi Buffon did not concede a single goal to an opponent all tournament.",
      ],
      "Cannavaro": [
        "Fabio Cannavaro captained the side and won the Ballon d’Or that year, rare for a defender.",
      ],
      "Pirlo": [
        "Andrea Pirlo dictated from deep midfield and was named man of the match three times.",
      ],
      "Grosso": [
        "Fabio Grosso scored the winning goal in the semi-final and the decisive penalty in the final.",
      ],
      "Materazzi": [
        "Marco Materazzi scored Italy’s goal in the final and was involved in the incident that saw Zidane sent off.",
      ],
      "Totti": [
        "Francesco Totti played the tournament months after breaking his ankle.",
      ],
    },
  },
  "michels-netherlands-74": {
    teamFacts: [
      "The Netherlands reached the 1974 World Cup final and lost to West Germany, having scored inside the first two minutes before the Germans had touched the ball.",
      "The squad was numbered alphabetically, which is why the goalkeeper wore 8 — Johan Cruyff insisted on keeping 14.",
      "Michels later won the 1988 European Championship with the Netherlands, the country’s only major trophy.",
    ],
    playerFacts: {
      "Cruyff": [
        "Johan Cruyff gave his name to the Cruyff turn, first performed at this tournament against Sweden.",
      ],
      "Neeskens": [
        "Johan Neeskens scored the fastest goal in a World Cup final at the time, from a penalty in the second minute.",
      ],
      "Krol": [
        "Ruud Krol played across the whole back line and pushed forward constantly, which was the point of the system.",
      ],
      "Jongbloed": [
        "Jan Jongbloed wore number 8 because the squad numbers were assigned alphabetically.",
      ],
      "Rep": [
        "Johnny Rep scored four goals at the tournament from the right of the front three.",
      ],
      "Rensenbrink": [
        "Rob Rensenbrink attacked from the left and later hit the post in the final minute of the 1978 final.",
      ],
    },
  },
  "aragones-spain-08": {
    teamFacts: [
      "Euro 2008 was Spain’s first major trophy since 1964, ending forty-four years without one.",
      "Aragonés dropped Raúl, the country’s record goalscorer at the time, and built the team around smaller technical midfielders instead.",
      "Spain won every match at the tournament, beating the reigning world champions Italy on penalties in the quarter-final.",
    ],
    playerFacts: {
      "Senna": [
        "Marcos Senna screened the defence alone and was named in the team of the tournament.",
      ],
      "Torres": [
        "Fernando Torres scored the only goal of the final against Germany.",
      ],
      "Xavi": [
        "Xavi was named player of the tournament, the first sign of what Spain would go on to do.",
      ],
      "Casillas": [
        "Iker Casillas saved two penalties in the quarter-final shoot-out against Italy.",
      ],
      "Silva": [
        "David Silva was twenty-two and playing his first major tournament.",
      ],
      "Iniesta": [
        "Andrés Iniesta played wide left in this side before becoming a central midfielder for Spain.",
      ],
    },
  },
  "benitez-liverpool-05": {
    teamFacts: [
      "Liverpool trailed AC Milan 3-0 at half-time in the 2005 Champions League final and were level within six minutes of the restart.",
      "Benítez changed shape at half-time, bringing on Dietmar Hamann and moving to three at the back.",
      "Liverpool had finished fifth in the league that season and only entered the following season’s competition by special dispensation.",
    ],
    playerFacts: {
      "Gerrard": [
        "Steven Gerrard scored the goal that started the comeback and finished the final playing as a right-back.",
      ],
      "Dudek": [
        "Jerzy Dudek saved the decisive penalty and distracted takers with a much-copied movement on his line.",
      ],
      "Carragher": [
        "Jamie Carragher played through cramp in extra time and made two goal-saving blocks.",
      ],
      "Xabi Alonso": [
        "Xabi Alonso scored Liverpool’s third goal from the rebound after his own penalty was saved.",
      ],
      "Hyypiä": [
        "Sami Hyypiä anchored a defence that conceded only three goals in the knockout rounds before the final.",
      ],
      "Luis García": [
        "Luis García scored the semi-final goal against Chelsea that was never conclusively shown to have crossed the line.",
      ],
    },
  },
  "dalglish-liverpool-88": {
    teamFacts: [
      "Liverpool went twenty-nine league matches unbeaten from the start of the 1987-88 season.",
      "The side is frequently voted the best in the club’s history, though it lost the FA Cup final to Wimbledon that year.",
      "Dalglish was still registered as a player and had won the double as player-manager two seasons earlier.",
    ],
    playerFacts: {
      "Barnes": [
        "John Barnes was named footballer of the year in his first season at the club.",
      ],
      "Beardsley": [
        "Peter Beardsley played between midfield and attack, linking the two in a role few English sides used.",
      ],
      "Aldridge": [
        "John Aldridge scored in a record number of consecutive league matches that season.",
      ],
      "Hansen": [
        "Alan Hansen brought the ball out of defence rather than clearing it, unusual for an English centre-back then.",
      ],
      "Grobbelaar": [
        "Bruce Grobbelaar was known for unorthodox goalkeeping and for the wobbly legs routine in the 1984 final.",
      ],
      "Houghton": [
        "Ray Houghton and John Barnes swapped flanks constantly, which defenders found almost impossible to track.",
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Glossary of football jargon. Terms found in panel copy are marked with an
// asterisk and defined in small text at the bottom of that panel, for readers
// newer to the game. Keys are the canonical (singular, lowercase) form.
// ---------------------------------------------------------------------------

export const GLOSSARY: Record<string, string> = {
  trequartista:
    'an attacking playmaker who floats in the pocket of space behind the strikers',
  gegenpressing:
    'winning the ball back immediately after losing it, by pressing the new ball-carrier at once',
  'counter-press':
    'pressing the opponent the instant possession is lost, before they can organise',
  'juego de posición':
    'Spanish for positional play — the pitch is split into zones that players occupy to guarantee passing options',
  'positional play':
    'a possession system where players hold set zones so there is always a passing triangle available',
  'half-space':
    'the two vertical channels of the pitch between the centre and the wings',
  'false nine':
    'a centre-forward who drops into midfield instead of staying on the last defender',
  'single pivot': 'one lone deep midfielder shielding the defence',
  'double pivot': 'two deep midfielders sharing the shielding job in front of the defence',
  pivot: 'the deepest midfielder, who shields the defence and links play',
  'number ten':
    'the creative attacking midfielder who plays between the opposition’s midfield and defence',
  'low block': 'a deep, compact defensive shape camped close to a team’s own goal',
  'rest defence':
    'the players who stay back in secure covering positions while their own team attacks',
  overload: 'creating a numerical advantage in one area of the pitch',
  'inverted full-back':
    'a full-back who steps into central midfield when his team has the ball',
  'third-man':
    'a passing pattern where a layoff is met by a third player arriving — the one no defender is marking',
  underlap: 'a run by a full-back inside the winger, rather than around the outside',
  'tiki-taka': 'the short-passing, high-possession style of Guardiola’s Barcelona and Spain',
  'total football':
    'the Dutch philosophy in which any outfield player can rotate into any position',
  'wing-back':
    'the wide player in a back-five system who covers the entire flank, defending and attacking',
  fantasista: 'Italian for a creative attacking player given complete artistic freedom',
  libero: 'a “free” defender who sweeps up behind the rest of the defensive line',
  regista: 'Italian for a deep-lying playmaker who conducts the game from in front of the defence',
  raumdeuter:
    'German for “space interpreter” — a forward who finds unmarked pockets rather than holding a fixed position',
};

// ---------------------------------------------------------------------------
// Manager playstyles, keyed by manager name exactly as it appears in MANAGERS
// (App.tsx). Shown in the inspector under Core Ideas when an era is active.
// ---------------------------------------------------------------------------

export const MANAGER_PLAYSTYLES: Record<string, string> = {
  'Alex Ferguson':
    'Ferguson\u2019s football was built on speed, width and relentless attacking tempo: two genuine wingers delivering early crosses, full-backs overlapping in waves, and strikers working in pairs. Underneath the style sat psychology \u2014 squad rotation years before it was fashionable, ruthless rebuilding of ageing teams, and the famous \u201cFergie time\u201d belief that a match is never finished. His sides pressed forward hardest in the final fifteen minutes, when opponents were praying for the whistle.',
  'Pep Guardiola':
    'Guardiola plays positional play \u2014 juego de posici\u00f3n \u2014 a grid of zones the pitch is divided into, with strict rules about who occupies which lane and half-space. The ball is circulated to pull opponents out of their shape until a free man appears between the lines; losing it triggers an immediate six-second counter-press. Around that core he has never stopped experimenting: the false nine at Barcelona, inverted full-backs at Bayern, and a defender stepping into midfield at City. Control of the ball is really control of the game\u2019s risk.',
  'Jos\u00e9 Mourinho':
    'Mourinho is football\u2019s great reactive strategist: the game is won by denying the opponent what they do best, then punishing the moments they over-commit. His teams defend in a compact mid or low block, concede possession by design, and break with devastating four-second vertical transitions. Every player has one job and the discipline to do only that job \u2014 creative licence is granted to a single trusted number ten. In knockout football, where one mistake decides everything, his method has been ruthlessly effective.',
  'Carlo Ancelotti':
    'Ancelotti bends the system to the players, never the reverse \u2014 the Christmas tree at Milan existed only because Kak\u00e1, Seedorf and Rui Costa had to coexist. His trademark is the deep-lying playmaker: dropping Pirlo in front of the defence redefined the position for a generation. Tactically his teams are balanced rather than extreme \u2014 a solid block, freedom for the artists, and devastating transitions \u2014 while his real genius is man-management, keeping dressing rooms of superstars calm, humble and pulling together.',
  'Johan Cruyff':
    'Cruyff imported Total Football from the Ajax of his playing days and turned it into a philosophy: every player comfortable in every zone, constant positional rotation, and the ball as the best defender. His 3-4-3 diamond created triangles all over the pitch so there was always a passing angle, with the spare defender stepping into midfield to create overloads. Defending meant winning the ball back high and fast, before the opponent could organise. Barcelona\u2019s entire modern identity \u2014 La Masia, Guardiola, tiki-taka \u2014 descends directly from these ideas.',
  'Ars\u00e8ne Wenger':
    'Wenger fused English pace and power with continental technique \u2014 the Invincibles were as physically dominant as they were beautiful. His football was about speed of combination: win the ball, then move it forward through one- and two-touch passing before the opponent could reset, with Henry drifting into the left channel and Bergkamp threading passes between the lines. He gave players frameworks rather than scripts, trusting technical intelligence over drilled patterns, and pioneered sports science, nutrition and data in the English game.',
  'Luis Enrique':
    'Luis Enrique plays aggressive, vertical positional play: the build-up patterns of the Barcelona school, but faster and more direct, always looking to release the forwards the moment a line can be broken. Without the ball his teams press as an eleven, suffocating opponents in their own third \u2014 his PSG side pressed harder than any European champion before it. He is also ruthlessly collective: stars who won\u2019t defend don\u2019t play, which is why a post-gal\u00e1ctico PSG of runners and pressers finally won the trophy the superstars never could.',
  'J\u00fcrgen Klopp':
    'Klopp\u2019s gegenpressing treats the counter-press as the best playmaker: the instant the ball is lost, the nearest players swarm it in a five-second frenzy, because an opponent who has just won the ball is at their most disorganised. Played at full intensity \u2014 \u201cheavy metal football\u201d \u2014 it turns defence into attack thirty metres from goal. His Liverpool added a high defensive line behind the press, full-backs as the chief creators, and a front three who defended from the front, all fuelled by an emotional connection between team and crowd that he treated as a tactical weapon.',
  'Zin\u00e9dine Zidane':
    'Zidane\u2019s genius was balance: fitting Kroos, Modri\u0107 and Casemiro into a midfield that could control any game, then letting the BBC decide it. Tactically flexible \u2014 4-3-3 one season, a diamond the next \u2014 his Madrid conceded territory when needed, trusted individual brilliance in decisive moments, and managed the calendar masterfully, resting stars so they peaked in the Champions League spring. Critics called it lucky; three consecutive European Cups suggest it was something closer to mastery of the knockout format.',
  'Mikel Arteta':
    'Arteta learned under Guardiola and kept the framework: control the ball, control the space, leave nothing to chance. His Arsenal build with a back three formed by a full-back stepping inside, hold the width through two wingers who stay glued to the touchline, and attack the moment an opponent narrows to cover the middle. Out of possession the press is aggressive but selective, triggered by a backwards pass or a heavy touch. The distinguishing feature is preparation: set pieces are coached in fine detail by a dedicated specialist and became a decisive source of goals, and the defensive record that carried the 2023-24 title race was the best in the league.',
  'Unai Emery':
    'Emery is the most match-specific coach of his generation, famous for hours of video work and plans tailored to a single opponent. The constants are a double pivot protecting the back four, wide players who attack one-against-one, and pressing used in calculated bursts rather than continuously. At Sevilla that produced three Europa League titles in a row, a record still unmatched. At Aston Villa he added an extreme high line and a deliberately aggressive offside trap, squeezing the pitch and daring opponents to run in behind — a high-risk method that demands total co-ordination from the back four.',
  'Xabi Alonso':
    'Alonso plays the game the way he played in midfield: patient, positional, unhurried until the pass is on. His Leverkusen used a back three of centre-backs comfortable carrying the ball forward, wing-backs who covered the entire touchline, and a free role for Florian Wirtz between the lines. The team rarely forced play, preferring to circulate until an opponent stepped out of shape. It was also relentlessly persistent: a run of late goals turned draws into wins repeatedly on the way to the first unbeaten season in Bundesliga history.',
  'Rúben Amorim':
    'Amorim is unusually committed to a single shape. His 3-4-3 is played by the whole club, academy included, on the theory that certainty is worth more than surprise: everyone knows the movements without thinking. The back three defend a compact central area, the wing-backs supply every ounce of width, and the two inside forwards tuck close to a striker who attacks the space behind at the first opportunity. It asks a great deal of the wing-backs and can be stretched by teams that overload one flank, but it produced titles at Sporting with squads far cheaper than their rivals.',
  'Hansi Flick':
    'Flick took over a Bayern side mid-season and immediately pushed everything forward: the defensive line to halfway, the press onto the opposition goalkeeper, the full-backs almost into the front line. The result was the most extreme high-line football at the top of the European game, with Manuel Neuer sweeping far outside his box as the last defender. It produced a treble and a 8-2 win over Barcelona, and it is deliberately high-risk — the space behind is enormous, and the whole method depends on winning the ball back before anyone can use it.',
  'Diego Simeone':
    'Simeone built Atlético around the idea that possession is optional and organisation is not. Two banks of four sit narrow and deep, the distance between the lines is guarded jealously, and the team is content to let opponents keep the ball in front of them. Attacks come fast and direct once the ball is won, and set pieces are treated as a primary weapon rather than an afterthought. The football is often described as defensive, but the demand it makes is relentless: every player runs, every duel is contested, and the intensity is sustained for the full match.',
  'Vincent Kompany':
    'Kompany coaches from the perspective of the defender he was, but the football is front-footed: a high defensive line, quick vertical passing, and possession used to pin opponents back rather than to slow the game down. At Bayern he gave Jamal Musiala and Michael Olise freedom to drift and swap across the front while the structure behind them stayed disciplined, with Harry Kane as the reference point. The approach reclaimed the Bundesliga in his first season and asks the same question as every high line: whether the press can win the ball back before the space behind matters.',
  'Thomas Tuchel':
    'Tuchel is a problem-solver who reshapes his team around the opponent, and his sides are defined by structure rather than a single signature. At PSG he freed Neymar and Mbappé from defensive work and built a midfield that could cover for them, reaching a first Champions League final. At Chelsea he switched to a back three and two holding midfielders and conceded almost nothing, winning the Champions League four months after arriving mid-season. The common thread is control of the centre: whatever the shape, the middle of the pitch is crowded and the opposition is pushed towards the touchlines.',
  "Bill Shankly":
    "Shankly’s method was simplicity carried out perfectly: pass to the nearest red shirt, move, and ask for it back. He rebuilt Liverpool from the second division on fitness, repetition and an emotional bond with the crowd that he cultivated deliberately. The football was direct without being crude — wingers held the touchlines and delivered early to two forwards — and the team was picked with almost no rotation, so the understanding between players became instinctive. He also built the boot room, the coaching structure that let Liverpool keep winning long after he left.",
  "Bob Paisley":
    "Paisley inherited Shankly’s side and quietly made it better, winning three European Cups in five years while barely raising his voice. The football was pass-and-move: give the ball early, run to support it, and never hold on longer than necessary. Defensively his teams were patient rather than aggressive, holding shape and declining to dive into tackles, which is why they conceded so little. He rarely spent big, preferring to sign one player a year and let them adapt slowly, and he moved players between positions when he saw something others had not.",
  "Arrigo Sacchi":
    "Sacchi rebuilt defending as a collective act rather than a set of individual duels. His Milan pressed the ball the instant it was lost, held an offside line dozens of times a match on a signal, and kept the distance between the highest and deepest player to around twenty-five metres — squeezing opponents into a space too small to play in. It was drilled relentlessly, sometimes with shadow play against no opposition at all. Sacchi had never played professionally, which he answered with the line that you do not need to have been a horse to be a jockey.",
  "Fabio Capello":
    "Capello was a pragmatist who won wherever he went, and his teams were built from the defence forward. The back four defended as a single unit, stepped up together, and conceded almost nothing — his 1993-94 Milan let in fifteen goals in an entire league season. In attack he preferred patience: keep the shape, wait for the opponent to commit, then break with two forwards who interchanged constantly. He was known for strict discipline and for being willing to leave out any player, however famous, who did not meet it.",
  "Vicente del Bosque":
    "Del Bosque took a team that already knew how to keep the ball and made it relentless about it. Two holding midfielders freed the technicians ahead of them, and possession was treated as a defensive act as much as an attacking one: an opponent without the ball cannot score. Spain won the 2010 World Cup scoring only eight goals in seven matches, every knockout tie by a single goal, which drew criticism for caution and missed the point — the control was the plan. He managed quietly, deferring to senior players rather than dominating them.",
  "Jupp Heynckes":
    "Heynckes was a calm, meticulous coach whose 2012-13 Bayern combined German organisation with two of the finest wingers of the era attacking from either flank. The double pivot controlled tempo and won the ball back at once; the full-backs pushed high, trusting that cover; and Robben and Ribéry were left one-against-one as often as possible. The side won the treble in his final season before retirement, having lost the previous year’s final at home — a rebuild driven by disappointment rather than by any change of philosophy.",
  "Marcello Lippi":
    "Lippi built from the back and made it look like ambition rather than caution. His Italy conceded twice in seven matches on the way to the 2006 World Cup, one of those an own goal, with a back four that defended as a unit and full-backs who supplied all the width. In midfield Andrea Pirlo dictated from deep while Gennaro Gattuso covered the ground around him, a division of labour Lippi used repeatedly. He was also a skilled manager of people, holding a squad together through a match-fixing scandal at home during the tournament.",
  "Rinus Michels":
    "Michels invented what became known as Total Football: a system in which any outfield player could take up any position, provided someone immediately filled the space they left. It demanded extraordinary intelligence and fitness, and it worked because the players — Cruyff above all — could genuinely play anywhere. The defence pushed to halfway to compress the pitch, an idea that predated the modern high line by decades. He was uncompromising about work rate, and gave the game one of its most quoted lines: football is war.",
  "Luis Aragonés":
    "Aragonés made the decision that changed Spanish football: he dropped the traditional target man and built the team around small, technical midfielders who kept the ball. Marcos Senna screened the defence alone so four creators could play in front of him, and Spain passed opponents into submission on the way to Euro 2008 — a first trophy in forty-four years. The choice was unpopular before it worked, and it laid the foundation for everything Spain won afterwards. He was blunt, stubborn, and entirely willing to be disliked while being proved right.",
  "Rafael Benítez":
    "Benítez is a systems coach who prepares in exhaustive detail and changes shape within matches rather than between them. At Liverpool he introduced zonal marking at set pieces, which drew years of criticism in England, and rotated squads in a way that was then unusual. His most famous night was Istanbul in 2005: three goals down at half-time in the Champions League final, he changed formation, brought on a holding midfielder, and Liverpool were level within six minutes. The football is not romantic, but the planning behind it is unusually thorough.",
  "Kenny Dalglish":
    "Dalglish took over Liverpool as player-manager in the hardest circumstances imaginable and won the double in his first season. His 1987-88 side is often called the best the club has produced: fast, fluent attacking football, with John Barnes and Peter Beardsley given freedom to move wherever they liked and the ball moved forward first time whenever possible. He led the club through the Hillsborough disaster with a personal commitment to the bereaved families that defined his standing at Liverpool long after he stopped managing.",
};
