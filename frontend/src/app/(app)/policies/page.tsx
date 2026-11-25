"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Info, LayoutList, Search } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import {
  Badge,
  Card,
  EmptyState,
  Input,
  SectionTitle,
  Skeleton,
} from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import type { PolicySummary } from "@/lib/types";

const PAGE_SIZE = 12;

export default function PoliciesPage() {
  const { push } = useToast();
  const [policies, setPolicies] = useState<PolicySummary[] | null>(null);
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    void api
      .getPolicies()
      .then(setPolicies)
      .catch(() => {
        setPolicies([]);
        push("error", "정책 목록을 불러오지 못했습니다.");
      });
  }, [push]);

  const filtered = useMemo(() => {
    if (!policies) return [];
    const q = query.trim();
    if (!q) return policies;
    return policies.filter((p) =>
      [p.polyBizSjnm, p.cnsgNmor, p.ctpvNm, p.ageInfo]
        .filter(Boolean)
        .some((field) => field!.includes(q)),
    );
  }, [policies, query]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <SectionTitle
        title="정책 찾기"
        description="수집된 청년정책 공고 전체를 검색합니다."
        right={
          policies && <Badge tone="neutral">{policies.length.toLocaleString()}건 수집</Badge>
        }
      />

      <div className="relative mt-5">
        <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setVisible(PAGE_SIZE);
          }}
          placeholder="정책명, 기관, 나이 조건으로 검색"
          className="pl-10"
        />
      </div>

      {/* 현재 목록 API 의 한계를 화면에서 숨기지 않는다. */}
      <div className="mt-3 flex items-start gap-2 rounded-xl border border-line bg-surface-2/60 px-3.5 py-2.5">
        <Info size={14} className="mt-px shrink-0 text-muted" />
        <p className="text-[12px] leading-relaxed text-muted">
          목록 API(<code className="text-[11px]">GET /api/policies</code>)는 페이징과 신청기간을
          내려주지 않아, 지금은 전체를 받아 브라우저에서 검색·분할합니다. 마감 임박 정렬은 서버에
          신청기간 정규화가 들어간 뒤에 붙일 수 있습니다.
        </p>
      </div>

      {!policies ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={<LayoutList size={26} />}
            title={query ? "검색 결과가 없습니다" : "수집된 정책이 없습니다"}
            description={
              query
                ? "다른 키워드로 찾아보세요."
                : "관리자 동기화(POST /api/admin/policies/sync)를 실행하면 온통청년 API에서 정책을 수집합니다."
            }
          />
        </div>
      ) : (
        <>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, visible).map((policy) => (
              <li key={policy.id}>
                <Card className="group flex h-full flex-col p-4 transition-colors hover:border-brand/50">
                  <Link href={`/policies/${policy.id}`} className="flex flex-1 flex-col">
                    <p className="line-clamp-2 text-[14.5px] leading-snug font-semibold tracking-[-0.02em]">
                      {policy.polyBizSjnm ?? "정책명 미제공"}
                    </p>
                    <p className="mt-1.5 line-clamp-1 text-[12px] text-muted">
                      {policy.cnsgNmor ?? policy.ctpvNm ?? "기관 미제공"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {policy.ageInfo && <Badge tone="brand">{policy.ageInfo}</Badge>}
                      {policy.ctpvNm && policy.ctpvNm !== policy.cnsgNmor && (
                        <Badge>{policy.ctpvNm}</Badge>
                      )}
                    </div>
                  </Link>
                  {policy.polyUrl && (
                    <a
                      href={policy.polyUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-3 inline-flex items-center gap-1 border-t border-line pt-2.5 text-[11.5px] text-muted hover:text-fg"
                    >
                      원문 공고
                      <ExternalLink size={10.5} />
                    </a>
                  )}
                </Card>
              </li>
            ))}
          </ul>

          {visible < filtered.length && (
            <div className="mt-6 flex justify-center">
              <Button variant="secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                {filtered.length - visible}건 더 보기
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
