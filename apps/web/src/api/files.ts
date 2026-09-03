import apiClient from "./client";

const apiOrigin = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export function resolveMediaUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) return url;
  return `${apiOrigin}${url.startsWith("/") ? url : `/${url}`}`;
}

export interface UploadResponse {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
}

export const filesApi = {
  upload: async (file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  uploadMultiple: async (files: File[], onProgress?: (progress: number) => void): Promise<UploadResponse[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await apiClient.post("/files/upload/multiple", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  delete: async (fileId: string): Promise<void> => {
    await apiClient.delete(`/files/${fileId}`);
  },

  getDownloadUrl: (fileId: string): string => {
    return `/api/v1/archives/file/${fileId}/download`;
  },
};
