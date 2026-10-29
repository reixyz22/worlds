# Worlds 2026 Swiss Simulator

Pick the open Round 4 series, roll the 2-2 draw (no rematches), pick Round 5, roll the quarterfinal draw.

Results are hard-coded from [Leaguepedia](https://lol.fandom.com/wiki/2026_Season_World_Championship/Main_Event) in `src/data.ts`. Draw logic is in `src/draw.ts`:

- **Round 5:** enumerates every rematch-free pairing of the 2-2 teams and picks one uniformly (`crypto.getRandomValues`, rejection-sampled).
- **Quarterfinals** (per the LoL Esports Worlds 2026 primer): both 3-0 teams draw a random 3-2 team, then the other four are paired at random. The 3-0 teams go in opposite halves.

```bash
npm install
npm run dev
npm test
```
