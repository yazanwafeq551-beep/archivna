import apiClient from "./client";

export interface Archive {
  id: string;
  titleAr: string;
  titleEn?: string;
  alternativeTitleAr?: string;
  alternativeTitleEn?: string;
  referenceNumber?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  materialType: string;
  accessLevel: "public" | "sensitive" | "sovereign";
  accessGranted?: boolean;
  dateText?: string;
  dateFrom?: string;
  dateTo?: string;
  institutionName?: string;
  creatorName?: string;
  collectionName?: string;
  subjectText?: string;
  place?: string;
  language?: string;
  rightsStatement?: string;
  ownerId: string;
  owner?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  status: "draft" | "processing" | "cataloging" | "inReview" | "approved" | "published" | "archived";
  institutionId?: string;
  archivalUnitId?: string;
  institution?: { id: string; nameAr: string; nameEn?: string; slug: string };
  archivalUnit?: { id: string; titleAr: string; titleEn?: string; level: string; referenceCode?: string };
  accessPolicy?: { requiresReason: boolean; watermarkEnabled: boolean; metadataVisibility: string };
  workflowEvents?: Array<{ id: string; fromStatus?: string; toStatus: string; note?: string; createdAt: string; actor?: { id: string; fullName: string } }>;
  files: ArchiveFile[];
  subjects?: { id: string; subject: string }[];
  _count?: { files: number; favorites: number };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface ArchiveFile {
  id: string;
  originalFilename: string;
  storedFilename: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  fileExtension: string;
  thumbnailPath?: string;
  secureUrl?: string;
  publicId?: string;
  resourceType?: string;
  createdAt: string;
}

export interface ArchiveListResponse {
  data: Archive[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ArchiveStats {
  totalRecords: number;
  totalUsers: number;
  totalDownloads: number;
  totalInstitutions: number;
  myDrafts: number;
  myPublished: number;
  myArchives: number;
  storageUsed: number;
}

export interface CreateArchiveRequest {
  titleAr: string;
  titleEn?: string;
  altTitles?: string[];
  referenceNumber?: string;
  description?: string;
  materialType: string;
  accessLevel: "public" | "sensitive" | "sovereign";
  date?: string;
  institution?: string;
  creator?: string;
  collection?: string;
  subjects?: string[];
  place?: string;
  language?: string;
  rights?: string;
  institutionId?: string;
  archivalUnitId?: string;
  metadata?: Record<string, unknown>;
  status?: "draft";
}

export interface SearchParams {
  q?: string;
  materialType?: string[];
  institution?: string;
  dateFrom?: string;
  dateTo?: string;
  subject?: string;
  place?: string;
  language?: string;
  accessLevel?: string[];
  sort?: string;
  page?: number;
  limit?: number;
  status?: string;
}

function toSnakeParams(params: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    const snakeKey = key.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
    result[snakeKey] = Array.isArray(value) ? value.join(',') : value;
  }
  return result;
}

export const archivesApi = {
  search: async (params: SearchParams): Promise<ArchiveListResponse> => {
    const response = await apiClient.get("/archives", { params: toSnakeParams(params as Record<string, unknown>) });
    return response.data;
  },

  getById: async (id: string): Promise<Archive> => {
    const response = await apiClient.get(`/archives/${id}`);
    return response.data;
  },

  create: async (data: CreateArchiveRequest): Promise<Archive> => {
    const response = await apiClient.post("/archives", data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateArchiveRequest>): Promise<Archive> => {
    const response = await apiClient.patch(`/archives/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/archives/${id}`);
  },

  publish: async (id: string): Promise<Archive> => {
    const response = await apiClient.post(`/archives/${id}/publish`);
    return response.data;
  },

  unpublish: async (id: string): Promise<Archive> => {
    const response = await apiClient.post(`/archives/${id}/unpublish`);
    return response.data;
  },

  transition: async (id: string, action: string, note?: string): Promise<Archive> => {
    const response = await apiClient.post(`/archives/${id}/workflow`, { action, note });
    return response.data;
  },

  uploadFiles: async (archiveId: string, files: File[], onProgress?: (progress: number) => void): Promise<ArchiveFile[]> => {
    // The API takes one file per request, so progress is tracked across them.
    const results: ArchiveFile[] = [];
    for (const file of files) {
      const singleFormData = new FormData();
      singleFormData.append("file", file);
      const response = await apiClient.post(`/archives/${archiveId}/file`, singleFormData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (onProgress && files.length > 0) {
            const overallProgress = Math.round(((results.length + progressEvent.loaded / (progressEvent.total || 1)) * 100) / files.length);
            onProgress(overallProgress);
          }
        },
      });
      results.push(response.data);
    }
    return results;
  },

  deleteFile: async (archiveId: string, fileId: string): Promise<void> => {
    await apiClient.delete(`/archives/${archiveId}/file/${fileId}`);
  },

  getMyArchives: async (params: SearchParams): Promise<ArchiveListResponse> => {
    const response = await apiClient.get("/archives/my", { params: toSnakeParams(params as Record<string, unknown>) });
    return response.data;
  },

  getDrafts: async (params: SearchParams): Promise<ArchiveListResponse> => {
    const response = await apiClient.get("/archives/my/drafts", { params: toSnakeParams(params as Record<string, unknown>) });
    return response.data;
  },

  getPublished: async (params: SearchParams): Promise<ArchiveListResponse> => {
    const response = await apiClient.get("/archives/my/published", { params: toSnakeParams(params as Record<string, unknown>) });
    return response.data;
  },

  getStats: async (): Promise<ArchiveStats> => {
    const response = await apiClient.get("/archives/stats");
    return response.data;
  },

  getLatest: async (limit?: number): Promise<Archive[]> => {
    const response = await apiClient.get("/archives/latest", { params: { limit } });
    return response.data;
  },

  getFeatured: async (limit?: number): Promise<Archive[]> => {
    const response = await apiClient.get("/archives/featured", { params: { limit } });
    return response.data;
  },

  getRelated: async (id: string, limit?: number): Promise<Archive[]> => {
    const response = await apiClient.get(`/archives/${id}/related`, { params: { limit } });
    return response.data;
  },
};
