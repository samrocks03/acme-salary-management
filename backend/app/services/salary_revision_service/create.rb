# frozen_string_literal: true

module SalaryRevisionService
  # Records a salary change and moves the employee's current salary to it (domain rules 2, 3, 5).
  # The employee row is locked so two concurrent raises can't both read the same previous amount.
  class Create < Base
    NOT_FOUND = 'employee.errors.not_found'
    SUCCESS_KEY = 'salary_revision.create.success.message'

    def initialize(employee_id, params, current_user)
      super()
      @employee_id = employee_id
      @params = params.to_h.symbolize_keys.slice(:amount, :effective_on, :reason, :note)
      @current_user = current_user
    end

    def call
      ActiveRecord::Base.transaction do
        employee = EmployeeRepository.find_for_update(@employee_id)
        next failure(NOT_FOUND, status: :not_found) unless employee

        record_change(employee)
      end
    end

    private

    def record_change(employee)
      revision = build_revision(employee)
      return validation_failure(revision.errors) unless revision.save(context: :manual_change)

      employee.update!(salary: revision.amount)
      success(serialize(V1::SalaryRevisionSerializer, revision), message_key: SUCCESS_KEY, status: :created)
    end

    def build_revision(employee)
      employee.salary_revisions.new(**@params, previous_amount: employee.salary, changed_by: @current_user)
    end
  end
end
