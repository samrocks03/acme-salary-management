# frozen_string_literal: true

module InsightService
  # min / median / avg / max per group, in the country's currency when `country` is given, else USD.
  # Subclasses define GROUP_BY (:job_title or :department) and SUCCESS_KEY.
  class GroupedStats < Base
    include Support

    def initialize(params, current_user)
      super()
      @country = normalize_country(params[:country])
      @current_user = current_user
    end

    def call
      return invalid_country unless valid_country?(@country)

      success(cached(self.class::GROUP_BY, @country) { build }, message_key: self.class::SUCCESS_KEY)
    end

    private

    def build
      rows = InsightRepository.grouped_stats(self.class::GROUP_BY, country_code: @country).map do |group, *stats|
        { self.class::GROUP_BY => group }.merge(row_stats(*stats))
      end
      { currency: currency_for(@country), rows: }
    end

    def row_stats(headcount, min, median, avg, max)
      { headcount:, min_salary: number(min), median_salary: number(median), avg_salary: number(avg),
        max_salary: number(max) }
    end
  end
end
