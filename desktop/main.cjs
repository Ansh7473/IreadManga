const { app, BrowserWindow } = require("electron");
const { spawn } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");

const PORT = 28787;

function bundled(rel) {
  if (app.isPackaged) return path.join(process.resourcesPath, rel);
  return path.join(__dirname, "bundle", rel);
}

function waitForHealth() {
  const url = `http://127.0.0.1:${PORT}/api/health`;
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode === 200) resolve();
        else retry();
      });
      req.on("error", retry);
      req.setTimeout(1500, () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      if (Date.now() - started > 20000) {
        reject(new Error("Desktop server did not start"));
        return;
      }
      setTimeout(tick, 250);
    };
    tick();
  });
}

let serverProcess = null;

function startServer() {
  const serverDir = bundled("server");
  const entry = path.join(serverDir, "dist", "index.js");
  const dataDir = path.join(app.getPath("userData"), "data");
  serverProcess = spawn(process.execPath, [entry], {
    cwd: serverDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      HOST: "127.0.0.1",
      PORT: String(PORT),
      CLIENT_DIST: bundled("client-dist"),
      DATA_DIR: dataDir,
    },
    stdio: "inherit",
  });
  serverProcess.on("exit", (code) => {
    if (code && code !== 0) console.error("Server exited", code);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 390,
    minHeight: 640,
    backgroundColor: "#0c0c0d",
    title: "I Read Manga",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadURL(`http://127.0.0.1:${PORT}/`);
}

app.whenReady().then(async () => {
  startServer();
  try {
    await waitForHealth();
  } catch (err) {
    console.error(err);
    app.quit();
    return;
  }
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (serverProcess && !serverProcess.killed) serverProcess.kill();
});
