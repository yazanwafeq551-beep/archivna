import apiClient from "./client";

export type SupportKind = "consultation" | "feedback" | "complaint" | "suggestion";
export type SupportStatus = "new" | "in_review" | "answered" | "closed";

export interface SupportRequest {
  id: string;
  kind: SupportKind;
  topic?: string;
  subject: string;
  message: string;
  contactEmail?: string;
  status: SupportStatus;
  response?: string;
  respondedAt?: string;
  createdAt: string;
  user?: { id: string; fullName: string; email: string; institutionName?: string };
  responder?: { id: string; fullName: string };
}

export interface CreateSupportRequestInput {
  kind: SupportKind;
  topic?: string;
  subject: string;
  message: string;
  contactEmail?: string;
}

export const supportApi = {
  create: async (data: CreateSupportRequestInput): Promise<SupportRequest> => {
    const response = await apiClient.post("/support/requests", data);
    return response.data;
  },

  mine: async (kind?: SupportKind | SupportKind[]): Promise<SupportRequest[]> => {
    const response = await apiClient.get("/support/requests/mine", {
      params: Array.isArray(kind) ? undefined : { kind },
    });
    const all: SupportRequest[] = response.data;
    return Array.isArray(kind) ? all.filter((item) => kind.includes(item.kind)) : all;
  },

  inbox: async (filters?: { kind?: string; status?: string }): Promise<SupportRequest[]> => {
    const response = await apiClient.get("/support/requests", { params: filters });
    return response.data;
  },

  respond: async (
    id: string,
    data: { response?: string; status?: SupportStatus }
  ): Promise<SupportRequest> => {
    const response = await apiClient.patch(`/support/requests/${id}`, data);
    return response.data;
  },
};
