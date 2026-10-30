# frozen_string_literal: true

# Serves swagger/v1/swagger.yaml (generated from the request specs) at /api-docs/v1/swagger.yaml.
Rswag::Api.configure do |c|
  c.openapi_root = Rails.root.join('swagger').to_s
end
