# frozen_string_literal: true

module EmployeeService
  # Updates profile fields only. Salary changes go through SalaryRevisionService::Create;
  # currency/employee_code are never accepted and country_code can't change (domain rule 6).
  # Correcting hired_on also moves the system `hire` revision (domain rule 4).
  class Update < Base
    NOT_FOUND = 'employee.errors.not_found'
    SUCCESS_KEY = 'employee.update.success.message'

    def initialize(id, params, current_user)
      super()
      @id = id
      @params = params.to_h.symbolize_keys
      @current_user = current_user
    end

    # Locked like SalaryRevisionService::Create, so a hire-date correction can't race a new revision.
    def call
      ActiveRecord::Base.transaction do
        employee = EmployeeRepository.find_for_update(@id)
        next failure(NOT_FOUND, status: :not_found) unless employee

        update(employee)
      end
    end

    private

    # A later hired_on is rejected by the model when it falls after the first non-hire revision;
    # otherwise the system `hire` revision moves with it so history shows the hire on the right day.
    def update(employee)
      employee.assign_attributes(@params)
      hire_date_changed = employee.will_save_change_to_hired_on?
      return validation_failure(employee.errors) unless employee.save

      SalaryRevisionRepository.move_hire_revision(employee.id, employee.hired_on) if hire_date_changed
      success(serialize(V1::EmployeeSerializer, employee.reload), message_key: SUCCESS_KEY)
    end
  end
end
