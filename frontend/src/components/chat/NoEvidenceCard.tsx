"use client";

import { ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

/**
 * 근거를 찾지 못했을 때의 응답 카드.
 *
 * 백엔드는 이 경우 생성 모델을 호출하지 않고 고정 안내 문구를 돌려준다.
 * 화면에서도 이를 '실패'로 보이게 두지 않고, 다음 행동(프로필 보완·질문 구체화)으로 잇는다.
 */
export function NoEvidenceCard({
  reply,
  suggestions,
  onPick,
}: {
  reply: string;
  suggestions: string[];
  onPick: (text: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-warn/35 bg-warn-soft/60 p-4">
      <p className="flex items-center gap-1.5 text-[12px] font-semibold text-warn">
        <ShieldCheck size={13} />
        근거를 찾지 못해 답변을 생성하지 않았습니다
      </p>
      <p className="mt-2 text-[13.5px] leading-relaxed text-fg">{reply}</p>

      {suggestions.length > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {suggestions.map((text) => (
            <button
              key={text}
              type="button"
              onClick={() => onPick(text)}
              className="rounded-full border border-line bg-surface px-2.5 py-1 text-[12px] text-muted transition-colors hover:border-brand/50 hover:text-fg"
            >
              {text}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3.5">
        <ButtonLink href="/me" variant="secondary" size="sm">
          프로필 보완하기
        </ButtonLink>
      </div>
    </div>
  );
}
