import { LatestCommentsPanel } from "./LatestCommentsPanel";
import { LatestPostsPanel } from "./LatestPostsPanel";

export function CommunitySidebar() {
  return (
    <aside className="community-sidebar" aria-label="Community">
      <LatestPostsPanel />
      <LatestCommentsPanel />
    </aside>
  );
}
