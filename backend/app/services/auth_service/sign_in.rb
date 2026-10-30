# frozen_string_literal: true

module AuthService
  # Credentials are verified by Warden (lockable/trackable hooks included); this builds the response body.
  class SignIn < Base
    SUCCESS_KEY = 'auth.sign_in.success.message'

    def initialize(user)
      super()
      @user = user
    end

    def call
      success(serialize(V1::UserSerializer, @user), message_key: SUCCESS_KEY)
    end
  end
end
