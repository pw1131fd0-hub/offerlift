#!/bin/bash
set -e
cd /home/crawd_user/project/offerlift

# 等候舊 container 完全停止
fuser -k 3000/tcp 2>/dev/null || true
sleep 2

# 啟動所有服務（含 postgres + redis）
docker compose up -d --build

# 等候 offerlift healthy（最多 60 秒）
echo "⏳ 等候服務 healthy..."
for i in $(seq 1 60); do
    status=$(docker inspect --format='{{.State.Health.Status}}' offerlift 2>/dev/null || echo "none")
    if [ "$status" = "healthy" ]; then
        echo "✅ offerlift is healthy"
        exit 0
    fi
    sleep 1
done

echo "❌ offerlift healthcheck timeout"
docker compose logs --tail=20
exit 1
