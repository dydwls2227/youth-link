# 로컬 실행 가이드

처음 돌릴 때 막히는 지점이 몇 군데 있어 따로 정리한다.

## 1. 환경변수

```bash
cp .env.properties.example .env.properties
```

`MYSQL_PASSWORD` · `JWT_SECRET` · `GEMINI_API_KEY` · `YOUTH_CENTER_API_KEY` ·
`KAKAO_CLIENT_ID` · `KAKAO_CLIENT_SECRET` 을 채운다. 이 파일은 gitignore 대상이다.

## 2. 컨테이너와 Chroma 초기 스키마

```bash
./scripts/local-up.sh
```

이 스크립트가 처리하는 것들이 전부 한 번씩은 막혔던 지점이다.

**Chroma 는 1.0.0 으로 고정한다.** 0.6.x 는 Spring AI 1.1.1 이 보내는 upsert 요청의
본문을 받지 못하고 `400 Invalid HTTP request received` 또는
`Input is a zero-length, empty document` 를 돌려준다. 수집은 되는데 임베딩만 전부 실패해서
원인을 찾기 어렵다.

**컬렉션을 미리 만들어야 한다.** `application.yml` 에 `initialize-schema: true` 가 있지만
동작하지 않는다. `ChromaVectorStore.afterPropertiesSet()` 은 `getCollection()` 이 null 을
돌려줄 때만 컬렉션을 만드는데, Spring AI 1.1.1 의 `ChromaApi.getCollection()` 은 404 에서
곧장 예외를 던진다. 그래서 생성 분기에 도달하지 못하고 앱 기동 자체가 실패한다.

**테넌트가 `default_tenant` 가 아니다.** Spring AI 는
`SpringAiTenant` / `SpringAiDatabase` 를 쓴다. 프록시로 요청을 떠서 확인했다.

```
GET /api/v2/tenants/SpringAiTenant/databases/SpringAiDatabase/collections/youth_policies
```

`default_tenant` 에 컬렉션을 만들어 두면 조회가 200 으로 보이는데도 앱은 계속 404 를 받는다.

**앱은 기동 시점의 컬렉션 ID를 캐시한다.** Chroma 컨테이너를 다시 만들면 컬렉션 ID가 바뀌므로
백엔드도 함께 재기동해야 한다.

## 3. 백엔드 · 프론트엔드

```bash
./gradlew bootRun
```

```bash
npm --prefix frontend run dev
```

프론트엔드를 실제 백엔드에 붙이려면 `frontend/.env.local` 에 `NEXT_PUBLIC_USE_MOCK=false`.

## 4. 로그인 없이 API 테스트하기

`SecurityConfig` 가 `/`, `/login/**`, `/oauth2/**`, `/api/auth/**`, swagger 를 뺀 모든 경로에
인증을 요구한다. 카카오 앱에 `http://localhost:8080/login/oauth2/code/kakao` 리다이렉트 URI가
등록돼 있지 않으면 로컬에서 로그인할 수 없다.

`data.sql` 이 넣어 주는 테스트 회원(`diagnostic@example.com`, 인천 연수구, 27세, 미취업)으로
액세스 토큰을 직접 만들어 쓰면 된다. `JwtTokenProvider` 와 같은 규칙(subject=email, HS 서명,
키 길이로 알고리즘 결정)으로 서명하면 그대로 통과한다.

브라우저에서 쓰려면 개발자 도구 콘솔에서:

```js
localStorage.setItem('youthlink.accessToken', '<토큰>')
```

## 5. 정책 수집과 임베딩

```bash
curl -X POST -H "Authorization: Bearer <토큰>" http://localhost:8080/api/admin/policies/sync
```

수집은 잘 된다. 실행해 보면 약 4,000건이 들어온다.

**임베딩은 전량을 한 번에 돌릴 수 없다.** Gemini 무료 등급은 임베딩 요청이 분당 100건으로
제한되고, 4,000건을 한 배치에 넣으면 중간에 429 가 떨어진다.

더 큰 문제는 그때 남는 상태다. 정책은 이미 DB에 저장된 뒤라 다음 실행에서 "변경 없음"으로
판정되고, **실패한 임베딩은 영영 재시도되지 않는다.** 수집과 임베딩이 한 트랜잭션으로 묶여
있지 않은 탓이다. 재시도 큐나 임베딩 상태 컬럼이 필요하다.

당장은 단건 재적재 API 를 속도를 조절해 가며 돌리면 된다.

```bash
curl -X POST -H "Authorization: Bearer <토큰>" http://localhost:8080/api/admin/policies/1264/embed
```

## 확인된 동작

이 순서대로 실제로 돌려서 확인한 결과다.

| 항목 | 결과 |
| --- | --- |
| 온통청년 API 수집 | 3,997건, 전부 `zipCd` 보유 |
| Gemini 임베딩 | 3,072차원, 샘플 60건 Chroma 적재 |
| 지역 필터 | 인천 거주 회원 질의에 인천 정책이 1단계에서 매칭(폴백 없음) |
| RAG 응답 | 근거 5건과 함께 생성, 조건이 맞지 않으면 맞지 않는다고 답함 |
| 대화 이력 | `chat_message` 에 USER/ASSISTANT 저장 |
