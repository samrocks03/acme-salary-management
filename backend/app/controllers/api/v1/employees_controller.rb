# frozen_string_literal: true

module Api
  module V1
    class EmployeesController < ApplicationController
      EMPLOYEE_ATTRIBUTES = %i[first_name last_name email job_title department employment_type hired_on].freeze

      def index
        authorize Employee
        render_result EmployeeService::Index.new(params, current_user).call
      end

      def export
        authorize Employee
        result = EmployeeService::Export.new(params, current_user).call
        send_data result.data[:content], type: 'text/csv; charset=utf-8', filename: result.data[:filename],
                                         disposition: 'attachment'
      end

      def show
        authorize Employee
        render_result EmployeeService::Show.new(params[:id], current_user).call
      end

      def create
        authorize Employee
        render_result EmployeeService::Create.new(create_params, current_user).call
      end

      def update
        authorize Employee
        render_result EmployeeService::Update.new(params[:id], update_params, current_user).call
      end

      def destroy
        authorize Employee
        render_result EmployeeService::Destroy.new(params[:id], current_user).call
      end

      private

      def create_params
        params.expect(employee: [*EMPLOYEE_ATTRIBUTES, :country_code, :salary])
      end

      # salary/currency/employee_code are not updatable; country_code is accepted only so the model can
      # answer "can't be changed" instead of silently ignoring it.
      def update_params
        params.expect(employee: [*EMPLOYEE_ATTRIBUTES, :country_code])
      end
    end
  end
end
