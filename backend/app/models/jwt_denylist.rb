# frozen_string_literal: true

# Revoked JWTs (by jti) — populated on sign-out, checked on every authenticated request.
class JwtDenylist < ApplicationRecord
  include Devise::JWT::RevocationStrategies::Denylist
end
