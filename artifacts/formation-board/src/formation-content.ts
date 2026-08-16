// Editorial content for each formation, keyed by formation name (the ID used
// throughout the app). Edit copy here without touching any UI code.

export type KeyRole = {
  role: string;
  job: string;
};

export type CoreIdeas = {
  inPossession: string;
  outOfPossession: string;
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
      inPossession: '2-4-4 with full-backs pushing on and wingers hugging the touchline',
      outOfPossession: 'Two flat banks of four, strikers screening the pivot',
      principles: [
        'Width comes from the wingers; full-backs overlap only when cover exists',
        'One central midfielder holds while the other joins attacks',
        'The strike pair works as a unit: one drops, one runs beyond',
        'Crosses and second balls are the primary chance creation routes',
      ],
      keyRoles: [
        { role: 'Strike partnership', job: 'Combine, occupy both centre-backs, and press the first pass together' },
        { role: 'Holding midfielder', job: 'Screen the back four and recycle possession — only two protect the middle' },
      ],
      strength: 'Compact, easy to organise, and dangerous from wide areas',
      vulnerability: 'A midfield three can overload the two central midfielders',
    },
    funFacts: [
      'The 4-4-2 grew out of English football in the 1960s, with Alf Ramsey\u2019s England popularising a four-man midfield on the way to the 1966 World Cup.',
      'Arrigo Sacchi\u2019s AC Milan of the late 1980s is the most celebrated 4-4-2, winning back-to-back European Cups with a hyper-compact, high-pressing version.',
      'Unlike the textbook two flat banks, Sacchi\u2019s version defended with barely 25 metres between the striker and the last defender, squeezing opponents into a tiny playing area.',
    ],
  },
  '4-3-3': {
    coreIdeas: {
      inPossession: '2-3-5 with full-backs or the eight-space midfielders providing the extra line',
      outOfPossession: '4-1-4-1 or 4-5-1 as the wingers drop onto the full-backs',
      principles: [
        'Width is fixed by the wingers so the full-backs can pick their moments',
        'The single pivot screens the back line and sets the tempo',
        'Two number eights break lines with runs into the half-spaces',
        'The front three press the opposition build-up as the first defensive wave',
      ],
      keyRoles: [
        { role: 'Single pivot', job: 'Protect the space in front of the defence and dictate the rhythm of build-up' },
        { role: 'Wingers', job: 'Stay high and wide to isolate full-backs one-v-one' },
      ],
      strength: 'Natural triangles everywhere make it the classic possession shape',
      vulnerability: 'The lone pivot can be swamped if the eights push too high',
    },
    funFacts: [
      'The 4-3-3 became famous through Rinus Michels\u2019 Ajax and the Dutch national team of the early 1970s, the sides that gave the world Total Football.',
      'Johan Cruyff carried the idea to Barcelona, and his 4-3-3 with a patient positional game became the house style of La Masia.',
      'Where the textbook 4-3-3 uses a flat midfield three, Cruyff\u2019s version staggered it around a deep organiser — a role later defined by Pep Guardiola the player.',
    ],
  },
  '4-2-3-1': {
    coreIdeas: {
      inPossession: 'Double pivot splits, the ten floats between the lines, wingers cut inside',
      outOfPossession: 'Compact 4-4-1-1 with the ten pressing the deepest midfielder',
      principles: [
        'Width is created by wingers who attack inside channels while full-backs overlap',
        'Two holders share screening duties so one can always step out',
        'The number ten links midfield to attack and finds pockets between lines',
        'The lone striker pins both centre-backs to keep space open for the ten',
      ],
      keyRoles: [
        { role: 'Number ten', job: 'Live between the lines, receive on the half-turn, and feed the front three' },
        { role: 'Double pivot', job: 'One destroys, one distributes — together they free the four attackers' },
      ],
      strength: 'Balances attacking numbers with two dedicated midfield protectors',
      vulnerability: 'If the ten is marked out of the game, attack and midfield disconnect',
    },
    funFacts: [
      'The 4-2-3-1 spread through Spanish and French football in the 1990s and became Europe\u2019s default shape by the 2010 World Cup, which Spain won using it.',
      'Jos\u00e9 Mourinho\u2019s Real Madrid of 2011-12 rode a devastating counter-attacking 4-2-3-1 to a 100-point La Liga title.',
      'Unlike the possession-first textbook version, Mourinho\u2019s Madrid used the shape as a launch pad for vertical transitions, going from box to box in a handful of passes.',
    ],
  },
  '4-1-4-1': {
    coreIdeas: {
      inPossession: 'The pivot drops between or ahead of the centre-backs while the eights push up',
      outOfPossession: 'Two tight banks with the pivot patrolling the gap between them',
      principles: [
        'Width comes from the wide midfielders staying disciplined on the touchline',
        'The lone pivot screens the back four and is the out-ball under pressure',
        'The two central midfielders arrive late in the box rather than starting high',
        'The striker presses alone, steering play toward the touchlines',
      ],
      keyRoles: [
        { role: 'Anchor', job: 'Hold the space in front of the defence and start every attack' },
        { role: 'Box-to-box midfielders', job: 'Cover ground in both directions and crash the box late' },
      ],
      strength: 'Extremely hard to play through centrally',
      vulnerability: 'The lone striker can be isolated for long spells',
    },
    funFacts: [
      'The 4-1-4-1 rose to prominence as a pressing shape in the 2000s, prized for the clean five-man second line it creates without the ball.',
      'Pep Guardiola leaned on a 4-1-4-1 at Bayern Munich, often listing it as the nominal shape behind his fluid positional attacks.',
      'Guardiola\u2019s twist was inverting his full-backs into midfield, so the nominal 4-1-4-1 became a 2-3-2-3 the moment Bayern had the ball.',
    ],
  },
  '4-4-1-1': {
    coreIdeas: {
      inPossession: 'The second striker drops into pockets while wide midfielders push high',
      outOfPossession: 'A 4-4-2 look, with the withdrawn forward cutting passing lanes to the pivot',
      principles: [
        'Width is supplied by the two wide midfielders, not the full-backs',
        'The second striker is the free man — finding him between the lines is the plan',
        'Central midfielders stay disciplined; runs beyond come from wide players',
        'Quick combinations between the front two spring the attack',
      ],
      keyRoles: [
        { role: 'Withdrawn forward', job: 'Drift between the lines, link play, and arrive unmarked in the box' },
        { role: 'Wide midfielders', job: 'Provide both width in attack and cover for the full-backs' },
      ],
      strength: 'The free role between the lines is very hard to mark with a back four',
      vulnerability: 'Only one true striker, so the box can be under-populated',
    },
    funFacts: [
      'The 4-4-1-1 is the classic vehicle for a deep-lying forward, a role Italian football romanticised as the fantasista playing "between the lines".',
      'Alex Ferguson\u2019s mid-90s Manchester United often played a 4-4-1-1 in practice, with Eric Cantona dropping off the front line as the creative hub.',
      'Rather than a pure playmaker, Cantona\u2019s version of the role mixed goal-scoring with creation — he finished as United\u2019s top scorer while playing as the link man.',
    ],
  },
  '4-5-1': {
    coreIdeas: {
      inPossession: 'Wide midfielders become wingers and the shape morphs toward a 4-3-3',
      outOfPossession: 'A five-man midfield wall in front of a flat back four',
      principles: [
        'Width comes from the wide midfielders sprinting forward in transition',
        'Three central midfielders win the numbers game in the middle',
        'The striker holds the ball up alone to let the team climb the pitch',
        'Compactness first: the block shifts side to side as one unit',
      ],
      keyRoles: [
        { role: 'Target striker', job: 'Occupy defenders alone, hold up long balls, and buy time for runners' },
        { role: 'Central midfield trio', job: 'Outnumber opposing midfields and shield the defence' },
      ],
      strength: 'Owns central midfield and is very hard to break down',
      vulnerability: 'Can become passive and camp too deep with only one outlet',
    },
    funFacts: [
      'The 4-5-1 became a staple of European away performances in the 2000s, when packing midfield was the accepted way to survive on the road.',
      'Rafael Ben\u00edtez\u2019s Liverpool used a disciplined 4-5-1 on the run to the 2005 Champions League title, including the famous comeback in Istanbul.',
      'Ben\u00edtez\u2019s version was really a 4-2-3-1 in disguise — Steven Gerrard was pushed up behind the striker rather than sitting in a flat five.',
    ],
  },
  '4-2-2-2': {
    coreIdeas: {
      inPossession: 'A box midfield: two holders behind two free-roaming creators',
      outOfPossession: 'Narrow 4-4-2 that concedes the flanks to protect the middle',
      principles: [
        'Width comes almost entirely from the full-backs bombing forward',
        'The two attacking midfielders live in the half-spaces, never wide',
        'Vertical passing through the box of four midfielders breaks lines quickly',
        'The strike pair stays central to finish the moves the box creates',
      ],
      keyRoles: [
        { role: 'Attacking mid pair', job: 'Roam the half-spaces, combine through the centre, and slide passes to the strikers' },
        { role: 'Full-backs', job: 'Supply every inch of width — the shape fails if they cannot get forward' },
      ],
      strength: 'Overloads the centre and creates fast vertical combinations',
      vulnerability: 'Huge spaces behind the full-backs on the counter',
    },
    funFacts: [
      'The 4-2-2-2 with its "magic square" midfield is a Brazilian and South American classic, associated with Tel\u00ea Santana\u2019s beloved 1982 Brazil side.',
      'Ralf Rangnick championed a pressing version of the 4-2-2-2 at Hoffenheim and RB Leipzig, using the narrow front four to hunt central turnovers.',
      'Where the Brazilian original was built for artistry on the ball, Rangnick\u2019s version weaponised the same shape against the ball, cutting the pitch in half to force mistakes.',
    ],
  },
  '4-3-1-2': {
    coreIdeas: {
      inPossession: 'Narrow diamond-like attack with the ten feeding a strike pair',
      outOfPossession: 'The ten drops onto the opposition pivot to form a tight 4-4-2 diamond block',
      principles: [
        'All width comes from the full-backs; the midfield stays narrow by design',
        'The number ten operates in the pocket behind two strikers',
        'The midfield three rotates to cover the flanks when full-backs push on',
        'Central overloads and quick one-twos are the route to goal',
      ],
      keyRoles: [
        { role: 'Number ten', job: 'Play the final pass between two strikers making opposite movements' },
        { role: 'Full-backs', job: 'Deliver the width the narrow midfield deliberately gives up' },
      ],
      strength: 'Outnumbers almost any midfield centrally',
      vulnerability: 'Exposed in wide areas if the full-backs are pinned back',
    },
    funFacts: [
      'The 4-3-1-2 is a staple of Italian football, where narrow midfields and playmakers in the hole have a long tradition.',
      'Carlo Ancelotti used a 4-3-1-2 at Juventus and early AC Milan, before famously bending his systems around the players available.',
      'Ancelotti\u2019s twist at Milan was dropping the playmaker to the base instead of the hole — moving Andrea Pirlo deep created the modern deep-lying playmaker role.',
    ],
  },
  '4-3-2-1': {
    coreIdeas: {
      inPossession: 'Two trequartistas float behind a lone striker in a narrow "tree" shape',
      outOfPossession: 'The two tens tuck in to clog the centre in a compact 4-5-1',
      principles: [
        'Width comes only from full-backs and midfield shuttlers stepping wide',
        'The two attacking mids overload the space in front of the opposition pivot',
        'The striker pins the centre-backs so the tens receive facing goal',
        'Patient central combinations rather than crosses create the chances',
      ],
      keyRoles: [
        { role: 'Twin playmakers', job: 'Share the creative burden and interchange so neither can be man-marked' },
        { role: 'Lone striker', job: 'Occupy the whole back line and finish moves built through the middle' },
      ],
      strength: 'Almost impossible to defend the two floating creators with a standard back four',
      vulnerability: 'Very narrow — teams that switch play quickly can pull it apart',
    },
    funFacts: [
      'The 4-3-2-1 is nicknamed the "Christmas tree" for its tapering rows of four, three, two and one.',
      'Carlo Ancelotti\u2019s AC Milan made the shape famous in the mid-2000s, fitting Kak\u00e1, Seedorf and Rui Costa into the same side on the way to Champions League finals.',
      'Ancelotti adopted the tree partly out of pragmatism — it was less a tactical ideal than the only geometry that let all his playmakers coexist.',
    ],
  },
  '4-3-3 Attack': {
    coreIdeas: {
      inPossession: 'An aggressive 2-3-5 with both eights and both wingers in the final third',
      outOfPossession: 'Immediate counter-press; the shape gambles on winning the ball high',
      principles: [
        'Wingers stay pinned to the last line to threaten in behind constantly',
        'Both eights attack the box while the pivot holds the centre alone',
        'Full-backs step into midfield or underlap rather than staying home',
        'Losing the ball triggers a five-second swarm to win it back',
      ],
      keyRoles: [
        { role: 'Advanced eights', job: 'Arrive in the box as extra attackers, effectively creating a front five' },
        { role: 'Lone pivot', job: 'Sweep up counters alone — the most exposed job on the pitch' },
      ],
      strength: 'Overwhelms deep blocks with sheer numbers in the final third',
      vulnerability: 'One missed press leaves the pivot and centre-backs on an island',
    },
    funFacts: [
      'The attacking 4-3-3 with high eights is the signature of Jürgen Klopp\u2019s Liverpool and Pep Guardiola\u2019s Manchester City, the sides that defined the Premier League\u2019s late-2010s duopoly.',
      'Klopp\u2019s version pushed both full-backs into playmaking roles, with Trent Alexander-Arnold and Andy Robertson leading the team\u2019s assist charts.',
      'Unlike the patient textbook 4-3-3, Klopp\u2019s "heavy metal" interpretation treated the counter-press itself as the playmaker, creating chances from turnovers rather than build-up.',
    ],
  },
  '3-4-3': {
    coreIdeas: {
      inPossession: 'Three builders at the back, wing-backs as the width, a fluid front three',
      outOfPossession: '5-4-1 as the wing-backs drop to make a back five',
      principles: [
        'All width comes from the two wing-backs, who must cover the full touchline',
        'The back three splits wide to bait and then bypass the first press',
        'The two central midfielders screen and switch play from side to side',
        'The wide forwards play inside, between full-back and centre-back',
      ],
      keyRoles: [
        { role: 'Wing-backs', job: 'Own an entire flank each, defending like full-backs and attacking like wingers' },
        { role: 'Central striker', job: 'Link the two inside forwards and pin the middle centre-back' },
      ],
      strength: 'Extra man in build-up plus genuine width high up the pitch',
      vulnerability: 'Wing-backs caught upfield leave a slow back three exposed wide',
    },
    funFacts: [
      'The 3-4-3 has deep Dutch roots — Johan Cruyff used a diamond-midfield version at Barcelona to free an extra attacker.',
      'Antonio Conte revived the back-three 3-4-3 at Chelsea in 2016-17, switching mid-season and then winning 13 straight league games.',
      'Conte\u2019s version was more defensive than Cruyff\u2019s ideal: his wide forwards tucked in to form a 5-4-1 without the ball, prioritising the clean sheet over constant attack.',
    ],
  },
  '3-4-1-2': {
    coreIdeas: {
      inPossession: 'A ten knits play between wing-back width and a central strike pair',
      outOfPossession: '5-3-2 with the ten dropping onto the opposition pivot',
      principles: [
        'Wing-backs supply all the width so the front three can stay central',
        'The number ten finds pockets behind the strikers\u2019 pinning runs',
        'The two central midfielders stay home to protect the back three',
        'Diagonal balls from the wide centre-backs find wing-backs in stride',
      ],
      keyRoles: [
        { role: 'Number ten', job: 'Operate in the pocket between the lines and feed two strikers' },
        { role: 'Outside centre-backs', job: 'Step out with the ball and defend the channels behind the wing-backs' },
      ],
      strength: 'Strike pair plus a ten gives constant central threat',
      vulnerability: 'Only two central midfielders behind an aggressive front three',
    },
    funFacts: [
      'The 3-4-1-2 flourished in Serie A in the late 1990s and 2000s, when back-three systems remained mainstream in Italy long after they faded elsewhere.',
      'Carlo Ancelotti fielded a 3-4-1-2 at Parma in the late 1990s, famously struggling to fit an unwilling Gianfranco Zola into its rigid roles.',
      'Ancelotti later called that rigidity a lesson — his mature teams bent the system to the players, the opposite of his Parma years.',
    ],
  },
  '3-4-2-1': {
    coreIdeas: {
      inPossession: 'Two free eights/tens float behind a lone striker, wing-backs stay wide',
      outOfPossession: 'A 5-4-1 block with the two tens tucking in beside the pivots',
      principles: [
        'Width from wing-backs; the two attacking mids live in the half-spaces',
        'The striker pins the central defender so the tens receive facing goal',
        'The back three plus double pivot form a secure five-man rest defence',
        'Third-man combinations through the half-spaces unlock deep blocks',
      ],
      keyRoles: [
        { role: 'Twin number tens', job: 'Interchange across both half-spaces to overload either flank' },
        { role: 'Double pivot', job: 'Recycle possession and snuff out counters before they start' },
      ],
      strength: 'Half-space overloads with a very secure base behind them',
      vulnerability: 'Lone striker can be starved if the tens are tracked',
    },
    funFacts: [
      'The 3-4-2-1 became one of Europe\u2019s most fashionable shapes in the late 2010s, blending the security of a back five with two free creators.',
      'Thomas Tuchel switched Chelsea to a 3-4-2-1 on arrival in January 2021 and won the Champions League with it four months later.',
      'Tuchel\u2019s version was defined by its rest defence — the back three and double pivot barely crossed halfway, which is why that Chelsea conceded just twice in the knockout rounds.',
    ],
  },
  '3-5-2': {
    coreIdeas: {
      inPossession: 'A midfield five dominates the centre while wing-backs stretch the pitch',
      outOfPossession: '5-3-2 with the wing-backs completing a back five',
      principles: [
        'Width comes exclusively from the wing-backs on both flanks',
        'Three central midfielders control tempo and win second balls',
        'The strike pair splits the centre-backs and attacks crosses together',
        'The spare centre-back steps into midfield with the ball',
      ],
      keyRoles: [
        { role: 'Wing-backs', job: 'Sprint the full length of the flank all game — the engine of the system' },
        { role: 'Central midfield trio', job: 'Outnumber opponents in the middle and feed the wing-backs\u2019 runs' },
      ],
      strength: 'Numerical superiority in central midfield and at the back',
      vulnerability: 'Slow wing-backs turn it into a passive 5-3-2 with no width',
    },
    funFacts: [
      'Carlos Bilardo\u2019s Argentina popularised the 3-5-2 at the 1986 World Cup, building the midfield five around Diego Maradona.',
      'Antonio Conte turned Juventus into a 3-5-2 machine from 2011, going unbeaten in Serie A in his first season with the shape.',
      'Conte\u2019s twist on Bilardo\u2019s original was the regista: instead of a destroyer at the base, Andrea Pirlo conducted the entire game from the deepest midfield slot.',
    ],
  },
  '3-1-4-2': {
    coreIdeas: {
      inPossession: 'The anchor links a back three to an aggressive line of four behind two strikers',
      outOfPossession: 'The midfield four drops beside the anchor to form a 5-3-2 or flat block',
      principles: [
        'Width from the wide midfielders pushing on like advanced wing-backs',
        'The single pivot connects defence to attack and covers both half-spaces',
        'The interior midfielders make runs beyond the strikers',
        'High pressing from the front six pins opponents in their own half',
      ],
      keyRoles: [
        { role: 'Anchor', job: 'Alone at the base — screens, circulates, and reads every counter' },
        { role: 'Interior midfielders', job: 'Arrive beyond the strike pair to turn a front two into a front four' },
      ],
      strength: 'Ferocious pressing structure with runners from everywhere',
      vulnerability: 'Enormous physical demands; gaps appear as legs tire',
    },
    funFacts: [
      'The 3-1-4-2 is closely associated with Marcelo Bielsa, whose sides at Athletic Bilbao and Leeds pressed man-for-man from this aggressive base.',
      'Bielsa\u2019s famous rule was the spare man: he switched between a back four and back three depending on how many strikers the opponent fielded.',
      'Unlike the containing back-three systems of Italian tradition, Bielsa\u2019s version used the shape to chase the ball — his Leeds side routinely posted the league\u2019s highest running numbers.',
    ],
  },
  '5-3-2': {
    coreIdeas: {
      inPossession: 'Wing-backs release while a back three plus midfield trio keep a safe base',
      outOfPossession: 'A disciplined five-man defensive line with three screeners in front',
      principles: [
        'Width comes from the wing-backs choosing their moments to push on',
        'The back five defends the width of the box; wide areas are conceded early',
        'The midfield three blocks central passing lanes before defending flanks',
        'Long diagonals and the strike pair\u2019s channel runs spring counters',
      ],
      keyRoles: [
        { role: 'Middle centre-back', job: 'Organise the line, sweep behind, and start attacks with line-breaking passes' },
        { role: 'Strike pair', job: 'Stay connected on counters — one holds the ball, one runs the channel' },
      ],
      strength: 'Extremely solid central defensive block',
      vulnerability: 'Sits deep by nature and can struggle to get out',
    },
    funFacts: [
      'The 5-3-2 with a sweeper carried West Germany to the 1990 World Cup, with Franz Beckenbauer coaching the shape he had once defined as a player.',
      'The modern zonal 5-3-2 owes much to Antonio Conte\u2019s Italy at Euro 2016, which outperformed far more talented squads with drilled defensive choreography.',
      'Where the classic version used a libero sweeping behind man-markers, Conte\u2019s flat back five defends space zonally — the sweeper role has effectively moved to the goalkeeper.',
    ],
  },
  '5-4-1': {
    coreIdeas: {
      inPossession: 'Direct balls to the lone striker with wing-backs joining when safe',
      outOfPossession: 'Two deep banks of five and four — the classic low block',
      principles: [
        'Deny space in behind first; the line only steps up on clear triggers',
        'Wide midfielders double up with wing-backs against dangerous wingers',
        'The striker defends the front zone alone and starts every counter',
        'Set pieces and long throws are treated as first-class scoring routes',
      ],
      keyRoles: [
        { role: 'Lone striker', job: 'Chase alone, hold the ball under pressure, and win the free-kicks that matter' },
        { role: 'Wide midfielders', job: 'Sprint 80 metres both ways to link the block to the counter' },
      ],
      strength: 'Nine players behind the ball make clear chances rare',
      vulnerability: 'Almost no presence in attack; one goal down can mean chasing shadows',
    },
    funFacts: [
      'The 5-4-1 low block is the great equaliser of knockout football, the default shape for underdogs protecting a result.',
      'Diego Simeone\u2019s Atl\u00e9tico Madrid have dropped into a 5-4-1 for famous Champions League defences, though their base shape remains a 4-4-2.',
      'The purest version may be Greece at Euro 2004 under Otto Rehhagel, who mixed the deep block with old-fashioned man-marking — and won the whole tournament with it.',
    ],
  },
  '5-2-3': {
    coreIdeas: {
      inPossession: 'A front three stays high while wing-backs turn the five into a three',
      outOfPossession: '5-2-3 press or a 5-4-1 as the wide forwards drop onto wing-backs',
      principles: [
        'The front three press high while the back five keeps insurance behind',
        'Width in attack comes from wing-backs underlapping the wide forwards',
        'The two pivots must cover the whole central corridor between the lines',
        'Fast counters release the front three the instant the ball is won',
      ],
      keyRoles: [
        { role: 'Wide forwards', job: 'Counter-attack from high positions and trap the opposition build-up' },
        { role: 'Double pivot', job: 'Hold the huge middle zone alone — positioning must be perfect' },
      ],
      strength: 'Combines a back-five safety net with a genuine front-three counter threat',
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
      inPossession: 'The ten links a lone striker to a midfield three breaking forward',
      outOfPossession: 'A 5-3-2-style block with the ten screening the opposition pivot',
      principles: [
        'The back five and midfield three form the block; the front two stay for counters',
        'The number ten is the out-ball — every clearance looks for his feet',
        'Wing-backs join attacks only when the counter is clearly on',
        'The striker runs channels to drag defenders from the ten\u2019s pocket',
      ],
      keyRoles: [
        { role: 'Number ten', job: 'Turn survival into counters by carrying or releasing the first pass' },
        { role: 'Middle centre-back', job: 'Command the deepest line and keep the block connected' },
      ],
      strength: 'Deep-block security with a genuine creative outlet on the counter',
      vulnerability: 'The front two can be starved for entire halves',
    },
    funFacts: [
      'The 5-3-1-1 is a favourite tournament shape for underdogs who still want a playmaker on the pitch rather than a pure front two.',
      'It shares DNA with the sweeper systems of 1990s international football, where a libero played behind man-markers and a fantasista floated in front.',
      'Unlike the flat 5-4-1, the 5-3-1-1 concedes one defensive body to keep the ten high — a bet that one moment of creativity outweighs an extra man in the block.',
    ],
  },
  '4-2-4': {
    coreIdeas: {
      inPossession: 'Four permanent attackers stretched across the last line',
      outOfPossession: 'Wingers drop reluctantly into a 4-4-2; the middle stays light',
      principles: [
        'Two wingers and two strikers pin the entire opposition back four',
        'The two central midfielders must dominate their duels — there is no help',
        'Get the ball forward early; the shape is built for the final third',
        'Full-backs stay honest to avoid total exposure on the counter',
      ],
      keyRoles: [
        { role: 'Wingers', job: 'Beat their man one-v-one and deliver — the whole shape feeds them' },
        { role: 'Central midfield pair', job: 'Cover the biggest midfield workload in football, two against three or more' },
      ],
      strength: 'Overwhelming attacking presence in the final third',
      vulnerability: 'A two-man midfield is a permanent numerical crisis',
    },
    funFacts: [
      'The 4-2-4 was developed in Brazil and Hungary in the 1950s and swept the world after Brazil won the 1958 World Cup with it.',
      'Brazil\u2019s 1970 side nominally lined up in a 4-2-4 built around Pel\u00e9, though its stars interchanged so freely the numbers barely mattered.',
      'The textbook 4-2-4 relied on one winger dropping back in defence to make a 4-3-3 — Mário Zagallo performed exactly that shuttle in 1958 before later coaching the 1970 team.',
    ],
  },
  '4-1-2-1-2': {
    coreIdeas: {
      inPossession: 'A full midfield diamond: anchor, two shuttlers, and a ten behind two strikers',
      outOfPossession: 'The diamond shifts as a unit to clog the middle; flanks are conceded',
      principles: [
        'All width comes from the full-backs — the diamond never leaves the centre',
        'The anchor covers behind while the shuttlers press the wide zones',
        'The ten plays the final pass between two strikers on opposite movements',
        'Overloading the centre creates four-v-three against any midfield trio',
      ],
      keyRoles: [
        { role: 'Tip of the diamond', job: 'Create everything from the pocket behind the strikers' },
        { role: 'Base of the diamond', job: 'Protect the back four alone and switch play to the free full-back' },
      ],
      strength: 'Total central control with a strike pair to finish it',
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
      inPossession: 'A ten connects the double pivot to a fixed front three',
      outOfPossession: '4-4-1-1 as the wingers drop and the ten shadows the pivot',
      principles: [
        'The wingers stay high and wide to isolate defenders one-v-one',
        'The ten floats behind the striker as the free man between the lines',
        'The double pivot gives cover so both full-backs can overlap',
        'Quick vertical passes through the ten release the front three early',
      ],
      keyRoles: [
        { role: 'Number ten', job: 'Receive between the lines and slide passes into three runners' },
        { role: 'Centre-forward', job: 'Pin the back line so the ten and wingers attack space, not bodies' },
      ],
      strength: 'A stable base with four players permanently dedicated to attack',
      vulnerability: 'The ten and pivot pair can be bypassed by teams that play around the block',
    },
    funFacts: [
      'The 4-2-1-3 is best understood as a 4-2-3-1 with the wide men pushed all the way up into a true front three.',
      'Jos\u00e9 Mourinho\u2019s treble-winning Inter of 2010 often took this staggered form, with Wesley Sneijder behind a three of Eto\u2019o, Milito and Pandev.',
      'Mourinho\u2019s twist was asking his wide forwards to defend like full-backs in the biggest games — Eto\u2019o famously spent the Champions League semi-final at Camp Nou defending the right flank.',
    ],
  },
  '4-4-2 Diamond': {
    coreIdeas: {
      inPossession: 'A narrow diamond feeds two strikers; full-backs supply the width',
      outOfPossession: 'The diamond compresses the centre and shepherds play wide',
      principles: [
        'The base screens, the wide shuttlers press, the tip creates',
        'Full-backs must attack in pairs of moments — one goes, one holds',
        'The strike pair makes opposite movements: one to feet, one in behind',
        'Winning the central overload matters more than defending the flanks',
      ],
      keyRoles: [
        { role: 'Tip of the diamond', job: 'The chief creator, playing between the lines with both strikers as targets' },
        { role: 'Strike partnership', job: 'Stretch the defence vertically so the diamond has room to combine' },
      ],
      strength: 'Central overloads plus a genuine front two',
      vulnerability: 'Wide areas are permanently under-defended',
    },
    funFacts: [
      'The diamond 4-4-2 has been a recurring answer to fitting two strikers and a playmaker into one team without sacrificing midfield numbers.',
      'Carlo Ancelotti\u2019s AC Milan used the diamond to reach three Champions League finals in five seasons during the 2000s.',
      'Unlike the flat 4-4-2\u2019s wing play, the diamond deliberately abandons the flanks — Milan\u2019s only width came from Cafu and Serginho charging forward from full-back.',
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
};
