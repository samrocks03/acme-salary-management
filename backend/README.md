# ACME Salary Management — API (`backend/`)

Rails 8.1 JSON API (Ruby 4.0.7, PostgreSQL 17) behind the Next.js BFF in `../frontend`.
The contract both apps follow is `../docs/03-api-contract.md`; the OpenAPI version is generated from the request
specs and served at **http://localhost:3001/api-docs**.

## Setup

```bash
# PostgreSQL 17 on localhost:5432 (postgres/postgres by default — see .env.example)
bundle install
bin/rails db:prepare          # creates acme_salary_development / acme_salary_test, loads db/structure.sql
bin/rails db:seed             # 10,000 employees + ~23k salary revisions + 2 users (~6 s)
bin/rails server              # http://localhost:3001 (PORT to override)
```

Seeded accounts (password `Password@123`): `hr@acme.test` (hr_manager, read + write) and `viewer@acme.test`
(viewer, read-only). `SEED_EMPLOYEES=500` seeds fewer; `SEED_RESET=1` wipes employees and re-seeds (otherwise the
seed skips when employees already exist).

Environment (all optional locally): `DATABASE_HOST|PORT|USERNAME|PASSWORD`, `DATABASE_URL` (production),
`FRONTEND_ORIGIN` (CORS, default `http://localhost:3000`), `DEVISE_JWT_SECRET_KEY` (falls back to `secret_key_base`),
`SECRET_KEY_BASE` (production).

## Commands

| Task | Command |
|---|---|
| Tests (+ SimpleCov, fails under 90 % line coverage) | `bundle exec rspec` |
| Lint | `bundle exec rubocop` |
| Security | `bundle exec brakeman -q --no-pager` · `bundle exec bundler-audit check --update` |
| Everything CI runs | `bin/ci` |
| Regenerate Swagger (`swagger/v1/swagger.yaml`) | `RAILS_ENV=test bundle exec rake rswag:specs:swaggerize` |

## Calling the API

```bash
curl -i -X POST localhost:3001/api/v1/auth/sign_in -H 'Content-Type: application/json' \
  -d '{"user":{"email":"hr@acme.test","password":"Password@123"}}'
# -> 200, header `Authorization: Bearer <jwt>` (8 h). Send it back on every other request.
curl 'localhost:3001/api/v1/employees?country=IN&sort=salary&direction=desc' -H 'Authorization: Bearer <jwt>'
```

Every response uses the envelope `{ success, message, data, meta? }` or `{ success: false, errors: { field: [..] } }`.

## Structure

```
app/controllers/api/v1/           thin: authorize (Pundit) -> Service.new(...).call -> render_result
app/controllers/concerns/         RendersServiceResult, ErrorHandling (403/404/400 -> error envelope)
app/services/base.rb              success / failure / validation_failure helpers -> ServiceResult
app/services/service_result.rb    immutable result (Data.define) rendered as the JSON envelope
app/services/<domain>_service/    one class per use case: employee_service/{index,show,create,update,destroy,export},
                                  salary_revision_service/{index,create}, insight_service/*, lookup_service, auth_service
app/services/repositories/        all non-trivial querying (EmployeeRepository, SalaryRevisionRepository, InsightRepository)
app/serializers/v1/               jsonapi-serializer resources
app/policies/                     Pundit; reads for any signed-in user, writes for hr_manager
app/models/reference/             Country, Fx, Department, JobTitle — read from config/*.yml
app/lib/                          TextNormalizer, Auth::JsonFailureApp (JSON 401s)
lib/seeds/                        deterministic EmployeeSeeder + UserSeeder
spec/                             models, services, policies, lib, requests/api/v1 (rswag) — 190+ examples
```

## Design notes

- **Current salary is denormalised** onto `employees.salary` and only written by `EmployeeService::Create` (hire
  revision) and `SalaryRevisionService::Create`, inside a transaction holding a row lock on the employee. Lists,
  sorts and every insight stay single-table queries on 10k rows.
- **Revisions are append-only**: no update/delete routes, persisted records are read-only, corrections are new
  revisions. `effective_on` must be ≤ today, ≥ `hired_on` and ≥ the latest revision, so "current salary = latest
  revision" holds without scheduling. `hire` is system-only.
- **Currency follows the country** (set before validation, never from input); `country_code` is immutable.
  Org-wide figures are USD-normalised with the static, dated table in `config/currencies.yml`; the SQL `CASE`
  is built only from that config with quoted values.
- **Database guards too**: check constraints (salary range, enums, lengths), unique email/code, a Postgres sequence
  for `EMP-000123` codes, a stored generated `full_name` with a trigram GIN index for `ILIKE` search. The schema is
  `db/structure.sql` because `schema.rb` can't express the sequence.
- **Insights** are cached in `Rails.cache` under a key that includes a cheap data version
  (`count`, `max(updated_at)`, `max(revision id)`), so any write invalidates them — no busting code to forget.
- **Security**: Devise + devise-jwt (denylist revocation on sign-out, 8 h expiry), lockable (5 attempts / 15 min),
  `rate_limit` on sign-in (10 / 3 min per IP + email, so the shared BFF IP is not one global bucket), paranoid auth messages, Pundit with `verify_authorized`, allow-listed
  sort columns, `sanitize_sql_like` + bound params for search, HTML stripped from text input, CSV formula-injection
  escaping, security headers, CORS limited to `FRONTEND_ORIGIN` with `Authorization` exposed, salary/amount filtered
  from logs.
- **Deliberate differences from the reference codebase**: `ServiceResult` value object instead of `OpenStruct`;
  no SQL string interpolation of user input; HTTP status comes from the service (404/422/201), not always 422.
