"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, Info, Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import {
  Badge,
  Card,
  EmptyState,
  Field,
  Input,
  SectionTitle,
  Select,
  Skeleton,
} from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "@/hooks/useSession";
import type { PolicyAlert, RegionDto } from "@/lib/types";

export default function AlertsPage() {
  const { push } = useToast();
  const { member } = useSession();
  const [alerts, setAlerts] = useState<PolicyAlert[] | null>(null);
  const [regions, setRegions] = useState<RegionDto[]>([]);
  const [keyword, setKeyword] = useState("");
  const [region, setRegion] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    void api.getAlerts().then(setAlerts).catch(() => setAlerts([]));
    void api.getRegions().then(setRegions).catch(() => setRegions([]));
  }, []);

  useEffect(() => {
    if (member?.region?.sido) setRegion(member.region.sido);
  }, [member]);

  const sidoList = useMemo(() => [...new Set(regions.map((r) => r.sido))], [regions]);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = keyword.trim();
    if (!trimmed) {
      push("error", "키워드를 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      const created = await api.createAlert(trimmed, region || null);
      setAlerts((prev) => [...(prev ?? []), created]);
      setKeyword("");
      push("success", `'${trimmed}' 키워드를 구독했습니다.`);
    } catch (e) {
      push("error", e instanceof ApiError ? e.message : "구독 등록에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    setBusy(id);
    try {
      await api.deleteAlert(id);
      setAlerts((prev) => prev?.filter((a) => a.id !== id) ?? null);
      push("success", "구독을 해제했습니다.");
    } catch {
      push("error", "구독 해제에 실패했습니다.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <SectionTitle
        title="관심 키워드"
        description="등록한 키워드가 새 정책의 정책명·지원내용·소개에 걸리면 알림이 생성됩니다."
      />

      <Card className="mt-5 p-5">
        <form onSubmit={create} className="grid gap-4 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
          <Field label="키워드" hint="예) 월세, 취업, 창업, 적금">
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="월세"
              maxLength={50}
            />
          </Field>
          <Field label="지역" hint="비우면 전체 지역">
            <Select value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="">전체 지역</option>
              {sidoList.map((sido) => (
                <option key={sido} value={sido}>
                  {sido}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" loading={saving} className="h-11">
            <Plus size={15} />
            구독
          </Button>
        </form>
      </Card>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-line bg-surface-2/60 px-3.5 py-2.5">
        <Info size={14} className="mt-px shrink-0 text-muted" />
        <p className="text-[12px] leading-relaxed text-muted">
          현재 매칭은 키워드 포함 여부로만 동작합니다. 프로필의 나이·소득·고용 조건을 쓰는 자격 기반
          자동 구독으로 바꾸면 키워드를 직접 떠올리지 않아도 됩니다.
        </p>
      </div>

      {!alerts ? (
        <div className="mt-5 space-y-2.5">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={<BellRing size={26} />}
            title="구독한 키워드가 없습니다"
            description="관심 있는 지원 분야를 키워드로 등록해 두면 새 공고를 놓치지 않습니다."
          />
        </div>
      ) : (
        <ul className="mt-5 space-y-2.5">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <Card className="flex items-center gap-3 p-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                  <BellRing size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold tracking-[-0.02em]">{alert.keyword}</p>
                  <div className="mt-1">
                    <Badge>{alert.region ?? "전체 지역"}</Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={busy === alert.id}
                  onClick={() => void remove(alert.id)}
                  aria-label="구독 해제"
                >
                  <Trash2 size={14} />
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
