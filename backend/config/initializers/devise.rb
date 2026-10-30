# frozen_string_literal: true

Devise.setup do |config|
  require 'devise/orm/active_record'

  config.mailer_sender = 'no-reply@acme.test'

  config.case_insensitive_keys = [:email]
  config.strip_whitespace_keys = [:email]

  # Stateless API: never write the user into a session.
  config.skip_session_storage = %i[http_auth params_auth]
  config.navigational_formats = []

  # Don't reveal whether an email exists or an account is locked.
  config.paranoid = true

  config.stretches = Rails.env.test? ? 1 : 12
  config.password_length = 8..128
  config.email_regexp = /\A[^@\s]+@[^@\s]+\z/
  config.sign_out_via = :delete
  config.expire_all_remember_me_on_sign_out = true

  # Lockable: 5 failed attempts lock the account for 15 minutes, then it unlocks itself.
  config.lock_strategy = :failed_attempts
  config.unlock_keys = [:email]
  config.unlock_strategy = :time
  config.maximum_attempts = 5
  config.unlock_in = 15.minutes
  config.last_attempt_warning = false

  config.responder.error_status = :unprocessable_content
  config.responder.redirect_status = :see_other

  config.jwt do |jwt|
    jwt.secret = ENV.fetch('DEVISE_JWT_SECRET_KEY') { Rails.application.secret_key_base }
    jwt.expiration_time = 8.hours.to_i
    jwt.dispatch_requests = [['POST', %r{\A/api/v1/auth/sign_in\z}]]
    # Revocation is done explicitly by AuthService::SignOut (after the token has been authenticated),
    # not by the revocation middleware, which raises on malformed tokens instead of answering 401.
    jwt.revocation_requests = []
    jwt.request_formats = { user: [nil, :json] }
  end

  # JSON 401 envelope instead of Devise's redirect/HTML failure responses.
  config.warden do |manager|
    manager.failure_app = ->(env) { Auth::JsonFailureApp.call(env) }
  end
end
