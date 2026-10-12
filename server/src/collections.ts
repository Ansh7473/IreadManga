import crypto from "node:crypto";
import { readJson, writeJson } from "./persist.js";
import { getManga } from "./mangadex.js";
import { getUserSnippet } from "./profiles.js";
import type { RankTier } from "./ranks.js";
import { loadAuthDb } from "./auth-store.js";

export type CollectionRecord = {
  id: string;
  userId: string;
  displayName: string;
  title: string;
  description?: string;
  mangaIds: string[];
  createdAt: string;
  updatedAt: string;
};

type CollectionDb = { items: CollectionRecord[] };

const FILE = "collections.json";
const MAX_MANGA = 200;
const MAX_TITLE_LEN = 120;
const MAX_DESC_LEN = 2000;

async function loadDb(): Promise<CollectionDb> {
  return readJson<CollectionDb>(FILE, { items: [] });
}

async function saveDb(db: CollectionDb) {
  await writeJson(FILE, db);
}

export type EnrichedCollection = CollectionRecord & {
  titleCount: number;
  coverUrls: (string | null)[];
  avatarId: string;
  avatarGlyph: string;
  avatarGradient: string;
  rank: RankTier;
};

async function coverUrlsForMangaIds(mangaIds: string[]): Promise<(string | null)[]> {
  const ids = mangaIds.slice(0, 3);
  const urls = await Promise.all(
    ids.map(async (id) => {
      try {
        const m = await getManga(id);
        return m.coverUrl;
      } catch {
        return null;
      }
    }),
  );
  while (urls.length < 3) urls.push(null);
  return urls;
}

export async function enrichCollection(
  c: CollectionRecord,
): Promise<EnrichedCollection> {
  const snippet = await getUserSnippet(c.userId);
  const db = await loadAuthDb();
  const owner = db.users.find((u) => u.id === c.userId);
  const displayName = owner?.displayName ?? c.displayName;

  return {
    ...c,
    displayName,
    titleCount: c.mangaIds.length,
    coverUrls: await coverUrlsForMangaIds(c.mangaIds),
    avatarId: snippet?.avatarId ?? "scroll-blue",
    avatarGlyph: snippet?.avatarGlyph ?? "📜",
    avatarGradient:
      snippet?.avatarGradient ?? "linear-gradient(135deg, #ff5c28, #cc4520)",
    rank: snippet?.rank ?? {
      id: "novice",
      label: "Novice Reader",
      minChapters: 0,
    },
  };
}

export async function listLatestCollections(
  limit: number,
): Promise<EnrichedCollection[]> {
  const db = await loadDb();
  const n = Math.min(50, Math.max(1, limit));
  const sorted = [...db.items].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  const slice = sorted.slice(0, n);
  return Promise.all(slice.map(enrichCollection));
}

export async function getCollectionById(
  id: string,
): Promise<EnrichedCollection | null> {
  const db = await loadDb();
  const c = db.items.find((x) => x.id === id);
  if (!c) return null;
  return enrichCollection(c);
}

export async function listCollectionsForUser(
  userId: string,
): Promise<CollectionRecord[]> {
  const db = await loadDb();
  return db.items
    .filter((c) => c.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createCollection(input: {
  userId: string;
  displayName: string;
  title: string;
  description?: string;
}): Promise<CollectionRecord> {
  const title = input.title.trim();
  if (title.length < 2 || title.length > MAX_TITLE_LEN) {
    throw new Error("Title must be 2–120 characters");
  }
  const description = input.description?.trim().slice(0, MAX_DESC_LEN);
  const now = new Date().toISOString();
  const record: CollectionRecord = {
    id: crypto.randomUUID(),
    userId: input.userId,
    displayName: input.displayName.trim().slice(0, 80) || "Reader",
    title,
    ...(description ? { description } : {}),
    mangaIds: [],
    createdAt: now,
    updatedAt: now,
  };
  const db = await loadDb();
  db.items.push(record);
  await saveDb(db);
  return record;
}

export async function updateCollection(
  id: string,
  userId: string,
  patch: { title?: string; description?: string },
): Promise<CollectionRecord> {
  const db = await loadDb();
  const idx = db.items.findIndex((c) => c.id === id);
  if (idx < 0) throw new Error("Collection not found");
  const c = db.items[idx];
  if (c.userId !== userId) throw new Error("Not your collection");

  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (title.length < 2 || title.length > MAX_TITLE_LEN) {
      throw new Error("Title must be 2–120 characters");
    }
    c.title = title;
  }
  if (patch.description !== undefined) {
    const description = patch.description.trim().slice(0, MAX_DESC_LEN);
    c.description = description || undefined;
  }
  c.updatedAt = new Date().toISOString();
  db.items[idx] = c;
  await saveDb(db);
  return c;
}

export async function deleteCollection(id: string, userId: string): Promise<void> {
  const db = await loadDb();
  const c = db.items.find((x) => x.id === id);
  if (!c) throw new Error("Collection not found");
  if (c.userId !== userId) throw new Error("Not your collection");
  db.items = db.items.filter((x) => x.id !== id);
  await saveDb(db);
}

export async function addMangaToCollection(
  id: string,
  userId: string,
  mangaId: string,
): Promise<CollectionRecord> {
  const mid = mangaId.trim();
  if (!mid) throw new Error("Manga id required");
  const db = await loadDb();
  const idx = db.items.findIndex((c) => c.id === id);
  if (idx < 0) throw new Error("Collection not found");
  const c = db.items[idx];
  if (c.userId !== userId) throw new Error("Not your collection");
  if (c.mangaIds.includes(mid)) return c;
  if (c.mangaIds.length >= MAX_MANGA) {
    throw new Error(`Collections are limited to ${MAX_MANGA} titles`);
  }
  c.mangaIds = [mid, ...c.mangaIds];
  c.updatedAt = new Date().toISOString();
  db.items[idx] = c;
  await saveDb(db);
  return c;
}

export async function removeMangaFromCollection(
  id: string,
  userId: string,
  mangaId: string,
): Promise<CollectionRecord> {
  const db = await loadDb();
  const idx = db.items.findIndex((c) => c.id === id);
  if (idx < 0) throw new Error("Collection not found");
  const c = db.items[idx];
  if (c.userId !== userId) throw new Error("Not your collection");
  c.mangaIds = c.mangaIds.filter((x) => x !== mangaId);
  c.updatedAt = new Date().toISOString();
  db.items[idx] = c;
  await saveDb(db);
  return c;
}
