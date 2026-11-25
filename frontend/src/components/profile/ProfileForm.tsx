"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import {
  EDUCATION_LABELS,
  EMPLOYMENT_OPTIONS,
  GENDER_LABELS,
  INCOME_OPTIONS,
  type EducationLevel,
  type Gender,
  type MemberDetail,
  type ProfileUpdate,
  type RegionDto,
} from "@/lib/types";

type Draft = {
  name: string;
  age: string;
  gender: Gender | "";
  sido: string;
  regionId: string;
  education: EducationLevel | "";
  employmentStatus: string;
  incomeLevel: string;
};

function toDraft(member: MemberDetail | null): Draft {
  return {
    name: member?.name ?? "",
    age: member?.age ? String(member.age) : "",
    gender: member?.gender ?? "",
    sido: member?.region?.sido ?? "",
    regionId: member?.region ? String(member.region.id) : "",
    education: member?.education ?? "",
    employmentStatus: member?.employmentStatus ?? "",
    incomeLevel: member?.incomeLevel ?? "",
  };
}

export function ProfileForm({
  member,
  submitLabel,
  onSaved,
}: {
  member: MemberDetail | null;
  submitLabel: string;
  onSaved: (updated: MemberDetail) => void;
}) {
  const { push } = useToast();
  const [regions, setRegions] = useState<RegionDto[]>([]);
  const [draft, setDraft] = useState<Draft>(() => toDraft(member));
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void api.getRegions().then(setRegions).catch(() => push("error", "지역 목록을 불러오지 못했습니다."));
  }, [push]);

  useEffect(() => {
    setDraft(toDraft(member));
  }, [member]);

  const sidoList = useMemo(() => [...new Set(regions.map((r) => r.sido))], [regions]);
  const sigunguList = useMemo(
    () => regions.filter((r) => r.sido === draft.sido),
    [regions, draft.sido],
  );

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): ProfileUpdate | null {
    const next: Partial<Record<keyof Draft, string>> = {};
    const age = Number(draft.age);

    if (!draft.name.trim()) next.name = "이름을 입력해 주세요.";
    if (!draft.age || Number.isNaN(age) || age < 1) next.age = "나이를 숫자로 입력해 주세요.";
    if (!draft.gender) next.gender = "성별을 선택해 주세요.";
    if (!draft.regionId) next.regionId = "거주 지역을 선택해 주세요.";
    if (!draft.education) next.education = "학력을 선택해 주세요.";
    if (!draft.employmentStatus) next.employmentStatus = "고용 상태를 선택해 주세요.";
    if (!draft.incomeLevel) next.incomeLevel = "소득 수준을 선택해 주세요.";

    setErrors(next);
    if (Object.keys(next).length > 0) return null;

    return {
      name: draft.name.trim(),
      age,
      gender: draft.gender as Gender,
      regionId: Number(draft.regionId),
      education: draft.education as EducationLevel,
      employmentStatus: draft.employmentStatus,
      incomeLevel: draft.incomeLevel,
    };
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const payload = validate();
    if (!payload) return;

    setSaving(true);
    try {
      const updated = await api.updateMe(payload);
      push("success", "프로필을 저장했습니다.");
      onSaved(updated);
    } catch (e) {
      push("error", e instanceof ApiError ? e.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="이름" error={errors.name}>
          <Input
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="홍길동"
            maxLength={50}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="나이" error={errors.age}>
            <Input
              value={draft.age}
              onChange={(e) => set("age", e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
              inputMode="numeric"
              placeholder="27"
            />
          </Field>
          <Field label="성별" error={errors.gender}>
            <Select value={draft.gender} onChange={(e) => set("gender", e.target.value as Gender)}>
              <option value="">선택</option>
              {Object.entries(GENDER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
        <div className="flex items-center gap-2 text-[13px] font-medium">
          <MapPin size={14} className="text-brand" />
          거주 지역
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          상담에서 가장 큰 영향을 주는 값입니다. 검색 단계에서 이 지역과 전국 정책만 먼저 추립니다.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Select
            value={draft.sido}
            onChange={(e) => {
              set("sido", e.target.value);
              set("regionId", "");
            }}
          >
            <option value="">시/도</option>
            {sidoList.map((sido) => (
              <option key={sido} value={sido}>
                {sido}
              </option>
            ))}
          </Select>
          <Select
            value={draft.regionId}
            disabled={!draft.sido}
            onChange={(e) => set("regionId", e.target.value)}
          >
            <option value="">시/군/구</option>
            {sigunguList.map((region) => (
              <option key={region.id} value={region.id}>
                {region.sigungu}
              </option>
            ))}
          </Select>
        </div>
        {errors.regionId && <p className="mt-1.5 text-[12px] text-danger">{errors.regionId}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="학력" error={errors.education}>
          <Select
            value={draft.education}
            onChange={(e) => set("education", e.target.value as EducationLevel)}
          >
            <option value="">선택</option>
            {Object.entries(EDUCATION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="고용 상태" error={errors.employmentStatus}>
          <Select
            value={draft.employmentStatus}
            onChange={(e) => set("employmentStatus", e.target.value)}
          >
            <option value="">선택</option>
            {EMPLOYMENT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="소득 수준" error={errors.incomeLevel}>
          <Select value={draft.incomeLevel} onChange={(e) => set("incomeLevel", e.target.value)}>
            <option value="">선택</option>
            {INCOME_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Button type="submit" size="lg" loading={saving} className="w-full sm:w-auto">
        {submitLabel}
      </Button>
    </form>
  );
}
