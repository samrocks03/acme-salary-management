# frozen_string_literal: true

module AuthHelpers
  # A real, signed JWT for `user` — exactly what sign-in would return.
  def bearer_for(user)
    token, _payload = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil)
    "Bearer #{token}"
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request
end
