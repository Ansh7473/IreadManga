import {
  avatarUnlockedForRank,
  DEFAULT_AVATAR_ID,
  getAvatar,
  isKnownAvatar,
} from "./avatars.js";
import { rankForChapters, RANK_TIERS, type RankTier } from "./ranks.js";
import { loadAuthDb, saveAuthDb, type UserRecord } from "./auth-store.js";
import { toPublic, type PublicUser } from "./auth.js";
import { readJson, writeJson } from "./persist.js";

type ReadingDb = { byUser: Record<string, string[]> };

const READING_FILE = "reading-progress.json";

async function loadReading(): Promise<ReadingDb> {
  return readJson<ReadingDb>(READING_FILE, { byUser: {} });
}

async function saveReading(db: ReadingDb) {
  await writeJson(READING_FILE, db);
}

function normalizeUser(u: UserRecord): UserRecord {
  return {
    ...u,
    avatarId: u.avatarId ?? DEFAULT_AVATAR_ID,
    bio: u.bio ?? "",
    chaptersRead: u.chaptersRead ?? 0,
  };
}

export type LeaderboardEntry = {
  id: string;
  displayName: string;
  avatarId: string;
  avatarGlyph: string;
  avatarGradient: string;
  chaptersRead: number;
  rank: RankTier;
};

export async function getLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
  const db = await loadAuthDb();
  return db.users
    .map(normalizeUser)
    .sort((a, b) => (b.chaptersRead ?? 0) - (a.chaptersRead ?? 0))
    .slice(0, Math.min(100, Math.max(1, limit)))
    .map((u) => {
      const chaptersRead = u.chaptersRead ?? 0;
      const avatar = getAvatar(u.avatarId);
      return {
        id: u.id,
        displayName: u.displayName,
        avatarId: avatar.id,
        avatarGlyph: avatar.glyph,
        avatarGradient: avatar.gradient,
        chaptersRead,
        rank: rankForChapters(chaptersRead),
      };
    });
}

export async function getUserSnippet(userId: string) {
  const db = await loadAuthDb();
  const u = db.users.find((x) => x.id === userId);
  if (!u) return null;
  const user = normalizeUser(u);
  const chaptersRead = user.chaptersRead ?? 0;
  const avatar = getAvatar(user.avatarId);
  return {
    avatarId: avatar.id,
    avatarGlyph: avatar.glyph,
    avatarGradient: avatar.gradient,
    rank: rankForChapters(chaptersRead),
    chaptersRead,
  };
}

export async function updateProfile(
  userId: string,
  patch: { avatarId?: string; bio?: string },
): Promise<PublicUser> {
  const db = await loadAuthDb();
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx < 0) throw new Error("User not found");
  const user = normalizeUser(db.users[idx]);

  if (patch.bio !== undefined) {
    const bio = patch.bio.trim();
    if (bio.length > 280) throw new Error("Bio must be 280 characters or less");
    user.bio = bio;
  }

  if (patch.avatarId !== undefined) {
    const avatarId = patch.avatarId.trim();
    if (!isKnownAvatar(avatarId)) throw new Error("Unknown avatar");
    const rankId = rankForChapters(user.chaptersRead ?? 0).id;
    if (!avatarUnlockedForRank(avatarId, rankId)) {
      throw new Error("Avatar locked — read more chapters to unlock");
    }
    user.avatarId = avatarId;
  }

  db.users[idx] = user;
  await saveAuthDb(db);
  return toPublic(user);
}

export async function recordChapterRead(
  userId: string,
  chapterId: string,
): Promise<{ chaptersRead: number; newRead: boolean; rank: RankTier }> {
  const id = chapterId.trim();
  if (!id) throw new Error("chapterId required");

  const reading = await loadReading();
  const list = reading.byUser[userId] ?? [];
  if (list.includes(id)) {
    const db = await loadAuthDb();
    const u = db.users.find((x) => x.id === userId);
    const chaptersRead = u ? normalizeUser(u).chaptersRead ?? 0 : 0;
    return { chaptersRead, newRead: false, rank: rankForChapters(chaptersRead) };
  }

  reading.byUser[userId] = [...list, id];
  await saveReading(reading);

  const db = await loadAuthDb();
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx < 0) throw new Error("User not found");
  const user = normalizeUser(db.users[idx]);
  user.chaptersRead = (user.chaptersRead ?? 0) + 1;
  db.users[idx] = user;
  await saveAuthDb(db);

  return {
    chaptersRead: user.chaptersRead,
    newRead: true,
    rank: rankForChapters(user.chaptersRead),
  };
}

export function getRankTiers() {
  return RANK_TIERS;
}
