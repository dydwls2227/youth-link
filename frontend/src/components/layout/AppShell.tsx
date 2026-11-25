"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Bell,
  BellRing,
  LayoutList,
  LogOut,
  MessageSquareText,
  Moon,
  Sun,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { USE_MOCK } from "@/lib/config";
import { useSession } from "@/hooks/useSession";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Primitives";

const NAV = [
  { href: "/chat", label: "정책 상담", icon: MessageSquareText },
  { href: "/policies", label: "정책 찾기", icon: LayoutList },
  { href: "/notifications", label: "알림", icon: Bell },
  { href: "/alerts", label: "관심 키워드", icon: BellRing },
  { href: "/me", label: "내 프로필", icon: UserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { member, signOut } = useSession();
  const { dark, toggle, mounted } = useTheme();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    void api
      .getNotifications()
      .then((list) => setUnread(list.filter((n) => !n.read).length))
      .catch(() => setUnread(0));
  }, [pathname]);

  return (
    <div className="flex min-h-dvh">
      {/* 데스크톱 사이드바 */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-surface/60 px-3 py-5 lg:flex">
        <Link href="/chat" className="mb-7 flex items-center gap-2.5 px-2.5">
          <Logo />
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-[-0.02em]">유스링크</p>
            <p className="text-[11px] text-muted">근거로만 답하는 상담</p>
          </div>
        </Link>

        <nav className="flex flex-col gap-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13.5px] font-medium transition-colors",
                  active ? "text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl bg-brand-soft"
                    transition={{ type: "spring", stiffness: 480, damping: 38 }}
                  />
                )}
                <Icon size={16.5} className={cn("relative z-1", active && "text-brand")} />
                <span className="relative z-1">{label}</span>
                {href === "/notifications" && unread > 0 && (
                  <span className="relative z-1 ml-auto rounded-full bg-brand px-1.5 py-px text-[10.5px] font-semibold text-brand-fg">
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2 px-1">
          {USE_MOCK && (
            <div className="rounded-xl border border-dashed border-line px-2.5 py-2">
              <Badge tone="warn">목 데이터 모드</Badge>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                백엔드 없이 동작 중입니다. 실제 서버에 붙이려면{" "}
                <code className="text-[10.5px]">NEXT_PUBLIC_USE_MOCK=false</code>
              </p>
            </div>
          )}
          <div className="flex items-center gap-1.5 rounded-xl px-1 py-1">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-medium">{member?.name ?? "—"}</p>
              <p className="truncate text-[11px] text-muted">
                {member?.region ? `${member.region.sido} ${member.region.sigungu}` : "지역 미설정"}
              </p>
            </div>
            <button
              type="button"
              onClick={toggle}
              aria-label="테마 전환"
              className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              {mounted && (dark ? <Sun size={15} /> : <Moon size={15} />)}
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              aria-label="로그아웃"
              className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* 모바일 상단바 */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-bg/85 px-4 py-3 backdrop-blur lg:hidden">
          <Logo />
          <p className="text-[15px] font-semibold tracking-[-0.02em]">유스링크</p>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={toggle}
              aria-label="테마 전환"
              className="grid size-9 place-items-center rounded-lg text-muted active:bg-surface-2"
            >
              {mounted && (dark ? <Sun size={16} /> : <Moon size={16} />)}
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              aria-label="로그아웃"
              className="grid size-9 place-items-center rounded-lg text-muted active:bg-surface-2"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 pb-[max(4.5rem,env(safe-area-inset-bottom))] lg:pb-0">
          {children}
        </main>

        {/* 모바일 하단 내비게이션 */}
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-bg/92 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium transition-colors",
                  active ? "text-brand" : "text-muted",
                )}
              >
                <Icon size={19} />
                {href === "/notifications" && unread > 0 && (
                  <span className="absolute top-1.5 right-[calc(50%-1.1rem)] size-1.5 rounded-full bg-brand" />
                )}
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-[9px] bg-brand text-brand-fg"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <path
          d="M5 8.5C5 6.567 6.567 5 8.5 5h7C17.433 5 19 6.567 19 8.5S17.433 12 15.5 12h-7"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M19 15.5C19 17.433 17.433 19 15.5 19h-7C6.567 19 5 17.433 5 15.5S6.567 12 8.5 12h7"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
