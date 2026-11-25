"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { tokenStore } from "@/lib/auth";
import { USE_MOCK } from "@/lib/config";
import type { MemberDetail } from "@/lib/types";

type SessionValue = {
  member: MemberDetail | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue>({
  member: null,
  loading: true,
  error: null,
  refresh: async () => {},
  signOut: async () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setMember(await api.getMe());
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "프로필을 불러오지 못했습니다.";
      setError(message);
      // 토큰이 끝까지 유효하지 않으면(재발급도 실패) 로그인 화면으로 돌려보낸다.
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        tokenStore.clear();
        router.replace("/?expired=1");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  const signOut = useCallback(async () => {
    await api.logout();
    setMember(null);
    router.replace("/");
  }, [router]);

  useEffect(() => {
    if (!USE_MOCK && !tokenStore.get()) {
      router.replace("/");
      return;
    }
    void refresh();
  }, [refresh, router]);

  const value = useMemo(
    () => ({ member, loading, error, refresh, signOut }),
    [member, loading, error, refresh, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
