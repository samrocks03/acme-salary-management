# frozen_string_literal: true

module EmployeeService
  # Creates the employee and its first salary revision (domain rule 4) in one transaction.
  class Create < Base
    SUCCESS_KEY = 'employee.create.success.message'

    def initialize(params, current_user)
      super()
      @params = params.to_h.symbolize_keys
      @current_user = current_user
    end

    def call
      employee = Employee.new(@params)
      ActiveRecord::Base.transaction do
        employee.save!
        record_hire_revision!(employee)
      end

      success(serialize(V1::EmployeeSerializer, employee.reload), message_key: SUCCESS_KEY, status: :created)
    rescue ActiveRecord::RecordInvalid => e
      validation_failure(e.record.errors)
    end

    private

    def record_hire_revision!(employee)
      employee.salary_revisions.create!(
        amount: employee.salary, previous_amount: nil, effective_on: employee.hired_on,
        reason: 'hire', changed_by: @current_user
      )
    end
  end
end
