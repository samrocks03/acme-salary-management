# frozen_string_literal: true

module EmployeeService
  # Hard delete (soft delete / leaver archival is out of scope); salary history goes with it.
  class Destroy < Base
    NOT_FOUND = 'employee.errors.not_found'
    SUCCESS_KEY = 'employee.destroy.success.message'

    def initialize(id, current_user)
      super()
      @id = id
      @current_user = current_user
    end

    def call
      employee = EmployeeRepository.find(@id)
      return failure(NOT_FOUND, status: :not_found) unless employee

      employee.destroy!
      success(message_key: SUCCESS_KEY, name: employee.full_name)
    end
  end
end
