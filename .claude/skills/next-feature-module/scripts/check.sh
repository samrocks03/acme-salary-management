#!/usr/bin/env bash
# Frontend verification gate: lint, types, unit tests, production build.
# Usage: .claude/skills/next-feature-module/scripts/check.sh
set -euo pipefail

cd "$(git rev-parse --show-toplevel)/frontend"

echo "==> lint";      npm run lint
echo "==> typecheck"; npm run typecheck
echo "==> test";      npm test
echo "==> build";     npm run build

echo "All frontend checks passed."
