# frozen_string_literal: true

module LookupService
  # Reference data for filters and forms in one round trip.
  class Index < Base
    SUCCESS_KEY = 'lookup.index.success.message'

    def initialize(current_user)
      super()
      @current_user = current_user
    end

    def call
      success({
                countries: Reference::Country.all.map(&:to_h),
                departments: Reference::Department.all,
                employment_types: Employee.employment_types.keys,
                revision_reasons: SalaryRevision::USER_REASONS,
                job_titles: (Reference::JobTitle.all | EmployeeRepository.distinct_job_titles).sort,
                fx: Reference::Fx.to_h
              }, message_key: SUCCESS_KEY)
    end
  end
end
