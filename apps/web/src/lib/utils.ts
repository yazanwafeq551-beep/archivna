import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, "dd MMMM yyyy", { locale: ar });
  } catch {
    return dateString;
  }
}

export function formatRelativeDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ar });
  } catch {
    return dateString;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 بايت";
  const units = ["بايت", "كيلوبايت", "ميغابايت", "غيغابايت"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${size} ${units[i]}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

export function getMaterialTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    document: "وثيقة",
    image: "صورة",
    audio: "صوت",
    video: "فيديو",
    map: "خريطة",
    manuscript: "مخطوطة",
  };
  return labels[type] || type;
}

export function getAccessLabel(access: string): string {
  const labels: Record<string, string> = {
    public: "عام",
    sensitive: "حساس",
    sovereign: "سيادي",
  };
  return labels[access] || access;
}

export function getAccessColor(access: string): string {
  const colors: Record<string, string> = {
    public: "bg-green-100 text-green-800",
    sensitive: "bg-amber-100 text-amber-800",
    sovereign: "bg-red-100 text-red-800",
  };
  return colors[access] || "bg-gray-100 text-gray-800";
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
}

export function isPdfFile(filename: string): boolean {
  return getFileExtension(filename) === "pdf";
}

export function isAudioFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["mp3", "wav", "ogg", "m4a", "flac"].includes(ext);
}

export function isVideoFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["mp4", "webm", "avi", "mov", "mkv"].includes(ext);
}

export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const str = searchParams.toString();
  return str ? `?${str}` : "";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
