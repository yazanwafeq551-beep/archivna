import { createBrowserRouter, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LmsLayout } from "@/components/layout/LmsLayout";
import { useAuth } from "@/hooks/useAuth";
import { BrandLoader } from "@/components/shared/BrandLoader";

// Public Pages
import { HomePage } from "@/pages/public/HomePage";
import { SearchPage } from "@/pages/public/SearchPage";
import { ArchiveDetailPage } from "@/pages/public/ArchiveDetailPage";
import { NewsListPage } from "@/pages/public/NewsListPage";
import { NewsDetailPage } from "@/pages/public/NewsDetailPage";
import { AboutPage } from "@/pages/public/AboutPage";
import { PrivacyPage } from "@/pages/public/PrivacyPage";
import { TermsPage } from "@/pages/public/TermsPage";

// Auth Pages
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";

// LMS Pages
import { CoursesPage } from "@/pages/lms/CoursesPage";
import { CourseDetailPage } from "@/pages/lms/CourseDetailPage";
import { LessonPage } from "@/pages/lms/LessonPage";
import { LmsDashboardPage } from "@/pages/lms/LmsDashboardPage";

// Dashboard Pages
import { DashboardOverview } from "@/pages/dashboard/DashboardOverview";
import { MyArchivesPage } from "@/pages/dashboard/MyArchivesPage";
import { NewArchivePage } from "@/pages/dashboard/NewArchivePage";
import { EditArchivePage } from "@/pages/dashboard/EditArchivePage";
import { DraftsPage } from "@/pages/dashboard/DraftsPage";
import { PublishedPage } from "@/pages/dashboard/PublishedPage";
import { FavoritesPage } from "@/pages/dashboard/FavoritesPage";
import { NotificationsPage } from "@/pages/dashboard/NotificationsPage";
import { ProfilePage } from "@/pages/dashboard/ProfilePage";
import { SettingsPage } from "@/pages/dashboard/SettingsPage";

// System Pages
import { NotFoundPage } from "@/pages/system/NotFoundPage";
import { UnauthorizedPage } from "@/pages/system/UnauthorizedPage";
import { ErrorPage } from "@/pages/system/ErrorPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <BrandLoader className="h-16 w-16" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "search", element: <SearchPage /> },
      { path: "archives/:id", element: <ArchiveDetailPage /> },
      { path: "news", element: <NewsListPage /> },
      { path: "news/:slug", element: <NewsDetailPage /> },
      { path: "about", element: <AboutPage /> },
      { path: "privacy", element: <PrivacyPage /> },
      { path: "terms", element: <TermsPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password/:token", element: <ResetPasswordPage /> },
    ],
  },
  {
    path: "/lms",
    element: <LmsLayout />,
    children: [
      { index: true, element: <CoursesPage /> },
      { path: "courses/:slug", element: <CourseDetailPage /> },
      { path: "courses/:courseSlug/lessons/:lessonId", element: <LessonPage /> },
    ],
  },
  {
    path: "/lms/dashboard",
    element: (
      <ProtectedRoute>
        <LmsLayout dashboard />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <LmsDashboardPage /> },
    ],
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardOverview /> },
      { path: "archives", element: <MyArchivesPage /> },
      { path: "archives/new", element: <NewArchivePage /> },
      { path: "archives/:id/edit", element: <EditArchivePage /> },
      { path: "drafts", element: <DraftsPage /> },
      { path: "published", element: <PublishedPage /> },
      { path: "favorites", element: <FavoritesPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  { path: "/404", element: <NotFoundPage /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  { path: "/error", element: <ErrorPage /> },
  { path: "*", element: <Navigate to="/404" replace /> },
]);
