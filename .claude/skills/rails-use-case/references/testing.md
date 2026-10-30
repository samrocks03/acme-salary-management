# Testing templates

Contents: 1. Principles · 2. Service spec · 3. Policy spec · 4. rswag request spec · 5. Factories · 6. Swagger

## 1. Principles
- **Fast**: build/`build_stubbed` where persistence isn't the point; no `sleep`; insights cache cleared in a `before`.
- **Deterministic**: `travel_to(Date.new(2026, 10, 1))` for anything date-based; fixed numbers, not `Faker`, in
  assertions about money.
- **One behaviour per example**, named as the rule it protects ("rejects an effective date before the latest revision").
- Bullet raises on N+1 in the test env — a failing Bullet spec means add `includes`, not disable Bullet.

## 2. Service spec — `spec/services/salary_revision_service/create_spec.rb`
```ruby
RSpec.describe SalaryRevisionService::Create do
  subject(:result) { described_class.new(hr, employee.id, params).call }

  let(:hr) { create(:user) }
  let(:employee) { create(:employee, :with_history, salary: 100_000, hired_on: Date.new(2024, 1, 1)) }
  let(:params) { { amount: 110_000, effective_on: Date.new(2026, 9, 1), reason: 'promotion' } }

  before { travel_to Date.new(2026, 10, 1) }

  it 'updates the employee current salary to the new amount' do
    expect { result }.to change { employee.reload.salary }.from(100_000).to(110_000)
  end

  it 'records who made the change and the percentage' do
    expect(result.data[:attributes]).to include(change_percent: 10.0, changed_by_name: hr.name)
  end

  context 'when the effective date is in the future' do
    let(:params) { super().merge(effective_on: Date.new(2026, 10, 2)) }

    it { expect(result).not_to be_success }
    it { expect { result }.not_to(change { employee.reload.salary }) }
  end
end
```

## 3. Policy spec — `spec/policies/employee_policy_spec.rb`
```ruby
RSpec.describe EmployeePolicy do
  subject { described_class }

  permissions :index?, :show? do
    it { is_expected.to permit(build_stubbed(:user, :viewer), Employee) }
  end

  permissions :create?, :update?, :destroy?, :export? do
    it { is_expected.to permit(build_stubbed(:user), Employee) }
    it { is_expected.not_to permit(build_stubbed(:user, :viewer), Employee) }
  end
end
```

## 4. rswag request spec — `spec/requests/api/v1/employees_spec.rb`
Each endpoint documents and asserts: success, 401, 403 (viewer on writes), 404/422 where they can happen.
```ruby
require 'swagger_helper'

RSpec.describe 'Employees API' do
  let(:hr) { create(:user) }
  let(:Authorization) { bearer_for(hr) } # spec/support/auth_helpers.rb — real signed JWT

  path '/api/v1/employees' do
    post 'Create an employee' do
      tags 'Employees'
      security [bearer_auth: []]
      consumes 'application/json'
      parameter name: :payload, in: :body, schema: { '$ref' => '#/components/schemas/employee_input' }

      let(:payload) { { employee: attributes_for(:employee).except(:currency) } }

      response 201, 'created' do
        run_test! { |res| expect(json(res)[:data][:attributes][:employee_code]).to match(/\AEMP-\d{6}\z/) }
      end

      response 403, 'viewer cannot create' do
        let(:Authorization) { bearer_for(create(:user, :viewer)) }
        run_test!
      end

      response 401, 'missing token' do
        let(:Authorization) { nil }
        run_test!
      end
    end
  end
end
```

## 5. Factories — `spec/factories/*.rb`
Defaults are valid and minimal (`create(:user)` is an hr_manager); variations are traits — `:user, :viewer`,
`:user, :locked`, `:employee, :with_history`, `:employee, :us` — so a spec reads as the scenario it sets up.
Shared datasets for insights live in `spec/support/insight_dataset.rb`; reusable swagger schemas in
`spec/support/swagger_schemas.rb` (`SwaggerSchemas.envelope`, `.resource`, `.error`).

## 6. Swagger
`RAILS_ENV=test bundle exec rake rswag:specs:swaggerize` regenerates `swagger/v1/swagger.yaml` (committed,
served at `/api-docs`). Regenerate whenever a request spec changes.
