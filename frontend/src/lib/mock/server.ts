/**
 * 로컬 목(mock) 백엔드.
 *
 * MySQL·Chroma·Gemini·카카오 OAuth 없이 화면 전체를 돌려보기 위한 레이어로,
 * 실제 백엔드의 응답 계약과 RAG 동작(지역 하드 필터 → 0건이면 전체 검색 폴백 →
 * 근거가 없으면 LLM 호출 없이 고정 안내 문구 반환)을 그대로 흉내 낸다.
 * 화면 로직이 목에서만 통하는 일이 없도록 분기 구조를 일부러 같게 맞췄다.
 */
import {
  MOCK_ALERTS,
  MOCK_MEMBER,
  MOCK_NOTIFICATIONS,
  MOCK_POLICIES,
  MOCK_REGIONS,
  type MockPolicy,
} from "@/lib/mock/data";
import type {
  ChatMessage,
  ChatReply,
  MemberDetail,
  Notification,
  PolicyAlert,
  PolicySource,
  ProfileUpdate,
} from "@/lib/types";

const NO_EVIDENCE_REPLY =
  "관련 정책 정보를 찾을 수 없습니다. 지역, 나이, 취업 상태, 관심 분야를 조금 더 구체적으로 입력해 주세요.";

const TOP_K = 5;

type MockState = {
  member: MemberDetail;
  notifications: Notification[];
  alerts: PolicyAlert[];
  messages: ChatMessage[];
  seq: number;
};

const state: MockState = {
  member: structuredClone(MOCK_MEMBER),
  notifications: structuredClone(MOCK_NOTIFICATIONS),
  alerts: structuredClone(MOCK_ALERTS),
  messages: [],
  seq: 1000,
};

