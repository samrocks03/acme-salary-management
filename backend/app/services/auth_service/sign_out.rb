# frozen_string_literal: true

module AuthService
  # Denylists the (already authenticated) token's jti so it can never be used again.
  class SignOut < Base
    SUCCESS_KEY = 'auth.sign_out.success.message'

    def initialize(token)
      super()
      @token = token
    end

    def call
      Warden::JWTAuth::TokenRevoker.new.call(@token)
      success(message_key: SUCCESS_KEY)
    end
  end
end
