import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { Layout } from "./components/Layout";

const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const BrowsePage = lazy(() => import("./pages/BrowsePage"));
const MangaPage = lazy(() => import("./pages/MangaPage"));
const ReaderPage = lazy(() => import("./pages/ReaderPage"));
const LibraryPage = lazy(() => import("./pages/LibraryPage"));
const CollectionsPage = lazy(() => import("./pages/CollectionsPage"));
const CollectionDetailPage = lazy(() => import("./pages/CollectionDetailPage"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const CommunityCommentsPage = lazy(
  () => import("./pages/CommunityCommentsPage"),
);
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));

function PageFallback() {
  return <div className="skeleton" style={{ height: 320, marginTop: "1rem" }} />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="browse" element={<BrowsePage />} />
              <Route path="library" element={<LibraryPage />} />
              <Route path="collections" element={<CollectionsPage />} />
              <Route path="collections/:id" element={<CollectionDetailPage />} />
              <Route path="community" element={<CommunityPage />} />
              <Route
                path="community/comments"
                element={<CommunityCommentsPage />}
              />
              <Route path="login" element={<LoginPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />
              <Route path="manga/:id" element={<MangaPage />} />
              <Route path="read/:chapterId" element={<ReaderPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
