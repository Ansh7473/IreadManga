import crypto from "node:crypto";
import { readJson, writeJson } from "./persist.js";

export type Comment = {
  id: string;
  chapterId: string;
  userId: string;
  displayName: string;
  body: string;
  createdAt: string;
  chapterLabel?: string;
  mangaTitle?: string;
  mangaId?: string;
};

type CommentDb = { items: Comment[] };

const FILE = "comments.json";

async function loadDb(): Promise<CommentDb> {
  return readJson<CommentDb>(FILE, { items: [] });
}

async function saveDb(db: CommentDb) {
  await writeJson(FILE, db);
}

export async function listComments(chapterId: string): Promise<Comment[]> {
  const db = await loadDb();
  return db.items
    .filter((c) => c.chapterId === chapterId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 100);
}

export async function listLatestComments(limit: number): Promise<Comment[]> {
  const db = await loadDb();
  const n = Math.min(50, Math.max(1, limit));
  return [...db.items]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, n);
}

export async function addComment(input: {
  chapterId: string;
  userId: string;
  displayName: string;
  body: string;
  chapterLabel?: string;
  mangaTitle?: string;
  mangaId?: string;
}): Promise<Comment> {
  const body = input.body.trim();
  if (body.length < 2 || body.length > 2000) {
    throw new Error("Comment must be 2–2000 characters");
  }
  const db = await loadDb();
  const chapterLabel = input.chapterLabel?.trim().slice(0, 200);
  const mangaTitle = input.mangaTitle?.trim().slice(0, 200);
  const mangaId = input.mangaId?.trim().slice(0, 64);
  const comment: Comment = {
    id: crypto.randomUUID(),
    chapterId: input.chapterId,
    userId: input.userId,
    displayName: input.displayName,
    body,
    createdAt: new Date().toISOString(),
    ...(chapterLabel ? { chapterLabel } : {}),
    ...(mangaTitle ? { mangaTitle } : {}),
    ...(mangaId ? { mangaId } : {}),
  };
  db.items.push(comment);
  await saveDb(db);
  return comment;
}
