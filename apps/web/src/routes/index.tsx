import { createBrowserRouter, Navigate, useLocation } from "react-router-dom";
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
import { MyCoursesPage } from "@/pages/lms/MyCoursesPage";
import { SavedCoursesPage } from "@/pages/lms/SavedCoursesPage";
import { AchievementsPage } from "@/pages/lms/AchievementsPage";

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
import { AdminCoursesPage } from "@/pages/dashboard/AdminCoursesPage";
import { ArchiveManagementPage } from "@/pages/dashboard/ArchiveManagementPage";

// System Pages
import { NotFoundPage } from "@/pages/system/NotFoundPage";
import { UnauthorizedPage } from "@/pages/system/UnauthorizedPage";
import { ErrorPage } from "@/pages/system/ErrorPage";

function RouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <BrandLoader className="h-16 w-16" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <RouteLoader />;
  }

  if (!isAuthenticated) {
    // Remember where the user was headed so login can send them back.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

function RoleRoute({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <RouteLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!user.roleAssignments?.some((assignment) => roles.includes(assignment.role))) {
    return <Navigate to="/unauthorized" replace />;
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
      { path: "courses", element: <MyCoursesPage /> },
      { path: "saved", element: <SavedCoursesPage /> },
      { path: "achievements", element: <AchievementsPage /> },
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
      { path: "archives/new", element: <RoleRoute roles={["system_admin", "institution_admin", "depositor", "cataloger"]}><NewArchivePage /></RoleRoute> },
      { path: "archives/:id/edit", element: <EditArchivePage /> },
      { path: "drafts", element: <DraftsPage /> },
      { path: "published", element: <PublishedPage /> },
      { path: "favorites", element: <FavoritesPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "courses", element: <RoleRoute roles={["system_admin"]}><AdminCoursesPage /></RoleRoute> },
      { path: "archive-management", element: <ArchiveManagementPage /> },
    ],
  },
  { path: "/404", element: <NotFoundPage /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  { path: "/error", element: <ErrorPage /> },
  { path: "*", element: <Navigate to="/404" replace /> },
]);
