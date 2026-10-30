# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'api/v1/insights' do
  include_context 'with insight dataset'

  let(:Authorization) { bearer_for(create(:user, :viewer)) }
  let(:data) { response.parsed_body['data'] }

  def self.country_param
    parameter name: :country, in: :query, required: false, schema: { type: :string, enum: Reference::Country.codes },
              description: 'Local currency for that country; omitted = USD-normalised across the org'
  end

  def self.invalid_country_response
    response(422, 'unknown country') do
      schema '$ref' => '#/components/schemas/error'
      let(:country) { 'XX' }

      run_test! do |response|
        expect(response.parsed_body['errors']).to eq('country' => ['is not a supported country'])
      end
    end
  end

  path '/api/v1/insights/overview' do
    get('org overview (USD)') do
      tags 'Insights'
      produces 'application/json'
      security [{ bearer_auth: [] }]

      response(200, 'no employees yet: averages are null, counts and total are 0') do
        schema SwaggerSchemas.envelope(SwaggerSchemas.insight(:overview))
        before { Employee.delete_all }

        run_test! do
          expect(data).to eq('headcount' => 0, 'countries_count' => 0, 'total_payroll_usd' => 0.0,
                             'avg_salary_usd' => nil, 'median_salary_usd' => nil, 'fx_as_of' => '2026-10-01')
        end
      end

      response(200, 'overview') do
        schema SwaggerSchemas.envelope(SwaggerSchemas.insight(:overview))

        run_test! do
          expect(data).to eq('headcount' => 5, 'countries_count' => 2, 'total_payroll_usd' => 369_000.0,
                             'avg_salary_usd' => 73_800.0, 'median_salary_usd' => 34_500.0, 'fx_as_of' => '2026-10-01')
        end
      end

      include_examples 'unauthenticated'
    end
  end

  path '/api/v1/insights/by_country' do
    get('pay by country (local currency + USD)') do
      tags 'Insights'
      produces 'application/json'
      security [{ bearer_auth: [] }]

      response(200, 'one row per country, headcount desc') do
        schema SwaggerSchemas.envelope({ type: :array, items: SwaggerSchemas.insight(:country_row) })

        run_test! do
          expect(data.pluck('country_code')).to eq(%w[IN US])
          expect(data.first).to eq(
            'country_code' => 'IN', 'country_name' => 'India', 'currency' => 'INR', 'headcount' => 3,
            'min_salary' => 1_000_000.0, 'median_salary' => 2_000_000.0, 'avg_salary' => 2_000_000.0,
            'max_salary' => 3_000_000.0, 'avg_salary_usd' => 23_000.0, 'median_salary_usd' => 23_000.0,
            'total_payroll_usd' => 69_000.0
          )
        end
      end

      include_examples 'unauthenticated'
    end
  end

  path '/api/v1/insights/by_job_title' do
    get('pay by job title') do
      tags 'Insights'
      produces 'application/json'
      security [{ bearer_auth: [] }]
      country_param

      response(200, 'USD-normalised across countries, sorted by average desc') do
        schema SwaggerSchemas.envelope(SwaggerSchemas.insight(:grouped, :job_title))

        run_test! do
          expect(data['currency']).to eq('USD')
          expect(data['rows'].pluck('job_title')).to eq(['Sales Manager', 'Software Engineer', 'Accountant'])
          expect(data['rows'][1]).to eq('job_title' => 'Software Engineer', 'headcount' => 3, 'min_salary' => 11_500.0,
                                        'median_salary' => 23_000.0, 'avg_salary' => 44_833.33,
                                        'max_salary' => 100_000.0)
        end
      end

      response(200, 'local currency within one country') do
        schema SwaggerSchemas.envelope(SwaggerSchemas.insight(:grouped, :job_title))
        let(:country) { 'in' }

        run_test! do
          expect(data['currency']).to eq('INR')
          expect(data['rows'].pluck('job_title', 'median_salary')).to eq([['Accountant', 3_000_000.0],
                                                                          ['Software Engineer', 1_500_000.0]])
        end
      end

      invalid_country_response
      include_examples 'unauthenticated'
    end
  end

  path '/api/v1/insights/by_department' do
    get('pay by department') do
      tags 'Insights'
      produces 'application/json'
      security [{ bearer_auth: [] }]
      country_param

      response(200, 'rows keyed by department') do
        schema SwaggerSchemas.envelope(SwaggerSchemas.insight(:grouped, :department))
        let(:country) { 'US' }

        run_test! do
          expect(data).to eq('currency' => 'USD', 'rows' => [
                               { 'department' => 'Sales', 'headcount' => 1, 'min_salary' => 200_000.0,
                                 'median_salary' => 200_000.0, 'avg_salary' => 200_000.0, 'max_salary' => 200_000.0 },
                               { 'department' => 'Engineering', 'headcount' => 1, 'min_salary' => 100_000.0,
                                 'median_salary' => 100_000.0, 'avg_salary' => 100_000.0, 'max_salary' => 100_000.0 }
                             ])
        end
      end

      invalid_country_response
      include_examples 'unauthenticated'
    end
  end

  path '/api/v1/insights/salary_distribution' do
    get('salary histogram') do
      tags 'Insights'
      produces 'application/json'
      security [{ bearer_auth: [] }]
      country_param

      response(200, '10 equal-width buckets between min and max') do
        schema SwaggerSchemas.envelope(SwaggerSchemas.insight(:distribution))
        let(:country) { 'IN' }

        run_test! do
          expect(data['currency']).to eq('INR')
          expect(data['buckets'].size).to eq(10)
          expect(data['buckets'].first).to eq('min' => 1_000_000.0, 'max' => 1_200_000.0, 'count' => 1)
          expect(data['buckets'].pluck('count')).to eq([1, 0, 0, 0, 0, 1, 0, 0, 0, 1])
          expect(data['buckets'].last['max']).to eq(3_000_000.0)
        end
      end

      invalid_country_response
      include_examples 'unauthenticated'
    end
  end

  path '/api/v1/insights/recent_changes' do
    get('recent salary changes (excludes hires)') do
      tags 'Insights'
      produces 'application/json'
      security [{ bearer_auth: [] }]
      parameter name: :days, in: :query, required: false,
                schema: { type: :integer, minimum: 1, maximum: 365, default: 90 }

      before do
        travel_to Date.new(2026, 10, 30)
        hr = create(:user)
        create(:salary_revision, employee: in_engineer, changed_by: hr, reason: 'promotion',
                                 previous_amount: 1_000_000, amount: 1_100_000, effective_on: Date.new(2026, 9, 1))
        create(:salary_revision, employee: us_engineer, changed_by: hr, reason: 'annual_review',
                                 previous_amount: 100_000, amount: 105_000, effective_on: Date.new(2026, 8, 15))
        create(:salary_revision, employee: us_sales_manager, changed_by: hr, reason: 'annual_review',
                                 previous_amount: 200_000, amount: 206_000, effective_on: Date.new(2026, 1, 1))
        create(:salary_revision, employee: in_accountant, changed_by: hr, reason: 'hire',
                                 previous_amount: nil, amount: 3_000_000, effective_on: Date.new(2026, 10, 1))
      end

      response(200, 'no changes in the window: avg_change_percent is null') do
        schema SwaggerSchemas.envelope(SwaggerSchemas.insight(:recent_changes))
        let(:days) { 1 }

        run_test! do
          expect(data).to eq('days' => 1, 'revisions_count' => 0, 'employees_count' => 0,
                             'avg_change_percent' => nil, 'by_reason' => [])
        end
      end

      response(200, 'last 90 days by default') do
        schema SwaggerSchemas.envelope(SwaggerSchemas.insight(:recent_changes))

        run_test! do
          expect(data).to eq('days' => 90, 'revisions_count' => 2, 'employees_count' => 2, 'avg_change_percent' => 7.5,
                             'by_reason' => [
                               { 'reason' => 'annual_review', 'count' => 1, 'avg_change_percent' => 5.0 },
                               { 'reason' => 'promotion', 'count' => 1, 'avg_change_percent' => 10.0 }
                             ])
        end
      end

      response(200, 'custom window') do
        schema SwaggerSchemas.envelope(SwaggerSchemas.insight(:recent_changes))
        let(:days) { 365 }

        run_test! do
          expect(data).to include('days' => 365, 'revisions_count' => 3, 'avg_change_percent' => 6.0)
          expect(data['by_reason'].first).to eq('reason' => 'annual_review', 'count' => 2, 'avg_change_percent' => 4.0)
        end
      end

      response(422, 'days out of range') do
        schema '$ref' => '#/components/schemas/error'
        let(:days) { 366 }

        run_test!
      end

      include_examples 'unauthenticated'
    end
  end
end
