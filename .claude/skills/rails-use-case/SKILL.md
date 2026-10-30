---
name: rails-use-case
description: Add or change a backend API use case (endpoint) in backend/ following the controller → service → repository → serializer → policy → spec layering. Use for any new /api/v1 endpoint, new action on an existing resource, or new business rule.
---

# Rails use case checklist

Layering mirrors `rsense-ror-org`. One use case = one service class.

1. **Contract first** — add/adjust the endpoint in `docs/03-api-contract.md` (shape, status codes, roles).
2. **Spec first**
   - `spec/services/<domain>_service/<action>_spec.rb` — happy path + each rule/validation failure.
   - `spec/policies/<model>_policy_spec.rb` — `permissions :action? do` for `hr_manager` and `viewer`.
   - `spec/requests/api/v1/<resources>_spec.rb` — rswag `path/get/response` blocks for 2xx, 401, 403, 404, 422.
3. **Policy** — `app/policies/<model>_policy.rb`; read actions for any signed-in user, writes `user.hr_manager?`.
4. **Repository** — `app/services/repositories/<model>_repository.rb`: class methods, no instance state,
   allow-listed sort columns, `sanitize_sql_like` for search, no string interpolation of user input.
5. **Service** — `app/services/<domain>_service/<action>.rb`:
   ```ruby
   module EmployeeService
     class Show < Base
       NOT_FOUND = 'employee.show.errors.not_found'
       SUCCESS_KEY = 'employee.show.success.message'

       def initialize(id, current_user)
         super()
         @id = id
         @current_user = current_user
       end

       def call
         employee = EmployeeRepository.find(@id)
         return failure(NOT_FOUND, status: :not_found) unless employee

         success(V1::EmployeeSerializer.new(employee).serializable_hash[:data], message_key: SUCCESS_KEY)
       end
     end
   end
   ```
   Multi-row writes go in `ActiveRecord::Base.transaction`, lock rows you derive state from (`lock!`).
6. **Messages** — every key in `config/locales/en.yml` under `<domain>.<action>.(success|errors)`.
7. **Controller** — thin:
   ```ruby
   def show
     authorize Employee
     render_result EmployeeService::Show.new(params[:id], current_user).call
   end
   ```
   Strong params in private `*_params` methods, one per action that writes.
8. **Route** under `namespace :api { namespace :v1 { … } }`.
9. Run `bundle exec rspec`, `bundle exec rubocop`, regenerate swagger, commit (`feat(backend): …`).
