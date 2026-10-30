# Frontend tests (Vitest + Testing Library)

Fast and deterministic: jsdom, no network (`vi.stubGlobal('fetch', …)` or pass fake callbacks), fixed dates.

## What to test
| Target | Example assertions |
|---|---|
| Pure utils | `formatMoney(2400000, 'INR')`, `flattenResource`, `parseEmployeeParams` clamps `per_page`, `can('viewer', 'employee:create') === false` |
| Schemas | zod rules match API rules (salary > 0, effective date not in future, note ≤ 500) |
| Organisms per role | `EmployeesTable` with `canEdit={false}` renders no action buttons; with `true` renders them |
| Forms | invalid submit shows messages and doesn't call `onSubmit`; valid submit calls it with typed values; server 422 errors appear on fields |
| Proxy route | rejects unknown path segment (404), rejects cross-origin POST (403), attaches Bearer from cookie, clears cookie on 401 |

## Template
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('blocks a future effective date', async () => {
  vi.setSystemTime(new Date('2026-10-01'));
  const onSubmit = vi.fn();
  render(<SalaryRevisionForm currency="INR" currentAmount={2_400_000} onSubmit={onSubmit} />);

  await userEvent.type(screen.getByLabelText(/new salary/i), '2640000');
  await userEvent.type(screen.getByLabelText(/effective date/i), '2026-10-02');
  await userEvent.click(screen.getByRole('button', { name: /record change/i }));

  expect(await screen.findByText(/can't be in the future/i)).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});
```
Query by role/label (what users perceive), not by class names or test ids, unless there's no accessible handle.
