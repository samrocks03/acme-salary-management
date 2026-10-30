# frozen_string_literal: true

# The Next.js BFF calls Rails server-to-server, so CORS only matters for direct browser clients
# (Swagger "Try it out" from another origin, local tooling). Only the configured origin is allowed and the
# Authorization header is exposed so a client can read the JWT returned by sign-in.
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV.fetch('FRONTEND_ORIGIN', 'http://localhost:3000').split(',').map(&:strip)

    resource '/api/*',
             headers: :any,
             methods: %i[get post put patch delete options head],
             expose: %w[Authorization Content-Disposition],
             max_age: 600
  end
end
