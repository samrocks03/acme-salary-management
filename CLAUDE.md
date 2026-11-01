# CLAUDE.md — working agreement for AI agents in this repo

ACME Salary Management: Rails 8.1 API (`backend/`) + Next.js 16 BFF/UI (`frontend/`) in one monorepo.
Read `README.md` (domain rules, roles, API) before changing behaviour. The API contract is the rswag request
specs in `backend/spec/requests/api/v1/` (rendered at `/api-docs`) — change it first, then both sides.

## Hard rules
- Commits: small, conventional (`feat(backend): …`, `test(frontend): …`), authored by
  `Samarth Kulkarni <svkulkarni23@gmail.com>`. **No `Co-Authored-By` / `Claude-Session` trailers.**
- Never commit secrets or `.env` files. Use `.env.example`.
- Backend: every controller action calls `authorize` (Pundit) — `verify_authorized` enforces it.
  Business logic lives in `app/services/<domain>_service/*.rb`; queries in `app/services/repositories/`.
- Frontend: never use `dangerouslySetInnerHTML`; never read the JWT in client code (it is httpOnly);
  client components fetch through `/api/proxy/*` only; server components through `lib/api/server`.
- Tests must be fast and deterministic: no network, fixed seeds, `travel_to` for time.
- Write the failing spec first for domain rules (TDD), then the code.

## Commands
| Task | Command |
|---|---|
| Everything (Docker, live reload) | `docker compose up --build` → UI http://localhost:3000, API http://localhost:3001, Swagger http://localhost:3001/api-docs |
| Backend tests | `cd backend && bundle exec rspec` |
| Backend lint / security | `bundle exec rubocop` · `bundle exec brakeman -q` |
| Regenerate Swagger | `cd backend && RAILS_ENV=test bundle exec rake rswag:specs:swaggerize` |
| Seed 10k employees | `cd backend && bin/rails db:seed` (`SEED_EMPLOYEES=500` for fewer) |
| Frontend dev / tests | `cd frontend && npm run dev` · `npm test` · `npm run lint` · `npm run typecheck` |

## Agents & skills used to build this repo
- `.claude/agents/` — role briefs given to sub-agents (backend, frontend, devops, security review).
- `.claude/skills/rails-use-case` — checklist for adding an endpoint end-to-end.
- `.claude/skills/next-feature-module` — checklist for adding a data-driven page.
- `README.md` → "How AI was used" — the orchestration approach.
