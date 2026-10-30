# frozen_string_literal: true

module V1
  class UserSerializer
    include JSONAPI::Serializer

    set_type :user
    attributes :email, :name, :role
  end
end
