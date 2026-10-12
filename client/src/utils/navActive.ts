/** Sidebar / nav highlight — pathname-only NavLink matches all /browse routes otherwise. */
export function isBrowseNavActive(
  kind: "search" | "updated" | "recent",
  pathname: string,
  search: string,
): boolean {
  if (pathname !== "/browse") return false;
  const p = new URLSearchParams(search);
  if (p.get("q")) return kind === "search";
  const sort = p.get("sort") || "popular";
  if (kind === "updated") return sort === "updated";
  if (kind === "recent") return sort === "recent";
  return sort !== "updated" && sort !== "recent";
}

export function isLibraryNavActive(
  tab: "library" | "history",
  pathname: string,
  search: string,
): boolean {
  if (pathname !== "/library") return false;
  const param = new URLSearchParams(search).get("tab");
  const isHistory = param === "history";
  const isCollections = param === "collections";
  if (tab === "history") return isHistory;
  return !isHistory && !isCollections;
}
