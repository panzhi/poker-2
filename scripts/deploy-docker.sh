#!/usr/bin/env sh
set -eu

if [ ! -f docker-compose.yml ]; then
  echo "请在项目根目录执行：sh scripts/deploy-docker.sh" >&2
  exit 1
fi

if command -v git >/dev/null 2>&1 && [ -d .git ]; then
  git pull
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "未找到 Docker Compose。请先安装 docker compose 插件或 docker-compose。" >&2
  echo "Debian/Ubuntu 可先试：apt update && apt install -y docker-compose-plugin" >&2
  exit 1
fi

$COMPOSE up -d --build
docker image prune -f
$COMPOSE ps
