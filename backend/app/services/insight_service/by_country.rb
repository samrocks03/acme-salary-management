# frozen_string_literal: true

module InsightService
  # Pay per country in local currency (what HR negotiates in) plus USD columns for comparison.
  class ByCountry < Base
    include Support

    SUCCESS_KEY = 'insight.by_country.success.message'

    def initialize(_params, current_user)
      super()
      @current_user = current_user
    end

    def call
      success(cached(:by_country) { InsightRepository.by_country.map { |row| build_row(*row) } },
              message_key: SUCCESS_KEY)
    end

    private

    def build_row(code, currency, headcount, min, median, avg, max, avg_usd, median_usd, total_usd) # rubocop:disable Metrics/ParameterLists
      { country_code: code, country_name: Reference::Country.find(code)&.name, currency:, headcount:,
        min_salary: number(min), median_salary: number(median), avg_salary: number(avg), max_salary: number(max),
        avg_salary_usd: number(avg_usd), median_salary_usd: number(median_usd), total_payroll_usd: number(total_usd) }
    end
  end
end
