# Layer templates

Contents: 0. Exemplars · 1. Route · 2. Controller · 3. Service · 4. ServiceResult & Base helpers · 5. Repository · 6. Serializer · 7. Policy · 8. Locale

Paths are relative to `backend/`. When in doubt, copy the shape of the exemplar file rather than these snippets.

## 0. Exemplars — read the closest one first
| Need | Exemplar |
|---|---|
| CRUD controller with strong params | `app/controllers/api/v1/employees_controller.rb` |
| Nested resource controller | `app/controllers/api/v1/salary_revisions_controller.rb` |
| Write service with transaction + derived state | `app/services/salary_revision_service/create.rb`, `app/services/employee_service/create.rb` |
| List service with filters + pagination meta | `app/services/employee_service/index.rb` (+ `filter_params.rb`) |
| Cached aggregate | `app/services/insight_service/*.rb` (+ `support.rb`, `grouped_stats.rb`) |
| Query building | `app/services/repositories/employee_repository.rb`, `insight_repository.rb` |
| Envelope rendering / error mapping | `app/controllers/concerns/renders_service_result.rb`, `error_handling.rb` |
| Reference data (countries, FX) | `app/models/reference/*.rb`, `config/countries.yml`, `config/currencies.yml` |

## 1. Route — `config/routes.rb`
```ruby
namespace :api do
  namespace :v1 do
    resources :employees do
      get :export, on: :collection
      resources :salary_revisions, only: %i[index create]
    end
  end
end
```

## 2. Controller
Thin: authorize, delegate, render. Strong params use Rails 8 `params.expect`, one method per writing action.
```ruby
module Api
  module V1
    class EmployeesController < ApplicationController
      EMPLOYEE_ATTRIBUTES = %i[first_name last_name email job_title department employment_type hired_on].freeze

      def create
        authorize Employee
        render_result EmployeeService::Create.new(create_params, current_user).call
      end

      private

      def create_params
        params.expect(employee: [*EMPLOYEE_ATTRIBUTES, :country_code, :salary])
      end
    end
  end
end
```
`render_result` maps the `ServiceResult` to its `status` and JSON envelope. Services are constructed as
`(<id or params>, current_user)` — keep that argument order.

## 3. Service
One public `call`, returns a `ServiceResult`. Guard clauses return early; the happy path reads top-down.
```ruby
module EmployeeService
  # Creates the employee and its first salary revision (domain rule 4) in one transaction.
  class Create < Base
    SUCCESS_KEY = 'employee.create.success.message'

    def initialize(params, current_user)
      super()
      @params = params.to_h.symbolize_keys
      @current_user = current_user
    end

    def call
      employee = Employee.new(@params)
      ActiveRecord::Base.transaction do
        employee.save!
        record_hire_revision!(employee)
      end

      success(serialize(V1::EmployeeSerializer, employee.reload), message_key: SUCCESS_KEY, status: :created)
    rescue ActiveRecord::RecordInvalid => e
      validation_failure(e.record.errors)
    end
  end
end
```
Anything that derives state from a row (current salary) locks it first: `EmployeeRepository.find_for_update(id)`.

## 4. ServiceResult & Base helpers
`ServiceResult = Data.define(:success, :data, :message, :errors, :meta, :status)` with `.ok(...)` / `.error(...)`
— an immutable replacement for the reference repo's `OpenStruct`. Inside services use the `Base` helpers:
| Helper | Use for |
|---|---|
| `success(data, message_key:, meta: nil, status: :ok)` | Happy path; message translated from en.yml |
| `failure(key, status: :unprocessable_content)` | Business-rule failure → `errors.base` (`key` + `.detail` translated) |
| `validation_failure(record.errors)` | ActiveModel errors → `{ field: [messages] }` |
| `serialize(SerializerClass, resource)` | JSON:API `data` hash |

## 5. Repository
Class methods inside `class << self`, no request state. User input never becomes SQL text: allow-listed
sort columns/directions passed to `order` as a hash, `sanitize_sql_like` + bind params for search.
```ruby
class EmployeeRepository
  SORTABLE_COLUMNS = %w[full_name salary hired_on job_title country_code department created_at].freeze

  class << self
    def sorted(scope, sort, direction)
      column = SORTABLE_COLUMNS.include?(sort) ? sort : DEFAULT_SORT
      dir = DIRECTIONS.include?(direction) ? direction : DEFAULT_DIRECTION
      scope.order(column => dir).order(id: dir) # id breaks ties so pages are stable
    end
  end
end
```

## 6. Serializer — `app/serializers/v1/*_serializer.rb`
`include JSONAPI::Serializer`; money as `to_f`; computed fields (`salary_usd`, `country_name`,
`change_percent`, `changed_by_name`) as attribute blocks using `Reference::Fx` / `Reference::Country`.

## 7. Policy
```ruby
class EmployeePolicy < ApplicationPolicy
  def index? = user.present?
  def create? = user.hr_manager?
  def export? = user.hr_manager?
end
```
Headless policies for non-model endpoints: `authorize :insight, :show?` → `InsightPolicy#show?`.

## 8. Locale — `config/locales/en.yml`
`<domain>.<action>.success.message` and `<domain>.<action>.errors.<name>.detail`.
