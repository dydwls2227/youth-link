#!/usr/bin/env bash
# 로컬 개발 환경을 띄운다. MySQL · Chroma 컨테이너와 Chroma 초기 스키마까지 준비한다.
#
# 사용: ./scripts/local-up.sh
# 선행: .env.properties (.env.properties.example 을 복사해 값 채우기)
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env.properties ] || { echo "ERROR: .env.properties 가 없습니다. .env.properties.example 을 복사하세요."; exit 1; }
set -a; . ./.env.properties; set +a

# Chroma 1.0.0 으로 고정한다.
# 0.6.x 는 Spring AI 1.1.1 의 upsert 요청 본문을 받지 못해 400 을 돌려준다.
CHROMA_IMAGE="chromadb/chroma:1.0.0"

echo "==> MySQL (3307)"
docker rm -f youthlink-mysql >/dev/null 2>&1 || true
docker run -d --name youthlink-mysql \
  -p 3307:3306 \
  -e MYSQL_ROOT_PASSWORD="$MYSQL_PASSWORD" \
  -e MYSQL_DATABASE=youth_link \
  -e TZ=Asia/Seoul \
  mysql:8 >/dev/null

echo "==> Chroma (8000)"
docker rm -f youthlink-chroma >/dev/null 2>&1 || true
docker run -d --name youthlink-chroma -p 8000:8000 "$CHROMA_IMAGE" >/dev/null

echo "==> MySQL 준비 대기"
for _ in $(seq 1 60); do
  docker exec youthlink-mysql mysqladmin ping -h127.0.0.1 -uroot -p"$MYSQL_PASSWORD" --silent >/dev/null 2>&1 && break
  sleep 2
done

echo "==> Chroma 준비 대기"
for _ in $(seq 1 60); do
  curl -sf -o /dev/null --max-time 3 http://localhost:8000/api/v2/heartbeat && break
  sleep 2
done

# Spring AI 는 default_tenant 가 아니라 SpringAiTenant / SpringAiDatabase 를 쓴다.
# 또 ChromaApi.getCollection 이 404 에서 바로 예외를 던져서
# application.yml 의 initialize-schema: true 가 컬렉션을 만들어 주지 못한다.
# 그래서 테넌트·데이터베이스·컬렉션을 여기서 미리 만든다.
echo "==> Chroma 초기 스키마 (SpringAiTenant / SpringAiDatabase / youth_policies)"
B=http://localhost:8000/api/v2
curl -sf -o /dev/null -X POST -H 'Content-Type: application/json' \
  -d '{"name":"SpringAiTenant"}' "$B/tenants" || true
curl -sf -o /dev/null -X POST -H 'Content-Type: application/json' \
  -d '{"name":"SpringAiDatabase"}' "$B/tenants/SpringAiTenant/databases" || true
curl -sf -o /dev/null -X POST -H 'Content-Type: application/json' \
  -d '{"name":"youth_policies"}' \
  "$B/tenants/SpringAiTenant/databases/SpringAiDatabase/collections" || true

echo
echo "준비 완료. 다음을 실행하세요:"
echo "  ./gradlew bootRun                 # 백엔드 (8080)"
echo "  npm --prefix frontend run dev     # 프론트엔드 (3000)"
