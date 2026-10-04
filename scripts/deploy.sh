#!/usr/bin/env bash
set -e

# 进入仓库根目录
cd "$(dirname "$0")/.."

echo "==> 拉取最新代码"
git pull origin main

echo "==> 安装依赖"
npm ci

echo "==> 构建"
npm run build

echo "==> 重启服务"
pm2 restart uglyteam --update-env 2>/dev/null || pm2 start ecosystem.config.cjs

echo "==> 部署完成"
