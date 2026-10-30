# Layer templates

Contents: 1. Route · 2. Controller · 3. Service · 4. ServiceResult · 5. Repository · 6. Serializer · 7. Policy · 8. Locale

Paths are relative to `backend/`. Adapt names; keep the shape.

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

## 2. Controller — `app/controllers/api/v1/employees_controller.rb`
Thin: authorize, delegate, render. Strong params live here because they describe the HTTP surface.
```ruby
module Api
  module V1
    class EmployeesController < ApplicationController
      def index
        authorize Employee
        render_result EmployeeService::Index.new(current_user, index_params).call
      end

      def create
        authorize Employee
        render_result EmployeeService::Create.new(current_user, create_params).call, success_status: :created
      end

      private

      def index_params
        params.permit(:q, :country, :department, :job_title, :employment_type, :sort, :direction, :page, :per_page)
      end

      def create_params
        params.require(:employee).permit(:first_name, :last_name, :email, :job_title, :department,
                                         :country_code, :employment_type, :hired_on, :salary)
      end
    end
  end
end
```
`render_result` (concern `RendersServiceResult`) maps `ServiceResult` → status + envelope; errors use the
result's own status (`:not_found`, `:unprocessable_content`, …).

## 3. Service — `app/services/employee_service/create.rb`
One public `call`, returns a `ServiceResult`. Guard clauses return early failures; the happy path reads top-down.
```ruby
module EmployeeService
  class Create < Base
    SUCCESS_KEY = 'employee.create.success.message'

    def initialize(current_user, params)
      super()
      @current_user = current_user
      @params = params
    end

    def call
      employee = Employee.new(@params)
      ActiveRecord::Base.transaction do
        employee.save!
        SalaryRevisionRepository.create_hire!(employee, changed_by: @current_user)
      end
      success(serialize(employee), message_key: SUCCESS_KEY, status: :created)
    rescue ActiveRecord::RecordInvalid => e
      validation_failure(e.record)
    end

    private

    def serialize(employee) = V1::EmployeeSerializer.new(employee).serializable_hash[:data]
  end
end
```

## 4. ServiceResult — `app/services/service_result.rb`
Immutable value object instead of the reference repo's `OpenStruct` (explicit fields, no method_missing).
```ruby
ServiceResult = Data.define(:success, :data, :message, :errors, :meta, :status) do
  def success? = success
  def to_h = { success:, message:, data:, meta:, errors: }.compact
end
```

## 5. Repository — `app/services/repositories/employee_repository.rb`
Class methods only; no request state. Every user-controlled ordering goes through an allow-list.
```ruby
class EmployeeRepository
  SORTABLE = %w[full_name salary hired_on job_title country_code department created_at].freeze

  def self.search(scope, query)
    return scope if query.blank?

    pattern = "%#{ActiveRecord::Base.sanitize_sql_like(query.strip)}%"
    scope.where('employees.full_name ILIKE :p OR employees.email ILIKE :p OR employees.employee_code ILIKE :p', p: pattern)
  end

  def self.sorted(scope, column, direction)
    column = SORTABLE.include?(column) ? column : 'full_name'
    direction = direction == 'desc' ? :desc : :asc
    scope.order(column => direction, id: :asc) # tie-breaker keeps pagination stable
  end
end
```

## 6. Serializer — `app/serializers/v1/employee_serializer.rb`
```ruby
module V1
  class EmployeeSerializer
    include JSONAPI::Serializer
    attributes :employee_code, :first_name, :last_name, :full_name, :email, :job_title, :department,
               :country_code, :currency, :employment_type, :hired_on, :created_at, :updated_at
    attribute(:salary) { |e| e.salary.to_f }
    attribute(:salary_usd) { |e| Reference::Fx.to_usd(e.salary, e.currency).to_f }
    attribute(:country_name) { |e| Reference::Country.find(e.country_code)&.name }
  end
end
```

## 7. Policy — `app/policies/employee_policy.rb`
```ruby
class EmployeePolicy < ApplicationPolicy
  def index? = user.present?
  def show? = user.present?
  def create? = user.hr_manager?
  def update? = user.hr_manager?
  def destroy? = user.hr_manager?
  def export? = user.hr_manager?
end
```
Headless policies (insights, lookups): `authorize :insight, :show?` → `InsightPolicy#show?`.

## 8. Locale — `config/locales/en.yml`
```yaml
en:
  employee:
    create:
      success:
        message: "Employee created successfully."
    show:
      errors:
        not_found:
          detail: "Employee not found."
```
