# frozen_string_literal: true

# Headless policy: `authorize :lookup, :index?`.
class LookupPolicy < ApplicationPolicy
  def index? = signed_in?
end
