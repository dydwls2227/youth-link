"use client";

import { API_BASE_URL, USE_MOCK } from "@/lib/config";
import { tokenStore } from "@/lib/auth";
import * as mock from "@/lib/mock/server";
import type {
  ApiEnvelope,
  ChatMessage,
  ChatReply,
  MemberDetail,
  Notification,
  PolicyAlert,
  PolicyDetail,
  PolicySummary,
  ProfileUpdate,
  RegionDto,
} from "@/lib/types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** 401 재발급을 이미 시도했는지. 무한 재귀를 막는다. */
  retried?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, retried = false } = options;
  const token = tokenStore.get();

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      // 리프레시 토큰이 HttpOnly 쿠키에 있어 재발급 때 쿠키가 함께 가야 한다.
      credentials: "include",
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "백엔드에 연결할 수 없습니다. 서버가 실행 중인지 확인해 주세요.",
      0,
      "NETWORK",
    );
  }

  // 액세스 토큰이 만료되면 리프레시 쿠키로 한 번 재발급하고 원래 요청을 다시 보낸다.
  if (response.status === 401 && !retried && path !== "/api/auth/reissue") {
    const reissued = await tryReissue();
    if (reissued) {
      return request<T>(path, { ...options, retried: true });
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let envelope: ApiEnvelope<T> | null = null;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    /* 본문이 비었거나 JSON 이 아닐 수 있다. */
  }

  if (!response.ok || (envelope && envelope.isSuccess === false)) {
    throw new ApiError(
      envelope?.message ?? `요청이 실패했습니다 (HTTP ${response.status})`,
      response.status,
      envelope?.code,
    );
  }

  return (envelope?.result ?? (undefined as T)) as T;
}

async function tryReissue(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/reissue`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return false;
    const envelope = (await res.json()) as ApiEnvelope<{ accessToken: string }>;
    if (!envelope.isSuccess || !envelope.result?.accessToken) return false;
    tokenStore.set(envelope.result.accessToken);
    return true;
  } catch {
    return false;
  }
}

/**
 * 화면이 쓰는 유일한 데이터 창구.
 * 목 모드에서는 같은 시그니처로 메모리 구현을 호출해, 화면 코드가 모드를 신경 쓰지 않게 한다.
 */
export const api = {
  chat: (sessionId: string, message: string): Promise<ChatReply> =>
    USE_MOCK
      ? mock.mockChat(sessionId, message)
      : request("/api/v1/chat", { method: "POST", body: { sessionId, message } }),

  getMessages: (sessionId: string): Promise<ChatMessage[]> =>
    USE_MOCK
      ? mock.mockGetMessages(sessionId)
      : request(`/api/v1/chat/sessions/${encodeURIComponent(sessionId)}/messages`),

  deleteSession: (sessionId: string): Promise<void> =>
    USE_MOCK
      ? mock.mockDeleteSession(sessionId)
      : request(`/api/v1/chat/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" }),

  getMe: (): Promise<MemberDetail> => (USE_MOCK ? mock.mockGetMe() : request("/api/members/me")),

  updateMe: (payload: ProfileUpdate): Promise<MemberDetail> =>
    USE_MOCK ? mock.mockUpdateMe(payload) : request("/api/members/me", { method: "PUT", body: payload }),

  getRegions: (): Promise<RegionDto[]> =>
    USE_MOCK ? mock.mockGetRegions() : request("/api/regions"),

  getPolicies: (): Promise<PolicySummary[]> =>
    USE_MOCK ? mock.mockGetPolicies() : request("/api/policies"),

  getPolicy: (id: number): Promise<PolicyDetail> =>
    USE_MOCK ? mock.mockGetPolicy(id) : request(`/api/policies/${id}`),

  getNotifications: (): Promise<Notification[]> =>
    USE_MOCK ? mock.mockGetNotifications() : request("/api/notifications"),

  readNotification: (id: number): Promise<void> =>
    USE_MOCK ? mock.mockReadNotification(id) : request(`/api/notifications/${id}/read`, { method: "PATCH" }),

  getAlerts: (): Promise<PolicyAlert[]> =>
    USE_MOCK ? mock.mockGetAlerts() : request("/api/policy-alerts"),

  createAlert: (keyword: string, region: string | null): Promise<PolicyAlert> =>
    USE_MOCK
      ? mock.mockCreateAlert(keyword, region)
      : request("/api/policy-alerts", { method: "POST", body: { keyword, region } }),

  deleteAlert: (id: number): Promise<void> =>
    USE_MOCK ? mock.mockDeleteAlert(id) : request(`/api/policy-alerts/${id}`, { method: "DELETE" }),

  logout: async (): Promise<void> => {
    if (!USE_MOCK) {
      try {
        await request("/api/auth/logout", { method: "POST" });
      } catch {
        /* 서버 세션 정리에 실패해도 로컬 토큰은 지운다. */
      }
    }
    tokenStore.clear();
  },
};
