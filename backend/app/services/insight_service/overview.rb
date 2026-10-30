# frozen_string_literal: true

module InsightService
  # Org-wide headline numbers, USD-normalised (domain rule 7).
  class Overview < Base
    include Support

    SUCCESS_KEY = 'insight.overview.success.message'

    def initialize(_params, current_user)
      super()
      @current_user = current_user
    end

    def call
      success(cached(:overview) { build }, message_key: SUCCESS_KEY)
    end

    private

    def build
      headcount, countries_count, total, avg, median = InsightRepository.overview
      { headcount:, countries_count:, total_payroll_usd: number(total), avg_salary_usd: number(avg),
        median_salary_usd: number(median), fx_as_of: Reference::Fx.as_of }
    end
  end
end
