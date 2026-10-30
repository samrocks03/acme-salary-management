# Security checklist for backend changes

Walk this list for any change that accepts input, filters, sorts, exports or touches pay.

| Area | Check | Why |
|---|---|---|
| Authorization | `authorize` in the action; policy method exists; request spec proves viewer gets 403 on writes | Broken access control is the #1 web risk; the UI hiding a button is not a control |
| Mass assignment | Strong params per action; `salary`, `currency`, `employee_code`, `country_code` (on update) not permitted | Prevents pay changes bypassing the revision history |
| SQL | No user input interpolated; sort/direction via allow-list; `sanitize_sql_like` for LIKE | SQL injection + LIKE wildcard DoS |
| Stored XSS | Text attributes go through the model's `normalizes … strip_tags.squish` | Defence in depth — the API's data may be rendered by clients other than ours |
| CSV export | Cells beginning with `= + - @ \t \r` prefixed with `'` | Formula injection when HR opens the file in Excel |
| Logging | New sensitive params added to `config.filter_parameters` | Salaries and tokens must not land in logs |
| Errors | Error messages don't reveal whether an email exists | Account enumeration |
| Rate limiting | Auth-adjacent endpoints use Rails 8 `rate_limit` | Brute force |
| Money | Validate range (> 0, ≤ 100,000,000) and use `decimal`, never float columns | Precision + garbage data |

Run `bundle exec brakeman -q --no-pager` — it must stay at zero warnings.
