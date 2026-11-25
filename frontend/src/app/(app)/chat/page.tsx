"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Check, History, MapPin, Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge, Skeleton } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "@/hooks/useSession";
import { Composer } from "@/components/chat/Composer";
import { MessageBubble, ThinkingBubble, type ChatTurn } from "@/components/chat/MessageBubble";
import { cn, sessionIdFor } from "@/lib/utils";

const SESSION_STORE_KEY = "youthlink.sessions";
const NO_EVIDENCE_MARK = "관련 정책 정보를 찾을 수 없습니다";

const STARTERS = [
  "27살 미취업인데 받을 수 있는 월세 지원 알려줘",
  "지금 신청할 수 있는 자산형성 지원이 있어?",
  "취업 준비 중에 받을 수 있는 수당이 궁금해",
  "중소기업에 취업하면 받는 지원금 알려줘",
];

const REFINEMENTS = [
  "내 지역에서 받을 수 있는 주거 지원",
  "미취업 청년 대상 취업 지원",
  "소득 조건 없는 정책만 알려줘",
];

type StoredSession = { id: string; title: string; createdAt: string };

function readSessions(): StoredSession[] {
  try {
    const raw = localStorage.getItem(SESSION_STORE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession[]) : [];
  } catch {
    return [];
  }
}

function writeSessions(sessions: StoredSession[]) {
  try {
    localStorage.setItem(SESSION_STORE_KEY, JSON.stringify(sessions.slice(0, 20)));
  } catch {
    /* 저장이 막혀도 이번 세션에는 동작한다. */
  }
}

