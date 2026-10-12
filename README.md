# I Read Manga

Fast manga reader — **Fastify** API + **Vite/React** frontend, **Motion** for smooth UI, lazy routes/images, MangaDex as the current content provider (swappable later).

## Run

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5174  
- API: http://localhost:8787  

## Scripts

- `npm run dev` — API + Vite together (UI **http://localhost:5174**)  
- `npm run build` — build client + server  
- `npm start` — production server (serves `client/dist`)  
- `npm test` — unit tests (library + time helpers)  
- `npm run verify` — smoke-test API routes (server must be running)  

## Notes

- Ads are placeholder slots (`AdSlot`) — wire your network later  
- Library / history stored in `localStorage` (works logged out)  
- **Accounts** (`/login`): chapter comments, profile avatars, reading ranks; each chapter counts once toward rank while signed in  
- **Leaderboard**: http://localhost:5174/leaderboard  
- **Community**: `/community` (posts), `/community/comments` — latest widgets on Home and Browse sidebars  
- **Collections**: `/collections` (public lists), `/library?tab=collections` to create yours; save titles from the manga page when signed in  
- Chapter images go through `/api/proxy` for clean loading  
- Auth and progress data live in `server/data/*.json` (gitignored)

## Desktop (Windows and Mac)

The desktop app is the same UI plus the API, packaged with Electron. Windows installers build on Windows. Mac disk images build on a Mac (GitHub Actions does both when you push a `v*` tag).

```bash
npm run desktop
npm run desktop:win
```

Installers land in `release/`.

## Android

Same React UI via Capacitor. The phone cannot run the Node API, so set the deployed API before building:

```bash
# PowerShell
$env:VITE_API_BASE="https://your-api.example"
npm run build -w client
npm exec --prefix client -- cap sync android
```

Open `client/android` in Android Studio and run on a device. `CAP_SERVER_URL` in `client/capacitor.config.ts` can point a debug build at a machine on your LAN instead.  
