---
name: rails-use-case
description: Build or change anything in this repo's Rails 8.1 API (backend/) the house way — route, thin Api::V1 controller, Pundit policy, service object returning ServiceResult, repository query, JSON:API serializer, en.yml messages, migrations, and RSpec/FactoryBot/rswag specs with Swagger regeneration. Use this whenever the task touches backend/ — a new or changed /api/v1 endpoint, a filter/sort/search param, an insight or report, a validation or salary/revision business rule, a migration or index, a permission change for hr_manager vs viewer, Devise/JWT auth behaviour, CSV export, seeds, failing or missing specs, N+1 or slow queries, or Swagger docs — even if the user only says "add an API for X", "the backend should also return Y", "viewers shouldn't be able to Z", "why is this endpoint 403/422" or "write tests for this service".
---

# Rails use case (backend/)

This API mirrors the layering of the `rsense-ror-org` house style: controllers stay thin, every use case is
one service class, and all non-trivial querying lives in repositories. Keeping that shape matters because
reviewers (and future agents) navigate by convention — a rule hidden in a controller or a model callback is
a rule nobody finds.

## Workflow

1. **Start from the contract.** Read the endpoint's section in `docs/03-api-contract.md` (local-only file; it
   may not exist in a fresh clone — then the rswag spec in `spec/requests/api/v1/` is the contract).
   Decide response shape, status codes and which role may call it before writing code.
2. **Write the failing specs first** — service spec for the rule, policy spec for the role, rswag request
   spec for the HTTP surface. Templates: `references/testing.md`.
3. **Implement bottom-up**: migration (if any) → model → repository → service → serializer → policy →
   controller → route → locale keys. Code templates for each layer: `references/layers.md`.
4. **Check the security list** in `references/security.md` for anything that accepts input, filters,
   sorts, exports or changes money.
5. **Verify** with `scripts/check.sh` (rspec + rubocop + brakeman + swagger regeneration). Fix until green.
6. **Commit** only code paths (`git add backend/`), conventional message such as
   `feat(backend): add salary distribution insight`. No AI attribution trailers.

## Rules that are easy to get wrong

- **Authorize every action.** `ApplicationController` runs `after_action :verify_authorized`, so a missing
  `authorize` raises in specs — that's the point; don't skip it, add the policy method instead.
  Reads are open to any signed-in user; writes require `user.hr_manager?`.
- **`employees.salary` is derived state.** Only `EmployeeService::Create` and `SalaryRevisionService::Create`
  write it, inside a transaction with `employee.lock!`. Anything else that changes pay must go through a
  revision, otherwise history and current salary drift apart.
- **Revisions are append-only.** Corrections are new revisions with reason `correction`.
- **Never interpolate user input into SQL.** Sort columns come from an allow-list constant; search uses
  `sanitize_sql_like` + bind params. The USD `CASE` is built only from config constants.
- **Messages come from `config/locales/en.yml`** (`<domain>.<action>.success.message`,
  `<domain>.<action>.errors.<name>.detail`) so wording is reviewable in one place.
- **Insights are cached by data version** — if you add an insight, key it through
  `InsightRepository.data_version` so writes invalidate it for free.

## Reference files

| File | Read it when |
|---|---|
| `references/layers.md` | Writing any controller, service, repository, serializer, policy or route |
| `references/testing.md` | Writing specs, factories, or regenerating Swagger |
| `references/security.md` | The change accepts input, filters/sorts, exports data or touches salary |
| `references/domain.md` | You need the domain rules (currency, revisions, roles, reference data) |