const nextId = () => ++state.seq;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 질의 토큰이 정책 본문에 몇 번 걸리는지로 유사도를 흉내 낸다. */
function score(policy: MockPolicy, query: string): number {
  const haystack = [
    policy.polyBizSjnm,
    policy.polyItcnCn,
    policy.sporCn,
    policy.cnsgNmor,
    policy.ageInfo,
    policy.empmSttsCd,
    policy.incmRqisCn,
    policy.sido.join(" ") || "전국",
  ]
    .filter(Boolean)
    .join(" ");

  const tokens = query
    .replace(/[^0-9A-Za-z가-힣\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);

  let hits = 0;
  for (const token of tokens) {
    // 한글 조사 때문에 완전일치가 잘 안 맞아, 2글자 단위로 겹치는지 본다.
    for (let i = 0; i + 2 <= token.length; i += 1) {
      if (haystack.includes(token.slice(i, i + 2))) {
        hits += 1;
        break;
      }
    }
  }
  return hits;
}

/** 백엔드 RegionMetadata 와 같은 규칙: 대상 지역이 비면 전국으로 본다. */
function matchesRegion(policy: MockPolicy, sido: string | null): boolean {
  if (policy.sido.length === 0) return true;
  if (!sido) return false;
  return policy.sido.includes(sido);
}

export type MockSearchTrace = {
  regionFiltered: boolean;
  fellBack: boolean;
  usedRegion: string | null;
};

function searchPolicies(query: string, sido: string | null) {
  const ranked = MOCK_POLICIES.map((p) => ({ p, s: score(p, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);

  const trace: MockSearchTrace = { regionFiltered: false, fellBack: false, usedRegion: sido };

  if (sido) {
    const filtered = ranked.filter((x) => matchesRegion(x.p, sido)).slice(0, TOP_K);
    if (filtered.length > 0) {
      trace.regionFiltered = true;
      return { docs: filtered.map((x) => x.p), trace };
    }
    trace.fellBack = true;
  }
  return { docs: ranked.slice(0, TOP_K).map((x) => x.p), trace };
}

function toSource(policy: MockPolicy): PolicySource {
  return {
    policyId: String(policy.id),
    policyName: policy.polyBizSjnm ?? "",
    url: policy.polyUrl ?? "",
    organization: policy.cnsgNmor ?? "",
  };
}

/** 검색된 근거만으로 답변을 조립한다. 목이라서 생성 모델 대신 템플릿을 쓴다. */
function composeReply(docs: MockPolicy[], trace: MockSearchTrace): string {
  const head = trace.fellBack
    ? `거주 지역(${trace.usedRegion}) 기준으로는 맞는 정책이 없어서 전국 정책까지 넓혀서 찾았습니다.`
    : trace.regionFiltered
      ? `${trace.usedRegion} 거주 조건에 맞는 정책을 먼저 찾았습니다.`
      : `검색된 정책을 기준으로 안내드립니다.`;

  const body = docs
    .map((p, i) => {
      return [
        `### ${i + 1}. ${p.polyBizSjnm}`,
        `- **지원 내용**: ${p.sporCn}`,
        `- **신청 자격**: ${p.ageInfo} · ${p.empmSttsCd} · ${p.incmRqisCn}`,
        `- **신청 기간**: ${p.rqutPrdCn}`,
        `- **주관 기관**: ${p.cnsgNmor} (${p.sido.length ? p.sido.join(", ") : "전국"})`,
      ].join("\n");
    })
    .join("\n\n");

  return `${head}\n\n${body}\n\n> 위 내용은 검색된 ${docs.length}건의 정책 공고만을 근거로 작성했습니다. 신청 전 아래 출처에서 최신 공고를 확인해 주세요.`;
}

function pushMessage(sessionId: string, role: ChatMessage["role"], content: string) {
  state.messages.push({
    id: nextId(),
    sessionId,
    role,
    content,
    createdAt: new Date().toISOString(),
  });
}

export async function mockChat(sessionId: string, message: string): Promise<ChatReply> {
  await sleep(500 + Math.random() * 500);

  const sido = state.member.region?.sido ?? null;
  const { docs, trace } = searchPolicies(message, sido);

  pushMessage(sessionId, "USER", message);

  // 백엔드와 동일한 분기: 근거가 없으면 LLM 을 호출하지 않고 즉시 안내 문구를 돌려준다.
  if (docs.length === 0) {
    pushMessage(sessionId, "ASSISTANT", NO_EVIDENCE_REPLY);
    return { reply: NO_EVIDENCE_REPLY, sessionId, sources: [] };
  }

  const reply = composeReply(docs, trace);
  pushMessage(sessionId, "ASSISTANT", reply);
  return { reply, sessionId, sources: docs.map(toSource) };
}

export async function mockGetMessages(sessionId: string): Promise<ChatMessage[]> {
  await sleep(120);
  return state.messages.filter((m) => m.sessionId === sessionId);
}

export async function mockDeleteSession(sessionId: string): Promise<void> {
  await sleep(120);
  state.messages = state.messages.filter((m) => m.sessionId !== sessionId);
}

export async function mockGetMe(): Promise<MemberDetail> {
  await sleep(150);
  return structuredClone(state.member);
}

export async function mockUpdateMe(payload: ProfileUpdate): Promise<MemberDetail> {
  await sleep(300);
  const region = MOCK_REGIONS.find((r) => r.id === payload.regionId) ?? state.member.region;
  state.member = {
    ...state.member,
    name: payload.name,
    age: payload.age,
    gender: payload.gender,
    region,
    education: payload.education,
    employmentStatus: payload.employmentStatus,
    incomeLevel: payload.incomeLevel,
    isProfileComplete: true,
  };
  return structuredClone(state.member);
}

export async function mockGetRegions() {
  await sleep(100);
  return structuredClone(MOCK_REGIONS);
}

export async function mockGetPolicies() {
  await sleep(220);
  // 실제 GET /api/policies 는 PolicySummaryDto 만 내려준다(신청기간·지원내용 없음).
  // 목에서 더 많이 주면 화면이 목에서만 동작하게 되므로 같은 필드만 돌려준다.
  return MOCK_POLICIES.map((p) => ({
    id: p.id,
    bizId: p.bizId,
    polyBizSjnm: p.polyBizSjnm,
    cnsgNmor: p.cnsgNmor,
    ctpvNm: p.ctpvNm,
    ageInfo: p.ageInfo,
    polyUrl: p.polyUrl,
  }));
}

export async function mockGetPolicy(id: number) {
  await sleep(180);
  const found = MOCK_POLICIES.find((p) => p.id === id);
  if (!found) throw new Error("POLICY_NOT_FOUND");
  // sido 는 검색 필터용 내부 필드다. 실제 PolicyDetailDto 에는 없으므로 응답에서 뺀다.
  const { sido, ...rest } = found;
  void sido;
  return rest;
}

export async function mockGetNotifications() {
  await sleep(150);
  return structuredClone(state.notifications).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export async function mockReadNotification(id: number) {
  await sleep(100);
  const found = state.notifications.find((n) => n.id === id);
  if (found) found.read = true;
}

export async function mockGetAlerts() {
  await sleep(150);
  return structuredClone(state.alerts.filter((a) => a.active));
}

export async function mockCreateAlert(keyword: string, region: string | null) {
  await sleep(250);
  const created: PolicyAlert = { id: nextId(), keyword, region, active: true };
  state.alerts.push(created);
  return structuredClone(created);
}

export async function mockDeleteAlert(id: number) {
  await sleep(150);
  const found = state.alerts.find((a) => a.id === id);
  if (found) found.active = false;
}

/** 목 모드에서 쓰는 가짜 세션 목록. 실제 백엔드에는 세션 목록 API가 아직 없다. */
export function mockSessionIds(): string[] {
  return [...new Set(state.messages.map((m) => m.sessionId))];
}
