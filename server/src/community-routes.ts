import type { FastifyInstance, FastifyRequest } from "fastify";
import { getUserByToken } from "./auth.js";
import {
  addPostReply,
  createPost,
  listLatestPosts,
  listPostsPaginated,
} from "./posts.js";
import { getUserSnippet } from "./profiles.js";
import type { RankTier } from "./ranks.js";

function bearerToken(req: FastifyRequest): string {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return "";
  return h.slice(7).trim();
}

const defaultRank: RankTier = {
  id: "novice",
  label: "Novice Reader",
  minChapters: 0,
};

async function enrichUserRow<T extends { userId: string }>(row: T) {
  const snippet = await getUserSnippet(row.userId);
  return {
    ...row,
    avatarId: snippet?.avatarId ?? "scroll-blue",
    avatarGlyph: snippet?.avatarGlyph ?? "📜",
    avatarGradient:
      snippet?.avatarGradient ?? "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    rank: snippet?.rank ?? defaultRank,
  };
}

export async function registerCommunityRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { limit?: string } }>(
    "/api/posts/latest",
    async (req) => {
      const limit = Number(req.query.limit ?? 8);
      const items = await listLatestPosts(limit);
      const data = await Promise.all(items.map((p) => enrichUserRow(p)));
      return { data };
    },
  );

  app.get<{ Querystring: { limit?: string; offset?: string } }>(
    "/api/posts",
    async (req) => {
      const limit = Number(req.query.limit ?? 20);
      const offset = Number(req.query.offset ?? 0);
      const { items, total } = await listPostsPaginated(limit, offset);
      const data = await Promise.all(items.map((p) => enrichUserRow(p)));
      return { data, total };
    },
  );

  app.post<{
    Body: { category?: string; title?: string; body?: string };
  }>("/api/posts", async (req, reply) => {
    const user = await getUserByToken(bearerToken(req));
    if (!user) return reply.code(401).send({ error: "Sign in to post" });
    try {
      const post = await createPost({
        userId: user.id,
        displayName: user.displayName,
        category: req.body?.category ?? "general",
        title: req.body?.title ?? "",
        body: req.body?.body ?? "",
      });
      return { data: await enrichUserRow(post) };
    } catch (e) {
      return reply
        .code(400)
        .send({ error: e instanceof Error ? e.message : "Post failed" });
    }
  });

  app.post<{ Params: { id: string }; Body: { body?: string } }>(
    "/api/posts/:id/replies",
    async (req, reply) => {
      const user = await getUserByToken(bearerToken(req));
      if (!user) return reply.code(401).send({ error: "Sign in to reply" });
      try {
        const replyPost = await addPostReply({
          parentId: req.params.id,
          userId: user.id,
          displayName: user.displayName,
          body: req.body?.body ?? "",
        });
        return { data: await enrichUserRow(replyPost) };
      } catch (e) {
        return reply
          .code(400)
          .send({ error: e instanceof Error ? e.message : "Reply failed" });
      }
    },
  );
}
