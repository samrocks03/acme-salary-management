# frozen_string_literal: true

module SalaryRevisionService
  class Index < Base
    NOT_FOUND = 'employee.errors.not_found'
    SUCCESS_KEY = 'salary_revision.index.success.message'

    def initialize(employee_id, current_user)
      super()
      @employee_id = employee_id
      @current_user = current_user
    end

    def call
      employee = EmployeeRepository.find(@employee_id)
      return failure(NOT_FOUND, status: :not_found) unless employee

      revisions = SalaryRevisionRepository.history_for(employee.id)
      success(serialize(V1::SalaryRevisionSerializer, revisions), message_key: SUCCESS_KEY)
    end
  end
end
