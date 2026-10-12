import { Container, getContainer } from "@cloudflare/containers";

/** One container for the whole site so logins and comments stay on the same disk. */
export class MangaApp extends Container {
  defaultPort = 8787;
  sleepAfter = "30m";
  envVars = {
    NODE_ENV: "production",
    HOST: "0.0.0.0",
    PORT: "8787",
  };
}

type Env = {
  MANGA: DurableObjectNamespace<MangaApp>;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return getContainer(env.MANGA).fetch(request);
  },
};
