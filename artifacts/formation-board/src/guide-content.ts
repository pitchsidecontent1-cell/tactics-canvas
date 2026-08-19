// ---------------------------------------------------------------------------
// The Guide: a plain-English reference for someone who has just opened a
// tactics board and does not yet know what a regista is, or why the flag went
// up. Three kinds of entry live here side by side:
//
//   • positions   — the eleven slots on the board, each shown with the shirt
//                   number and initials this app puts on the circle, because
//                   the same role goes by half a dozen names elsewhere
//   • roles/ideas — the jargon that turns up in the write-ups
//   • rules       — offside and the rest of the laws, for readers newer to
//                   the game than to the tactics
//
// Entry ids are stable: they are the anchor the Core Ideas links scroll to,
// so renaming one silently breaks a link. GUIDE_TERMS (bottom of this file)
// is what maps a word in the copy to the entry it opens.
// ---------------------------------------------------------------------------

export type GuideEntry = {
  /** Stable anchor id. Referenced by GUIDE_TERMS — do not rename casually. */
  id: string;
  title: string;
  /** Shirt number and initials as this board writes them, e.g. '6 · DM'. */
  badge?: string;
  /** Other names for the same thing, so a reader can match what they heard. */
  aka?: string;
  summary: string;
  points: string[];
  /** One concrete thing to look for when watching a match. Positions only. */
  watch?: string;
};

