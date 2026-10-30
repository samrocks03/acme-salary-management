# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'api/v1/lookups' do
  path '/api/v1/lookups' do
    get('reference data for filters and forms') do
      tags 'Lookups'
      produces 'application/json'
      security [{ bearer_auth: [] }]

      response(200, 'lookups') do
        schema SwaggerSchemas.envelope(SwaggerSchemas.lookups)
        let(:Authorization) { bearer_for(create(:user, :viewer)) }

        before { create(:employee, job_title: 'Chief Happiness Officer') }

        run_test! do |response|
          data = response.parsed_body['data']
          expect(data['countries']).to include('code' => 'IN', 'name' => 'India', 'currency' => 'INR')
          expect(data['countries'].size).to eq(10)
          expect(data['employment_types']).to eq(%w[full_time part_time contractor])
          expect(data['revision_reasons']).to eq(%w[promotion annual_review market_adjustment correction other])
          expect(data['job_titles']).to include('Account Manager', 'Chief Happiness Officer')
          expect(data['fx']).to include('base' => 'USD', 'as_of' => '2026-10-01')
          expect(data['fx']['rates']).to include('INR' => 0.0115)
        end
      end

      include_examples 'unauthenticated'
    end
  end
end
