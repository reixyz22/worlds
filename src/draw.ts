import { pairKey } from './swiss'

/** Returns a uniformly random integer in [0, n). */
export type Rng = (n: number) => number

export const cryptoRng: Rng = (n) => {
  // Rejection sampling: drop the top sliver of the 32-bit range so `% n` has no modulo bias.
  const limit = Math.floor(0x1_0000_0000 / n) * n
  const buf = new Uint32Array(1)
  do crypto.getRandomValues(buf)
  while (buf[0] >= limit)
  return buf[0] % n
}

export function shuffle<T>(items: T[], rng: Rng): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng(i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export type Pair = [string, string]

/** Every way to split `teams` into pairs where no pair is in `forbidden`. */
export function validPairings(teams: string[], forbidden: Set<string>): Pair[][] {
  if (teams.length === 0) return [[]]
  const [first, ...rest] = teams
  const out: Pair[][] = []
  rest.forEach((opp, i) => {
    if (forbidden.has(pairKey(first, opp))) return
    const remaining = rest.filter((_, j) => j !== i)
    for (const tail of validPairings(remaining, forbidden)) out.push([[first, opp], ...tail])
  })
  return out
}

export interface SwissDraw {
  pairs: Pair[]
  /** How many rematch-free pairings the draw was picked from. */
  options: number
}

/**
 * Draws one record pool (e.g. the 2-2 teams) by enumerating every rematch-free
 * pairing and picking one uniformly, so no legal bracket is favoured.
 */
export function drawSwissRound(teams: string[], played: Set<string>, rng: Rng): SwissDraw {
  const options = validPairings(teams, played)
  if (options.length === 0) throw new Error(`No rematch-free pairing for ${teams.join(', ')}`)
  const picked = options[rng(options.length)]
  // Order and sides are cosmetic; shuffle them so the layout doesn't leak enumeration order.
  const pairs = shuffle(picked, rng).map(([a, b]): Pair => (rng(2) ? [a, b] : [b, a]))
  return { pairs, options: options.length }
}

/**
 * Quarterfinal draw per the Worlds 2026 primer: both 3-0 teams are drawn against
 * 3-2 teams, then the other four are paired at random. The 3-0 teams go in
 * opposite halves. Returns QF1..QF4; QF1+QF2 feed SF1, QF3+QF4 feed SF2.
 */
export function drawQuarterfinals(threeZero: string[], threeOne: string[], threeTwo: string[], rng: Rng): Pair[] {
  if (threeZero.length !== 2 || threeOne.length !== 3 || threeTwo.length !== 3) {
    throw new Error('Quarterfinal draw needs two 3-0, three 3-1 and three 3-2 teams')
  }
  const [topSeed, bottomSeed] = shuffle(threeZero, rng)
  const [topOpp, bottomOpp, leftover] = shuffle(threeTwo, rng)
  const rest = shuffle([...threeOne, leftover], rng)
  return [
    [topSeed, topOpp],
    [rest[0], rest[1]],
    [bottomSeed, bottomOpp],
    [rest[2], rest[3]],
  ]
}
