# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'api/v1/employees/{employee_id}/salary_revisions' do
  let(:hr_manager) { create(:user, name: 'Hana HR') }
  let(:Authorization) { bearer_for(hr_manager) }
  let(:employee) { create(:employee, :with_history, hired_on: Date.new(2022, 4, 11), salary: 2_400_000) }
  let(:employee_id) { employee.id }

  before { travel_to Date.new(2026, 10, 30) }

  path '/api/v1/employees/{employee_id}/salary_revisions' do
    parameter name: :employee_id, in: :path, schema: { type: :integer }

    get('salary history') do
      tags 'Salary revisions'
      produces 'application/json'
      security [{ bearer_auth: [] }]
      description 'Immutable history, newest first.'

      response(200, 'revisions, newest first') do
        schema SwaggerSchemas.envelope({ type: :array,
                                         items: { '$ref' => '#/components/schemas/salary_revision' } })
        let(:Authorization) { bearer_for(create(:user, :viewer)) }

        run_test! do |response|
          rows = response.parsed_body['data'].pluck('attributes')
          expect(rows.pluck('reason')).to eq(%w[annual_review hire])
          expect(rows.first).to include('amount' => 2_640_000.0, 'previous_amount' => 2_400_000.0,
                                        'change_percent' => 10.0, 'currency' => 'INR')
          expect(rows.last).to include('previous_amount' => nil, 'change_percent' => nil)
        end
      end

      response(404, 'employee not found') do
        schema '$ref' => '#/components/schemas/error'
        let(:employee_id) { 0 }

        run_test!
      end

      include_examples 'unauthenticated'
    end

    post('record a salary change') do
      tags 'Salary revisions'
      consumes 'application/json'
      produces 'application/json'
      security [{ bearer_auth: [] }]
      description "HR manager only. Becomes the employee's current salary. `effective_on` must be <= today, " \
                  '>= hired_on and >= the latest revision; `hire` is system-only.'
      parameter name: :payload, in: :body, schema: SwaggerSchemas.body(:salary_revision, 'salary_revision_input')

      let(:revision) do
        { amount: 2_904_000, effective_on: '2026-04-01', reason: 'promotion', note: 'Promoted to Senior' }
      end
      let(:payload) { { salary_revision: revision } }

      response(201, 'recorded') do
        schema SwaggerSchemas.envelope({ '$ref' => '#/components/schemas/salary_revision' })

        run_test! do |response|
          expect(response.parsed_body.dig('data', 'attributes')).to include(
            'amount' => 2_904_000.0, 'previous_amount' => 2_640_000.0, 'change_percent' => 10.0,
            'reason' => 'promotion', 'changed_by_name' => 'Hana HR', 'effective_on' => '2026-04-01'
          )
          expect(employee.reload.salary).to eq(2_904_000)
        end
      end

      response(422, 'breaks a revision rule') do
        schema '$ref' => '#/components/schemas/error'
        let(:revision) { { amount: 0, effective_on: '2026-11-01', reason: 'hire', note: 'x' * 501 } }

        run_test! do |response|
          expect(response.parsed_body['errors']).to include(
            'amount' => ['must be greater than 0'],
            'effective_on' => ["can't be in the future"],
            'reason' => ['is not included in the list'],
            'note' => ['is too long (maximum is 500 characters)']
          )
          expect(employee.reload.salary).to eq(2_640_000)
        end
      end

      response(404, 'employee not found') do
        schema '$ref' => '#/components/schemas/error'
        let(:employee_id) { 0 }

        run_test!
      end

      include_examples 'unauthenticated'
      include_examples 'forbidden for viewer'
    end
  end
end
