"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  Building2,
  CalendarClock,
  ExternalLink,
  GraduationCap,
  MapPin,
  UserRound,
} from "lucide-react";
import { api } from "@/lib/api";
import { ButtonLink } from "@/components/ui/Button";
import { Badge, Card, EmptyState, Skeleton } from "@/components/ui/Primitives";
import { daysUntilDeadline } from "@/lib/utils";
import type { PolicyDetail } from "@/lib/types";

const FACTS = [
  { key: "rqutPrdCn", label: "신청 기간", icon: CalendarClock },
  { key: "ageInfo", label: "나이 조건", icon: UserRound },
  { key: "empmSttsCd", label: "고용 상태", icon: Building2 },
  { key: "accrRqisCd", label: "학력 조건", icon: GraduationCap },
  { key: "incmRqisCn", label: "소득 조건", icon: Banknote },
  { key: "ctpvNm", label: "지역·기관", icon: MapPin },
] as const;

export default function PolicyDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [policy, setPolicy] = useState<PolicyDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setNotFound(true);
      return;
    }
    void api.getPolicy(id).then(setPolicy).catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <EmptyState
          title="정책을 찾을 수 없습니다"
          description="삭제되었거나 아직 수집되지 않은 공고일 수 있습니다."
          action={<ButtonLink href="/policies" variant="secondary" size="sm">정책 목록으로</ButtonLink>}
        />
      </div>
    );
  }

  const dday = policy ? daysUntilDeadline(policy.rqutPrdCn) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/policies"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft size={14} />
        정책 목록
      </Link>

      {!policy ? (
        <div className="mt-5 space-y-3">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-6 h-48 w-full" />
        </div>
      ) : (
        <>
          <div className="mt-5">
            <div className="flex flex-wrap items-center gap-1.5">
              {dday !== null && dday >= 0 && (
                <Badge tone={dday <= 7 ? "warn" : "brand"}>
                  <CalendarClock size={11} />
                  마감 D-{dday}
                </Badge>
              )}
              {dday !== null && dday < 0 && <Badge tone="danger">신청 기간 종료</Badge>}
              <Badge>{policy.bizId}</Badge>
            </div>

            <h1 className="mt-3 text-[clamp(1.4rem,4vw,1.9rem)] leading-tight font-semibold tracking-[-0.035em]">
              {policy.polyBizSjnm ?? "정책명 미제공"}
            </h1>
            <p className="mt-2 text-[13px] text-muted">{policy.cnsgNmor ?? "기관 미제공"}</p>
          </div>

          {policy.polyItcnCn && (
            <Card className="mt-6 p-5">
              <h2 className="text-[12px] font-medium tracking-wide text-muted uppercase">정책 소개</h2>
              <p className="mt-2 text-[14px] leading-relaxed break-keep whitespace-pre-wrap">
                {policy.polyItcnCn}
              </p>
            </Card>
          )}

          {policy.sporCn && (
            <Card className="mt-3 border-brand/30 bg-brand-soft/40 p-5">
              <h2 className="text-[12px] font-medium tracking-wide text-brand uppercase">지원 내용</h2>
              <p className="mt-2 text-[14px] leading-relaxed break-keep whitespace-pre-wrap">
                {policy.sporCn}
              </p>
            </Card>
          )}

          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {FACTS.map(({ key, label, icon: Icon }) => {
              const value = policy[key];
              if (!value) return null;
              return (
                <Card key={key} className="p-4">
                  <dt className="flex items-center gap-1.5 text-[11.5px] font-medium tracking-wide text-muted uppercase">
                    <Icon size={12} />
                    {label}
                  </dt>
                  <dd className="mt-1.5 text-[13.5px] leading-relaxed break-keep">{value}</dd>
                </Card>
              );
            })}
          </dl>

          {policy.polyUrl && (
            <a
              href={policy.polyUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-[14.5px] font-medium text-brand-fg transition-colors hover:bg-brand-hover"
            >
              원문 공고에서 신청하기
              <ExternalLink size={15} />
            </a>
          )}

          <p className="mt-3 text-center text-[11.5px] leading-relaxed text-muted">
            수집 시점 이후 공고가 변경될 수 있습니다. 신청 전 원문 공고를 반드시 확인해 주세요.
          </p>
        </>
      )}
    </div>
  );
}
