import crypto from "node:crypto";
import { readJson, writeJson } from "./persist.js";

export type PostCategory = "general" | "feature" | "discussion";

export type Post = {
  id: string;
  userId: string;
  displayName: string;
  category: PostCategory;
  title: string;
  body: string;
  createdAt: string;
  replyCount: number;
  parentId?: string;
};

type PostDb = { items: Post[] };

const FILE = "posts.json";

const CATEGORIES: PostCategory[] = ["general", "feature", "discussion"];

async function loadDb(): Promise<PostDb> {
  return readJson<PostDb>(FILE, { items: [] });
}

async function saveDb(db: PostDb) {
  await writeJson(FILE, db);
}

function parseCategory(raw: string): PostCategory {
  const c = raw.trim().toLowerCase() as PostCategory;
  if (!CATEGORIES.includes(c)) throw new Error("Invalid category");
  return c;
}

export async function listLatestPosts(limit: number): Promise<Post[]> {
  const db = await loadDb();
  const n = Math.min(50, Math.max(1, limit));
  return db.items
    .filter((p) => !p.parentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, n);
}

export async function listPostsPaginated(
  limit: number,
  offset: number,
): Promise<{ items: Post[]; total: number }> {
  const db = await loadDb();
  const roots = db.items
    .filter((p) => !p.parentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const n = Math.min(50, Math.max(1, limit));
  const off = Math.max(0, offset);
  return {
    items: roots.slice(off, off + n),
    total: roots.length,
  };
}

export async function createPost(input: {
  userId: string;
  displayName: string;
  category: string;
  title: string;
  body: string;
}): Promise<Post> {
  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 3 || title.length > 200) {
    throw new Error("Title must be 3–200 characters");
  }
  if (body.length < 10 || body.length > 8000) {
    throw new Error("Body must be 10–8000 characters");
  }
  const db = await loadDb();
  const post: Post = {
    id: crypto.randomUUID(),
    userId: input.userId,
    displayName: input.displayName,
    category: parseCategory(input.category),
    title,
    body,
    createdAt: new Date().toISOString(),
    replyCount: 0,
  };
  db.items.push(post);
  await saveDb(db);
  return post;
}

export async function addPostReply(input: {
  parentId: string;
  userId: string;
  displayName: string;
  body: string;
}): Promise<Post> {
  const body = input.body.trim();
  if (body.length < 2 || body.length > 2000) {
    throw new Error("Reply must be 2–2000 characters");
  }
  const db = await loadDb();
  const parent = db.items.find((p) => p.id === input.parentId && !p.parentId);
  if (!parent) throw new Error("Post not found");
  const reply: Post = {
    id: crypto.randomUUID(),
    userId: input.userId,
    displayName: input.displayName,
    category: parent.category,
    title: `Re: ${parent.title}`.slice(0, 200),
    body,
    createdAt: new Date().toISOString(),
    replyCount: 0,
    parentId: parent.id,
  };
  parent.replyCount += 1;
  db.items.push(reply);
  await saveDb(db);
  return reply;
}
