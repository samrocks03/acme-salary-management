# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'api/v1/me' do
  path '/api/v1/me' do
    get('current user') do
      tags 'Auth'
      produces 'application/json'
      security [{ bearer_auth: [] }]

      response(200, 'the signed-in user') do
        schema SwaggerSchemas.envelope({ '$ref' => '#/components/schemas/user' })
        let(:viewer) { create(:user, :viewer) }
        let(:Authorization) { bearer_for(viewer) }

        run_test! do |response|
          expect(response.parsed_body.dig('data', 'id')).to eq(viewer.id.to_s)
          expect(response.parsed_body.dig('data', 'attributes', 'role')).to eq('viewer')
        end
      end

      include_examples 'unauthenticated'

      response(401, 'expired token') do
        schema '$ref' => '#/components/schemas/error'
        let!(:Authorization) { bearer_for(create(:user)) } # issued now…

        before { travel 8.hours + 1.minute } # …used after expiry

        run_test!
      end
    end
  end
end
