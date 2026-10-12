import type { ChapterItem, ChapterPages, MangaCard } from "./types.js";
import { cache } from "./cache.js";

const API = "https://api.mangadex.org";
const UPLOADS = "https://uploads.mangadex.org";

const DEFAULT_RATINGS = ["safe", "suggestive", "erotica"] as const;

async function mdFetch<T>(path: string, ttlMs = 60_000): Promise<T> {
  const key = `md:${path}`;
  const cached = cache.get<T>(key);
  if (cached) return cached;

  const res = await fetch(`${API}${path}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "IReadManga/0.1 (local; contact@ireadmanga.local)",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MangaDex ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as T;
  cache.set(key, data, ttlMs);
  return data;
}

function pickTitle(title: Record<string, string> | undefined): string {
  if (!title) return "Untitled";
  return title.en || title.ja || Object.values(title)[0] || "Untitled";
}

function pickDescription(desc: Record<string, string> | undefined): string {
  if (!desc) return "";
  return desc.en || Object.values(desc)[0] || "";
}

function coverFromRelationships(
  mangaId: string,
  relationships: Array<{ type: string; id: string; attributes?: { fileName?: string } }> = [],
): string | null {
  const cover = relationships.find((r) => r.type === "cover_art");
  const fileName = cover?.attributes?.fileName;
  if (!fileName) return null;
  return `${UPLOADS}/covers/${mangaId}/${fileName}.512.jpg`;
}

function personName(
  relationships: Array<{ type: string; attributes?: { name?: string } }> = [],
  type: "author" | "artist",
): string | null {
  const person = relationships.find((r) => r.type === type);
  return person?.attributes?.name ?? null;
}

type MdManga = {
  id: string;
  attributes: {
    title: Record<string, string>;
    description: Record<string, string>;
    status: string;
    year: number | null;
    contentRating: string;
    lastChapter: string | null;
    tags: Array<{ attributes: { name: Record<string, string> } }>;
  };
  relationships?: Array<{
    type: string;
    id: string;
    attributes?: { fileName?: string; name?: string };
  }>;
};

function mapManga(m: MdManga): MangaCard {
  return {
    id: m.id,
    title: pickTitle(m.attributes.title),
    description: pickDescription(m.attributes.description),
    status: m.attributes.status,
    year: m.attributes.year,
    tags: (m.attributes.tags || [])
      .map((t) => t.attributes?.name?.en)
      .filter(Boolean)
      .slice(0, 8) as string[],
    contentRating: m.attributes.contentRating,
    coverUrl: coverFromRelationships(m.id, m.relationships),
    author: personName(m.relationships, "author"),
    artist: personName(m.relationships, "artist"),
    lastChapter: m.attributes.lastChapter,
  };
}

function ratingsQuery(): string {
  return DEFAULT_RATINGS.map((r) => `contentRating[]=${r}`).join("&");
}

export async function getPopular(limit = 24, offset = 0): Promise<MangaCard[]> {
  const q = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    "order[followedCount]": "desc",
    "availableTranslatedLanguage[]": "en",
  });
  q.append("includes[]", "cover_art");
  q.append("includes[]", "author");
  q.append("includes[]", "artist");

  const data = await mdFetch<{ data: MdManga[] }>(
    `/manga?${q}&${ratingsQuery()}`,
    5 * 60_000,
  );
  return data.data.map(mapManga);
}

export async function getRecentlyAdded(limit = 24): Promise<MangaCard[]> {
  const q = new URLSearchParams({
    limit: String(limit),
    "order[createdAt]": "desc",
    "availableTranslatedLanguage[]": "en",
  });
  q.append("includes[]", "cover_art");
  q.append("includes[]", "author");
  q.append("includes[]", "artist");

  const data = await mdFetch<{ data: MdManga[] }>(
    `/manga?${q}&${ratingsQuery()}`,
    2 * 60_000,
  );
  return data.data.map(mapManga);
}

export async function searchManga(
  query: string,
  limit = 24,
  offset = 0,
): Promise<MangaCard[]> {
  const q = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    title: query,
    "order[relevance]": "desc",
    "availableTranslatedLanguage[]": "en",
  });
  q.append("includes[]", "cover_art");
  q.append("includes[]", "author");
  q.append("includes[]", "artist");

  const data = await mdFetch<{ data: MdManga[] }>(
    `/manga?${q}&${ratingsQuery()}`,
    60_000,
  );
  return data.data.map(mapManga);
}

export async function getManga(id: string): Promise<MangaCard> {
  const q = new URLSearchParams();
  q.append("includes[]", "cover_art");
  q.append("includes[]", "author");
  q.append("includes[]", "artist");

  const data = await mdFetch<{ data: MdManga }>(`/manga/${id}?${q}`, 5 * 60_000);
  return mapManga(data.data);
}

export async function getChapters(
  mangaId: string,
  limit = 100,
  offset = 0,
): Promise<{ total: number; chapters: ChapterItem[] }> {
  const q = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    "translatedLanguage[]": "en",
    "order[chapter]": "desc",
  });
  q.append("includes[]", "scanlation_group");

  const data = await mdFetch<{
    total: number;
    data: Array<{
      id: string;
      attributes: {
        title: string | null;
        chapter: string | null;
        volume: string | null;
        pages: number;
        publishAt: string | null;
        translatedLanguage: string;
      };
      relationships?: Array<{
        type: string;
        attributes?: { name?: string };
      }>;
    }>;
  }>(`/manga/${mangaId}/feed?${q}`, 2 * 60_000);

  const chapters: ChapterItem[] = data.data.map((c) => {
    const group = c.relationships?.find((r) => r.type === "scanlation_group");
    return {
      id: c.id,
      title: c.attributes.title || "",
      chapter: c.attributes.chapter,
      volume: c.attributes.volume,
      pages: c.attributes.pages,
      publishAt: c.attributes.publishAt,
      group: group?.attributes?.name ?? null,
      language: c.attributes.translatedLanguage,
    };
  });

  return { total: data.total, chapters };
}

export async function getChapterPages(chapterId: string): Promise<ChapterPages> {
  const data = await mdFetch<{
    baseUrl: string;
    chapter: { hash: string; data: string[]; dataSaver: string[] };
  }>(`/at-home/server/${chapterId}`, 30_000);

  const { baseUrl, chapter } = data;
  return {
    chapterId,
    hash: chapter.hash,
    baseUrl,
    pages: chapter.data.map(
      (file) => `${baseUrl}/data/${chapter.hash}/${file}`,
    ),
    dataSaver: chapter.dataSaver.map(
      (file) => `${baseUrl}/data-saver/${chapter.hash}/${file}`,
    ),
  };
}

export async function getLatestUpdates(limit = 24): Promise<
  Array<MangaCard & { latestChapter: ChapterItem }>
> {
  const q = new URLSearchParams({
    limit: String(Math.min(limit * 2, 64)),
    "translatedLanguage[]": "en",
    "order[readableAt]": "desc",
  });
  q.append("includes[]", "manga");
  q.append("includes[]", "scanlation_group");

  const feed = await mdFetch<{
    data: Array<{
      id: string;
      attributes: {
        title: string | null;
        chapter: string | null;
        volume: string | null;
        pages: number;
        publishAt: string | null;
        translatedLanguage: string;
      };
      relationships?: Array<{
        type: string;
        id: string;
        attributes?: { name?: string };
      }>;
    }>;
  }>(`/chapter?${q}`, 60_000);

  const pairs: Array<{ mangaId: string; chapter: ChapterItem }> = [];
  const seen = new Set<string>();

  for (const ch of feed.data) {
    const mangaRel = ch.relationships?.find((r) => r.type === "manga");
    if (!mangaRel || seen.has(mangaRel.id)) continue;
    seen.add(mangaRel.id);
    const group = ch.relationships?.find((r) => r.type === "scanlation_group");
    pairs.push({
      mangaId: mangaRel.id,
      chapter: {
        id: ch.id,
        title: ch.attributes.title || "",
        chapter: ch.attributes.chapter,
        volume: ch.attributes.volume,
        pages: ch.attributes.pages,
        publishAt: ch.attributes.publishAt,
        group: group?.attributes?.name ?? null,
        language: ch.attributes.translatedLanguage,
      },
    });
    if (pairs.length >= limit) break;
  }

  if (!pairs.length) return [];

  const ids = new URLSearchParams({ limit: String(pairs.length) });
  for (const p of pairs) ids.append("ids[]", p.mangaId);
  ids.append("includes[]", "cover_art");
  ids.append("includes[]", "author");
  ids.append("includes[]", "artist");

  const mangaRes = await mdFetch<{ data: MdManga[] }>(
    `/manga?${ids}&${ratingsQuery()}`,
    60_000,
  );
  const byId = new Map(mangaRes.data.map((m) => [m.id, mapManga(m)]));

  return pairs
    .map((p) => {
      const manga = byId.get(p.mangaId);
      if (!manga) return null;
      return { ...manga, latestChapter: p.chapter };
    })
    .filter(Boolean) as Array<MangaCard & { latestChapter: ChapterItem }>;
}

export type TagItem = { id: string; name: string; group: string };

export async function getTags(): Promise<TagItem[]> {
  const data = await mdFetch<{
    data: Array<{
      id: string;
      attributes: { name: Record<string, string>; group: string };
    }>;
  }>(`/manga/tag?limit=100&order[name]=asc`, 24 * 60 * 60_000);

  return data.data
    .map((t) => ({
      id: t.id,
      name:
        t.attributes.name.en ||
        Object.values(t.attributes.name)[0] ||
        "Unknown",
      group: t.attributes.group,
    }))
    .filter((t) => t.group === "genre" || t.group === "theme")
    .slice(0, 48);
}

export async function browseManga(options: {
  sort?: "popular" | "recent" | "updated";
  status?: "ongoing" | "completed" | "hiatus";
  tagId?: string;
  limit?: number;
  offset?: number;
}): Promise<MangaCard[]> {
  const limit = options.limit ?? 36;
  const offset = options.offset ?? 0;
  const q = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    "availableTranslatedLanguage[]": "en",
  });

  const sort = options.sort ?? "popular";
  if (sort === "popular") q.set("order[followedCount]", "desc");
  if (sort === "recent") q.set("order[createdAt]", "desc");
  if (sort === "updated") q.set("order[latestUploadedChapter]", "desc");

  if (options.status) q.append("status[]", options.status);
  if (options.tagId) q.append("includedTags[]", options.tagId);

  q.append("includes[]", "cover_art");
  q.append("includes[]", "author");
  q.append("includes[]", "artist");

  const data = await mdFetch<{ data: MdManga[] }>(
    `/manga?${q}&${ratingsQuery()}`,
    2 * 60_000,
  );
  return data.data.map(mapManga);
}

export async function getRandomManga(): Promise<MangaCard> {
  const offset = Math.floor(Math.random() * 900);
  const batch = await getPopular(1, offset);
  if (batch[0]) return batch[0];
  const fallback = await getPopular(1, 0);
  if (!fallback[0]) throw new Error("No manga available");
  return fallback[0];
}
