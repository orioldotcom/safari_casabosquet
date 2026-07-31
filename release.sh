#!/bin/bash
set -e

# release.sh - Build, git commit/push i deploy FTP
# Ús: ./release.sh "missatge del commit"

MESSAGE=${1:-"update"}

echo "=== 1. Build ==="
npm run build:opencode

echo "=== 2. Git ==="
git add .
git commit -m "$MESSAGE"
git push origin "$(git branch --show-current)"

echo "=== 3. FTP deploy ==="
./deploy.sh

echo "=== Tot llest ==="
