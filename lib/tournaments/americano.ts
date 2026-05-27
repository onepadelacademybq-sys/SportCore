// Pure algorithmic functions for americano tournament formats — no DB access

// ─── Super 8 fixed schedule ────────────────────────────────────────────────
// 7 rounds × 2 matches per round, 8 players (indices 0–7).
// Each entry [a,b,c,d] = team(a,b) vs team(c,d).
// Guarantees: every player partners with each other exactly once.
export const SUPER_8_ROUNDS: [number, number, number, number][][] = [
  [[0, 1, 2, 3], [4, 5, 6, 7]],
  [[0, 2, 4, 6], [1, 3, 5, 7]],
  [[0, 3, 5, 6], [1, 2, 4, 7]],
  [[0, 4, 1, 5], [2, 6, 3, 7]],
  [[0, 5, 3, 6], [1, 4, 2, 7]],
  [[0, 6, 2, 5], [1, 7, 3, 4]],
  [[0, 7, 1, 6], [2, 4, 3, 5]],
]

// ─── Individual americano round generation ──────────────────────────────────
// Returns `numRounds` rounds; each round = array of [a,b,c,d] indices into
// the players array, meaning team(players[a]+players[b]) vs team(players[c]+players[d]).
// Greedy algorithm minimises repeated partnerships across rounds.
// n must be divisible by 4.
export function generateIndividualRounds(
  n: number,
  numRounds: number,
): [number, number, number, number][][] {
  if (n < 4 || n % 4 !== 0) {
    throw new Error(`Necesitas múltiplo de 4 jugadores (actual: ${n})`)
  }

  const matchesPerRound = n / 4
  // Track how many times each pair (i,j) has played together
  const partnered: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  const rounds: [number, number, number, number][][] = []

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  for (let r = 0; r < numRounds; r++) {
    const used = new Set<number>()
    const round: [number, number, number, number][] = []

    while (round.length < matchesPerRound) {
      const available = shuffle(
        Array.from({ length: n }, (_, i) => i).filter(p => !used.has(p))
      )
      if (available.length < 4) break

      // Try 40 random picks; choose the arrangement with min repeated partnerships
      let best: [number, number, number, number] = [available[0], available[1], available[2], available[3]]
      let bestScore = Infinity

      for (let t = 0; t < 40; t++) {
        const s = shuffle(available)
        const [a, b, c, d] = s
        const score = partnered[a][b] + partnered[c][d]
        if (score < bestScore) { bestScore = score; best = [a, b, c, d] }
        // Also try alt pairing same four players: (a,c)vs(b,d) and (a,d)vs(b,c)
        const s2 = score; const alt1 = partnered[a][c] + partnered[b][d]
        if (alt1 < bestScore) { bestScore = alt1; best = [a, c, b, d] }
        const alt2 = partnered[a][d] + partnered[b][c]
        if (alt2 < bestScore) { bestScore = alt2; best = [a, d, b, c] }
      }

      const [a, b, c, d] = best
      round.push(best)
      used.add(a); used.add(b); used.add(c); used.add(d)
      partnered[a][b]++; partnered[b][a]++
      partnered[c][d]++; partnered[d][c]++
    }

    if (round.length > 0) rounds.push(round)
  }

  return rounds
}

// ─── Round-robin for pair formats ────────────────────────────────────────────
// Returns all rounds for a full round-robin of n pairs.
// Each entry [i,j] = pair index i plays pair index j.
export function generatePairsRoundRobin(n: number): [number, number][][] {
  const teams = Array.from({ length: n }, (_, i) => i)
  if (n % 2 === 1) teams.push(-1) // -1 = bye (not used in matches)
  const m = teams.length
  const rounds: [number, number][][] = []

  for (let r = 0; r < m - 1; r++) {
    const round: [number, number][] = []
    for (let i = 0; i < m / 2; i++) {
      const t1 = teams[i]
      const t2 = teams[m - 1 - i]
      if (t1 !== -1 && t2 !== -1) round.push([t1, t2])
    }
    rounds.push(round)
    // Rotate all except first element
    const temp = teams[m - 1]
    for (let i = m - 1; i > 1; i--) teams[i] = teams[i - 1]
    teams[1] = temp
  }

  return rounds
}

// ─── Rey de pista: court assignment from ranked pairs ──────────────────────
// Takes pairs sorted by rank (index 0 = best); returns matches array
// where court 1 = best court, court N = worst.
export function assignCourtsFromRanking(
  rankedPairIds: string[],
): Array<{ entry1_id: string; entry2_id: string; court_number: number }> {
  const matches: Array<{ entry1_id: string; entry2_id: string; court_number: number }> = []
  for (let i = 0; i < rankedPairIds.length - 1; i += 2) {
    matches.push({
      entry1_id: rankedPairIds[i],
      entry2_id: rankedPairIds[i + 1],
      court_number: Math.floor(i / 2) + 1,
    })
  }
  return matches
}

// ─── Format metadata ─────────────────────────────────────────────────────────
export type AmericanoFormat =
  | 'americano_individual'
  | 'americano_parejas'
  | 'americano_rey_pista'
  | 'super_8'
  | 'americano_mixto'

export const AMERICANO_FORMATS: AmericanoFormat[] = [
  'americano_individual', 'americano_parejas', 'americano_rey_pista',
  'super_8', 'americano_mixto',
]

export function isAmericanoFormat(format: string): format is AmericanoFormat {
  return (AMERICANO_FORMATS as string[]).includes(format)
}

// Formats where players register individually (not as pairs)
export const INDIVIDUAL_ENTRY_FORMATS: string[] = [
  'americano_individual', 'americano_mixto', 'super_8',
]

// Formats that use round-pair temp entries (and thus a leaderboard by player)
export const ROUND_PAIR_FORMATS: string[] = [
  'americano_individual', 'americano_mixto', 'super_8',
]
