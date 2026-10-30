# frozen_string_literal: true

module EmployeeService
  class Show < Base
    NOT_FOUND = 'employee.errors.not_found'
    SUCCESS_KEY = 'employee.show.success.message'

    def initialize(id, current_user)
      super()
      @id = id
      @current_user = current_user
    end

    def call
      employee = EmployeeRepository.find(@id)
      return failure(NOT_FOUND, status: :not_found) unless employee

      success(serialize(V1::EmployeeSerializer, employee), message_key: SUCCESS_KEY)
    end
  end
end
