// 백엔드 공통 응답 래퍼. ApiResponse<T> 와 1:1 대응한다.
export type ApiEnvelope<T> = {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T;
};

export type Gender = "MALE" | "FEMALE";

export type EducationLevel =
  | "BELOW_MIDDLE_SCHOOL"
  | "HIGH_SCHOOL_GRADUATE"
  | "ASSOCIATE_DEGREE"
  | "BACHELOR_DEGREE"
  | "MASTERS_DEGREE"
  | "DOCTORATE_DEGREE";

export type RegionDto = {
  id: number;
  sido: string;
  sigungu: string;
};

export type MemberDetail = {
  id: number;
  email: string;
  name: string | null;
  age: number | null;
  gender: Gender | null;
  region: RegionDto | null;
  education: EducationLevel | null;
  employmentStatus: string | null;
  incomeLevel: string | null;
  isProfileComplete: boolean;
};

export type ProfileUpdate = {
  name: string;
  age: number;
  gender: Gender;
  regionId: number;
  education: EducationLevel;
  employmentStatus: string;
  incomeLevel: string;
};

export type PolicySource = {
  policyId: string;
  policyName: string;
  url: string;
  organization: string;
};

export type ChatReply = {
  reply: string;
  sessionId: string;
  sources: PolicySource[];
};

export type ChatMessage = {
  id: number;
  sessionId: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
};

export type PolicySummary = {
  id: number;
  bizId: string;
  polyBizSjnm: string | null;
  cnsgNmor: string | null;
  ctpvNm: string | null;
  ageInfo: string | null;
  polyUrl: string | null;
};

export type PolicyDetail = PolicySummary & {
  polyItcnCn: string | null;
  sporCn: string | null;
  rqutPrdCn: string | null;
  empmSttsCd: string | null;
  accrRqisCd: string | null;
  incmRqisCn: string | null;
};

export type Notification = {
  id: number;
  title: string;
  content: string;
  read: boolean;
  policyId: number | null;
  policyName: string | null;
  createdAt: string;
};

export type PolicyAlert = {
  id: number;
  keyword: string;
  region: string | null;
  active: boolean;
};

export const EDUCATION_LABELS: Record<EducationLevel, string> = {
  BELOW_MIDDLE_SCHOOL: "중졸 이하",
  HIGH_SCHOOL_GRADUATE: "고졸",
  ASSOCIATE_DEGREE: "대졸(전문대)",
  BACHELOR_DEGREE: "대졸(4년제)",
  MASTERS_DEGREE: "석사",
  DOCTORATE_DEGREE: "박사",
};

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: "남성",
  FEMALE: "여성",
};

export const EMPLOYMENT_OPTIONS = ["재직자", "미취업", "프리랜서", "창업", "재학생", "제한없음"];

export const INCOME_OPTIONS = [
  "중위소득 50% 이하",
  "중위소득 100% 이하",
  "중위소득 150% 이하",
  "제한없음",
];
