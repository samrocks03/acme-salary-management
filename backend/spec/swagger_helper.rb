# frozen_string_literal: true

require 'rails_helper'

RSpec.configure do |config|
  config.openapi_root = Rails.root.join('swagger').to_s

  config.openapi_specs = {
    'v1/swagger.yaml' => {
      openapi: '3.0.1',
      info: {
        title: 'ACME Salary Management API',
        version: 'v1',
        description: 'HR salary management for ACME. Sign in, then click "Authorize" and paste the token from the ' \
                     '`Authorization` response header (without the "Bearer " prefix). ' \
                     'Contract: docs/03-api-contract.md.'
      },
      paths: {},
      servers: [{ url: ENV.fetch('API_BASE_URL', 'http://localhost:3001') }],
      components: {
        securitySchemes: {
          bearer_auth: { type: :http, scheme: :bearer, bearerFormat: 'JWT' }
        },
        schemas: SwaggerSchemas.all
      }
    }
  }

  config.openapi_format = :yaml
end
