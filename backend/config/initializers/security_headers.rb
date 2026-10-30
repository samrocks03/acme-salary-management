# frozen_string_literal: true

# JSON-only API: nothing may frame, script or style a response. (Swagger UI is served by the rswag
# middleware outside these controller responses, so it is unaffected.)
Rails.application.config.action_dispatch.default_headers.merge!(
  'X-Frame-Options' => 'DENY',
  'X-Content-Type-Options' => 'nosniff',
  'Referrer-Policy' => 'no-referrer',
  'Permissions-Policy' => 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy' => "default-src 'none'; frame-ancestors 'none'"
)
