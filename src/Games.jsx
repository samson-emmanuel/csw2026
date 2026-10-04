import { useState } from 'react'

// Game rules — entries with `official: true` are the organisers' rules; the others are DRAFT wording
const GAMES = [
  {
    id: 'jollof', n: 1, name: 'Jollof Wars', ic: '🍛', c: '#d62d1f', official: true,
    tag: 'Describe-the-word card game',
    intro: 'Goal: get your team to say the words on the card. Get through as many cards as possible in 60 seconds.',
    setup: [
      'Play in the four CSW teams: Trailblazers, Pathfinders, Pacesetters and Milestones.',
      'Choose a colour to play and shuffle the cards. The colour you choose determines how you play the game, as each colour has its own rules.',
    ],
    modes: [
      ['Green', '#1f9d55', 'Describe the words by explaining them any way you like.'],
      ['White', '#ffffff', 'Describe the words using no more than 5 words.'],
      ['Red', '#d62d1f', 'Describe the words using 1 word and gestures.'],
      ['Yellow', '#ecbc40', 'Describe the words by singing or rapping (it’s okay if you don’t have a great voice or rhythm).'],
    ],
    rules: [
      'You can only describe the word using the rules for the colour you’re playing (for example, you can’t use gestures when playing Green, White or Yellow).',
      '“Fillers” (um, uh, er, ah, like, okay, right, you know, and so on) aren’t included in the word count when you play White or Red.',
      'You can’t say the word or use any part of the word when describing it.',
      'You can’t use “sounds like” or “opposite of”, or abbreviations of the word (like “FB” for football).',
      'You can’t describe the word using another language.',
      'A slash ( / ) on any card means “or”, so any of the listed words is acceptable. For example, for the card “Chale/Friend”, either word earns points.',
      'You must attempt to describe each word on a card before moving to the next. Once you move to a new word on the card, you cannot go back.',
    ],
  },
  {
    id: 'gidi', n: 2, name: 'Gidi Words', ic: '🗣️', c: '#073485', official: true,
    tag: 'Hint-giving word game',
    intro: 'Get your teammates to say the Gidi Word on the card, without using any of the five Forbidden Words underneath it.',
    sections: [
      ['How to play', [
        'Play in the four CSW teams: Trailblazers, Pathfinders, Pacesetters and Milestones. Teams take turns in that order.',
        'The team whose turn it is selects a player as hint giver, while the next team in the order plays the regulator. The regulating team sits beside or behind the hint giver so they can see the cards as they are played. They raise alarms (by saying “FORBIDDEN” or any other agreed means) when the Rules for Hints are broken.',
        'The hint giver’s teammates are not allowed to see the cards. They sit opposite their hint giver, waiting to shout out their answers to the hints.',
        'There are two sets of Gidi Words on each card: the green outline (easier) and the black outline (harder). Teams must be consistent during each game round, so all four teams play either the green outline or the black outline for that round.',
        'The hint giver draws a card and looks at it. The word at the top is the Gidi Word, which the hint giver tries to get their teammates to say. The five words below it are the Forbidden Words, which the hint giver cannot say while giving hints.',
        'As soon as the first card is drawn, the regulating team starts timing one minute (with a minute glass or stopwatch). The hint giver then gives hints to make teammates say the Gidi Word. Hints may be detailed sentences, phrases or single words, and must follow the Rules for Hints.',
        'As the hint giver gives hints, their teammates shout out possible words and phrases, trying to say the Gidi Word.',
        'After a hint giver completes a turn, the next team chooses its hint giver, and the team after that becomes the regulator.',
        'Teams keep rotating until every player has had a turn as hint giver. If a team has fewer players than the others, one of its players is the hint giver again so every team gets the same number of turns.',
      ]],
      ['Rules for hints', [
        'You are not allowed to mention the Gidi Word or the Forbidden Words.',
        'The game is played in English or Pidgin English.',
        'You can’t translate a Gidi Word or Forbidden Word into any other language. For example, you can’t use “bia” as a hint for “come”, “aboki” for “friend”, or “pele” for “sorry”.',
        'No form or part of any word can be given as a hint. For example, “aero” or “plane” can’t be a hint for AEROPLANE, “enjoy” for ENJOYMENT, or “sang” for SING.',
        'No sound effects can be made (for example gunshots or animal sounds).',
        'You can sing a song or dance as a description, but don’t mention the Gidi Word or Forbidden Words while doing so.',
        'You can’t say the Gidi Word or a Forbidden Word “rhymes with” or “sounds like” another word.',
        'No abbreviations or initials can be given if the words they stand for are on the card. For example, “VP” can’t be used if VICE or PRESIDENT is on the card, and you can’t say “African Independent Television” if AIT is on the card.',
      ]],
      ['Scoring a point', [
        'Each time a teammate shouts out a correct Gidi Word, the hint giver’s team scores a point. The number of Gidi Words guessed correctly within the minute is the number of points the hint giver earns for the team.',
        'The hint giver gets a point each time there is a false alarm against them for breaking the Rules for Hints, and the card in play is added to the completed cards.',
      ]],
      ['Losing a point', [
        'Hint givers can lose points in two ways: by breaking a Rule for Hints, and by passing on a card. All points lost are awarded to the regulating team.',
        'Passing on a card: the hint giver may choose to pass and not play a card at any time during their turn. Each pass gives the regulating team a point.',
      ]],
      ['Regulating your opponent', [
        'During the hint giver’s turn, the regulating team watches the hint giver and the cards. If a Forbidden Word is mentioned or any Rule for Hints is broken, they raise an alarm.',
        'If the alarm is valid, the regulating team gets an extra point. If the alarm is false, the hint giver’s team gets the point automatically.',
        'Remember, you’re racing against time: it may be better to pass than to spend a long time on a card you’re clueless about.',
      ]],
      ['Winning the game', [
        'When all players have had one turn as hint giver (or all four teams have had the same number of turns), the points are totalled. The team with the most points wins.',
        'In case of a tie, each tied team chooses its best hint giver to take one more turn and decide the winner.',
      ]],
    ],
  },
  {
    id: 'naija', n: 3, name: 'How Nigerian Are You?', ic: '🇳🇬', c: '#0f6b3c', official: true,
    tag: 'Nigeria quiz with hammer questions',
    intro: 'Answer as many questions about Nigeria as you can in 60 seconds, and watch out for the HAMMER!',
    setup: [
      'Play in the four CSW teams: Trailblazers, Pathfinders, Pacesetters and Milestones.',
      'Shuffle the cards. You can mix all three colours or play one colour at a time.',
      'Choose an independent reader for the game (or one per team). The independent reader(s) must be fair at all times.',
      'Choose one independent scorekeeper and one independent timekeeper. (These are great roles for people who want to learn more about Nigeria.) Give the notepad and pencil to the scorekeeper.',
    ],
    modes: [
      ['History', '#2563eb', 'Blue cards.'],
      ['Culture & Destinations', '#ecbc40', 'Yellow cards.'],
      ['Entertainment', '#ffffff', 'White cards.'],
    ],
    sections: [
      ['Music questions', [
        'Due to copyright laws, lyrics to musical questions are not provided. The independent reader confirms accuracy (close enough is acceptable).',
        'Readers who are unsure of an answer can take guidance from the players. If the players can’t agree, stop the timer by laying it on its side so the reader can look up the lyrics online.',
      ]],
      ['Time', [
        'Each player has 60 seconds for each round of questions. Once a player from one team finishes a 60-second round, a player from the next team goes (Trailblazers → Pathfinders → Pacesetters → Milestones), and so on until the game ends. On average, a player gets through 3–5 questions per round.',
        'Time starts when the independent reader starts reading the first question. Don’t read the hints unless the player asks for them.',
        'A player may delegate one question per round to a team member. You can’t ask who knows the answer before you delegate.',
      ]],
      ['Hammer questions', [
        'If a hammer question comes up, stop the timer by laying it on its side. The player can then answer the hammer with some or all of their team members.',
        'There are only six hammer questions in the game. (Good luck!) Once the team finishes the hammer, turn the timer back up to continue the round.',
        'Hammer questions are labelled “HAMMER!” at the top.',
      ]],
    ],
  },
  {
    id: 'lyrics', n: 4, name: 'Complete the Lyrics', ic: '🎤', c: '#e09a00', official: true,
    tag: 'Think you know music? Prove it.',
    intro: 'Sing, shout and race against the clock! Compete in teams to complete as many lyrics as you can in 45 seconds.',
    setup: [
      'Play in the four CSW teams: Trailblazers, Pathfinders, Pacesetters and Milestones.',
      'Pick a Game Master (not part of a team). They keep time, track scores and judge answers.',
      'Choose a theme, or shuffle all the cards for a mix.',
      'Decide which of the four teams goes first. If you can’t agree, play rock-paper-scissors!',
    ],
    modes: [
      ['Afrobeats', '#ffffff', 'White cards.'],
      ['Throwback', '#7a3e1d', 'Brown cards.'],
      ['International', '#f08a24', 'Orange cards.'],
    ],
  },
]
const GENERAL = [
  'Timed rounds can be run on the challenge timer shown on the Scoreboard.',
  'The host’s decision is final.',
  'Scores update live on the Scoreboard after every round.',
  'Play fair, cheer loud and go the extra mile!',
]

