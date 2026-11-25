# 유스링크 프론트엔드

청년정책 상담(RAG) 서비스의 웹 프론트엔드입니다. Next.js 15(App Router) · TypeScript · Tailwind CSS v4.

## 바로 실행하기 (백엔드 없이)

```bash
npm install
npm run dev
```

`http://localhost:3000` 에서 전체 화면을 바로 확인할 수 있습니다.
기본값이 **목(mock) 모드**라서 MySQL·Chroma·Gemini·카카오 OAuth 없이도 동작합니다.

목 모드는 응답 계약뿐 아니라 백엔드의 RAG 분기까지 흉내 냅니다.

- 거주 지역으로 먼저 하드 필터링 → 0건이면 전국까지 넓혀 재검색
- 근거를 못 찾으면 생성 단계로 넘기지 않고 고정 안내 문구 반환

마지막 동작을 눈으로 보려면 정책과 무관한 질문을 넣어 보세요. 예: `비트코인 투자 방법 알려줘`

## 실제 백엔드에 붙이기

`.env.local` 에서 목 모드를 끕니다.

```
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

백엔드 쪽 선행 조건:

| 항목 | 값 | 비고 |
| --- | --- | --- |
| MySQL | `localhost:3307` / DB `youth_link` | `application.yml` 의 datasource |
| Chroma | `localhost:8000` | 컬렉션 `youth_policies` |
| Spring Boot | `localhost:8080` | `./gradlew bootRun` |
| 환경변수 | `.env.properties` | `GEMINI_API_KEY`, `KAKAO_*`, `JWT_SECRET` 등 |

포트 3000 은 바꾸지 마세요. 백엔드의 CORS 허용 출처(`SecurityConfig`)와
카카오 OAuth 리다이렉트 URI(`jwt.oauth2-redirect-uri`)가 모두
`http://localhost:3000` 으로 고정돼 있습니다.

## 화면 구성

| 경로 | 설명 |
| --- | --- |
| `/` | 랜딩. 카카오 로그인 진입 (목 모드에서는 바로 입장) |
| `/oauth/callback` | 백엔드가 토큰을 쿼리스트링으로 넘겨주는 지점 |
| `/onboarding` | 최초 로그인 후 자격 조건 입력 |
| `/chat` | 정책 상담. 출처 카드, 근거 없음 응답, 검색/생성 단계 표시 |
| `/policies`, `/policies/[id]` | 수집된 공고 검색 및 상세 |
| `/notifications` | 신규·변경 정책 알림 |
| `/alerts` | 관심 키워드 구독 |
| `/me` | 프로필 수정 (상담 검색 필터로 쓰이는 값) |

## 구조

```
src/
  app/            라우트 (랜딩 · 온보딩 · (app) 인증 구역)
  components/     ui(프리미티브) · chat · layout · policy · profile
  hooks/          useSession(프로필 컨텍스트) · useTheme
  lib/
    api.ts        유일한 데이터 창구. 목/실서버를 같은 시그니처로 감싼다
    mock/         로컬 목 백엔드 (RAG 분기 포함)
    types.ts      백엔드 DTO 와 1:1 대응
```

화면 코드는 `api` 객체만 호출하고 모드를 알지 못합니다.
목 모드에서만 통하는 화면이 생기지 않도록, 목도 실제 API 와 같은 필드만 돌려줍니다.
(예: `GET /api/policies` 는 `PolicySummaryDto` 라서 신청기간이 없고, 목도 같게 맞췄습니다.)

## 알려진 백엔드 제약

화면에서 우회하지 않고 그대로 드러냈습니다.

- **세션 목록 API 없음** — 대화방 목록을 브라우저 `localStorage` 에 보관합니다.
- **정책 목록 페이징 없음** — 전체를 받아 클라이언트에서 검색·분할합니다.
- **목록 응답에 신청기간 없음** — 마감 임박 정렬을 아직 붙일 수 없습니다.
- **나이·소득·고용 조건은 필터가 아님** — 거주 지역만 하드 필터로 쓰입니다.
