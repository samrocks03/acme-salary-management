# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API documentation' do
  it 'serves the generated OpenAPI document' do
    get '/api-docs/v1/swagger.yaml'

    expect(response).to have_http_status(:ok)
    expect(YAML.safe_load(response.body).dig('info', 'title')).to eq('ACME Salary Management API')
  end

  it 'serves Swagger UI' do
    get '/api-docs/index.html'

    expect(response).to have_http_status(:ok)
    expect(response.body).to include('swagger-ui')
  end
end
