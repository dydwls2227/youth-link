"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { tokenStore } from "@/lib/auth";

/**
 * 카카오 로그인 성공 후 백엔드가 리다이렉트하는 지점.
 *
 * OAuth2AuthenticationSuccessHandler 가 액세스 토큰과 isNewMember 를 쿼리스트링에 담아 보낸다.
 * (리프레시 토큰은 HttpOnly 쿠키라 프론트에서 읽지 않는다.)
 * 토큰을 저장하고, 프로필이 비어 있으면 온보딩으로 보낸다.
 */
function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const accessToken = params.get("accessToken");
    const isNewMember = params.get("isNewMember") === "true";

    if (!accessToken) {
      router.replace("/?expired=1");
      return;
    }
    tokenStore.set(accessToken);
    router.replace(isNewMember ? "/onboarding" : "/chat");
  }, [params, router]);

  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 size={22} className="animate-spin text-brand" />
        <p className="text-sm text-muted">로그인 정보를 확인하고 있습니다…</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense>
      <CallbackInner />
    </Suspense>
  );
}
