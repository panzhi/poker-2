#!/usr/bin/env sh
set -eu

if [ ! -f docker-compose.yml ]; then
  echo "请在项目根目录执行：sh scripts/deploy-docker.sh" >&2
  exit 1
fi

if command -v git >/dev/null 2>&1 && [ -d .git ]; then
  git pull
fi

docker compose up -d --build
docker image prune -f
docker compose ps
