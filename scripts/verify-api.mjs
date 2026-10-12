const base = process.env.API_URL || "http://localhost:8787";

const checks = [
  ["/api/health", (j) => j.ok === true],
  ["/api/manga/popular?limit=1", (j) => j.data?.length >= 1],
  ["/api/manga/latest?limit=1", (j) => Array.isArray(j.data)],
  ["/api/tags", (j) => Array.isArray(j.data) && j.data.length > 0],
];

let failed = 0;

async function runCheck(path, assert) {
  const res = await fetch(`${base}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!assert(json)) throw new Error("assertion failed");
  console.log(`OK ${path}`);
}

for (const [path, assert] of checks) {
  try {
    await runCheck(path, assert);
  } catch (e) {
    failed++;
    console.error(`FAIL ${path}:`, e.message || e);
  }
}

try {
  const email = `verify-${Date.now()}@example.test`;
  const password = "verify-pass-1";
  const reg = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      displayName: "Verify Bot",
    }),
  });
  if (!reg.ok) throw new Error(`register HTTP ${reg.status}`);
  const regJson = await reg.json();
  const token = regJson.token;
  if (!token) throw new Error("no token");

  const pop = await fetch(`${base}/api/manga/popular?limit=1`);
  const popJson = await pop.json();
  const mangaId = popJson.data?.[0]?.id;
  if (!mangaId) throw new Error("no manga for chapter test");

  const chRes = await fetch(`${base}/api/manga/${mangaId}/chapters?limit=1`);
  const chJson = await chRes.json();
  const chapterId = chJson.chapters?.[0]?.id;
  if (!chapterId) throw new Error("no chapter for comment test");

  const post = await fetch(`${base}/api/chapter/${chapterId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ body: "verify-api smoke comment" }),
  });
  if (!post.ok) throw new Error(`post comment HTTP ${post.status}`);

  const list = await fetch(`${base}/api/chapter/${chapterId}/comments`);
  const listJson = await list.json();
  if (!listJson.data?.some((c) => c.body.includes("verify-api"))) {
    throw new Error("comment not listed");
  }
  const avatars = await fetch(`${base}/api/profile/avatars`);
  if (!avatars.ok) throw new Error(`avatars HTTP ${avatars.status}`);
  const avJson = await avatars.json();
  if (!avJson.data?.length) throw new Error("no avatars");

  const prog = await fetch(`${base}/api/reading/progress`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ chapterId }),
  });
  if (!prog.ok) throw new Error(`reading progress HTTP ${prog.status}`);

  const board = await fetch(`${base}/api/leaderboard?limit=5`);
  if (!board.ok) throw new Error(`leaderboard HTTP ${board.status}`);
  const boardJson = await board.json();
  if (!Array.isArray(boardJson.data)) throw new Error("leaderboard not array");

  const latestComments = await fetch(`${base}/api/comments/latest?limit=5`);
  if (!latestComments.ok) throw new Error(`comments/latest HTTP ${latestComments.status}`);
  const lcJson = await latestComments.json();
  if (!Array.isArray(lcJson.data)) throw new Error("comments/latest not array");

  const latestPosts = await fetch(`${base}/api/posts/latest?limit=5`);
  if (!latestPosts.ok) throw new Error(`posts/latest HTTP ${latestPosts.status}`);
  const lpJson = await latestPosts.json();
  if (!Array.isArray(lpJson.data)) throw new Error("posts/latest not array");

  const newPost = await fetch(`${base}/api/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      category: "general",
      title: "verify-api smoke post",
      body: "Automated verify-api community check.",
    }),
  });
  if (!newPost.ok) throw new Error(`create post HTTP ${newPost.status}`);

  const pubCollections = await fetch(`${base}/api/collections/latest?limit=5`);
  if (!pubCollections.ok) throw new Error(`collections/latest HTTP ${pubCollections.status}`);
  const colLatest = await pubCollections.json();
  if (!Array.isArray(colLatest.data)) throw new Error("collections/latest not array");

  const newCol = await fetch(`${base}/api/collections`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: "verify-api list",
      mangaIds: mangaId ? [mangaId] : [],
    }),
  });
  if (!newCol.ok) throw new Error(`create collection HTTP ${newCol.status}`);

  const mine = await fetch(`${base}/api/collections/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!mine.ok) throw new Error(`collections/mine HTTP ${mine.status}`);

  console.log("OK /api/auth + social + collections");
} catch (e) {
  failed++;
  console.error("FAIL auth/social:", e.message || e);
}

process.exit(failed ? 1 : 0);
