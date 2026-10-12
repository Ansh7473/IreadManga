import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerRoutes } from "./routes.js";
import { registerCommunityRoutes } from "./community-routes.js";
import { registerSocialRoutes } from "./social-routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? "0.0.0.0";
const isProd = process.env.NODE_ENV === "production";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: true,
  });

  await registerRoutes(app);
  await registerSocialRoutes(app);
  await registerCommunityRoutes(app);

  if (isProd) {
    const clientDist = process.env.CLIENT_DIST
      ? path.resolve(process.env.CLIENT_DIST)
      : path.join(__dirname, "../../client/dist");
    await app.register(fastifyStatic, {
      root: clientDist,
      wildcard: false,
    });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith("/api/")) {
        return reply.code(404).send({ error: "Not found" });
      }
      return reply.sendFile("index.html");
    });
  }

  await app.listen({ port: PORT, host: HOST });
  console.log(`I Read Manga API on http://${HOST}:${PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
