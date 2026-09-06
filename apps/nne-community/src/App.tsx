import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { CollabBrand } from "./components/CollabBrand";
import { InstallAppPrompt } from "./components/InstallAppPrompt";
import { useAuth } from "./context/AuthContext";
import { AdminPage } from "./pages/AdminPage";
import { AdminReviewersPage } from "./pages/AdminReviewersPage";
import { AuthPage } from "./pages/AuthPage";
import { BeatCatalogPage } from "./pages/BeatCatalogPage";
import { EmailVerificationPage, ForgotPasswordPage, ResetPasswordPage } from "./pages/PasswordRecoveryPage";
import { JoinPage } from "./pages/JoinPage";
import { ReviewPage } from "./pages/ReviewPage";
import {
  FeedPage,
  HomePage,
  PlaylistsPage,
  ProfilePage,
  QuestsPage,
  RafflesPage,
  RewardsPage
} from "./pages/CommunityPages";

function RequireAuth({ admin = false }: { admin?: boolean }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="loading-screen"><CollabBrand /><strong>Cargando…</strong></div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return <AppLayout />;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route element={<RequireAuth />}>
          <Route index element={<HomePage />} />
          <Route path="quests" element={<QuestsPage />} />
          <Route path="beats" element={<BeatCatalogPage />} />
          <Route path="playlists" element={<PlaylistsPage />} />
          <Route path="raffles" element={<RafflesPage />} />
          <Route path="feed" element={<FeedPage />} />
          <Route path="rewards" element={<RewardsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="review" element={<ReviewPage />} />
        </Route>
        <Route element={<RequireAuth admin />}>
          <Route path="admin" element={<AdminPage />} />
          <Route path="admin/reviewers" element={<AdminReviewersPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <InstallAppPrompt />
    </>
  );
}
