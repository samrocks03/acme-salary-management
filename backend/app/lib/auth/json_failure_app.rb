# frozen_string_literal: true

module Auth
  # Devise/Warden failure app: always answer 401 with the JSON error envelope (never redirect).
  class JsonFailureApp < Devise::FailureApp
    def respond
      self.status = :unauthorized
      self.content_type = 'application/json'
      self.response_body = { success: false, errors: { base: [i18n_message] } }.to_json
    end
  end
end
