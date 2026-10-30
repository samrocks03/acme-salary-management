# frozen_string_literal: true

# Headless policy: `authorize :insight, :show?`. Both roles may read insights.
class InsightPolicy < ApplicationPolicy
  def show? = signed_in?
end
