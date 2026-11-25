"use client";

import { motion } from "motion/react";
import { Logo } from "@/components/layout/AppShell";
import { Markdown } from "@/components/chat/Markdown";
import { SourceList } from "@/components/chat/SourceList";
import { NoEvidenceCard } from "@/components/chat/NoEvidenceCard";
import type { PolicySource } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ChatTurn = {
  key: string;
  role: "USER" | "ASSISTANT";
  content: string;
  sources?: PolicySource[];
  /** 검색 근거가 없어 생성 단계로 넘어가지 않은 응답 */
  noEvidence?: boolean;
};

export function MessageBubble({
  turn,
  suggestions,
  onPick,
}: {
  turn: ChatTurn;
  suggestions: string[];
  onPick: (text: string) => void;
}) {
  const isUser = turn.role === "USER";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex gap-3", isUser && "justify-end")}
    >
      {!isUser && <Logo size={30} />}

      <div className={cn("min-w-0", isUser ? "max-w-[85%] sm:max-w-[70%]" : "flex-1")}>
        {isUser ? (
          <div className="rounded-2xl rounded-tr-md bg-brand px-4 py-2.5 text-[14px] leading-relaxed text-brand-fg">
            <p className="break-words whitespace-pre-wrap">{turn.content}</p>
          </div>
        ) : turn.noEvidence ? (
          <NoEvidenceCard reply={turn.content} suggestions={suggestions} onPick={onPick} />
        ) : (
          <div className="rounded-2xl rounded-tl-md border border-line bg-surface px-4 py-3.5">
            <Markdown>{turn.content}</Markdown>
            <SourceList sources={turn.sources ?? []} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function ThinkingBubble({ stage }: { stage: "search" | "generate" }) {
  return (
    <div className="flex gap-3">
      <Logo size={30} />
      <div className="flex items-center gap-2.5 rounded-2xl rounded-tl-md border border-line bg-surface px-4 py-3">
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="size-1.5 rounded-full bg-brand"
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.16 }}
            />
          ))}
        </span>
        <span className="text-[12.5px] text-muted">
          {stage === "search" ? "거주 지역 조건으로 공고를 찾는 중" : "찾은 근거로 답변을 정리하는 중"}
        </span>
      </div>
    </div>
  );
}
