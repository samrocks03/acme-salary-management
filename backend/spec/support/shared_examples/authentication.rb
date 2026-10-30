# frozen_string_literal: true

# Use inside an rswag operation block: `include_examples 'unauthenticated'`.
RSpec.shared_examples 'unauthenticated' do
  response(401, 'missing or invalid token') do
    let(:Authorization) { 'Bearer not-a-real-token' }

    schema '$ref' => '#/components/schemas/error'
    run_test!
  end
end

# `include_examples 'forbidden for viewer'` — the viewer role must never perform writes.
RSpec.shared_examples 'forbidden for viewer' do
  response(403, 'viewer role cannot perform this action') do
    let(:Authorization) { bearer_for(create(:user, :viewer)) }

    schema '$ref' => '#/components/schemas/error'
    run_test! do |response|
      expect(response.parsed_body['errors']['base']).to eq([I18n.t('errors.forbidden')])
    end
  end
end
