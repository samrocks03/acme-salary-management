# frozen_string_literal: true

module AuthService
  class Me < Base
    SUCCESS_KEY = 'auth.me.success.message'

    def initialize(user)
      super()
      @user = user
    end

    def call
      success(serialize(V1::UserSerializer, @user), message_key: SUCCESS_KEY)
    end
  end
end
