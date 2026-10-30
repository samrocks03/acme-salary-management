# frozen_string_literal: true

module V1
  class EmployeeSerializer
    include JSONAPI::Serializer

    set_type :employee

    attributes :employee_code, :first_name, :last_name, :full_name, :email, :job_title, :department,
               :country_code, :country_name, :currency, :salary_usd, :employment_type, :hired_on,
               :created_at, :updated_at

    attribute(:salary) { |employee| employee.salary&.to_f }
  end
end
