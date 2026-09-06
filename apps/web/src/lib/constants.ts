export const MATERIAL_TYPES = [
  { value: "document", label: "وثائق", icon: "FileText" },
  { value: "image", label: "صور", icon: "Image" },
  { value: "audio", label: "صوت", icon: "Headphones" },
  { value: "video", label: "فيديو", icon: "Video" },
  { value: "map", label: "خرائط", icon: "Map" },
  { value: "manuscript", label: "مخطوطات", icon: "ScrollText" },
] as const;

export const ACCESS_LEVELS = [
  { value: "public", label: "عام", color: "green" },
  { value: "sensitive", label: "حساس", color: "amber" },
  { value: "sovereign", label: "سيادي", color: "burgundy" },
] as const;

export const SORT_OPTIONS = [
  { value: "relevance", label: "الأكثر صلة" },
  { value: "newest", label: "الأحدث" },
  { value: "oldest", label: "الأقدم" },
  { value: "title", label: "العنوان" },
] as const;

export const ITEMS_PER_PAGE = 12;

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "video/mp4",
  "video/webm",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export const API_BASE_URL = "/api/v1";

export const DASHBOARD_SIDEBAR_ITEMS = [
  { key: "overview", label: "نظرة عامة", path: "/dashboard", icon: "LayoutDashboard" },
  { key: "archives", label: "ملفاتي الأرشيفية", path: "/dashboard/archives", icon: "FolderOpen" },
  { key: "new", label: "إضافة مادة أرشيفية", path: "/dashboard/archives/new", icon: "Plus" },
  { key: "archiveManagement", label: "إدارة الأرشيف والوصول", labelEn: "Archive Management", path: "/dashboard/archive-management", icon: "ShieldCheck" },
  { key: "supportInbox", label: "صندوق الاستشارات", labelEn: "Support inbox", path: "/dashboard/support-inbox", icon: "Inbox", staffOnly: true },
  { key: "courseAdmin", label: "إدارة الدورات", labelEn: "Manage Courses", path: "/dashboard/courses", icon: "BookOpenCheck", adminOnly: true },
  { key: "drafts", label: "المسودات", path: "/dashboard/drafts", icon: "FileEdit" },
  { key: "published", label: "المواد المنشورة", path: "/dashboard/published", icon: "Globe" },
  { key: "favorites", label: "المفضلة", path: "/dashboard/favorites", icon: "Heart" },
  { key: "notifications", label: "التنبيهات", path: "/dashboard/notifications", icon: "Bell" },
  { key: "profile", label: "الملف الشخصي", path: "/dashboard/profile", icon: "User" },
  { key: "settings", label: "الإعدادات", path: "/dashboard/settings", icon: "Settings" },
] as const;

/** Translation key for each dashboard sidebar entry, shared by every surface. */
export const SIDEBAR_LABEL_KEYS: Record<string, string> = {
  overview: "dashboard.overview.title",
  archives: "dashboard.archives.title",
  new: "dashboard.newArchive.title",
  archiveManagement: "dashboard.archiveManagement",
  drafts: "dashboard.drafts.title",
  published: "dashboard.published.title",
  favorites: "dashboard.favorites.title",
  notifications: "dashboard.notifications.title",
  profile: "dashboard.profile.title",
  settings: "dashboard.settings.title",
  courseAdmin: "dashboard.coursesAdmin",
  supportInbox: "supportInbox.title",
};

/**
 * The seven services of the platform, numbered as the project owner set them
 * out. The same list drives the top tabs, the mobile drawer and the home hub,
 * so they can never drift apart.
 */
export const PLATFORM_SECTIONS = [
  { key: "search", number: 1, path: "/search", icon: "Search" },
  { key: "capacity", number: 2, path: "/lms", icon: "GraduationCap" },
  { key: "support", number: 3, path: "/support", icon: "Headphones" },
  { key: "deposit", number: 4, path: "/deposit", icon: "UploadCloud" },
  { key: "news", number: 5, path: "/news", icon: "Newspaper" },
  { key: "feedback", number: 6, path: "/feedback", icon: "ClipboardList" },
  { key: "about", number: 7, path: "/about", icon: "Landmark" },
] as const;

export type PlatformSectionKey = (typeof PLATFORM_SECTIONS)[number]["key"];

/**
 * Two of the seven services open onto a short list of their own. The home hub
 * reveals these under the card that owns them; every other section has none and
 * shows no disclosure at all.
 */
export const PLATFORM_SECTION_CHILDREN: Partial<
  Record<PlatformSectionKey, ReadonlyArray<{ key: string; code: string; path: string }>>
> = {
  search: [
    { key: "free", code: "1-1", path: "/search" },
    { key: "byInstitution", code: "1-2", path: "/search?browse=institution" },
  ],
  capacity: [
    { key: "materials", code: "2-1", path: "/lms/materials" },
    { key: "synchronous", code: "2-2", path: "/lms#programs-live" },
    { key: "interactive", code: "2-3", path: "/lms#programs-interactive" },
  ],
};

/**
 * The reader's own corner of the platform. The seven services are the home hub
 * and the footer; the top bar, the mobile drawer and the bottom tab bar all read
 * this list instead, so the four never drift apart.
 */
export const MAIN_NAV = [
  { key: "home", path: "/", icon: "Home", protected: false },
  { key: "myArchive", path: "/dashboard/archives", icon: "FolderOpen", protected: true },
  { key: "notifications", path: "/dashboard/notifications", icon: "Bell", protected: true },
  { key: "account", path: "/dashboard/profile", icon: "User", protected: true },
] as const;

export const COURSE_DIFFICULTIES = [
  { value: "beginner", label: "مبتدئ", labelEn: "Beginner" },
  { value: "intermediate", label: "متوسط", labelEn: "Intermediate" },
  { value: "advanced", label: "متقدم", labelEn: "Advanced" },
] as const;

export const COURSE_SORT_OPTIONS = [
  { value: "newest", label: "الأحدث", labelEn: "Newest" },
  { value: "popular", label: "الأكثر شهرة", labelEn: "Most Popular" },
  { value: "oldest", label: "الأقدم", labelEn: "Oldest" },
] as const;

export const COURSE_BADGE_TYPES = [
  "new", "popular", "featured", "free"
] as const;

export const LEARNING_HOURS_PER_CREDIT = 15;
