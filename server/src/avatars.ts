import { rankMeetsMinimum } from "./ranks.js";

export type AvatarPreset = {
  id: string;
  label: string;
  tier: "basic" | "advanced";
  unlockRankId: string;
  glyph: string;
  gradient: string;
};

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "scroll-blue",
    label: "Scroll",
    tier: "basic",
    unlockRankId: "novice",
    glyph: "📜",
    gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
  },
  {
    id: "ink-orange",
    label: "Ink",
    tier: "basic",
    unlockRankId: "novice",
    glyph: "🖋",
    gradient: "linear-gradient(135deg, #f97316, #ea580c)",
  },
  {
    id: "page-cream",
    label: "Page",
    tier: "basic",
    unlockRankId: "novice",
    glyph: "📖",
    gradient: "linear-gradient(135deg, #fde68a, #d97706)",
  },
  {
    id: "night-read",
    label: "Night",
    tier: "basic",
    unlockRankId: "novice",
    glyph: "🌙",
    gradient: "linear-gradient(135deg, #312e81, #1e1b4b)",
  },
  {
    id: "katana",
    label: "Katana",
    tier: "basic",
    unlockRankId: "novice",
    glyph: "⚔",
    gradient: "linear-gradient(135deg, #64748b, #334155)",
  },
  {
    id: "bubble-tea",
    label: "Tea",
    tier: "basic",
    unlockRankId: "novice",
    glyph: "🧋",
    gradient: "linear-gradient(135deg, #f472b6, #db2777)",
  },
  {
    id: "fox-spirit",
    label: "Fox",
    tier: "basic",
    unlockRankId: "novice",
    glyph: "🦊",
    gradient: "linear-gradient(135deg, #fb923c, #c2410c)",
  },
  {
    id: "chibi-smile",
    label: "Chibi",
    tier: "basic",
    unlockRankId: "novice",
    glyph: "😊",
    gradient: "linear-gradient(135deg, #a78bfa, #7c3aed)",
  },
  {
    id: "dragon-sage",
    label: "Dragon",
    tier: "advanced",
    unlockRankId: "bookworm",
    glyph: "🐉",
    gradient: "linear-gradient(135deg, #059669, #047857)",
  },
  {
    id: "void-oracle",
    label: "Oracle",
    tier: "advanced",
    unlockRankId: "sage",
    glyph: "🔮",
    gradient: "linear-gradient(135deg, #6366f1, #4338ca)",
  },
  {
    id: "gold-crown",
    label: "Crown",
    tier: "advanced",
    unlockRankId: "sage",
    glyph: "👑",
    gradient: "linear-gradient(135deg, #fbbf24, #b45309)",
  },
  {
    id: "cosmic-legend",
    label: "Cosmic",
    tier: "advanced",
    unlockRankId: "legend",
    glyph: "✨",
    gradient: "linear-gradient(135deg, #ec4899, #8b5cf6, #06b6d4)",
  },
];

const byId = new Map(AVATAR_PRESETS.map((a) => [a.id, a]));

export const DEFAULT_AVATAR_ID = "scroll-blue";

export function getAvatar(id: string | undefined): AvatarPreset {
  return byId.get(id ?? "") ?? byId.get(DEFAULT_AVATAR_ID)!;
}

export function isKnownAvatar(id: string): boolean {
  return byId.has(id);
}

export function avatarUnlockedForRank(avatarId: string, userRankId: string): boolean {
  const preset = byId.get(avatarId);
  if (!preset) return false;
  return rankMeetsMinimum(userRankId, preset.unlockRankId);
}

export function listAvatarsPublic() {
  return AVATAR_PRESETS.map(({ id, label, tier, unlockRankId, glyph, gradient }) => ({
    id,
    label,
    tier,
    unlockRankId,
    glyph,
    gradient,
  }));
}
