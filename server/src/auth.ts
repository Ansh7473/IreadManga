import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { DEFAULT_AVATAR_ID, getAvatar } from "./avatars.js";
import { rankForChapters, rankProgressDetail } from "./ranks.js";
import { loadAuthDb, saveAuthDb, type UserRecord } from "./auth-store.js";

export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  avatarId: string;
  avatarGlyph: string;
  avatarGradient: string;
  bio: string;
  chaptersRead: number;
  rank: ReturnType<typeof rankForChapters>;
  rankProgress: ReturnType<typeof rankProgressDetail>;
};

export function toPublic(u: UserRecord): PublicUser {
  const chaptersRead = u.chaptersRead ?? 0;
  const avatar = getAvatar(u.avatarId);
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    createdAt: u.createdAt,
    avatarId: avatar.id,
    avatarGlyph: avatar.glyph,
    avatarGradient: avatar.gradient,
    bio: u.bio ?? "",
    chaptersRead,
    rank: rankForChapters(chaptersRead),
    rankProgress: rankProgressDetail(chaptersRead),
  };
}

export async function registerUser(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<{ user: PublicUser; token: string }> {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim() || email.split("@")[0];
  if (!email.includes("@") || input.password.length < 6) {
    throw new Error("Invalid email or password (min 6 chars)");
  }

  const db = await loadAuthDb();
  if (db.users.some((u) => u.email === email)) {
    throw new Error("Email already registered");
  }

  const user: UserRecord = {
    id: crypto.randomUUID(),
    email,
    displayName,
    passwordHash: await bcrypt.hash(input.password, 10),
    createdAt: new Date().toISOString(),
    avatarId: DEFAULT_AVATAR_ID,
    bio: "",
    chaptersRead: 0,
  };
  const token = crypto.randomUUID();
  db.users.push(user);
  db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
  await saveAuthDb(db);
  return { user: toPublic(user), token };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ user: PublicUser; token: string }> {
  const email = input.email.trim().toLowerCase();
  const db = await loadAuthDb();
  const user = db.users.find((u) => u.email === email);
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new Error("Invalid email or password");
  }
  const token = crypto.randomUUID();
  db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
  await saveAuthDb(db);
  return { user: toPublic(user), token };
}

export async function logoutToken(token: string) {
  const db = await loadAuthDb();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  await saveAuthDb(db);
}

export async function getUserByToken(token: string): Promise<PublicUser | null> {
  if (!token) return null;
  const db = await loadAuthDb();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  const user = db.users.find((u) => u.id === session.userId);
  return user ? toPublic(user) : null;
}
