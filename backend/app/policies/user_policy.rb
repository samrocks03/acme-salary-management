# frozen_string_literal: true

class UserPolicy < ApplicationPolicy
  # A user may only read their own profile (GET /me).
  def show? = signed_in? && record == user
end
