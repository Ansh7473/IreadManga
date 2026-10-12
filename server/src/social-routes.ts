import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  getUserByToken,
  loginUser,
  logoutToken,
  registerUser,
} from "./auth.js";
import { listAvatarsPublic } from "./avatars.js";
import { addComment, listComments, listLatestComments } from "./comments.js";
import {
  addMangaToCollection,
  createCollection,
  deleteCollection,
  getCollectionById,
  listCollectionsForUser,
  listLatestCollections,
  removeMangaFromCollection,
  updateCollection,
} from "./collections.js";
import {
  getLeaderboard,
  getRankTiers,
  getUserSnippet,
  recordChapterRead,
  updateProfile,
} from "./profiles.js";

function bearerToken(req: FastifyRequest): string {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return "";
  return h.slice(7).trim();
}

export async function registerSocialRoutes(app: FastifyInstance) {
  app.post<{
    Body: { email?: string; password?: string; displayName?: string };
  }>("/api/auth/register", async (req, reply) => {
    try {
      const { email = "", password = "", displayName = "" } = req.body ?? {};
      const result = await registerUser({ email, password, displayName });
      return result;
    } catch (e) {
      return reply
        .code(400)
        .send({ error: e instanceof Error ? e.message : "Register failed" });
    }
  });

  app.post<{ Body: { email?: string; password?: string } }>(
    "/api/auth/login",
    async (req, reply) => {
      try {
        const { email = "", password = "" } = req.body ?? {};
        const result = await loginUser({ email, password });
        return result;
      } catch (e) {
        return reply
          .code(401)
          .send({ error: e instanceof Error ? e.message : "Login failed" });
      }
    },
  );

  app.post("/api/auth/logout", async (req) => {
    await logoutToken(bearerToken(req));
    return { ok: true };
  });

  app.get("/api/auth/me", async (req, reply) => {
    const user = await getUserByToken(bearerToken(req));
    if (!user) return reply.code(401).send({ error: "Not signed in" });
    return { user };
  });

  app.get("/api/users/me/profile", async (req, reply) => {
    const user = await getUserByToken(bearerToken(req));
    if (!user) return reply.code(401).send({ error: "Not signed in" });
    return { user };
  });

  app.patch<{ Body: { avatarId?: string; bio?: string } }>(
    "/api/users/me/profile",
    async (req, reply) => {
      const user = await getUserByToken(bearerToken(req));
      if (!user) return reply.code(401).send({ error: "Sign in required" });
      try {
        const updated = await updateProfile(user.id, req.body ?? {});
        return { user: updated };
      } catch (e) {
        return reply
          .code(400)
          .send({ error: e instanceof Error ? e.message : "Update failed" });
      }
    },
  );

  app.get<{ Querystring: { limit?: string } }>(
    "/api/leaderboard",
    async (req) => {
      const limit = Number(req.query.limit ?? 20);
      return { data: await getLeaderboard(limit) };
    },
  );

  app.get("/api/profile/avatars", async () => {
    return { data: listAvatarsPublic(), ranks: getRankTiers() };
  });

  app.post<{ Body: { chapterId?: string } }>(
    "/api/reading/progress",
    async (req, reply) => {
      const user = await getUserByToken(bearerToken(req));
      if (!user) return reply.code(401).send({ error: "Sign in to track reading" });
      try {
        const result = await recordChapterRead(user.id, req.body?.chapterId ?? "");
        return { data: result };
      } catch (e) {
        return reply
          .code(400)
          .send({ error: e instanceof Error ? e.message : "Progress failed" });
      }
    },
  );

  app.get<{ Params: { chapterId: string } }>(
    "/api/chapter/:chapterId/comments",
    async (req) => {
      const items = await listComments(req.params.chapterId);
      const enriched = await Promise.all(
        items.map(async (c) => {
          const snippet = await getUserSnippet(c.userId);
          return {
            ...c,
            avatarId: snippet?.avatarId ?? "scroll-blue",
            avatarGlyph: snippet?.avatarGlyph ?? "📜",
            avatarGradient:
              snippet?.avatarGradient ??
              "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            rank: snippet?.rank ?? {
              id: "novice",
              label: "Novice Reader",
              minChapters: 0,
            },
          };
        }),
      );
      return { data: enriched };
    },
  );

  app.post<{
    Params: { chapterId: string };
    Body: {
      body?: string;
      chapterLabel?: string;
      mangaTitle?: string;
      mangaId?: string;
    };
  }>("/api/chapter/:chapterId/comments", async (req, reply) => {
    const user = await getUserByToken(bearerToken(req));
    if (!user) return reply.code(401).send({ error: "Sign in to comment" });
    try {
      const comment = await addComment({
        chapterId: req.params.chapterId,
        userId: user.id,
        displayName: user.displayName,
        body: req.body?.body ?? "",
        chapterLabel: req.body?.chapterLabel,
        mangaTitle: req.body?.mangaTitle,
        mangaId: req.body?.mangaId,
      });
      const snippet = await getUserSnippet(user.id);
      return {
        data: {
          ...comment,
          avatarId: snippet?.avatarId ?? user.avatarId,
          avatarGlyph: snippet?.avatarGlyph ?? "📜",
          avatarGradient:
            snippet?.avatarGradient ??
            "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          rank: snippet?.rank ?? user.rank,
        },
      };
    } catch (e) {
      return reply
        .code(400)
        .send({ error: e instanceof Error ? e.message : "Comment failed" });
    }
  });

  app.get<{ Querystring: { limit?: string } }>(
    "/api/comments/latest",
    async (req) => {
      const limit = Number(req.query.limit ?? 8);
      const items = await listLatestComments(limit);
      const enriched = await Promise.all(
        items.map(async (c) => {
          const snippet = await getUserSnippet(c.userId);
          return {
            ...c,
            avatarId: snippet?.avatarId ?? "scroll-blue",
            avatarGlyph: snippet?.avatarGlyph ?? "📜",
            avatarGradient:
              snippet?.avatarGradient ??
              "linear-gradient(135deg, #ff5c28, #cc4520)",
            rank: snippet?.rank ?? {
              id: "novice",
              label: "Novice Reader",
              minChapters: 0,
            },
          };
        }),
      );
      return { data: enriched };
    },
  );

  app.get<{ Querystring: { limit?: string } }>(
    "/api/collections/latest",
    async (req) => {
      const limit = Number(req.query.limit ?? 12);
      return { data: await listLatestCollections(limit) };
    },
  );

  app.get("/api/collections/mine", async (req, reply) => {
    const user = await getUserByToken(bearerToken(req));
    if (!user) return reply.code(401).send({ error: "Sign in required" });
    const items = await listCollectionsForUser(user.id);
    return { data: items };
  });

  app.get<{ Params: { id: string } }>(
    "/api/collections/:id",
    async (req, reply) => {
      const data = await getCollectionById(req.params.id);
      if (!data) return reply.code(404).send({ error: "Not found" });
      return { data };
    },
  );

  app.post<{ Body: { title?: string; description?: string } }>(
    "/api/collections",
    async (req, reply) => {
      const user = await getUserByToken(bearerToken(req));
      if (!user) return reply.code(401).send({ error: "Sign in required" });
      try {
        const record = await createCollection({
          userId: user.id,
          displayName: user.displayName,
          title: req.body?.title ?? "",
          description: req.body?.description,
        });
        const data = await getCollectionById(record.id);
        return { data };
      } catch (e) {
        return reply
          .code(400)
          .send({ error: e instanceof Error ? e.message : "Create failed" });
      }
    },
  );

  app.patch<{
    Params: { id: string };
    Body: { title?: string; description?: string };
  }>("/api/collections/:id", async (req, reply) => {
    const user = await getUserByToken(bearerToken(req));
    if (!user) return reply.code(401).send({ error: "Sign in required" });
    try {
      await updateCollection(req.params.id, user.id, req.body ?? {});
      const data = await getCollectionById(req.params.id);
      return { data };
    } catch (e) {
      return reply
        .code(400)
        .send({ error: e instanceof Error ? e.message : "Update failed" });
    }
  });

  app.delete<{ Params: { id: string } }>(
    "/api/collections/:id",
    async (req, reply) => {
      const user = await getUserByToken(bearerToken(req));
      if (!user) return reply.code(401).send({ error: "Sign in required" });
      try {
        await deleteCollection(req.params.id, user.id);
        return { ok: true };
      } catch (e) {
        return reply
          .code(400)
          .send({ error: e instanceof Error ? e.message : "Delete failed" });
      }
    },
  );

  app.post<{ Params: { id: string }; Body: { mangaId?: string } }>(
    "/api/collections/:id/manga",
    async (req, reply) => {
      const user = await getUserByToken(bearerToken(req));
      if (!user) return reply.code(401).send({ error: "Sign in required" });
      try {
        await addMangaToCollection(
          req.params.id,
          user.id,
          req.body?.mangaId ?? "",
        );
        const data = await getCollectionById(req.params.id);
        return { data };
      } catch (e) {
        return reply
          .code(400)
          .send({ error: e instanceof Error ? e.message : "Add failed" });
      }
    },
  );

  app.delete<{ Params: { id: string; mangaId: string } }>(
    "/api/collections/:id/manga/:mangaId",
    async (req, reply) => {
      const user = await getUserByToken(bearerToken(req));
      if (!user) return reply.code(401).send({ error: "Sign in required" });
      try {
        await removeMangaFromCollection(
          req.params.id,
          user.id,
          req.params.mangaId,
        );
        const data = await getCollectionById(req.params.id);
        return { data };
      } catch (e) {
        return reply
          .code(400)
          .send({ error: e instanceof Error ? e.message : "Remove failed" });
      }
    },
  );
}
