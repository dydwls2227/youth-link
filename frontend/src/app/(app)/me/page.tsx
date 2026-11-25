"use client";

import { CircleUser, Info } from "lucide-react";
import { Card, SectionTitle, Skeleton } from "@/components/ui/Primitives";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { useSession } from "@/hooks/useSession";
import { EDUCATION_LABELS, GENDER_LABELS } from "@/lib/types";

export default function ProfilePage() {
  const { member, loading, refresh } = useSession();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <SectionTitle
        title="내 프로필"
        description="여기 적힌 자격 조건이 상담 검색의 필터로 그대로 쓰입니다."
      />

      {loading ? (
        <div className="mt-5 space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-80" />
        </div>
      ) : (
        <>
          <Card className="mt-5 flex items-center gap-3.5 p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
              <CircleUser size={21} />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold tracking-[-0.02em]">
                {member?.name ?? "이름 미설정"}
              </p>
              <p className="truncate text-[12.5px] text-muted">{member?.email}</p>
            </div>
            <dl className="ml-auto hidden gap-5 text-right sm:flex">
              {[
                ["나이", member?.age ? `${member.age}세` : "—"],
                ["성별", member?.gender ? GENDER_LABELS[member.gender] : "—"],
                ["학력", member?.education ? EDUCATION_LABELS[member.education] : "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[11px] text-muted">{label}</dt>
                  <dd className="mt-0.5 text-[13px] font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <div className="mt-3 flex items-start gap-2 rounded-xl border border-line bg-surface-2/60 px-3.5 py-2.5">
            <Info size={14} className="mt-px shrink-0 text-muted" />
            <p className="text-[12px] leading-relaxed text-muted">
              거주 지역만 검색 단계에서 하드 필터로 쓰이고, 나이·학력·고용·소득은 아직 필터가 아니라
              프롬프트 참고값입니다. 메타데이터 필터로 넓히면 개인화가 한 단계 더 정확해집니다.
            </p>
          </div>

          <Card className="mt-3 p-5 sm:p-6">
            <ProfileForm
              member={member}
              submitLabel="프로필 저장"
              onSaved={() => void refresh()}
            />
          </Card>
        </>
      )}
    </div>
  );
}
