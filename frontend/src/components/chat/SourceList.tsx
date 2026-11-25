"use client";

import Link from "next/link";
import { Building2, ExternalLink, FileText } from "lucide-react";
import type { PolicySource } from "@/lib/types";

/**
 * 답변의 근거가 된 공고 목록.
 *
 * 출처를 접어두지 않고 답변 바로 아래에 펼쳐 둔다.
 * "무엇을 근거로 답했는가"가 이 서비스의 신뢰 근거이기 때문이다.
 */
export function SourceList({ sources }: { sources: PolicySource[] }) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-4 border-t border-line pt-3.5">
      <p className="flex items-center gap-1.5 text-[11.5px] font-medium tracking-wide text-muted uppercase">
        <FileText size={12} />
        근거 {sources.length}건
      </p>
      <ul className="mt-2.5 grid gap-2 sm:grid-cols-2">
        {sources.map((source, i) => (
          <li key={`${source.policyId}-${i}`}>
            <div className="group flex h-full flex-col gap-2 rounded-xl border border-line bg-surface-2/50 p-3 transition-colors hover:border-brand/50">
              <p className="line-clamp-2 text-[13px] leading-snug font-medium">
                {source.policyName || "정책명 미제공"}
              </p>
              {source.organization && (
                <p className="flex items-center gap-1 text-[11.5px] text-muted">
                  <Building2 size={11} />
                  {source.organization}
                </p>
              )}
              <div className="mt-auto flex items-center gap-3 pt-0.5">
                {source.policyId && (
                  <Link
                    href={`/policies/${source.policyId}`}
                    className="text-[11.5px] font-medium text-brand hover:underline"
                  >
                    상세 보기
                  </Link>
                )}
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-0.5 text-[11.5px] text-muted hover:text-fg"
                  >
                    원문 공고
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
