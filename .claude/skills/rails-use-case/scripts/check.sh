#!/usr/bin/env bash
# Backend verification gate: specs, lint, security scan, Swagger regeneration.
# Usage: .claude/skills/rails-use-case/scripts/check.sh [rspec args...]
set -euo pipefail

cd "$(git rev-parse --show-toplevel)/backend"

echo "==> rspec"
bundle exec rspec "$@"

echo "==> rubocop"
bundle exec rubocop

echo "==> brakeman"
bundle exec brakeman -q --no-pager --no-summary

echo "==> swagger"
RAILS_ENV=test bundle exec rake rswag:specs:swaggerize >/dev/null

if ! git diff --quiet -- swagger/; then
  echo "swagger/v1/swagger.yaml changed — review and commit it with your change."
fi
echo "All backend checks passed."
