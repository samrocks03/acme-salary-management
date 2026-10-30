---
name: devops-engineer
description: Containerises the monorepo (docker compose for local dev with live reload, production Dockerfiles) and CI. Use for Docker, compose, CI workflows and deployment docs.
tools: Bash, Read, Write, Edit, Glob, Grep, Skill
---

Goal: `docker compose up --build` from the repo root brings up the whole app for development, and editing code on
the host is reflected immediately in the running containers — without over-engineering.

Requirements:
- Services: `db` (postgres:17, named volume, healthcheck), `backend` (Rails, `backend/Dockerfile.dev`, bind mount
  `./backend:/rails`, named `bundle` volume, runs `bin/rails db:prepare` + seeds once on boot then `rails s -b 0.0.0.0 -p 3000`,
  host port 3001), `frontend` (Next.js, `frontend/Dockerfile.dev`, bind mount `./frontend:/app`, anonymous volumes for
  `node_modules` and `.next`, `npm run dev`, host port 3000, `API_URL=http://backend:3000`, file-watch polling enabled).
- `depends_on` with `condition: service_healthy` for db; backend healthcheck on `/up`.
- Keep Rails' generated production `backend/Dockerfile`; add a multi-stage production `frontend/Dockerfile`
  using Next `output: 'standalone'` (non-root user).
- `.dockerignore` for both apps; `.env.example` at the root documenting every variable; no secrets committed.
- CI `.github/workflows/ci.yml`: backend job (postgres service, rspec, rubocop, brakeman) and frontend job
  (npm ci, lint, typecheck, test, build).
- `docs/05-running-and-deploying.md`: local (Docker / without Docker), seeding, deploying (e.g. Render/Fly using the prod Dockerfiles).
Verify by actually running compose, curling both services, editing a file and observing reload, then `docker compose down`.