export default function ChatPage() {
  const { push } = useToast();
  const { member, loading: memberLoading } = useSession();

  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [stage, setStage] = useState<"idle" | "search" | "generate">("idle");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  // 백엔드에 세션 목록 API 가 아직 없어, 대화방 목록은 브라우저에 보관한다.
  useEffect(() => {
    const stored = readSessions();
    setSessions(stored);
    setSessionId(stored[0]?.id ?? sessionIdFor());
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    setLoadingHistory(true);
    void api
      .getMessages(sessionId)
      .then((messages) =>
        setTurns(
          messages.map((m) => ({
            key: `h-${m.id}`,
            role: m.role,
            content: m.content,
            sources: [],
            noEvidence: m.role === "ASSISTANT" && m.content.includes(NO_EVIDENCE_MARK),
          })),
        ),
      )
      .catch(() => setTurns([]))
      .finally(() => setLoadingHistory(false));
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, stage]);

  const regionLabel = useMemo(
    () => (member?.region ? `${member.region.sido} ${member.region.sigungu}` : null),
    [member],
  );

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || !sessionId || stage !== "idle") return;

      setDraft("");
      setTurns((prev) => [...prev, { key: `u-${Date.now()}`, role: "USER", content: message }]);
      setStage("search");

      // 검색 단계와 생성 단계를 구분해 보여준다. 근거를 모으는 일이 먼저라는 걸 화면에서도 드러낸다.
      const toGenerate = setTimeout(() => setStage("generate"), 700);

      try {
        const reply = await api.chat(sessionId, message);
        const noEvidence = reply.sources.length === 0 && reply.reply.includes(NO_EVIDENCE_MARK);

        setTurns((prev) => [
          ...prev,
          {
            key: `a-${Date.now()}`,
            role: "ASSISTANT",
            content: reply.reply,
            sources: reply.sources,
            noEvidence,
          },
        ]);

        // 첫 질문을 대화방 제목으로 쓴다.
        setSessions((prev) => {
          if (prev.some((s) => s.id === sessionId)) return prev;
          const next = [
            { id: sessionId, title: message.slice(0, 40), createdAt: new Date().toISOString() },
            ...prev,
          ];
          writeSessions(next);
          return next;
        });
      } catch (e) {
        push("error", e instanceof ApiError ? e.message : "답변을 받지 못했습니다.");
        setTurns((prev) => prev.slice(0, -1));
        setDraft(message);
      } finally {
        clearTimeout(toGenerate);
        setStage("idle");
      }
    },
    [push, sessionId, stage],
  );

  function startNewSession() {
    setSessionId(sessionIdFor());
    setTurns([]);
    setHistoryOpen(false);
  }

  async function removeSession(id: string) {
    try {
      await api.deleteSession(id);
    } catch {
      /* 서버에 없던 세션일 수 있다. 목록에서는 지운다. */
    }
    const next = sessions.filter((s) => s.id !== id);
    setSessions(next);
    writeSessions(next);
    if (id === sessionId) startNewSession();
    push("success", "대화를 삭제했습니다.");
  }

  const isEmpty = turns.length === 0 && !loadingHistory;

  return (
    <div className="flex h-full min-h-dvh flex-col lg:h-dvh">
      {/* 대화 헤더 */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-[15px] font-semibold tracking-[-0.02em]">정책 상담</h1>
          <p className="truncate text-[12px] text-muted">
            {regionLabel ? `${regionLabel} 기준으로 먼저 검색합니다` : "프로필에 지역을 설정하면 더 정확해집니다"}
          </p>
        </div>

        <div className="relative">
          <Button variant="ghost" size="sm" onClick={() => setHistoryOpen((v) => !v)}>
            <History size={15} />
            <span className="hidden sm:inline">최근 대화</span>
          </Button>
          {historyOpen && (
            <>
              <button
                type="button"
                aria-label="닫기"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setHistoryOpen(false)}
              />
              <div className="absolute top-full right-0 z-50 mt-1.5 w-72 overflow-hidden rounded-2xl border border-line bg-surface shadow-xl shadow-black/10">
                <div className="max-h-80 overflow-y-auto p-1.5">
                  {sessions.length === 0 ? (
                    <p className="px-2.5 py-3 text-[12.5px] text-muted">아직 저장된 대화가 없습니다.</p>
                  ) : (
                    sessions.map((s) => (
                      <div
                        key={s.id}
                        className={cn(
                          "group flex items-center gap-1.5 rounded-xl px-2.5 py-2",
                          s.id === sessionId ? "bg-brand-soft" : "hover:bg-surface-2",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSessionId(s.id);
                            setHistoryOpen(false);
                          }}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate text-[12.5px] font-medium">{s.title}</p>
                          <p className="text-[11px] text-muted">
                            {new Date(s.createdAt).toLocaleDateString("ko-KR")}
                          </p>
                        </button>
                        {s.id === sessionId && <Check size={13} className="text-brand" />}
                        <button
                          type="button"
                          onClick={() => void removeSession(s.id)}
                          aria-label="대화 삭제"
                          className="grid size-6 place-items-center rounded-md text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-danger"
                        >
                          <Trash2 size={12.5} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <Button variant="secondary" size="sm" onClick={startNewSession}>
          <Plus size={15} />
          <span className="hidden sm:inline">새 대화</span>
        </Button>
      </div>

      {/* 대화 영역 */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          {loadingHistory ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : isEmpty ? (
            <div className="pt-6 sm:pt-12">
              {memberLoading ? (
                <Skeleton className="h-6 w-40" />
              ) : (
                <Badge tone="brand">
                  <MapPin size={11} />
                  {regionLabel ?? "지역 미설정"}
                </Badge>
              )}
              <h2 className="mt-4 text-[clamp(1.5rem,4vw,2rem)] leading-tight font-semibold tracking-[-0.035em]">
                무엇을 지원받고 싶으세요?
              </h2>
              <p className="mt-2.5 max-w-lg text-[13.5px] leading-relaxed text-muted">
                검색된 공고를 근거로만 답합니다. 근거를 찾지 못하면 추측하지 않고 그대로 알려드립니다.
              </p>

              <div className="mt-7 grid gap-2 sm:grid-cols-2">
                {STARTERS.map((text) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => void send(text)}
                    className="rounded-xl border border-line bg-surface px-3.5 py-3 text-left text-[13px] leading-snug transition-colors hover:border-brand/50 hover:bg-brand-soft/40"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <AnimatePresence initial={false}>
                {turns.map((turn) => (
                  <MessageBubble
                    key={turn.key}
                    turn={turn}
                    suggestions={REFINEMENTS}
                    onPick={(text) => void send(text)}
                  />
                ))}
              </AnimatePresence>
              {stage !== "idle" && <ThinkingBubble stage={stage} />}
            </div>
          )}
          <div ref={bottomRef} className="h-2" />
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="sticky bottom-0 border-t border-line bg-bg/92 px-4 pt-3 pb-4 backdrop-blur sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Composer
            value={draft}
            onChange={setDraft}
            onSubmit={() => void send(draft)}
            disabled={stage !== "idle"}
            placeholder="예) 인천 사는 27살 미취업인데 월세 지원 받을 수 있어?"
          />
          <p className="mt-2 px-1 text-[11px] text-muted">
            Enter 로 전송, Shift + Enter 로 줄바꿈 · 답변은 검색된 공고를 근거로만 생성됩니다
          </p>
        </div>
      </div>
    </div>
  );
}
