// Worlds 2026 Swiss Stage, hard-coded from Leaguepedia as of 2026-10-29.
// https://lol.fandom.com/wiki/2026_Season_World_Championship/Main_Event

export type Region = 'KR' | 'CN' | 'EMEA' | 'NA' | 'APAC' | 'BR'

export interface Team {
  id: string
  name: string
  short: string
  region: Region
}

export interface Match {
  round: number
  a: string
  b: string
  winner?: string
}

const team = (id: string, short: string, name: string, region: Region): Team => ({ id, short, name, region })

export const TEAMS: Record<string, Team> = Object.fromEntries(
  [
    team('gen', 'GEN', 'Gen.G', 'KR'),
    team('hle', 'HLE', 'Hanwha Life Esports', 'KR'),
    team('t1', 'T1', 'T1', 'KR'),
    team('dk', 'DK', 'Dplus KIA', 'KR'),
    team('al', 'AL', "Anyone's Legend", 'CN'),
    team('blg', 'BLG', 'Bilibili Gaming', 'CN'),
    team('tes', 'TES', 'Top Esports', 'CN'),
    team('ig', 'iG', 'Invictus Gaming', 'CN'),
    team('g2', 'G2', 'G2 Esports', 'EMEA'),
    team('mkoi', 'MKOI', 'Movistar KOI', 'EMEA'),
    team('kc', 'KC', 'Karmine Corp', 'EMEA'),
    team('tl', 'TL', 'Team Liquid', 'NA'),
    team('lyon', 'LYON', 'LYON', 'NA'),
    team('tsw', 'TSW', 'Team Secret Whales', 'APAC'),
    team('cfo', 'CFO', 'CTBC Flying Oyster', 'APAC'),
    team('los', 'LØS', 'LØS', 'BR'),
  ].map((t) => [t.id, t]),
)

const m = (round: number, a: string, b: string, winner?: string): Match => ({ round, a, b, winner })

export const MATCHES: Match[] = [
  // Round 1 (0-0)
  m(1, 'gen', 'ig', 'gen'),
  m(1, 'hle', 'tes', 'hle'),
  m(1, 'blg', 'mkoi', 'mkoi'),
  m(1, 'al', 'kc', 'kc'),
  m(1, 'g2', 'dk', 'dk'),
  m(1, 'tl', 'cfo', 'cfo'),
  m(1, 'los', 't1', 't1'),
  m(1, 'tsw', 'lyon', 'lyon'),
  // Round 2
  m(2, 'tes', 'al', 'tes'),
  m(2, 'cfo', 'mkoi', 'mkoi'),
  m(2, 'g2', 'los', 'g2'),
  m(2, 'lyon', 'kc', 'lyon'),
  m(2, 'ig', 'tsw', 'ig'),
  m(2, 'hle', 'gen', 'gen'),
  m(2, 'dk', 't1', 'dk'),
  m(2, 'tl', 'blg', 'blg'),
  // Round 3
  m(3, 'hle', 'ig', 'ig'),
  m(3, 'tes', 'g2', 'tes'),
  m(3, 'dk', 'mkoi', 'dk'),
  m(3, 'gen', 'lyon', 'gen'),
  m(3, 't1', 'cfo', 't1'),
  m(3, 'kc', 'blg', 'blg'),
  m(3, 'los', 'tsw', 'los'),
  m(3, 'tl', 'al', 'tl'),
  // Round 4: first two are played, the rest are up for picks
  m(4, 'mkoi', 't1', 't1'),
  m(4, 'ig', 'lyon', 'ig'),
  m(4, 'kc', 'cfo'),
  m(4, 'tes', 'blg'),
  m(4, 'tl', 'los'),
  m(4, 'hle', 'g2'),
]
