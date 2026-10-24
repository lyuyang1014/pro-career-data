#!/usr/bin/env bash
# 把 pro-career-data/ 推成独立的公开仓库 lyuyang1014/pro-career-data（部署机上执行，需要 gh 已登录、有建仓库权限）
#   bash pro-career-data/scripts/publish.sh            第一次：建公开仓库并推送
#   bash pro-career-data/scripts/publish.sh --update   以后：把最新的 data/ 和脚本推上去
# 只推这个目录（.cache/ 原始下载不推）；队员资料、对局记录、球星照片和队徽图片都不在这里
set -euo pipefail
REPO="lyuyang1014/pro-career-data"
SRC="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

rsync -a --exclude '.cache' --exclude 'node_modules' "$SRC/" "$WORK/"
cd "$WORK"
if [ "${1:-}" = "--update" ]; then
  git clone --quiet "https://github.com/$REPO.git" repo
  rsync -a --delete --exclude '.git' "$WORK/" repo/ --exclude repo
  cd repo
  git add -A
  git commit -qm "data: $(date +%F) 重新生成" || { echo "没有变化"; exit 0; }
  git push -q origin HEAD
else
  git init -q -b main
  git add -A
  git commit -qm "pro-career-data 1.0.0：历史足球数据（CC0 / GPL-2.0-or-later / RSSSF / CC BY 3.0 IGO 分目录）"
  gh repo create "$REPO" --public --description "Historical football data (league tables, tournaments, player careers, births) for the NIO United FC mini program 'Pro Career' — CC0 / GPL-2.0 / RSSSF / CC BY 3.0 IGO" --source . --push
fi
echo "完成：https://github.com/$REPO"
