import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

/**
 * 신청기간 문자열에서 종료일을 추측해 남은 일수를 구한다.
 * 공공 API가 "2026-05-01 ~ 2026-05-21", "상시", "분기별 접수(...)" 처럼
 * 정규화되지 않은 자유 텍스트를 내려주므로, 파싱에 실패하면 null 을 돌려준다.
 */
export function daysUntilDeadline(period: string | null | undefined): number | null {
  if (!period) return null;
  const dates = period.match(/\d{4}[-.]\s?\d{1,2}[-.]\s?\d{1,2}/g);
  if (!dates || dates.length === 0) return null;
  const last = dates[dates.length - 1].replace(/\./g, "-").replace(/\s/g, "");
  const parts = last.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const end = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / 86_400_000);
}

export function sessionIdFor(date = new Date()): string {
  return `session-${date.toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 7)}`;
}
