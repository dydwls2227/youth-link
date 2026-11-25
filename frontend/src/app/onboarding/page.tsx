"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Primitives";
import { Logo } from "@/components/layout/AppShell";
import { ProfileForm } from "@/components/profile/ProfileForm";
import type { MemberDetail } from "@/lib/types";

export default function OnboardingPage() {
  const router = useRouter();
  const [member, setMember] = useState<MemberDetail | null>(null);

  useEffect(() => {
    void api.getMe().then(setMember).catch(() => setMember(null));
  }, []);

  return (
    <div className="mesh min-h-dvh px-5 py-10 sm:px-8 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-2xl"
      >
        <div className="flex items-center gap-2.5">
          <Logo />
          <p className="text-[15px] font-semibold tracking-[-0.02em]">유스링크</p>
        </div>

        <h1 className="mt-7 text-[clamp(1.6rem,4.5vw,2.25rem)] leading-tight font-semibold tracking-[-0.035em]">
          자격 조건을 먼저 알려주세요
        </h1>
        <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-muted">
          유스링크는 의미가 비슷한 정책이 아니라 실제로 신청 가능한 정책을 찾습니다.
          그래서 질문보다 프로필이 먼저 필요합니다. 나중에 언제든 수정할 수 있습니다.
        </p>

        <Card className="mt-7 p-5 sm:p-7">
          <ProfileForm
            member={member}
            submitLabel="저장하고 상담 시작하기"
            onSaved={() => router.replace("/chat")}
          />
        </Card>
      </motion.div>
    </div>
  );
}
