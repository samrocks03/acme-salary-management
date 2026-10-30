# frozen_string_literal: true

# Swagger UI at /api-docs. Regenerate the document with: RAILS_ENV=test bundle exec rake rswag:specs:swaggerize
Rswag::Ui.configure do |c|
  c.openapi_endpoint '/api-docs/v1/swagger.yaml', 'ACME Salary Management API v1'
end
