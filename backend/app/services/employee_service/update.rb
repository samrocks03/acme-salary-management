# frozen_string_literal: true

module EmployeeService
  # Updates profile fields only. Salary changes go through SalaryRevisionService::Create;
  # currency/employee_code are never accepted and country_code can't change (domain rule 6).
  class Update < Base
    NOT_FOUND = 'employee.errors.not_found'
    SUCCESS_KEY = 'employee.update.success.message'

    def initialize(id, params, current_user)
      super()
      @id = id
      @params = params.to_h.symbolize_keys
      @current_user = current_user
    end

    def call
      employee = EmployeeRepository.find(@id)
      return failure(NOT_FOUND, status: :not_found) unless employee
      return validation_failure(employee.errors) unless employee.update(@params)

      success(serialize(V1::EmployeeSerializer, employee.reload), message_key: SUCCESS_KEY)
    end
  end
end
