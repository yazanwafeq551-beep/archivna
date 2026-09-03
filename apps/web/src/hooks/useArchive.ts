import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { archivesApi, type SearchParams, type CreateArchiveRequest } from "@/api/archives";
import { toast } from "sonner";
import i18n from "@/i18n";

export function useArchives(params: SearchParams) {
  return useQuery({
    queryKey: ["archives", params],
    queryFn: () => archivesApi.search(params),
  });
}

export function useArchive(id: string) {
  return useQuery({
    queryKey: ["archive", id],
    queryFn: () => archivesApi.getById(id),
    enabled: !!id,
  });
}

export function useMyArchives(params: SearchParams) {
  return useQuery({
    queryKey: ["myArchives", params],
    queryFn: () => archivesApi.getMyArchives(params),
  });
}

export function useDrafts(params: SearchParams) {
  return useQuery({
    queryKey: ["drafts", params],
    queryFn: () => archivesApi.getDrafts(params),
  });
}

export function usePublished(params: SearchParams) {
  return useQuery({
    queryKey: ["published", params],
    queryFn: () => archivesApi.getPublished(params),
  });
}

export function useLatestArchives(limit?: number) {
  return useQuery({
    queryKey: ["latestArchives", limit],
    queryFn: () => archivesApi.getLatest(limit),
  });
}

export function useFeaturedArchives(limit?: number) {
  return useQuery({
    queryKey: ["featuredArchives", limit],
    queryFn: () => archivesApi.getFeatured(limit),
  });
}

export function useArchiveStats() {
  return useQuery({
    queryKey: ["archiveStats"],
    queryFn: () => archivesApi.getStats(),
  });
}

export function useRelatedArchives(id: string, limit?: number) {
  return useQuery({
    queryKey: ["relatedArchives", id, limit],
    queryFn: () => archivesApi.getRelated(id, limit),
    enabled: !!id,
  });
}

export function useCreateArchive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateArchiveRequest) => archivesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myArchives"] });
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      toast.success(i18n.t("archive.createSuccess"));
    },
    onError: () => {
      toast.error(i18n.t("archive.createError"));
    },
  });
}

export function useUpdateArchive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateArchiveRequest> }) =>
      archivesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["myArchives"] });
      queryClient.invalidateQueries({ queryKey: ["archive", variables.id] });
      toast.success(i18n.t("archive.updateSuccess"));
    },
    onError: () => {
      toast.error(i18n.t("archive.updateError"));
    },
  });
}

export function useDeleteArchive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archivesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myArchives"] });
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      queryClient.invalidateQueries({ queryKey: ["published"] });
      toast.success(i18n.t("archive.deleteSuccess"));
    },
    onError: () => {
      toast.error(i18n.t("archive.deleteError"));
    },
  });
}

export function usePublishArchive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archivesApi.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myArchives"] });
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      queryClient.invalidateQueries({ queryKey: ["published"] });
      toast.success(i18n.t("archive.publishSuccess"));
    },
    onError: () => {
      toast.error(i18n.t("archive.publishError"));
    },
  });
}

export function useUnpublishArchive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archivesApi.unpublish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myArchives"] });
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      queryClient.invalidateQueries({ queryKey: ["published"] });
      toast.success(i18n.t("archive.unpublishSuccess"));
    },
    onError: () => {
      toast.error(i18n.t("archive.unpublishError"));
    },
  });
}

export function useUploadFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      archiveId,
      files,
      onProgress,
    }: {
      archiveId: string;
      files: File[];
      onProgress?: (progress: number) => void;
    }) => archivesApi.uploadFiles(archiveId, files, onProgress),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["archive", variables.archiveId] });
      queryClient.invalidateQueries({ queryKey: ["archives"] });
      queryClient.invalidateQueries({ queryKey: ["myArchives"] });
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      queryClient.invalidateQueries({ queryKey: ["published"] });
      queryClient.invalidateQueries({ queryKey: ["latestArchives"] });
      queryClient.invalidateQueries({ queryKey: ["relatedArchives"] });
      toast.success(i18n.t("archive.uploadSuccess"));
    },
    onError: () => {
      toast.error(i18n.t("archive.uploadError"));
    },
  });
}
