import { AxiosError } from "axios";
import i18n from "@/i18n";

interface ApiErrorBody {
  message?: string | string[];
  statusCode?: number;
}

/**
 * The API answers with a human-readable Arabic message. Surfacing it beats a
 * generic "something went wrong", especially for rate limits and validation.
 */
export function getApiErrorMessage(error: unknown, fallback?: string): string {
  const axiosError = error as AxiosError<ApiErrorBody>;
  const data = axiosError?.response?.data;

  if (data) {
    const message = Array.isArray(data.message) ? data.message[0] : data.message;
    if (message) return message;
  }

  if (axiosError?.response === undefined && axiosError?.request) {
    // A timeout and an unreachable server both arrive here with no response,
    // but they need different advice: one is "wait", the other is "check
    // your connection".
    if (axiosError.code === AxiosError.ECONNABORTED) {
      return i18n.t("error.timeout");
    }
    return i18n.t("error.network");
  }

  return fallback ?? i18n.t("common.error");
}

export function getApiErrorStatus(error: unknown): number | undefined {
  return (error as AxiosError)?.response?.status;
}
