# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'HTTP hardening' do
  let(:user) { create(:user, email: 'hr@acme.test') }

  it 'lets the configured frontend origin read the Authorization header after sign-in (CORS)' do
    post '/api/v1/auth/sign_in', params: { user: { email: user.email, password: 'Password@123' } }, as: :json,
                                 headers: { 'Origin' => 'http://localhost:3000' }

    expect(response.headers['Access-Control-Allow-Origin']).to eq('http://localhost:3000')
    expect(response.headers['Access-Control-Expose-Headers']).to include('Authorization')
  end

  it 'does not grant CORS to other origins' do
    get '/api/v1/lookups', headers: { 'Origin' => 'https://evil.example' }

    expect(response.headers['Access-Control-Allow-Origin']).to be_nil
  end

  it 'sends security headers on API responses' do
    get '/api/v1/me', headers: { 'Authorization' => bearer_for(user) }

    expect(response.headers).to include('X-Frame-Options' => 'DENY', 'X-Content-Type-Options' => 'nosniff',
                                        'Content-Security-Policy' => "default-src 'none'; frame-ancestors 'none'")
  end

  it 'does not leak JWT library errors for bad or revoked tokens' do
    get '/api/v1/me', headers: { 'Authorization' => 'Bearer abc' }

    expect(response).to have_http_status(:unauthorized)
    expect(response.parsed_body['errors']['base']).to eq(['Your session expired. Please sign in again to continue.'])
  end

  it 'asks unauthenticated clients to sign in' do
    get '/api/v1/me'

    expect(response.parsed_body['errors']['base']).to eq(['You need to sign in before continuing.'])
  end

  it 'answers unknown API routes with the JSON error envelope' do
    get '/api/v1/nope'

    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body).to eq('success' => false, 'errors' => { 'base' => ['No such endpoint.'] })
  end

  it 'answers malformed JSON with 400' do
    post '/api/v1/employees', params: '{"employee": ', headers: { 'Authorization' => bearer_for(user),
                                                                  'Content-Type' => 'application/json' }

    expect(response).to have_http_status(:bad_request)
    expect(response.parsed_body['success']).to be(false)
  end

  it 'keeps salaries and credentials out of the logs' do
    filter = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)

    expect(filter.filter('password' => 'x', 'salary' => 1, 'amount' => 2, 'name' => 'Asha'))
      .to eq('password' => '[FILTERED]', 'salary' => '[FILTERED]', 'amount' => '[FILTERED]', 'name' => 'Asha')
  end
end
