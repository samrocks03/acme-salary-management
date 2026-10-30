# Components — Atomic Design

| Level | Folder | What belongs here | Examples |
|---|---|---|---|
| ui (atoms source) | `src/components/ui/` | shadcn primitives, generated — edit sparingly | Button, Input, Select, Dialog, Table, Card |
| atoms | `src/components/atoms/` | Tiny app-specific display primitives, no state | Money, RoleBadge, CountryLabel, DateText, Spinner |
| molecules | `src/components/molecules/` | A few atoms with one job, local UI state at most | FormField, SearchInput, SelectFilter, StatCard, PaginationControls, ConfirmDialog, EmptyState, SortButton |
| organisms | `src/components/organisms/` | Feature-sized sections; **props in, callbacks out**, no data fetching | EmployeesTable, EmployeeFilters, EmployeeForm, SalaryRevisionForm, SalaryHistory, CountryPayTable, PayBarChart, DistributionChart, AppSidebar, UserMenu |
| templates | `src/components/templates/` | Page layouts with slots | AppShell, PageHeader |
| containers | next to the route or in `src/features/<domain>/components/` | `'use client'` glue: hooks → organism props | EmployeesContainer, SalaryRevisionDialogContainer |

## SOLID, applied
- **S**: an organism renders; a container fetches/mutates; a fetcher talks HTTP. Each changes for one reason.
- **O**: extend via props/composition (`actions` slot, `renderCell`), not by editing internals per use case.
- **L**: molecules accept native props (`...props` spread onto the underlying element) so they substitute for it.
- **I**: small prop interfaces; don't pass the whole `user` when a `canEdit: boolean` will do.
- **D**: organisms depend on callbacks (`onSubmit`, `onPageChange`), not on React Query or the router.

## Before creating a component
1. Search `src/components` — reuse or extend an existing one.
2. Put it at the lowest level that fits; move up only when it gains responsibilities.
3. Name by what it is in the domain (`SalaryHistory`), not how it looks (`BlueTimeline`).

## UI conventions
Simple, calm, neutral palette; one primary action per view; tables right-align money; `Money` formats with
`Intl.NumberFormat` in the row's currency and shows USD as secondary text where helpful.
Accessibility: every input has a `<label>`, icon buttons have `aria-label`, dialogs trap focus (Radix does),
visible focus rings, sortable headers expose `aria-sort`.
