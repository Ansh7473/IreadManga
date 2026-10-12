export type RankTier = {
  id: string;
  label: string;
  minChapters: number;
};

export const RANK_TIERS: RankTier[] = [
  { id: "novice", label: "Novice Reader", minChapters: 0 },
  { id: "regular", label: "Regular", minChapters: 5 },
  { id: "bookworm", label: "Bookworm", minChapters: 25 },
  { id: "sage", label: "Sage", minChapters: 75 },
  { id: "legend", label: "Legend", minChapters: 200 },
];

export function rankForChapters(chaptersRead: number): RankTier {
  let tier = RANK_TIERS[0];
  for (const t of RANK_TIERS) {
    if (chaptersRead >= t.minChapters) tier = t;
  }
  return tier;
}

export function rankIndex(rankId: string): number {
  return RANK_TIERS.findIndex((t) => t.id === rankId);
}

export function rankMeetsMinimum(userRankId: string, requiredRankId: string): boolean {
  return rankIndex(userRankId) >= rankIndex(requiredRankId);
}

export function rankProgressDetail(chaptersRead: number) {
  const current = rankForChapters(chaptersRead);
  const idx = RANK_TIERS.findIndex((t) => t.id === current.id);
  const next = RANK_TIERS[idx + 1] ?? null;
  if (!next) {
    return { current, next: null as RankTier | null, progress: 1, remaining: 0 };
  }
  const base = current.minChapters;
  const span = next.minChapters - base;
  const progress = span > 0 ? Math.min(1, (chaptersRead - base) / span) : 0;
  return {
    current,
    next,
    progress,
    remaining: Math.max(0, next.minChapters - chaptersRead),
  };
}
