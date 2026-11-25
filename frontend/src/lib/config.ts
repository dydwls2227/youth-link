/**
 * 목(mock) 모드 여부.
 *
 * 기본값은 켜짐이다. MySQL·Chroma·Gemini·카카오 OAuth 없이도 화면 전체를 돌려볼 수 있어야
 * 로컬에서 바로 확인이 가능하기 때문이다. 실제 백엔드에 붙일 때는
 * .env.local 에서 NEXT_PUBLIC_USE_MOCK=false 로 바꾼다.
 */
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

/** 카카오 로그인 시작 URL. Spring Security 의 oauth2Login 기본 경로다. */
export const KAKAO_LOGIN_URL = `${API_BASE_URL}/oauth2/authorization/kakao`;
