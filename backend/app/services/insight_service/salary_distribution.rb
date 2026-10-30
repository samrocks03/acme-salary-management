# frozen_string_literal: true

module InsightService
  # Histogram with equal-width buckets between the lowest and highest salary.
  class SalaryDistribution < Base
    include Support

    SUCCESS_KEY = 'insight.salary_distribution.success.message'

    def initialize(params, current_user)
      super()
      @country = normalize_country(params[:country])
      @current_user = current_user
    end

    def call
      return invalid_country unless valid_country?(@country)

      success(cached(:salary_distribution, @country) { build }, message_key: SUCCESS_KEY)
    end

    private

    def build
      min, max, counts = InsightRepository.distribution(country_code: @country)
      { currency: currency_for(@country), buckets: buckets(min, max, counts) }
    end

    def buckets(min, max, counts)
      return [] if min.nil?
      return [{ min: number(min), max: number(max), count: counts.fetch(1) }] if min == max

      width = (max - min) / InsightRepository::BUCKETS
      Array.new(InsightRepository::BUCKETS) do |index|
        lower = min + (width * index)
        { min: number(lower.round(2)), max: number((lower + width).round(2)), count: counts.fetch(index + 1, 0) }
      end
    end
  end
end
