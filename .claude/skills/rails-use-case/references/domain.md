# Domain rules (salary management)

1. An employee is paid in **their country's currency** — `currency` is derived from `country_code`, never input.
2. `employees.salary` = the **latest salary revision**; written only by `EmployeeService::Create` and
   `SalaryRevisionService::Create` inside a transaction with a row lock.
3. Revisions are **append-only**; corrections are new revisions with reason `correction`.
4. Creating an employee creates the `hire` revision (`effective_on = hired_on`, `changed_by = current user`).
5. A new revision's `effective_on` must be ≤ today, ≥ `hired_on`, ≥ the latest revision's `effective_on`.
6. `country_code` is immutable after creation (relocation = v2).
7. Org-wide numbers are USD-normalised with the static, dated FX table in `config/currencies.yml`;
   per-country numbers stay in local currency.
8. Text input is normalised (`strip_tags` + `squish`) before validation.

## Roles
| Capability | hr_manager | viewer |
|---|:-:|:-:|
| Read employees, salary history, insights, lookups | ✅ | ✅ |
| Create / update / delete employees, record revisions, export CSV | ✅ | ❌ |

## Reference data (config, not tables)
Countries: US·USD, GB·GBP, DE·EUR, NL·EUR, IN·INR, CA·CAD, AU·AUD, SG·SGD, JP·JPY, BR·BRL.
Departments: Engineering, Product, Design, Sales, Marketing, Customer Support, Finance, Human Resources, Operations, Legal.
Employment types: full_time, part_time, contractor. Revision reasons (user): promotion, annual_review,
market_adjustment, correction, other — `hire` is system-only.
