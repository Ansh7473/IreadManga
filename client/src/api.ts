import { getToken, type AuthUser } from "./auth/session";
import type { ChapterItem, ChapterPages, LatestItem, MangaCard } from "./types";

export type TagItem = { id: string; name: string; group: string };

export type RankTier = {
  id: string;
  label: string;
  minChapters: number;
};

export type UserProfileFields = {
  avatarId?: string;
  avatarGlyph?: string;
  avatarGradient?: string;
  rank?: RankTier;
};

export type CommentItem = {
  id: string;
  chapterId: string;
  userId: string;
  displayName: string;
  body: string;
  createdAt: string;
} & UserProfileFields;

export type LatestCommentItem = CommentItem & {
  chapterLabel?: string;
  mangaTitle?: string;
  mangaId?: string;
};

export type PostCategory = "general" | "feature" | "discussion";

export type PostItem = {
  id: string;
  userId: string;
  displayName: string;
  category: PostCategory;
  title: string;
  body: string;
  createdAt: string;
  replyCount: number;
} & UserProfileFields;

export type AvatarPreset = {
  id: string;
  label: string;
  tier: "basic" | "advanced";
  unlockRankId: string;
  glyph: string;
  gradient: string;
};

export type CollectionSummary = {
  id: string;
  userId: string;
  displayName: string;
  title: string;
  description?: string;
  mangaIds: string[];
  createdAt: string;
  updatedAt: string;
  titleCount: number;
  coverUrls: (string | null)[];
  avatarId: string;
  avatarGlyph: string;
  avatarGradient: string;
  rank: RankTier;
};

