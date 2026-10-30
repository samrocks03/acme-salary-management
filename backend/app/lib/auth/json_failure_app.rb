# frozen_string_literal: true

module Auth
  # Devise/Warden failure app: always answer 401 with the JSON error envelope (never redirect).
  class JsonFailureApp < Devise::FailureApp
    def respond
      self.status = :unauthorized
      self.content_type = 'application/json'
      self.response_body = { success: false, errors: { base: [i18n_message] } }.to_json
    end

    private

    # The JWT strategy fails with raw library messages ("Signature has expired", "revoked token", ...);
    # don't leak those — every token problem reads the same to the client.
    def i18n_message(default = nil)
      warden_message.is_a?(String) ? I18n.t('devise.failure.timeout') : super
    end
  end
end
