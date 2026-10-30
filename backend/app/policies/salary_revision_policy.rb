# frozen_string_literal: true

class SalaryRevisionPolicy < ApplicationPolicy
  def index? = signed_in?
  def create? = hr_manager?
end
