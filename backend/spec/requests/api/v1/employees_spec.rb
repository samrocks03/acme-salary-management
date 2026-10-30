# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'api/v1/employees' do
  let(:hr_manager) { create(:user) }
  let(:Authorization) { bearer_for(hr_manager) }
  let(:employee_schema) { { '$ref' => '#/components/schemas/employee' } }

  path '/api/v1/employees' do
    get('list employees') do
      tags 'Employees'
      produces 'application/json'
      security [{ bearer_auth: [] }]
      description 'Search, filter, sort and paginate. Invalid sort/direction fall back to the defaults.'
      parameter name: :q, in: :query, required: false, schema: { type: :string },
                description: 'Case-insensitive contains on name, email or employee code'
      parameter name: :country, in: :query, required: false, schema: { type: :string }, description: 'ISO-3166 alpha-2'
      parameter name: :department, in: :query, required: false, schema: { type: :string }
      parameter name: :job_title, in: :query, required: false, schema: { type: :string }
      parameter name: :employment_type, in: :query, required: false,
                schema: { type: :string, enum: %w[full_time part_time contractor] }
      parameter name: :sort, in: :query, required: false,
                schema: { type: :string, enum: EmployeeRepository::SORTABLE_COLUMNS, default: 'full_name' }
      parameter name: :direction, in: :query, required: false, schema: { type: :string, enum: %w[asc desc] }
      parameter name: :page, in: :query, required: false, schema: { type: :integer, minimum: 1, default: 1 },
                description: 'Clamped to 1..total_pages; `meta.page` is the page actually returned'
      parameter name: :per_page, in: :query, required: false,
                schema: { type: :integer, minimum: 1, maximum: 100, default: 25 }

      response(200, 'paginated employees') do
        schema SwaggerSchemas.envelope({ type: :array, items: { '$ref' => '#/components/schemas/employee' } },
                                       meta: true)
        let!(:asha) { create(:employee, first_name: 'Asha', last_name: 'Rao', country_code: 'IN', salary: 2_400_000) }
        let!(:ravi) { create(:employee, first_name: 'Ravi', last_name: 'Shah', country_code: 'IN', salary: 3_000_000) }

        before { create(:employee, :us, first_name: 'Ann', last_name: 'Lee') }

        context 'when filtering by country, sorting by salary desc' do
          let(:country) { 'in' }
          let(:sort) { 'salary' }
          let(:direction) { 'desc' }

          run_test! do |response|
            body = response.parsed_body
            expect(body['data'].pluck('id')).to eq([ravi.id.to_s, asha.id.to_s])
            expect(body['meta']).to eq('page' => 1, 'per_page' => 25, 'total_count' => 2, 'total_pages' => 1)
          end
        end

        context 'when searching by part of a name' do
          let(:q) { 'rA' }

          run_test! do |response|
            expect(response.parsed_body['data'].pluck('id')).to contain_exactly(asha.id.to_s, ravi.id.to_s)
          end
        end

        context 'when searching by employee code' do
          let(:q) { asha.reload.employee_code }

          run_test! do |response|
            expect(response.parsed_body['data'].pluck('id')).to eq([asha.id.to_s])
          end
        end

        context 'when paginating with an unknown sort column' do
          let(:sort) { 'salary; DROP TABLE employees' }
          let(:per_page) { 2 }
          let(:page) { 2 }

          run_test! do |response|
            expect(response.parsed_body['data'].pluck('attributes').pluck('full_name')).to eq(['Ravi Shah'])
            expect(response.parsed_body['meta']).to include('total_count' => 3, 'total_pages' => 2)
          end
        end

        context 'when the page is past the end (or too large for an integer column)' do
          let(:per_page) { 2 }
          let(:page) { '99999999999999999999' }

          run_test! do |response|
            expect(response.parsed_body['data'].pluck('attributes').pluck('full_name')).to eq(['Ravi Shah'])
            expect(response.parsed_body['meta']).to eq('page' => 2, 'per_page' => 2, 'total_count' => 3,
                                                       'total_pages' => 2)
          end
        end

        context 'when search wildcards are used' do
          let(:q) { '%' }

          run_test! do |response|
            expect(response.parsed_body['data']).to be_empty
          end
        end
      end

      include_examples 'unauthenticated'
    end

    post('create employee') do
      tags 'Employees'
      consumes 'application/json'
      produces 'application/json'
      security [{ bearer_auth: [] }]
      description 'HR manager only. Also records the first salary revision (reason `hire`). ' \
                  'Currency is derived from the country.'
      parameter name: :payload, in: :body, schema: SwaggerSchemas.body(:employee, 'employee_input')

      let(:attributes) do
        { first_name: 'Asha', last_name: 'Rao', email: 'asha.rao@acme.test', job_title: 'Software Engineer',
          department: 'Engineering', country_code: 'IN', employment_type: 'full_time', hired_on: '2022-04-11',
          salary: 2_400_000 }
      end
      let(:payload) { { employee: attributes } }

      response(201, 'created') do
        schema SwaggerSchemas.envelope({ '$ref' => '#/components/schemas/employee' })

        run_test! do |response|
          attrs = response.parsed_body.dig('data', 'attributes')
          expect(attrs).to include('full_name' => 'Asha Rao', 'currency' => 'INR', 'salary' => 2_400_000.0,
                                   'salary_usd' => 27_600.0, 'country_name' => 'India')
          expect(attrs['employee_code']).to match(/\AEMP-\d{6}\z/)
          expect(Employee.last.salary_revisions.sole).to have_attributes(reason: 'hire', changed_by: hr_manager)
        end
      end

      response(422, 'validation failed') do
        schema '$ref' => '#/components/schemas/error'
        let(:attributes) { super().merge(email: 'nope', salary: 0, country_code: 'XX') }

        run_test! do |response|
          expect(response.parsed_body['errors'].keys).to include('email', 'salary', 'country_code')
          expect(Employee.count).to eq(0)
        end
      end

      response(400, 'missing employee root') do
        schema '$ref' => '#/components/schemas/error'
        let(:payload) { { first_name: 'Asha' } }

        run_test!
      end

      include_examples 'unauthenticated'
      include_examples 'forbidden for viewer'
    end
  end

  path '/api/v1/employees/export' do
    get('export employees as CSV') do
      tags 'Employees'
      produces 'text/csv'
      security [{ bearer_auth: [] }]
      description 'HR manager only. Same filters and sort as the list, unpaginated. ' \
                  'Formula-like cells (= + - @ tab CR) are prefixed with a quote.'
      parameter name: :q, in: :query, required: false, schema: { type: :string }
      parameter name: :country, in: :query, required: false, schema: { type: :string }
      parameter name: :department, in: :query, required: false, schema: { type: :string }
      parameter name: :job_title, in: :query, required: false, schema: { type: :string }
      parameter name: :employment_type, in: :query, required: false, schema: { type: :string }
      parameter name: :sort, in: :query, required: false, schema: { type: :string }
      parameter name: :direction, in: :query, required: false, schema: { type: :string }

      response(200, 'CSV file') do
        header 'Content-Disposition', schema: { type: :string },
                                      description: 'attachment; filename="employees-YYYY-MM-DD.csv"'
        let(:country) { 'IN' }
        let!(:employees) { [create(:employee, country_code: 'IN'), create(:employee, :us)] }

        before { travel_to Date.new(2026, 10, 30) }

        run_test! do |response|
          expect(response.media_type).to eq('text/csv')
          expect(response.headers['Content-Disposition']).to include('attachment; filename="employees-2026-10-30.csv"')
          expect(CSV.parse(response.body.delete_prefix("\uFEFF")).size).to eq(2) # header + 1 row
        end
      end

      response(401, 'missing or invalid token') do
        let(:Authorization) { 'Bearer not-a-real-token' }

        run_test!
      end

      response(403, 'viewer role cannot export') do
        let(:Authorization) { bearer_for(create(:user, :viewer)) }

        run_test!
      end
    end
  end

  path '/api/v1/employees/{id}' do
    parameter name: :id, in: :path, schema: { type: :integer }

    let(:employee) { create(:employee) }
    let(:id) { employee.id }

    get('show employee') do
      tags 'Employees'
      produces 'application/json'
      security [{ bearer_auth: [] }]

      response(200, 'employee') do
        schema SwaggerSchemas.envelope({ '$ref' => '#/components/schemas/employee' })
        let(:Authorization) { bearer_for(create(:user, :viewer)) }

        run_test! do |response|
          expect(response.parsed_body.dig('data', 'id')).to eq(employee.id.to_s)
        end
      end

      response(404, 'not found') do
        schema '$ref' => '#/components/schemas/error'
        let(:id) { 0 }

        run_test! do |response|
          expect(response.parsed_body['errors']['base']).to eq(['Employee not found.'])
        end
      end

      include_examples 'unauthenticated'
    end

    patch('update employee') do
      tags 'Employees'
      consumes 'application/json'
      produces 'application/json'
      security [{ bearer_auth: [] }]
      description 'HR manager only. `salary`, `currency` and `employee_code` are ignored; ' \
                  "changing `country_code` returns 422 \"can't be changed\"."
      parameter name: :payload, in: :body, schema: SwaggerSchemas.body(:employee, 'employee_input')
      let(:payload) { { employee: { job_title: 'Senior Software Engineer', salary: 1, currency: 'USD' } } }

      response(200, 'updated') do
        schema SwaggerSchemas.envelope({ '$ref' => '#/components/schemas/employee' })

        run_test! do |response|
          attrs = response.parsed_body.dig('data', 'attributes')
          expect(attrs).to include('job_title' => 'Senior Software Engineer', 'salary' => 2_400_000.0,
                                   'currency' => 'INR')
        end
      end

      response(422, 'country cannot change') do
        schema '$ref' => '#/components/schemas/error'
        let(:payload) { { employee: { country_code: 'US' } } }

        run_test! do |response|
          expect(response.parsed_body['errors']).to eq('country_code' => ["can't be changed"])
        end
      end

      response(404, 'not found') do
        schema '$ref' => '#/components/schemas/error'
        let(:id) { 0 }

        run_test!
      end

      include_examples 'unauthenticated'
      include_examples 'forbidden for viewer'
    end

    delete('delete employee') do
      tags 'Employees'
      produces 'application/json'
      security [{ bearer_auth: [] }]
      description 'HR manager only. Deletes the employee and their salary history.'

      response(200, 'deleted') do
        schema SwaggerSchemas.message_envelope
        let(:employee) { create(:employee, :with_history) }

        run_test! do
          expect(Employee.exists?(id)).to be(false)
          expect(SalaryRevision.where(employee_id: id)).to be_empty
        end
      end

      response(404, 'not found') do
        schema '$ref' => '#/components/schemas/error'
        let(:id) { 0 }

        run_test!
      end

      include_examples 'unauthenticated'
      include_examples 'forbidden for viewer'
    end
  end
end
