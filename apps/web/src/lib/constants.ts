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
  { value: "private", label: "خاص", color: "burgundy" },
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
  { key: "learning", label: "لوحة تعلمي", labelEn: "My Learning", path: "/lms/dashboard", icon: "GraduationCap" },
  { key: "archives", label: "ملفاتي الأرشيفية", path: "/dashboard/archives", icon: "FolderOpen" },
  { key: "new", label: "إضافة مادة أرشيفية", path: "/dashboard/archives/new", icon: "Plus" },
  { key: "courseAdmin", label: "إدارة الدورات", labelEn: "Manage Courses", path: "/dashboard/courses", icon: "BookOpenCheck", adminOnly: true },
  { key: "drafts", label: "المسودات", path: "/dashboard/drafts", icon: "FileEdit" },
  { key: "published", label: "المواد المنشورة", path: "/dashboard/published", icon: "Globe" },
  { key: "favorites", label: "المفضلة", path: "/dashboard/favorites", icon: "Heart" },
  { key: "notifications", label: "التنبيهات", path: "/dashboard/notifications", icon: "Bell" },
  { key: "profile", label: "الملف الشخصي", path: "/dashboard/profile", icon: "User" },
  { key: "settings", label: "الإعدادات", path: "/dashboard/settings", icon: "Settings" },
] as const;

export const NAV_LINKS = [
  { key: "home", label: "الرئيسية", path: "/" },
  { key: "search", label: "استكشف الأرشيف", path: "/search" },
  { key: "news", label: "الأخبار", path: "/news" },
  { key: "about", label: "عن أرشيفنا", path: "/about" },
] as const;

export const LMS_SIDEBAR_ITEMS = [
  { key: "overview", label: "نظرة عامة", labelEn: "Overview", path: "/lms/dashboard", icon: "LayoutDashboard" },
  { key: "courses", label: "الدورات", labelEn: "My Courses", path: "/lms/dashboard/courses", icon: "BookOpen" },
  { key: "saved", label: "المحفوظة", labelEn: "Saved", path: "/lms/dashboard/saved", icon: "Bookmark" },
  { key: "achievements", label: "الإنجازات", labelEn: "Achievements", path: "/lms/dashboard/achievements", icon: "Award" },
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
