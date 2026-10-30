# frozen_string_literal: true

class EmployeePolicy < ApplicationPolicy
  def index? = signed_in?
  def show? = signed_in?
  def create? = hr_manager?
  def update? = hr_manager?
  def destroy? = hr_manager?
  def export? = hr_manager?
end
