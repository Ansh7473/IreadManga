import type { FastifyInstance } from "fastify";
import {
  browseManga,
  getChapterPages,
  getChapters,
  getLatestUpdates,
  getManga,
  getPopular,
  getRandomManga,
  getRecentlyAdded,
  getTags,
  searchManga,
} from "./mangadex.js";

export async function registerRoutes(app: FastifyInstance) {
  app.get("/api/health", async () => ({ ok: true, provider: "mangadex" }));

  app.get<{
    Querystring: { limit?: string; offset?: string };
  }>("/api/manga/popular", async (req) => {
    const limit = Number(req.query.limit ?? 24);
    const offset = Number(req.query.offset ?? 0);
    return { data: await getPopular(limit, offset) };
  });

  app.get<{ Querystring: { limit?: string } }>(
    "/api/manga/recent",
    async (req) => {
      const limit = Number(req.query.limit ?? 24);
      return { data: await getRecentlyAdded(limit) };
    },
  );

  app.get<{ Querystring: { limit?: string } }>(
    "/api/manga/latest",
    async (req) => {
      const limit = Number(req.query.limit ?? 18);
      return { data: await getLatestUpdates(limit) };
    },
  );

  app.get("/api/manga/random", async () => {
    return { data: await getRandomManga() };
  });

  app.get("/api/tags", async () => {
    return { data: await getTags() };
  });

  app.get<{
    Querystring: {
      sort?: string;
      status?: string;
      tag?: string;
      limit?: string;
      offset?: string;
    };
  }>("/api/manga/browse", async (req) => {
    const sort = req.query.sort as "popular" | "recent" | "updated" | undefined;
    const status = req.query.status as
      | "ongoing"
      | "completed"
      | "hiatus"
      | undefined;
    const limit = Number(req.query.limit ?? 36);
    const offset = Number(req.query.offset ?? 0);
    return {
      data: await browseManga({
        sort: sort ?? "popular",
        status,
        tagId: req.query.tag,
        limit,
        offset,
      }),
    };
  });

  app.get<{
    Querystring: { q?: string; limit?: string; offset?: string };
  }>("/api/manga/search", async (req, reply) => {
    const q = (req.query.q ?? "").trim();
    if (!q) return reply.code(400).send({ error: "Missing q" });
    const limit = Number(req.query.limit ?? 24);
    const offset = Number(req.query.offset ?? 0);
    return { data: await searchManga(q, limit, offset) };
  });

  app.get<{ Params: { id: string } }>("/api/manga/:id", async (req) => {
    return { data: await getManga(req.params.id) };
  });

  app.get<{
    Params: { id: string };
    Querystring: { limit?: string; offset?: string };
  }>("/api/manga/:id/chapters", async (req) => {
    const limit = Number(req.query.limit ?? 100);
    const offset = Number(req.query.offset ?? 0);
    return await getChapters(req.params.id, limit, offset);
  });

  app.get<{ Params: { id: string } }>(
    "/api/chapter/:id/pages",
    async (req) => {
      return { data: await getChapterPages(req.params.id) };
    },
  );

  // Proxy chapter images so Referer works and CORS is clean
  app.get<{ Querystring: { url?: string } }>(
    "/api/proxy",
    async (req, reply) => {
      const url = req.query.url;
      if (!url || !/^https:\/\//i.test(url)) {
        return reply.code(400).send({ error: "Invalid url" });
      }

      const allowed =
        url.includes("mangadex.org") ||
        url.includes("mangadex.network") ||
        url.includes("uploads.mangadex.org");

      if (!allowed) {
        return reply.code(403).send({ error: "Host not allowed" });
      }

      const upstream = await fetch(url, {
        headers: {
          Referer: "https://mangadex.org",
          "User-Agent": "IReadManga/0.1",
        },
      });

      if (!upstream.ok) {
        return reply.code(upstream.status).send({ error: "Upstream failed" });
      }

      const contentType =
        upstream.headers.get("content-type") || "application/octet-stream";
      const buf = Buffer.from(await upstream.arrayBuffer());
      reply
        .header("Content-Type", contentType)
        .header("Cache-Control", "public, max-age=86400")
        .send(buf);
    },
  );
}
