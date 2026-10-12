import type { MangaCard } from "./types";

const LIBRARY_KEY = "irm:library";
const HISTORY_KEY = "irm:history";
const PROGRESS_KEY = "irm:progress";

export type HistoryEntry = {
  manga: MangaCard;
  chapterId: string;
  chapterLabel: string;
  at: number;
};

export type ProgressEntry = {
  chapterId: string;
  chapterLabel: string;
  page: number;
  at: number;
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getLibrary(): MangaCard[] {
  return readJson<MangaCard[]>(LIBRARY_KEY, []);
}

export function isInLibrary(id: string): boolean {
  return getLibrary().some((m) => m.id === id);
}

export function toggleLibrary(manga: MangaCard): boolean {
  const list = getLibrary();
  const exists = list.some((m) => m.id === manga.id);
  const next = exists ? list.filter((m) => m.id !== manga.id) : [manga, ...list];
  writeJson(LIBRARY_KEY, next);
  return !exists;
}

export function getHistory(): HistoryEntry[] {
  return readJson<HistoryEntry[]>(HISTORY_KEY, []);
}

export function pushHistory(
  manga: MangaCard,
  chapterId: string,
  chapterLabel: string,
) {
  const next = [
    { manga, chapterId, chapterLabel, at: Date.now() },
    ...getHistory().filter((h) => h.manga.id !== manga.id),
  ].slice(0, 40);
  writeJson(HISTORY_KEY, next);
}

export function getProgress(mangaId: string): ProgressEntry | null {
  const all = readJson<Record<string, ProgressEntry>>(PROGRESS_KEY, {});
  return all[mangaId] ?? null;
}

export function setProgress(
  mangaId: string,
  chapterId: string,
  chapterLabel: string,
  page = 0,
) {
  const all = readJson<Record<string, ProgressEntry>>(PROGRESS_KEY, {});
  all[mangaId] = { chapterId, chapterLabel, page, at: Date.now() };
  writeJson(PROGRESS_KEY, all);
}
