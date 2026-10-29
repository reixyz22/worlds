import { describe, expect, it } from 'vitest'
import { MATCHES, TEAMS, type Match } from './data'
import { cryptoRng, drawQuarterfinals, drawSwissRound, validPairings, type Pair } from './draw'
import { pairKey, playedPairs, records, teamsWithRecord } from './swiss'

const IDS = Object.keys(TEAMS)
const OPEN_R4 = MATCHES.flatMap((mt, i) => (mt.winner ? [] : [i]))

/** All 2^4 ways the open Round 4 series can go. */
function round4Scenarios(): Match[][] {
  return Array.from({ length: 1 << OPEN_R4.length }, (_, mask) =>
    MATCHES.map((mt, i) => {
      const bit = OPEN_R4.indexOf(i)
      if (bit < 0) return mt
      return { ...mt, winner: mask & (1 << bit) ? mt.a : mt.b }
    }),
  )
}

const pairingKey = (pairs: Pair[]) =>
  pairs
    .map(([a, b]) => pairKey(a, b))
    .sort()
    .join(',')

describe('hard-coded data', () => {
  it('matches Leaguepedia standings after Round 3', () => {
    const r = records(IDS, MATCHES, 4)
    expect(teamsWithRecord(r, 3, 0).sort()).toEqual(['dk', 'gen'])
    expect(teamsWithRecord(r, 0, 3).sort()).toEqual(['al', 'tsw'])
    expect(teamsWithRecord(r, 2, 1).sort()).toEqual(['blg', 'ig', 'lyon', 'mkoi', 't1', 'tes'])
    expect(teamsWithRecord(r, 1, 2).sort()).toEqual(['cfo', 'g2', 'hle', 'kc', 'los', 'tl'])
  })

  it('has no rematches and every match is within one record pool', () => {
    expect(playedPairs(MATCHES).size).toBe(MATCHES.length)
    for (const mt of MATCHES) {
      const r = records(IDS, MATCHES, mt.round)
      expect(r[mt.a]).toEqual(r[mt.b])
    }
  })
})

describe('validPairings', () => {
  it('counts perfect matchings with no restrictions', () => {
    expect(validPairings(['a', 'b', 'c', 'd'], new Set())).toHaveLength(3)
    expect(validPairings(['a', 'b', 'c', 'd', 'e', 'f'], new Set())).toHaveLength(15)
  })

  it('drops forbidden pairs', () => {
    const out = validPairings(['a', 'b', 'c', 'd'], new Set([pairKey('a', 'b')]))
    expect(out.map(pairingKey).sort()).toEqual(['a|c,b|d', 'a|d,b|c'])
  })
})

describe('Round 5 draw', () => {
  it('always yields a full rematch-free 2-2 draw for every Round 4 outcome', () => {
    for (const ms of round4Scenarios()) {
      const pool = teamsWithRecord(records(IDS, ms), 2, 2)
      expect(pool).toHaveLength(6)
      const played = playedPairs(ms)
      for (let i = 0; i < 200; i++) {
        const { pairs } = drawSwissRound(pool, played, cryptoRng)
        expect(pairs.flat().sort()).toEqual([...pool].sort())
        for (const [a, b] of pairs) expect(played.has(pairKey(a, b))).toBe(false)
      }
    }
  })

  it('picks every legal pairing equally often', () => {
    // Use the scenario with the most legal pairings so the test is meaningful.
    const ms = round4Scenarios()
      .map((ms) => ({ ms, n: validPairings(teamsWithRecord(records(IDS, ms), 2, 2), playedPairs(ms)).length }))
      .sort((a, b) => b.n - a.n)[0].ms
    const pool = teamsWithRecord(records(IDS, ms), 2, 2)
    const played = playedPairs(ms)
    const legal = validPairings(pool, played)
    expect(legal.length).toBeGreaterThan(1)

    const N = 60_000
    const counts = new Map<string, number>()
    for (let i = 0; i < N; i++) {
      const k = pairingKey(drawSwissRound(pool, played, cryptoRng).pairs)
      counts.set(k, (counts.get(k) ?? 0) + 1)
    }
    expect(counts.size).toBe(legal.length)
    const expected = N / legal.length
    for (const c of counts.values()) expect(Math.abs(c - expected) / expected).toBeLessThan(0.1)
  })
})

describe('cryptoRng', () => {
  it('is in range and roughly uniform', () => {
    const counts = [0, 0, 0]
    for (let i = 0; i < 30_000; i++) counts[cryptoRng(3)]++
    for (const c of counts) expect(Math.abs(c - 10_000)).toBeLessThan(500)
  })
})

describe('quarterfinal draw', () => {
  const z = ['dk', 'gen']
  const one = ['t1', 'ig', 'tes']
  const two = ['mkoi', 'kc', 'hle']

  it('puts 3-0s against 3-2s in opposite halves and uses every team once', () => {
    for (let i = 0; i < 2000; i++) {
      const qf = drawQuarterfinals(z, one, two, cryptoRng)
      expect(qf.flat().sort()).toEqual([...z, ...one, ...two].sort())
      expect(z).toContain(qf[0][0])
      expect(z).toContain(qf[2][0])
      expect(two).toContain(qf[0][1])
      expect(two).toContain(qf[2][1])
    }
  })

  it('gives each 3-2 team the same chance of drawing a 3-0 team', () => {
    const N = 30_000
    const hits = Object.fromEntries(two.map((id) => [id, 0]))
    for (let i = 0; i < N; i++) {
      const qf = drawQuarterfinals(z, one, two, cryptoRng)
      hits[qf[0][1]]++
      hits[qf[2][1]]++
    }
    // Two of three 3-2 teams get a 3-0 opponent each draw.
    for (const c of Object.values(hits)) expect(Math.abs(c / N - 2 / 3)).toBeLessThan(0.02)
  })
})