export function Games() {
  const [tab, setTab] = useState(GAMES[0].id)
  const g = GAMES.find((x) => x.id === tab)
  return (
    <>
      <section className="hero small">
        <p className="eyebrow">Inter-Team Games</p>
        <h1>Know the <em>Rules</em></h1>
        <p className="lead">Four games, four teams, one champion. Tap a game to read how it’s played.</p>
      </section>
      <section className="wrap gm">
        <div className="gm-tabs" role="tablist">
          {GAMES.map((x) => (
            <button key={x.id} role="tab" aria-selected={tab === x.id} className={tab === x.id ? 'on' : ''} style={{ '--c': x.c }} onClick={() => setTab(x.id)}>
              <i>{x.ic}</i><span><small>Game {x.n}</small>{x.name}</span>
            </button>
          ))}
        </div>
        <article key={g.id} className="gm-card" style={{ '--c': g.c }}>
          <header><span className="gm-ic">{g.ic}</span><div><small>Game {g.n} · {g.tag}</small><h2>{g.name}</h2></div></header>
          <p className="gm-intro">{g.intro}</p>
          {g.setup && <div className="gm-block"><h3>Set up</h3><ol>{g.setup.map((h) => <li key={h}>{h}</li>)}</ol></div>}
          {g.modes && (
            <div className="gm-block"><h3>{g.id === 'jollof' ? 'Colours' : 'Card colours'}</h3>
              <div className="gm-modes">{g.modes.map(([m, mc, d]) => <div key={m} className="gm-mode" style={{ '--m': mc }}><b>{m}</b><p>{d}</p></div>)}</div>
            </div>
          )}
          {g.rules && <div className="gm-block"><h3>Game rules</h3><ol>{g.rules.map((h) => <li key={h}>{h}</li>)}</ol></div>}
          {g.sections?.map(([h, items]) => <div key={h} className="gm-block"><h3>{h}</h3><ol>{items.map((x) => <li key={x}>{x}</li>)}</ol></div>)}
          {g.how && (
            <div className="gm-cols">
              <div><h3>How to play</h3><ol>{g.how.map((h) => <li key={h}>{h}</li>)}</ol></div>
              <div><h3>Scoring</h3><ul className="gm-score">{g.score.map((h) => <li key={h}>{h}</li>)}</ul></div>
            </div>
          )}
        </article>
        <div className="gm-general"><h3>For every game</h3><ul>{GENERAL.map((h) => <li key={h}>{h}</li>)}</ul></div>
      </section>
    </>
  )
}
