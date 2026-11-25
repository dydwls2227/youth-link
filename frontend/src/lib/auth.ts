"use client";

const TOKEN_KEY = "youthlink.accessToken";

/**
 * 액세스 토큰 보관소.
 *
 * 백엔드는 카카오 로그인 성공 후 쿼리스트링으로 액세스 토큰을 넘기고,
 * 리프레시 토큰은 HttpOnly 쿠키에 심는다. 그래서 프론트가 직접 들고 있어야 하는 값은
 * 액세스 토큰 하나뿐이다. 세션 간 유지가 필요해 localStorage 를 쓴다.
 */
export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* 프라이빗 모드 등에서 쓰기가 막힐 수 있다. 무시하고 메모리 세션으로 동작한다. */
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* no-op */
    }
  },
};