export type GuideSection = {
  id: string;
  title: string;
  blurb: string;
  entries: GuideEntry[];
};

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'defence',
    title: 'Goalkeeper and defence',
    blurb:
      'The back of the team. Numbers 1 to 5 in the traditional scheme, and the part of the pitch where a mistake is hardest to hide.',
    entries: [
      {
        id: 'goalkeeper',
        title: 'Goalkeeper',
        badge: '1 · GK',
        aka: 'keeper, GK, number one',
        summary:
          'The only player allowed to handle the ball, and only inside their own penalty area. Modern goalkeeping is two jobs bolted together: stopping shots, and being the first passer of the team.',
        points: [
          'Shot-stopping is the visible half — positioning and angles, and being set before the shot rather than diving late.',
          'Command of the box means claiming crosses and organising the defenders in front, who cannot see behind themselves.',
          'A sweeper-keeper starts high outside the box to cover the space behind a high line, which is what makes an aggressive defensive line possible at all.',
          'Distribution decides how a team builds: a short pass into a centre-back invites the press, a long one skips it entirely.',
        ],
        watch:
          'Watch where the keeper stands when play is at the far end. High up near the edge of the box means the team is defending with a high line.',
      },
      {
        id: 'centre-back',
        title: 'Centre-back',
        badge: '4 · LCB   ·   5 · RCB',
        aka: 'centre-half, CB, centre-backs',
        summary:
          'The two central defenders. They defend the middle of the goal, deal with balls into the box, and increasingly start the attack with the ball at their feet.',
        points: [
          'Defending the space between the two of them matters more than winning individual duels — a gap opened between centre-backs is the most dangerous gap on the pitch.',
          'They hold the defensive line together, stepping up and dropping as a pair so the offside line stays straight.',
          'One is usually the aggressor who follows the striker out, the other the coverer who stays behind and sweeps.',
          'Ball-playing centre-backs beat the first line of the press by carrying the ball forward until an opponent commits to them.',
        ],
        watch:
          'When their team has the ball deep, see how far apart the two split. Wide apart means they are trying to play out; close together means they expect to go long.',
      },
      {
        id: 'full-back',
        title: 'Full-back',
        badge: '2 · RB   ·   3 · LB',
        aka: 'RB, LB, full-backs',
        summary:
          'The wide defenders in a back four. Historically a purely defensive job, now often the widest attacking player on the pitch and, at some clubs, the main source of chances.',
        points: [
          'Defensively they face the winger one against one, and the first duty is to stop the cross and stay goal-side.',
          'In attack they overlap outside the winger to stretch the pitch, or underlap inside to arrive in the box unseen.',
          'How high they push is a team decision, not a personal one: both full-backs high leaves only two defenders behind the ball.',
          'An inverted full-back does the opposite and steps into central midfield instead.',
        ],
        watch:
          'Count how many defenders stay back when the team attacks. Two means both full-backs have gone; three or four means one has been told to stay.',
      },
      {
        id: 'wing-back',
        title: 'Wing-back',
        badge: '2 · RWB   ·   3 · LWB',
        aka: 'wing-backs, RWB, LWB',
        summary:
          'The wide player in a back-five system. A wing-back is a full-back and a winger in one shirt: asked to defend the flank and attack it, covering the entire touchline for ninety minutes.',
        points: [
          'They only exist alongside a back three — the third centre-back is what frees them to push forward.',
          'Out of possession the shape becomes a back five as both wing-backs drop into the defensive line.',
          'In possession they supply all of the team width, which lets the forwards stay narrow and central.',
          'It is the most physically demanding position on the pitch, and the first place a tiring team gets exposed.',
        ],
        watch:
          'Count the defensive line as the other team attacks. If it goes from three to five, you are watching wing-backs drop in.',
      },
      {
        id: 'sweeper',
        title: 'Sweeper',
        aka: 'libero',
        summary:
          'A free defender playing behind the defensive line rather than in it, with no marking assignment — their job is to clear up anything that gets through.',
        points: [
          'Largely extinct since the offside law and the high defensive line made the role redundant, but the vocabulary survives.',
          'The Italian libero, most famously Franco Baresi, was the version with licence to carry the ball forward into midfield.',
          'The modern equivalents are the sweeper-keeper behind a high line, and the spare centre-back in a back three.',
        ],
      },
    ],
  },
  {
    id: 'midfield',
    title: 'Midfield',
    blurb:
      'The engine room. Whoever controls the middle of the pitch usually controls where the game is played.',
    entries: [
      {
        id: 'defensive-midfielder',
        title: 'Defensive midfielder',
        badge: '6 · DM',
        aka: 'holding midfielder, the six, anchor, DM',
        summary:
          'The deepest midfielder, sitting in front of the back four. They screen the space between midfield and defence — the space attacking players most want to receive the ball in.',
        points: [
          'The core job is positional, not physical: stand in the passing lane so the pass into the striker is never on.',
          'They are the pivot the team turns around, receiving from the defenders and setting the direction of play.',
          'A destroyer version breaks play up by tackling; a regista version does it by reading passes and starting attacks.',
          'One defensive midfielder is a single pivot; two sharing the job are a double pivot.',
        ],
        watch:
          'Watch them when their own team attacks. A good six drifts sideways to stay between the ball and their own goal, ready for the counter.',
      },
      {
        id: 'central-midfielder',
        title: 'Central midfielder',
        badge: '8 · CM   ·   LCM   ·   RCM',
        aka: 'the eight, CM, midfielders',
        summary:
          'The all-rounder between the holder and the attacker. They link defence to attack, cover ground in both directions, and are involved in more passes than anyone else on the pitch.',
        points: [
          'A box-to-box eight arrives late in the opposition penalty area, which is the hardest run for a defender to track.',
          'They provide the passing angles that let a team escape pressure — an eight showing for the ball is what makes playing out possible.',
          'Out of possession they press the opposition midfield and stop the ball being turned forward.',
          'Two eights either side of a six is the standard midfield three; a flat pair of eights is a double pivot.',
        ],
        watch:
          'Follow one central midfielder for two minutes rather than the ball. The distance covered is what the position is.',
      },
      {
        id: 'attacking-midfielder',
        title: 'Attacking midfielder',
        badge: '10 · AM',
        aka: 'number ten, playmaker, AM',
        summary:
          'The creator playing between the opposition midfield and defence — the pocket of space no defender is quite responsible for. The job is to receive facing forward and make something happen.',
        points: [
          'Finding space between the lines is the whole skill: they move constantly so no midfielder can pass them on and no defender can step out.',
          'They are judged on the final pass, on chances created and on carrying the ball into dangerous areas.',
          'The classic ten is defensively expensive, which is why many modern teams ask two eights to share the creative work instead.',
          'A trequartista is the version given complete freedom to roam; a shadow striker is the version that runs beyond the forward.',
        ],
        watch:
          'When their team wins the ball, see whether the ten is already turned towards goal. Facing the right way before receiving is what separates them.',
      },
      {
        id: 'wide-midfielder',
        title: 'Wide midfielder',
        badge: '7 · RM   ·   11 · LM',
        aka: 'RM, LM, wide midfielders',
        summary:
          'The wide players in a midfield four. Less advanced than a winger and more defensively responsible: in a 4-4-2 they are the first line of protection for the full-back behind them.',
        points: [
          'Their defensive duty is to tuck in when the ball is on the far side, keeping the midfield four compact.',
          'In attack they hold the touchline to stretch the opposition back four and open the middle.',
          'The difference from a winger is workload and starting position, not dribbling ability.',
          'On this board you can relabel one as RW or LW if you want to play it as a front-foot winger instead.',
        ],
        watch:
          'Look at the far-side wide midfielder when the ball is on the opposite flank. If they are almost in the centre circle, the team is defending compactly.',
      },
    ],
  },
  {
    id: 'attack',
    title: 'Attack',
    blurb:
      'The front line. Fewer touches than anyone else on the pitch, and every one of them judged.',
    entries: [
      {
        id: 'winger',
        title: 'Winger',
        badge: '7 · RW   ·   11 · LW',
        aka: 'wingers, RW, LW, wide forwards',
        summary:
          'A forward who starts on the touchline. The whole point is to take on the full-back one against one, either going outside to cross or inside to shoot.',
        points: [
          'A traditional winger plays on their strong side and goes outside — right foot on the right — to deliver crosses and cut-backs.',
          'An inverted winger plays on the opposite side, cuts inside onto their stronger foot and shoots; Arjen Robben built a career on it.',
          'Staying wide when the ball is elsewhere is an instruction, not laziness: it pins the full-back and stops them helping in the middle.',
          'Modern wingers are also first defenders, pressing the opposition full-back and blocking the pass out.',
        ],
        watch:
          'Watch the first touch after they receive. Outside means a cross is coming; inside means a shot.',
      },
      {
        id: 'striker',
        title: 'Striker',
        badge: '9 · ST',
        aka: 'strikers, ST, number nine',
        summary:
          'The furthest player forward and the one expected to score. Everything else in the position — holding the ball, pressing, running the channels — exists to get them into scoring positions or to make room for someone else.',
        points: [
          'Movement in the box is the craft: attacking the near post, or checking away from a defender before darting back across them.',
          'Running the channel means going into the gap between centre-back and full-back rather than straight at the defender.',
          'Pressing from the front is now part of the job — the striker chooses which side the opposition are allowed to pass to.',
          'Occupying two centre-backs on their own is a service to the team even in a match where they never touch the ball in the box.',
        ],
        watch:
          'When a cross comes in, see whether they attack the near post. Getting there first is usually a decision made three seconds earlier.',
      },
      {
        id: 'centre-forward',
        title: 'Centre-forward',
        badge: '9 · CF   ·   FWD',
        aka: 'CF, centre-forwards, forwards',
        summary:
          'Often used interchangeably with striker. Where a distinction is drawn, the centre-forward is the more complete version: a scorer who also links play, holds the ball up and brings others in.',
        points: [
          'Holding the ball up means receiving with a defender behind you and keeping possession until support arrives.',
          'A target man is the physical version, aiming to win long balls and knock them down for others.',
          'A false nine is the opposite version, dropping into midfield rather than staying on the last defender.',
        ],
      },
      {
        id: 'second-striker',
        title: 'Second striker',
        badge: '10 · SS',
        aka: 'SS, support striker, shadow striker',
        summary:
          'The partner playing just behind the main forward. Half attacking midfielder and half striker: close enough to score, deep enough to find space between the lines.',
        points: [
          'They live in the gap the two centre-backs cannot cover without leaving the main striker free.',
          'It is the classic second half of a strike partnership — one big and one quick, one holding and one running.',
          'A 4-4-1-1 and a 4-3-1-2 are both, in essence, systems built to accommodate this player.',
        ],
        watch:
          'See who picks the ball up when the striker is being marked out of the game. In a front two, that is the second striker doing their job.',
      },
    ],
  },
  {
    id: 'roles',
    title: 'Specialist roles',
    blurb:
      'Not positions on the team sheet but jobs given to a player inside one. Most of these names come from Italian or German and stuck because English had no word for the idea.',
    entries: [
      {
        id: 'false-nine',
        title: 'False nine',
        summary:
          'A centre-forward who drops into midfield instead of staying on the last defender. The centre-backs are left with nobody to mark, and following the forward out opens the space behind them.',
        points: [
          'It creates an overload in midfield: the team has an extra body where the game is being played.',
          'Whoever fills the space the false nine vacated — usually a winger cutting in — is the one who actually scores.',
          'Messi under Guardiola is the defining example, but Hungary were doing it with Nándor Hidegkuti in 1953.',
          'It only works if the wide players attack the box, otherwise the team has nobody in it at all.',
        ],
      },
      {
        id: 'number-ten',
        title: 'Number ten',
        summary:
          'Shorthand for the creative attacking midfielder playing between the opposition midfield and defence. The number and the role became so bound together that the shirt itself came to mean creativity.',
        points: [
          'The same player is called an enganche in Argentina and a fantasista in Italy.',
          'Pressing football squeezed the classic ten out of many teams, because the space they live in stopped existing.',
          'Teams that still play one usually shield them with a double pivot behind.',
        ],
      },
      {
        id: 'regista',
        title: 'Regista',
        summary:
          'Italian for director. A deep-lying playmaker who conducts the game from in front of the defence, choosing the tempo and picking passes rather than making tackles.',
        points: [
          'Andrea Pirlo is the reference point: moved back from attacking midfield by Carlo Ancelotti at Milan, and redefined the position.',
          'The regista needs protection, which is why they usually sit alongside a more physical midfielder.',
          'The tell is the long diagonal switch — a pass that moves the whole opposition shape sideways.',
        ],
      },
      {
        id: 'trequartista',
        title: 'Trequartista',
        summary:
          'Italian for three-quarters, meaning the player who occupies the three-quarter line of the pitch. An attacking playmaker who floats in the pocket behind the strikers with no fixed zone.',
        points: [
          'Freedom is the defining feature: the trequartista is excused positional discipline in exchange for what they create.',
          'It is a luxury role and needs the midfield behind it to cover the ground they do not.',
          'Francesco Totti and Roberto Baggio are the archetypes.',
        ],
      },
      {
        id: 'fantasista',
        title: 'Fantasista',
        summary:
          'Italian for a creative attacking player given complete artistic freedom. Less a position than a licence: the player is trusted to invent, and the team is built to absorb the risk.',
        points: [
          'Overlaps heavily with the trequartista, but describes the player rather than the zone.',
          'The bargain is explicit — no defensive work, in exchange for the moments nobody else can produce.',
        ],
      },
      {
        id: 'raumdeuter',
        title: 'Raumdeuter',
        summary:
          'German for space interpreter, a word Thomas Müller invented for what he does. A forward who finds unmarked pockets by instinct rather than holding a fixed position.',
        points: [
          'There is no drill for it: the player reads where the space will be a second before it appears.',
          'On paper they look like a right winger; in practice they turn up anywhere in the final third.',
          'It only functions in a team disciplined enough to cover the ground they abandon.',
        ],
      },
      {
        id: 'pivot',
        title: 'Pivot — single and double',
        summary:
          'The deepest midfielder or midfielders, the point the team turns around. A single pivot is one player doing that job alone; a double pivot is two sharing it.',
        points: [
          'A single pivot frees an extra body further forward but leaves one player covering the whole width in front of the defence.',
          'A double pivot is more secure and is the standard choice against strong counter-attacking teams.',
          '4-2-3-1 and 4-4-2 use a double pivot; 4-3-3 and 4-1-4-1 use a single one.',
        ],
      },
      {
        id: 'inverted-full-back',
        title: 'Inverted full-back',
        summary:
          'A full-back who steps into central midfield when their team has the ball, rather than overlapping down the touchline.',
        points: [
          'It gives the team an extra central midfielder without picking one, and shortens the distance back to goal if possession is lost.',
          'The width has to come from somewhere else, so it is usually paired with wingers who stay glued to the touchline.',
          'Philipp Lahm under Guardiola at Bayern was the first widely copied version.',
        ],
      },
      {
        id: 'target-man',
        title: 'Target man',
        summary:
          'A physically dominant centre-forward used as an aiming point for long passes. They win the ball in the air, hold it up, and bring runners into the game.',
        points: [
          'It is an escape route as much as an attacking plan: a team under pressure can go long and know the ball will stick.',
          'The knock-down — heading or laying the ball into a supporting runner — is the point of the header, not the header itself.',
        ],
      },
      {
        id: 'box-to-box',
        title: 'Box-to-box midfielder',
        summary:
          'A central midfielder who contributes in both penalty areas: defending crosses at one end and arriving in the box at the other.',
        points: [
          'The late run into the box is the signature — arriving after the defenders have picked up everyone else.',
          'It is an endurance role, and the reason central midfielders top the distance-covered charts.',
        ],
      },
    ],
  },
  {
    id: 'ideas',
    title: 'Tactical ideas',
    blurb:
      'The concepts the write-ups keep returning to. None of them are complicated once the picture is in your head.',
    entries: [
      {
        id: 'pressing',
        title: 'Pressing',
        summary:
          'Actively chasing the ball to win it back, rather than dropping off and waiting. Pressing is done as a group — one player chasing alone just leaves a hole.',
        points: [
          'A press has a trigger: a backwards pass, a heavy touch, or a ball played into a full-back with no options.',
          'Where a team presses defines the style — high press starts in the opposition half, mid press around halfway.',
          'The press is also a way of choosing: by blocking one side, you make the opponent play into the side you have loaded.',
          'It is expensive. A press that fails leaves the team stretched and outnumbered behind the ball.',
        ],
      },
      {
        id: 'counter-press',
        title: 'Counter-press and gegenpressing',
        aka: 'gegenpressing, counter-pressing',
        summary:
          'Pressing the opponent the instant possession is lost, before they can organise. The logic is that a team who has just won the ball is at its most disorganised, so the seconds right after losing it are the best moment to win it back.',
        points: [
          'Jürgen Klopp put it best: the counter-press is the best playmaker, because it wins the ball high up with the opposition out of shape.',
          'It requires the team to already be compact when they lose it, which is why possession structure and counter-pressing are the same subject.',
          'Guardiola drills a six-second rule; if the ball is not won back in that time, the team drops into shape instead.',
        ],
      },
      {
        id: 'high-line',
        title: 'High defensive line',
        summary:
          'Pushing the back four or five up towards halfway, squeezing the pitch so the opposition have less room to play in and the team defends further from its own goal.',
        points: [
          'It compresses the space between the defence and the forwards, which is what makes a press workable.',
          'The cost is the space behind, which is why it needs a fast defence and a goalkeeper who will come out.',
          'It works with the offside law: an opponent who runs early into that space is simply offside.',
        ],
      },
      {
        id: 'low-block',
        title: 'Low block',
        summary:
          'A deep, compact defensive shape camped close to the team own goal. The opposition are allowed the ball in front of it, and denied any space behind or through it.',
        points: [
          'Two banks of four is the classic version: no gaps between the lines, no gaps between the players.',
          'It concedes possession deliberately — the plan is to defend the area that matters and counter from there.',
          'It is beaten by patience, by switching the ball quickly from side to side, and by shots from distance.',
        ],
      },
      {
        id: 'half-space',
        title: 'Half-space',
        summary:
          'The two vertical channels of the pitch between the centre and the wings. It is the most valuable real estate in modern football: wide enough to be unmarked, central enough to shoot and pass in every direction.',
        points: [
          'A player on the touchline can only pass forwards and inwards. A player in the half-space has the whole fan of angles.',
          'Defenders are unsure who picks it up: it is between the full-back and the centre-back, and between the winger and the midfielder.',
          'Inside forwards, eights and inverted wingers all exist to occupy it.',
        ],
      },
      {
        id: 'overload',
        title: 'Overload',
        summary:
          'Creating a numerical advantage in one area — three players against two — so that somebody has to be free.',
        points: [
          'Overload to isolate is the standard trick: crowd one flank, draw the defence across, then switch to the winger left alone on the far side.',
          'It is also what a false nine or an inverted full-back does, by adding a body where the defence has not planned for one.',
        ],
      },
      {
        id: 'transition',
        title: 'Transition',
        summary:
          'The moments right after the ball changes hands, in either direction. Most goals come from these seconds, because neither team is yet in its shape.',
        points: [
          'Attacking transition is the counter-attack: get forward before the opponent reorganises.',
          'Defensive transition is the counter-press or the retreat: buy time and get the shape back.',
          'Coaches often spend more training time on these two moments than on set shapes.',
        ],
      },
      {
        id: 'counter-attack',
        title: 'Counter-attack',
        summary:
          'Attacking at speed straight after winning the ball, while the opponent still has players ahead of the ball and no defensive shape.',
        points: [
          'The first pass forward is the whole thing: play it before the opposition can get bodies back, or the moment is gone.',
          'It is why teams who concede possession on purpose are not necessarily being negative.',
          'The defence against it is rest defence — keeping enough players in covering positions while attacking.',
        ],
      },
      {
        id: 'rest-defence',
        title: 'Rest defence',
        summary:
          'The players who stay back in secure covering positions while their own team attacks. It is what a team looks like at rest, ready for the ball to be lost.',
        points: [
          'A typical rest defence is two centre-backs and the holding midfielder, sometimes with one full-back staying home.',
          'Getting it right is the reason attacking teams do not get counter-attacked to death.',
          'It also sets up the counter-press: bodies near the ball are what make winning it back immediately possible.',
        ],
      },
      {
        id: 'third-man',
        title: 'Third-man run',
        summary:
          'A passing pattern where player A passes to B, and B lays it off to C — the third man — who is arriving into space nobody was marking.',
        points: [
          'It works because defenders track the ball and the receiver, not the player two passes ahead.',
          'It is the standard way of breaking a line of pressure without dribbling through it.',
        ],
      },
      {
        id: 'positional-play',
        title: 'Positional play',
        aka: 'juego de posición, tiki-taka',
        summary:
          'A possession system where the pitch is divided into zones and players occupy set ones, so there is always a passing triangle available. Spanish coaches call it juego de posición.',
        points: [
          'The rules are about spacing: never two players in the same zone, never two on the same line, always an option behind and ahead.',
          'The ball is circulated to move the opposition, not for its own sake — the pass sideways is there to open the pass forward.',
          'Tiki-taka is the popular name for the short-passing version played by Guardiola Barcelona and Spain, a term Guardiola himself dislikes.',
        ],
      },
      {
        id: 'total-football',
        title: 'Total Football',
        summary:
          'The Dutch philosophy in which any outfield player can take up any position, provided a team-mate immediately fills the space they left.',
        points: [
          'Rinus Michels built it at Ajax and the Netherlands; Johan Cruyff carried it to Barcelona as a player and then a coach.',
          'It demands extraordinary fitness and football intelligence, because every player must read every role.',
          'The defence pushed up to halfway to compress the pitch, decades before the modern high line.',
        ],
      },
      {
        id: 'offside-trap',
        title: 'Offside trap',
        summary:
          'A defensive line stepping forward together at the moment a pass is played, so the attacker behind them is caught offside.',
        points: [
          'It is a co-ordination exercise: one defender who steps late leaves everyone else playing the attacker onside.',
          'Arrigo Sacchi Milan drilled it dozens of times a match on a signal, and it defined the era.',
          'Video review made it riskier and more precise at the same time — the margins are now measured in centimetres.',
        ],
      },
      {
        id: 'width-and-compactness',
        title: 'Width and compactness',
        summary:
          'Two sides of the same idea. In possession a team stretches the pitch to make the opponent cover more ground; out of possession it shrinks to leave no space between players.',
        points: [
          'Width is usually supplied by wingers holding the touchline or by full-backs and wing-backs overlapping.',
          'Compact means short distances both ways: between the lines, and between the players in each line.',
          'A team that is compact and narrow concedes the flanks on purpose, because crosses are a lower-value way to score than passes through the middle.',
        ],
      },
      {
        id: 'set-pieces',
        title: 'Set pieces',
        summary:
          'Restarts where the ball is stationary — corners, free kicks and throw-ins in dangerous areas. Around a quarter of goals come from them, and they are increasingly coached by a dedicated specialist.',
        points: [
          'Marking is zonal (defenders guard areas), man-to-man (defenders guard players), or a mixture of both.',
          'Attacking routines are about blocking and timing — creating one free header rather than eleven contested ones.',
          'They are the cheapest source of goals in the game, which is why weaker teams invest in them most.',
        ],
      },
    ],
  },
  {
    id: 'rules',
    title: 'The rules of the game',
    blurb:
      'The seventeen Laws of the Game, written by IFAB, cover everything from the size of the pitch to the length of a player socks. These are the ones that actually come up while watching.',
    entries: [
      {
        id: 'match-basics',
        title: 'The basics of a match',
        summary:
          'Eleven players a side, one of whom is the goalkeeper. Two halves of forty-five minutes plus stoppage time. The team that scores more goals wins; a goal counts when the whole ball crosses the whole goal line.',
        points: [
          'A team drops below seven players — through red cards or injuries with no substitutes left — and the match is abandoned.',
          'The referee is the sole timekeeper and the only one who can end a half.',
          'Two assistant referees run the touchlines, mainly judging offside and who the ball came off.',
          'Kick-off is taken from the centre spot; the ball may now be played in any direction, backwards included.',
        ],
      },
      {
        id: 'offside',
        title: 'Offside',
        summary:
          'The rule that stops attackers from simply waiting next to the goalkeeper. A player is offside if, at the moment a team-mate plays the ball, they are in the opposition half and nearer to the opposition goal line than both the ball and the second-last opponent — and are then involved in the play.',
        points: [
          'The second-last opponent is normally the last outfield defender, because the goalkeeper is usually the last of all. If the keeper has come out, it is the last two defenders that count.',
          'It is judged at the moment the ball is played, not when it is received. Running past a defender after the pass is fine; being past them when it left the foot is not.',
          'Being in an offside position is not an offence on its own. The player has to interfere with play, interfere with an opponent, or gain an advantage from it.',
          'Any part of the body that can legally score counts — so an attacker arm does not play them offside, but a knee or a shoulder does.',
          'You cannot be offside from a throw-in, a corner or a goal kick, nor in your own half, nor level with the second-last opponent.',
          'The punishment is an indirect free kick to the defending side from where the offside player was.',
        ],
        watch:
          'When the flag stays down and play continues, watch the defensive line rather than the attacker — usually one defender has dropped a yard and kept everyone onside.',
      },
      {
        id: 'fouls-and-free-kicks',
        title: 'Fouls and free kicks',
        summary:
          'A foul is a physical offence committed carelessly, recklessly or with excessive force — kicking, tripping, pushing, holding, charging or jumping at an opponent. The restart is a free kick to the other team.',
        points: [
          'A direct free kick can be shot straight into the goal. It is given for physical fouls and for handball.',
          'An indirect free kick has to touch a second player before a goal counts. It is given for offside, dangerous play, obstruction and goalkeeper offences. The referee signals it with an arm held straight up.',
          'Defenders must retreat ten yards, and at many free kicks the attacking team may now ask the referee to enforce that formally.',
          'A foul by the defending team inside their own penalty area that would have been a direct free kick becomes a penalty.',
        ],
      },
      {
        id: 'cards',
        title: 'Yellow and red cards',
        summary:
          'A yellow card is a caution. A red card is a dismissal: the player leaves the pitch and is not replaced, so their team plays the rest of the match a player short.',
        points: [
          'Two yellow cards in one match equal a red — the player is shown a second yellow and then the red.',
          'Yellows are for unsporting behaviour, dissent, persistent fouling, delaying the restart and entering or leaving the field without permission.',
          'Straight reds are for serious foul play, violent conduct, spitting, deliberate handball that denies a goal, and denying an obvious goalscoring opportunity.',
          'If the goalscoring opportunity is denied by an ordinary attempt to play the ball inside the penalty area, the red is softened to a yellow — the so-called triple punishment was removed.',
        ],
      },
      {
        id: 'penalty',
        title: 'Penalty kick',
        summary:
          'Awarded for a direct-free-kick offence committed by the defending team inside their own penalty area. The kick is taken from the penalty spot, twelve yards out, with only the taker and the goalkeeper involved.',
        points: [
          'The goalkeeper must keep at least part of one foot on or in line with the goal line until the ball is kicked.',
          'Every other player must be outside the penalty area, outside the D, and behind the ball until it is struck.',
          'The taker may stutter in the run-up but not once the run-up is finished; the ball must be kicked forward.',
          'If the ball rebounds off the keeper or the post it is live and anyone can score, but the taker cannot touch it twice in a row.',
        ],
      },
      {
        id: 'handball',
        title: 'Handball',
        summary:
          'An offence when a player deliberately touches the ball with hand or arm, and also when an attacking player scores or creates a goal with an accidental one.',
        points: [
          'The arm counts from the bottom of the armpit down. Anything above that is the shoulder, and legal.',
          'Deliberate means moving the hand towards the ball, or making the body unnaturally bigger with it.',
          'The ball coming off a player own body or a nearby team-mate onto their arm is generally not punished.',
          'Goalkeepers may not handle a deliberate back-pass kicked to them by a team-mate, nor a throw-in received directly — the punishment is an indirect free kick.',
        ],
      },
      {
        id: 'throw-in',
        title: 'Throw-in',
        summary:
          'The restart when the ball crosses a touchline. It is given to the team that did not touch it last, and taken from where the ball went out.',
        points: [
          'Both feet must be on or behind the line and on the ground, and the ball must be thrown with both hands from behind and over the head.',
          'A goal cannot be scored directly from a throw-in, and there is no offside from one.',
          'The thrower may not touch the ball again until somebody else has.',
        ],
      },
      {
        id: 'corner-and-goal-kick',
        title: 'Corner and goal kick',
        summary:
          'Both restart the game after the ball crosses a goal line without a goal. Which one depends on who touched it last: the defending team gives a corner, the attacking team gives a goal kick.',
        points: [
          'A corner is taken from inside the quadrant at the nearest corner flag, and a goal can be scored directly from it.',
          'A goal kick is taken from anywhere inside the six-yard box, and the ball is live as soon as it is kicked — it no longer has to leave the penalty area.',
          'Opponents must stay outside the penalty area until a goal kick is taken.',
          'There is no offside from either restart.',
        ],
      },
      {
        id: 'advantage',
        title: 'Advantage',
        summary:
          'The referee may let play continue after a foul if stopping it would help the offending team. The signal is both arms swept forward.',
        points: [
          'If the advantage does not materialise within a few seconds, the referee can pull play back and award the original free kick.',
          'A card owed for the foul is still shown, at the next stoppage.',
        ],
      },
      {
        id: 'added-time',
        title: 'Added time',
        summary:
          'Time added at the end of each half to make up for stoppages — substitutions, injuries, goal celebrations, video reviews and deliberate time-wasting.',
        points: [
          'The fourth official displays a minimum, not a maximum; the referee can and does play beyond it.',
          'Only the referee decides when the half ends, and play cannot stop while a promising attack is in progress.',
        ],
      },
      {
        id: 'substitutions',
        title: 'Substitutions',
        summary:
          'Most competitions now allow five substitutions per team, made in a maximum of three windows so that the game is not repeatedly interrupted, plus half-time.',
        points: [
          'A substituted player cannot return, except in youth and friendly matches where return substitutions are permitted.',
          'The player leaving must exit at the nearest point on the touchline.',
          'An additional substitution is allowed for a suspected concussion, and does not count against the normal limit.',
        ],
      },
      {
        id: 'extra-time-and-shootouts',
        title: 'Extra time and penalty shoot-outs',
        summary:
          'In knockout matches that must produce a winner, a draw is followed by two periods of fifteen minutes, and then by a penalty shoot-out if the scores are still level.',
        points: [
          'Teams get one further substitution during extra time, and a further window in which to make it.',
          'A shoot-out is five kicks each, taken alternately; if still level it goes to sudden death, one pair at a time.',
          'Any player on the pitch at the end of extra time may take one, and both teams must use the same number of takers.',
        ],
      },
      {
        id: 'var',
        title: 'Video review (VAR)',
        summary:
          'A video assistant referee reviews four kinds of decision only: goals, penalty decisions, direct red cards, and cases of mistaken identity. Everything else stands as called.',
        points: [
          'The bar for intervention is a clear and obvious error, not a different opinion.',
          'Factual matters — offside, whether the ball was out — are checked precisely; judgement calls are reviewed on the pitchside monitor by the referee.',
          'Play is rewound to the point of the incident, which is why a goal can be ruled out for something that happened in the build-up.',
        ],
      },
      {
        id: 'the-pitch',
        title: 'The pitch and its markings',
        summary:
          'A rectangle between 100 and 130 yards long and 50 to 100 wide, though international matches are standardised near 115 by 74. Every line belongs to the area it encloses.',
        points: [
          'The penalty area is eighteen yards from each post and eighteen yards deep — the box. Fouls by defenders inside it give penalties, and the goalkeeper may only handle inside it.',
          'The six-yard box marks where goal kicks are taken from.',
          'The penalty spot is twelve yards out, and the arc outside the box — the D — marks ten yards from it.',
          'The halfway line matters for offside; the centre circle marks ten yards for kick-offs.',
          'The ball is only out of play when the whole ball has crossed the whole line, on the ground or in the air.',
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Words in the write-ups that open a guide entry when tapped. Each source is a
// regex fragment, matched case-insensitively on word boundaries and tried in
// this order, so the more specific pattern has to come first — 'wing-backs?'
// before 'backs?' — or the general one swallows it.
// ---------------------------------------------------------------------------

export const GUIDE_TERMS: Array<[source: string, entryId: string]> = [
  ['juego de posición', 'positional-play'],
  ['positional play', 'positional-play'],
  ['tiki-taka', 'positional-play'],
  ['total football', 'total-football'],
  ['inverted full-backs?', 'inverted-full-back'],
  ['counter-press(?:ing|es)?|counterpress(?:ing)?', 'counter-press'],
  ['gegenpress(?:ing)?', 'counter-press'],
  ['half-spaces?', 'half-space'],
  ['false[ -]nine', 'false-nine'],
  ['single pivot', 'pivot'],
  ['double pivot', 'pivot'],
  ['number ten', 'number-ten'],
  ['low block', 'low-block'],
  ['high line|high defensive line', 'high-line'],
  ['rest defence', 'rest-defence'],
  ['third[- ]man', 'third-man'],
  ['trequartistas?', 'trequartista'],
  ['wing-backs?', 'wing-back'],
  ['underlap(?:ping|s)?', 'full-back'],
  ['overlap(?:ping|s)?', 'full-back'],
  ['overload(?:s|ing)?', 'overload'],
  ['fantasistas?', 'fantasista'],
  ['liberos?|sweepers?', 'sweeper'],
  ['registas?', 'regista'],
  ['raumdeuter', 'raumdeuter'],
  ['target[- ]man', 'target-man'],
  ['box[- ]to[- ]box', 'box-to-box'],
  ['offside trap', 'offside-trap'],
  ['offsides?', 'offside'],
  ['set[- ]pieces?', 'set-pieces'],
  ['counter-attack(?:s|ing)?', 'counter-attack'],
  ['transitions?', 'transition'],
  ['pivot', 'pivot'],
  ['goalkeepers?|keepers?', 'goalkeeper'],
  ['centre-backs?|center-backs?|centre-half', 'centre-back'],
  ['full-backs?', 'full-back'],
  ['defensive midfielders?|holding midfielders?', 'defensive-midfielder'],
  ['attacking midfielders?', 'attacking-midfielder'],
  ['central midfielders?|midfielders?', 'central-midfielder'],
  ['wingers?', 'winger'],
  ['centre-forwards?|center-forwards?', 'centre-forward'],
  ['second strikers?', 'second-striker'],
  ['strikers?', 'striker'],
  ['press(?:ing|es)?', 'pressing'],
  ['compact(?:ness)?', 'width-and-compactness'],
  ['width', 'width-and-compactness'],
  ['penalt(?:y|ies)', 'penalty'],
  ['free[- ]kicks?', 'fouls-and-free-kicks'],
  ['corners?', 'corner-and-goal-kick'],
  ['throw-ins?', 'throw-in'],
];

/** Flat lookup of every entry by id, for the jump links. */
export const GUIDE_ENTRY_IDS = new Set(
  GUIDE_SECTIONS.flatMap((section) => section.entries.map((entry) => entry.id)),
);
