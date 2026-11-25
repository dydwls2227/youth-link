#!/usr/bin/env bash
# 로컬 개발 컨테이너를 정리한다. 데이터도 함께 사라진다.
set -euo pipefail
docker rm -f youthlink-mysql youthlink-chroma 2>/dev/null || true
echo "youthlink-mysql, youthlink-chroma 제거 완료"
