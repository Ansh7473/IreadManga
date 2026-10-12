const TOKEN_KEY = "irm:token";
const USER_KEY = "irm:user";

export type RankTier = {
  id: string;
  label: string;
  minChapters: number;
};

export type RankProgress = {
  current: RankTier;
  next: RankTier | null;
  progress: number;
  remaining: number;
};

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  avatarId: string;
  avatarGlyph: string;
  avatarGradient: string;
  bio: string;
  chaptersRead: number;
  rank: RankTier;
  rankProgress: RankProgress;
};

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (!parsed.id || !parsed.email) return null;
    return normalizeStoredUser(parsed);
  } catch {
    return null;
  }
}

/** Backfill profile fields for sessions saved before gamification shipped. */
export function normalizeStoredUser(parsed: Partial<AuthUser>): AuthUser {
  const chaptersRead = parsed.chaptersRead ?? 0;
  const rank =
    parsed.rank ??
    ({
      id: "novice",
      label: "Novice Reader",
      minChapters: 0,
    } satisfies RankTier);
  return {
    id: parsed.id!,
    email: parsed.email!,
    displayName: parsed.displayName ?? "Reader",
    createdAt: parsed.createdAt ?? new Date().toISOString(),
    avatarId: parsed.avatarId ?? "scroll-blue",
    avatarGlyph: parsed.avatarGlyph ?? "📜",
    avatarGradient:
      parsed.avatarGradient ??
      "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    bio: parsed.bio ?? "",
    chaptersRead,
    rank,
    rankProgress: parsed.rankProgress ?? {
      current: rank,
      next: { id: "regular", label: "Regular", minChapters: 5 },
      progress: chaptersRead / 5,
      remaining: Math.max(0, 5 - chaptersRead),
    },
  };
}

export function saveSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
