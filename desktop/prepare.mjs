import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const desktopDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(desktopDir, "..");
const bundle = path.join(desktopDir, "bundle");
const serverDir = path.join(bundle, "server");

await rm(bundle, { recursive: true, force: true });
await mkdir(serverDir, { recursive: true });
await cp(path.join(root, "client", "dist"), path.join(bundle, "client-dist"), {
  recursive: true,
});
await cp(path.join(root, "server", "dist"), path.join(serverDir, "dist"), {
  recursive: true,
});

const pkg = {
  name: "ireadmanga-server",
  private: true,
  type: "module",
  dependencies: {
    "@fastify/cors": "^11.1.0",
    "@fastify/static": "^8.2.0",
    bcryptjs: "^3.0.3",
    fastify: "^5.6.1",
  },
};

await writeFile(
  path.join(serverDir, "package.json"),
  JSON.stringify(pkg, null, 2),
);
execSync("npm install --omit=dev", { cwd: serverDir, stdio: "inherit" });
console.log("Desktop bundle ready");
