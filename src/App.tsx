import { useMemo, useState } from 'react'
import { MATCHES, TEAMS, type Match } from './data'
import { cryptoRng, drawQuarterfinals, drawSwissRound, type Pair, type SwissDraw } from './draw'
import { playedPairs, records, teamsWithRecord, type WL } from './swiss'

const IDS = Object.keys(TEAMS)
const ROLL_MS = 450

type Picks = { [matchIndex: number]: string }

function Logo({ id }: { id: string }) {
  return (
    <span className="logo">
      <img src={`/logos/${id}.webp`} alt="" />
    </span>
  )
}

function TeamCell({ id, rec }: { id: string; rec?: WL }) {
  return (
    <span className="team">
      <Logo id={id} />
      <span className="short">{TEAMS[id].short}</span>
      {rec && <span className="rec">{rec.w}-{rec.l}</span>}
    </span>
  )
}

function MatchRow({ mt, bo3, onPick }: { mt: Match; bo3: boolean; onPick?: (id: string) => void }) {
  const side = (id: string) => {
    const cls = mt.winner ? (mt.winner === id ? 'won' : 'lost') : ''
    return onPick ? (
      <button className={`side pickable ${cls}`} onClick={() => onPick(id)}>
        <TeamCell id={id} />
      </button>
    ) : (
      <span className={`side ${cls}`}>
        <TeamCell id={id} />
      </span>
    )
  }
  return (
    <div className={`match ${onPick && !mt.winner ? 'open' : ''}`}>
      {side(mt.a)}
      <span className="vs">{bo3 ? 'Bo3' : 'Bo1'}</span>
      {side(mt.b)}
    </div>
  )
}

function Dice({ rolling, onClick, label }: { rolling: boolean; onClick: () => void; label: string }) {
  return (
    <button className="dice" onClick={onClick} disabled={rolling}>
      <span className={rolling ? 'die spin' : 'die'}>🎲</span> {label}
    </button>
  )
}

