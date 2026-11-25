"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, BellOff, Check } from "lucide-react";
import { api } from "@/lib/api";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge, Card, EmptyState, SectionTitle, Skeleton } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { formatRelative } from "@/lib/utils";
import type { Notification } from "@/lib/types";

export default function NotificationsPage() {
  const { push } = useToast();
  const [items, setItems] = useState<Notification[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    void api
      .getNotifications()
      .then(setItems)
      .catch(() => {
        setItems([]);
        push("error", "알림을 불러오지 못했습니다.");
      });
  }, [push]);

  async function markRead(id: number) {
    setBusy(id);
    try {
      await api.readNotification(id);
      setItems((prev) => prev?.map((n) => (n.id === id ? { ...n, read: true } : n)) ?? null);
    } catch {
      push("error", "읽음 처리에 실패했습니다.");
    } finally {
      setBusy(null);
    }
  }

  const unread = items?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <SectionTitle
        title="알림"
        description="구독한 키워드에 걸린 신규·변경 정책을 모아 보여줍니다."
        right={unread > 0 ? <Badge tone="brand">안 읽음 {unread}</Badge> : undefined}
      />

      {!items ? (
        <div className="mt-5 space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={<BellOff size={26} />}
            title="아직 받은 알림이 없습니다"
            description="관심 키워드를 등록하면 수집 배치가 새 정책을 찾을 때 알림이 쌓입니다."
            action={
              <ButtonLink href="/alerts" variant="secondary" size="sm">
                관심 키워드 등록
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <ul className="mt-5 space-y-2.5">
          {items.map((item) => (
            <li key={item.id}>
              <Card
                className={
                  item.read ? "p-4" : "border-brand/35 bg-brand-soft/30 p-4"
                }
              >
                <div className="flex items-start gap-3">
                  <span
                    className={
                      item.read
                        ? "mt-1 grid size-7 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted"
                        : "mt-1 grid size-7 shrink-0 place-items-center rounded-lg bg-brand text-brand-fg"
                    }
                  >
                    <Bell size={14} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] leading-snug font-semibold tracking-[-0.02em] break-keep">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted break-keep">
                      {item.content}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-3">
                      <span className="text-[11.5px] text-muted">
                        {formatRelative(item.createdAt)}
                      </span>
                      {item.policyId && (
                        <Link
                          href={`/policies/${item.policyId}`}
                          className="text-[11.5px] font-medium text-brand hover:underline"
                        >
                          정책 상세 보기
                        </Link>
                      )}
                    </div>
                  </div>

                  {!item.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={busy === item.id}
                      onClick={() => void markRead(item.id)}
                    >
                      <Check size={14} />
                      <span className="hidden sm:inline">읽음</span>
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
