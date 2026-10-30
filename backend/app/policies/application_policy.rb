# frozen_string_literal: true

# Deny by default; every policy opts in explicitly. Reads are open to any signed-in user,
# writes are reserved for HR managers (docs/02-architecture.md §4).
class ApplicationPolicy
  attr_reader :user, :record

  def initialize(user, record)
    @user = user
    @record = record
  end

  def index? = false
  def show? = false
  def create? = false
  def update? = false
  def destroy? = false

  private

  def signed_in? = user.present?
  def hr_manager? = signed_in? && user.hr_manager?
end
