import type { Match } from './data'

export interface WL {
  w: number
  l: number
}

export const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)

/** W-L for every team, counting only decided matches before `beforeRound`. */
export function records(teamIds: string[], matches: Match[], beforeRound = Infinity) {
  const out: { [id: string]: WL } = Object.fromEntries(teamIds.map((id) => [id, { w: 0, l: 0 }]))
  for (const mt of matches) {
    if (mt.round >= beforeRound || !mt.winner) continue
    const loser = mt.winner === mt.a ? mt.b : mt.a
    out[mt.winner].w++
    out[loser].l++
  }
  return out
}

export function playedPairs(matches: Match[]) {
  return new Set(matches.map((mt) => pairKey(mt.a, mt.b)))
}

export function teamsWithRecord(recs: { [id: string]: WL }, w: number, l: number) {
  return Object.keys(recs).filter((id) => recs[id].w === w && recs[id].l === l)
}
