# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'api/v1/auth' do
  let!(:user) { create(:user, email: 'hr@acme.test', password: 'Password@123') }

  path '/api/v1/auth/sign_in' do
    post('sign in') do
      tags 'Auth'
      consumes 'application/json'
      produces 'application/json'
      description 'Returns the JWT in the `Authorization` response header (8h expiry). ' \
                  '5 failed attempts lock the account for 15 minutes; 10 requests / 3 min per IP + email.'
      parameter name: :credentials, in: :body, schema: {
        type: :object, required: %w[user],
        properties: { user: { type: :object, required: %w[email password],
                              properties: { email: { type: :string, example: 'hr@acme.test' },
                                            password: { type: :string, example: 'Password@123' } } } }
      }

      response(200, 'signed in') do
        header 'Authorization', schema: { type: :string }, description: 'Bearer <jwt>'
        schema SwaggerSchemas.envelope({ '$ref' => '#/components/schemas/user' })
        let(:credentials) { { user: { email: ' HR@acme.test ', password: 'Password@123' } } }

        run_test! do |response|
          expect(response.headers['Authorization']).to match(/\ABearer \S+\z/)
          expect(response.parsed_body.dig('data', 'attributes')).to eq(
            'email' => 'hr@acme.test', 'name' => user.name, 'role' => 'hr_manager'
          )
          expect(user.reload.sign_in_count).to eq(1)
        end
      end

      response(401, 'invalid credentials') do
        schema '$ref' => '#/components/schemas/error'
        let(:credentials) { { user: { email: user.email, password: 'wrong-password' } } }

        run_test! do |response|
          expect(response.headers['Authorization']).to be_nil
          expect(response.parsed_body['errors']['base']).to eq(['Invalid email or password.'])
          expect(user.reload.failed_attempts).to eq(1)
        end
      end

      response(429, 'rate limited') do
        schema '$ref' => '#/components/schemas/error'
        let(:credentials) { { user: { email: user.email, password: 'wrong-password' } } }

        before do
          10.times { post '/api/v1/auth/sign_in', params: credentials, as: :json }
        end

        run_test!
      end
    end
  end

  describe 'rate limiting' do
    let!(:other) { create(:user, email: 'viewer@acme.test', password: 'Password@123') }

    def sign_in(email, password)
      post '/api/v1/auth/sign_in', params: { user: { email:, password: } }, as: :json
    end

    it 'limits one email without locking everyone else out behind the same IP (the BFF)' do
      10.times { sign_in(user.email, 'wrong-password') }

      sign_in(' HR@acme.test ', 'wrong-password')
      expect(response).to have_http_status(:too_many_requests)

      sign_in(other.email, 'Password@123')
      expect(response).to have_http_status(:ok)
    end

    it 'does not fail when the user param is not an object' do
      post '/api/v1/auth/sign_in', params: { user: 'x' }, as: :json

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'account lockout' do
    it 'locks the account after 5 failed attempts, even for the right password' do
      5.times { post '/api/v1/auth/sign_in', params: { user: { email: user.email, password: 'nope' } }, as: :json }
      post '/api/v1/auth/sign_in', params: { user: { email: user.email, password: 'Password@123' } }, as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(user.reload).to be_access_locked
    end

    it 'unlocks itself after 15 minutes' do
      locked = create(:user, :locked)

      travel 16.minutes do
        post '/api/v1/auth/sign_in', params: { user: { email: locked.email, password: 'Password@123' } }, as: :json
      end

      expect(response).to have_http_status(:ok)
    end
  end

  path '/api/v1/auth/sign_out' do
    delete('sign out') do
      tags 'Auth'
      produces 'application/json'
      security [{ bearer_auth: [] }]
      description "Revokes the token (its `jti` is denylisted); it can't be used again."

      response(200, 'signed out') do
        schema SwaggerSchemas.message_envelope
        let(:Authorization) { bearer_for(user) }

        run_test! do
          expect(JwtDenylist.count).to eq(1)
          get '/api/v1/me', headers: { 'Authorization' => self.Authorization }
          expect(response).to have_http_status(:unauthorized)
        end
      end

      include_examples 'unauthenticated'
    end
  end
end