export default function App() {
  const [r4Picks, setR4Picks] = useState<Picks>({})
  const [r5, setR5] = useState<SwissDraw | null>(null)
  const [r5Picks, setR5Picks] = useState<Picks>({})
  const [qf, setQf] = useState<Pair[] | null>(null)
  const [rolling, setRolling] = useState<'r5' | 'qf' | null>(null)

  const matches = useMemo(() => {
    const base = MATCHES.map((mt, i) => (mt.winner ? mt : { ...mt, winner: r4Picks[i] }))
    const round5 = (r5?.pairs ?? []).map(([a, b], i): Match => ({ round: 5, a, b, winner: r5Picks[i] }))
    return [...base, ...round5]
  }, [r4Picks, r5, r5Picks])

  const recs = records(IDS, matches)
  const r4Done = MATCHES.every((mt, i) => mt.winner || r4Picks[i])
  const r5Done = !!r5 && r5.pairs.every((_, i) => r5Picks[i])
  const pool22 = r4Done ? teamsWithRecord(records(IDS, matches, 5), 2, 2) : []

  const pickR4 = (i: number, id: string) => {
    setR4Picks((p) => ({ ...p, [i]: id }))
    setR5(null)
    setR5Picks({})
    setQf(null)
  }
  const pickR5 = (i: number, id: string) => {
    setR5Picks((p) => ({ ...p, [i]: id }))
    setQf(null)
  }

  const roll = (what: 'r5' | 'qf', run: () => void) => {
    setRolling(what)
    setTimeout(() => {
      run()
      setRolling(null)
    }, ROLL_MS)
  }
  const rollR5 = () =>
    roll('r5', () => {
      setR5(drawSwissRound(pool22, playedPairs(matches.filter((mt) => mt.round < 5)), cryptoRng))
      setR5Picks({})
      setQf(null)
    })
  const rollQf = () =>
    roll('qf', () =>
      setQf(drawQuarterfinals(teamsWithRecord(recs, 3, 0), teamsWithRecord(recs, 3, 1), teamsWithRecord(recs, 3, 2), cryptoRng)),
    )

  const reset = () => {
    setR4Picks({})
    setR5(null)
    setR5Picks({})
    setQf(null)
  }

  // Group a round's matches by the record both teams carried into it.
  const pools = (round: number) => {
    const before = records(IDS, matches, round)
    const groups = new Map<string, { idx: number; mt: Match }[]>()
    matches.forEach((mt, idx) => {
      if (mt.round !== round) return
      const key = `${before[mt.a].w}-${before[mt.a].l}`
      groups.set(key, [...(groups.get(key) ?? []), { idx, mt }])
    })
    return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a))
  }

  const isBo3 = (round: number, mt: Match) => {
    const r = records(IDS, matches, round)[mt.a]
    return r.w === 2 || r.l === 2
  }

  const standings = [...IDS].sort((a, b) => recs[b].w - recs[a].w || recs[a].l - recs[b].l)
  const status = (id: string) => (recs[id].w === 3 ? 'adv' : recs[id].l === 3 ? 'out' : '')

  return (
    <div className="app">
      <header>
        <div>
          <h1>Worlds 2026 · Swiss Stage Simulator</h1>
          <p className="sub">
            Real results through Oct 29 (Leaguepedia). Click a team to pick the open Round 4 series, roll the 2-2 draw, pick
            Round 5, then roll the quarterfinal draw.
          </p>
        </div>
        <button className="ghost" onClick={reset}>
          Reset
        </button>
      </header>

      <div className="layout">
        <aside className="standings">
          <h2>Standings</h2>
          <ol>
            {standings.map((id) => (
              <li key={id} className={status(id)}>
                <TeamCell id={id} />
                <span className="rec">
                  {recs[id].w}-{recs[id].l}
                </span>
              </li>
            ))}
          </ol>
        </aside>

        <section className="board">
          {[1, 2, 3, 4].map((round) => (
            <div className="col" key={round}>
              <h2>Round {round}</h2>
              {pools(round).map(([key, list]) => (
                <div className="pool" key={key}>
                  <h3>{key}</h3>
                  {list.map(({ idx, mt }) => (
                    <MatchRow
                      key={idx}
                      mt={mt}
                      bo3={isBo3(round, mt)}
                      onPick={round === 4 && !MATCHES[idx].winner ? (id) => pickR4(idx, id) : undefined}
                    />
                  ))}
                </div>
              ))}
            </div>
          ))}

          <div className="col">
            <h2>Round 5</h2>
            <div className="pool">
              <h3>2-2</h3>
              {!r4Done && <p className="hint">Pick every open Round 4 series to unlock the 2-2 draw.</p>}
              {r4Done && !r5 && (
                <div className="waiting">
                  {pool22.map((id) => (
                    <TeamCell key={id} id={id} />
                  ))}
                </div>
              )}
              {r5?.pairs.map(([a, b], i) => (
                <MatchRow
                  key={`${a}-${b}`}
                  mt={{ round: 5, a, b, winner: r5Picks[i] }}
                  bo3
                  onPick={(id) => pickR5(i, id)}
                />
              ))}
              {r4Done && (
                <Dice rolling={rolling === 'r5'} onClick={rollR5} label={r5 ? 'Re-roll 2-2 draw' : 'Draw 2-2 matchups'} />
              )}
              {r5 && (
                <p className="hint">
                  Picked uniformly from {r5.options} rematch-free pairing{r5.options === 1 ? '' : 's'}.
                </p>
              )}
            </div>
          </div>

          <div className="col">
            <h2>Final</h2>
            <div className="pool adv">
              <h3>Advanced</h3>
              {[0, 1, 2].map((l) =>
                teamsWithRecord(recs, 3, l).map((id) => <TeamCell key={id} id={id} rec={recs[id]} />),
              )}
            </div>
            <div className="pool out">
              <h3>Eliminated</h3>
              {[2, 1, 0].map((w) =>
                teamsWithRecord(recs, w, 3).map((id) => <TeamCell key={id} id={id} rec={recs[id]} />),
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="knockout">
        <div className="knockout-head">
          <h2>Knockout Stage</h2>
          {r5Done && (
            <Dice rolling={rolling === 'qf'} onClick={rollQf} label={qf ? 'Re-roll quarterfinal draw' : 'Draw quarterfinals'} />
          )}
        </div>
        {!r5Done && <p className="hint">Draw Round 5 and pick its winners to unlock the quarterfinal draw.</p>}
        {qf && (
          <>
            <div className="bracket">
              <div className="bcol">
                <h3>Quarterfinals</h3>
                {qf.map(([a, b], i) => (
                  <div className="bmatch" key={i}>
                    <TeamCell id={a} rec={recs[a]} />
                    <TeamCell id={b} rec={recs[b]} />
                  </div>
                ))}
              </div>
              <div className="bcol">
                <h3>Semifinals</h3>
                {[0, 1].map((i) => (
                  <div className="bmatch tbd" key={i}>
                    <span>Winner QF{2 * i + 1}</span>
                    <span>Winner QF{2 * i + 2}</span>
                  </div>
                ))}
              </div>
              <div className="bcol">
                <h3>Final</h3>
                <div className="bmatch tbd">
                  <span>Winner SF1</span>
                  <span>Winner SF2</span>
                </div>
              </div>
            </div>
            <p className="hint">
              Both 3-0 teams draw a random 3-2 opponent and sit in opposite halves; the remaining four are paired at random.
            </p>
          </>
        )}
      </section>

      <footer>
        Fan project. Team logos via Leaguepedia, used for identification. Not affiliated with Riot Games.
      </footer>
    </div>
  )
}
