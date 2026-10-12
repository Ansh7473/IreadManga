import { readJson, writeJson } from "./persist.js";

export type UserRecord = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
  avatarId?: string;
  bio?: string;
  chaptersRead?: number;
};

type SessionRecord = { token: string; userId: string; createdAt: string };

export type AuthDb = {
  users: UserRecord[];
  sessions: SessionRecord[];
};

const FILE = "auth.json";

export async function loadAuthDb(): Promise<AuthDb> {
  return readJson<AuthDb>(FILE, { users: [], sessions: [] });
}

export async function saveAuthDb(db: AuthDb) {
  await writeJson(FILE, db);
}