export type CollectionBrief = {
  id: string;
  userId: string;
  displayName: string;
  title: string;
  description?: string;
  mangaIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type LeaderboardEntry = {
  id: string;
  displayName: string;
  avatarId: string;
  avatarGlyph: string;
  avatarGradient: string;
  chaptersRead: number;
  rank: RankTier;
};

const API_BASE = String(import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

/** Prefix relative API paths. Desktop uses same-origin; Android sets VITE_API_BASE. */
export function apiPath(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path}`;
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(apiPath(url), { ...init, headers });
  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      if (!res.ok) {
        throw new Error(text.slice(0, 180) || `Request failed: ${res.status}`);
      }
      throw new Error("Invalid server response");
    }
  }
  if (!res.ok) {
    const err =
      json &&
      typeof json === "object" &&
      "error" in json &&
      typeof (json as { error?: unknown }).error === "string"
        ? (json as { error: string }).error
        : `Request failed: ${res.status}`;
    throw new Error(err);
  }
  return json as T;
}

export const api = {
  popular: (limit = 24) =>
    getJson<{ data: MangaCard[] }>(`/api/manga/popular?limit=${limit}`).then(
      (r) => r.data,
    ),
  recent: (limit = 24) =>
    getJson<{ data: MangaCard[] }>(`/api/manga/recent?limit=${limit}`).then(
      (r) => r.data,
    ),
  latest: (limit = 24) =>
    getJson<{ data: LatestItem[] }>(`/api/manga/latest?limit=${limit}`).then(
      (r) => r.data,
    ),
  browse: (params: {
    sort?: string;
    status?: string;
    tag?: string;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params.sort) q.set("sort", params.sort);
    if (params.status) q.set("status", params.status);
    if (params.tag) q.set("tag", params.tag);
    q.set("limit", String(params.limit ?? 36));
    return getJson<{ data: MangaCard[] }>(`/api/manga/browse?${q}`).then(
      (r) => r.data,
    );
  },
  tags: () => getJson<{ data: TagItem[] }>("/api/tags").then((r) => r.data),
  random: () =>
    getJson<{ data: MangaCard }>("/api/manga/random").then((r) => r.data),
  search: (q: string, limit = 24) =>
    getJson<{ data: MangaCard[] }>(
      `/api/manga/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    ).then((r) => r.data),
  manga: (id: string) =>
    getJson<{ data: MangaCard }>(`/api/manga/${id}`).then((r) => r.data),
  chapters: (id: string, limit = 100, offset = 0) =>
    getJson<{ total: number; chapters: ChapterItem[] }>(
      `/api/manga/${id}/chapters?limit=${limit}&offset=${offset}`,
    ),
  pages: (chapterId: string) =>
    getJson<{ data: ChapterPages }>(`/api/chapter/${chapterId}/pages`).then(
      (r) => r.data,
    ),
  comments: (chapterId: string) =>
    getJson<{ data: CommentItem[] }>(
      `/api/chapter/${chapterId}/comments`,
    ).then((r) => r.data),
  postComment: (
    chapterId: string,
    body: string,
    context?: { chapterLabel?: string; mangaTitle?: string; mangaId?: string },
  ) =>
    getJson<{ data: CommentItem }>(`/api/chapter/${chapterId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, ...context }),
    }).then((r) => r.data),
  latestPosts: (limit = 8) =>
    getJson<{ data: PostItem[] }>(`/api/posts/latest?limit=${limit}`).then(
      (r) => r.data,
    ),
  listPosts: (limit = 20, offset = 0) =>
    getJson<{ data: PostItem[]; total: number }>(
      `/api/posts?limit=${limit}&offset=${offset}`,
    ),
  createPost: (input: {
    category: PostCategory;
    title: string;
    body: string;
  }) =>
    getJson<{ data: PostItem }>("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then((r) => r.data),
  latestComments: (limit = 10) =>
    getJson<{ data: LatestCommentItem[] }>(
      `/api/comments/latest?limit=${limit}`,
    ).then((r) => r.data),
  leaderboard: (limit = 20) =>
    getJson<{ data: LeaderboardEntry[] }>(
      `/api/leaderboard?limit=${limit}`,
    ).then((r) => r.data),
  avatars: () =>
    getJson<{ data: AvatarPreset[]; ranks: RankTier[] }>(
      "/api/profile/avatars",
    ),
  recordReading: (chapterId: string) =>
    getJson<{
      data: { chaptersRead: number; newRead: boolean; rank: RankTier };
    }>("/api/reading/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterId }),
    }).then((r) => r.data),
  patchProfile: (patch: { avatarId?: string; bio?: string }) =>
    getJson<{ user: AuthUser }>(
      "/api/users/me/profile",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      },
    ).then((r) => r.user),
  collectionsLatest: (limit = 12) =>
    getJson<{ data: CollectionSummary[] }>(
      `/api/collections/latest?limit=${limit}`,
    ).then((r) => r.data),
  collection: (id: string) =>
    getJson<{ data: CollectionSummary }>(`/api/collections/${id}`).then(
      (r) => r.data,
    ),
  collectionsMine: () =>
    getJson<{ data: CollectionBrief[] }>("/api/collections/mine").then(
      (r) => r.data,
    ),
  createCollection: (body: { title: string; description?: string }) =>
    getJson<{ data: CollectionSummary }>("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.data),
  patchCollection: (
    id: string,
    body: { title?: string; description?: string },
  ) =>
    getJson<{ data: CollectionSummary }>(`/api/collections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.data),
  deleteCollection: (id: string) =>
    getJson<{ ok: boolean }>(`/api/collections/${id}`, {
      method: "DELETE",
    }),
  addToCollection: (collectionId: string, mangaId: string) =>
    getJson<{ data: CollectionSummary }>(
      `/api/collections/${collectionId}/manga`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mangaId }),
      },
    ).then((r) => r.data),
  removeFromCollection: (collectionId: string, mangaId: string) =>
    getJson<{ data: CollectionSummary }>(
      `/api/collections/${collectionId}/manga/${mangaId}`,
      { method: "DELETE" },
    ).then((r) => r.data),
};

export function proxyUrl(url: string | null | undefined): string {
  if (!url) return "";
  return apiPath(`/api/proxy?url=${encodeURIComponent(url)}`);
}
