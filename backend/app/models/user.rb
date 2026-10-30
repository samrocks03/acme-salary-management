# frozen_string_literal: true

class User < ApplicationRecord
  devise :database_authenticatable, :validatable, :lockable, :trackable,
         :jwt_authenticatable, jwt_revocation_strategy: JwtDenylist

  enum :role, { hr_manager: 'hr_manager', viewer: 'viewer' }, validate: true

  normalizes :name, with: TextNormalizer

  validates :name, presence: true, length: { maximum: 100 }
end
