import { createBrowserRouter, Navigate, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LmsLayout } from "@/components/layout/LmsLayout";
import { useAuth } from "@/hooks/useAuth";
import { BrandLoader } from "@/components/shared/BrandLoader";

/*
 * Pages are loaded on demand through the router's own lazy support: a visitor
 * landing on the home page should not download the dashboard, the governance
 * console and the lesson player as well. The router waits for the chunk before
 * committing the navigation, so no page-level Suspense boundary is needed.
 */
type PageModule = Record<string, React.ComponentType>;

const page = (loader: () => Promise<PageModule>, name: string) => async () => {
  const module = await loader();
  return { Component: module[name] };
};

/** Same, for a page that must also pass a role check before it renders. */
const guardedPage = (
  loader: () => Promise<PageModule>,
  name: string,
  roles: string[]
) => async () => {
  const module = await loader();
  const Page = module[name];
  return {
    Component: () => (
      <RoleRoute roles={roles}>
        <Page />
      </RoleRoute>
    ),
  };
};

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

const DEPOSIT_ROLES = ["system_admin", "institution_admin", "depositor", "cataloger"];

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, lazy: page(() => import("@/pages/public/HomePage"), "HomePage") },
      { path: "search", lazy: page(() => import("@/pages/public/SearchPage"), "SearchPage") },
      { path: "archives/:id", lazy: page(() => import("@/pages/public/ArchiveDetailPage"), "ArchiveDetailPage") },
      { path: "news", lazy: page(() => import("@/pages/public/NewsListPage"), "NewsListPage") },
      { path: "news/:slug", lazy: page(() => import("@/pages/public/NewsDetailPage"), "NewsDetailPage") },
      { path: "about", lazy: page(() => import("@/pages/public/AboutPage"), "AboutPage") },
      { path: "privacy", lazy: page(() => import("@/pages/public/PrivacyPage"), "PrivacyPage") },
      { path: "terms", lazy: page(() => import("@/pages/public/TermsPage"), "TermsPage") },
      { path: "login", lazy: page(() => import("@/pages/auth/LoginPage"), "LoginPage") },
      { path: "register", lazy: page(() => import("@/pages/auth/RegisterPage"), "RegisterPage") },
      { path: "forgot-password", lazy: page(() => import("@/pages/auth/ForgotPasswordPage"), "ForgotPasswordPage") },
      { path: "reset-password/:token", lazy: page(() => import("@/pages/auth/ResetPasswordPage"), "ResetPasswordPage") },
    ],
  },
  {
    path: "/lms",
    element: <LmsLayout />,
    children: [
      { index: true, lazy: page(() => import("@/pages/lms/CoursesPage"), "CoursesPage") },
      { path: "courses/:slug", lazy: page(() => import("@/pages/lms/CourseDetailPage"), "CourseDetailPage") },
      { path: "courses/:courseSlug/lessons/:lessonId", lazy: page(() => import("@/pages/lms/LessonPage"), "LessonPage") },
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
      { index: true, lazy: page(() => import("@/pages/lms/LmsDashboardPage"), "LmsDashboardPage") },
      { path: "courses", lazy: page(() => import("@/pages/lms/MyCoursesPage"), "MyCoursesPage") },
      { path: "saved", lazy: page(() => import("@/pages/lms/SavedCoursesPage"), "SavedCoursesPage") },
      { path: "achievements", lazy: page(() => import("@/pages/lms/AchievementsPage"), "AchievementsPage") },
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
      { index: true, lazy: page(() => import("@/pages/dashboard/DashboardOverview"), "DashboardOverview") },
      { path: "archives", lazy: page(() => import("@/pages/dashboard/MyArchivesPage"), "MyArchivesPage") },
      {
        path: "archives/new",
        lazy: guardedPage(() => import("@/pages/dashboard/NewArchivePage"), "NewArchivePage", DEPOSIT_ROLES),
      },
      { path: "archives/:id/edit", lazy: page(() => import("@/pages/dashboard/EditArchivePage"), "EditArchivePage") },
      { path: "drafts", lazy: page(() => import("@/pages/dashboard/DraftsPage"), "DraftsPage") },
      { path: "published", lazy: page(() => import("@/pages/dashboard/PublishedPage"), "PublishedPage") },
      { path: "favorites", lazy: page(() => import("@/pages/dashboard/FavoritesPage"), "FavoritesPage") },
      { path: "notifications", lazy: page(() => import("@/pages/dashboard/NotificationsPage"), "NotificationsPage") },
      { path: "profile", lazy: page(() => import("@/pages/dashboard/ProfilePage"), "ProfilePage") },
      { path: "settings", lazy: page(() => import("@/pages/dashboard/SettingsPage"), "SettingsPage") },
      {
        path: "courses",
        lazy: guardedPage(() => import("@/pages/dashboard/AdminCoursesPage"), "AdminCoursesPage", ["system_admin"]),
      },
      { path: "archive-management", lazy: page(() => import("@/pages/dashboard/ArchiveManagementPage"), "ArchiveManagementPage") },
    ],
  },
  { path: "/404", lazy: page(() => import("@/pages/system/NotFoundPage"), "NotFoundPage") },
  { path: "/unauthorized", lazy: page(() => import("@/pages/system/UnauthorizedPage"), "UnauthorizedPage") },
  { path: "/error", lazy: page(() => import("@/pages/system/ErrorPage"), "ErrorPage") },
  { path: "*", element: <Navigate to="/404" replace /> },
]);
