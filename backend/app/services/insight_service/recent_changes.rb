# frozen_string_literal: true

module InsightService
  # Raises and other salary changes (excluding hires) effective in the last `days` days, today included.
  class RecentChanges < Base
    include Support

    SUCCESS_KEY = 'insight.recent_changes.success.message'
    INVALID_DAYS = 'insight.errors.invalid_days.detail'
    DEFAULT_DAYS = 90
    DAYS_RANGE = (1..365)

    def initialize(params, current_user)
      super()
      @days = parse_days(params[:days])
      @current_user = current_user
    end

    def call
      return ServiceResult.error(errors: { days: [translate(INVALID_DAYS)] }) unless DAYS_RANGE.cover?(@days)

      success(cached(:recent_changes, @days, Date.current) { build }, message_key: SUCCESS_KEY)
    end

    private

    def parse_days(value)
      return DEFAULT_DAYS if value.blank?

      Integer(value.to_s, exception: false)
    end

    def build
      since = Date.current - @days + 1 # inclusive range: `days` calendar days ending today
      (revisions_count, employees_count, avg), by_reason = InsightRepository.recent_changes(since:)
      { days: @days, revisions_count:, employees_count:, avg_change_percent: number(avg),
        by_reason: by_reason.map do |reason, count, reason_avg|
          { reason:, count:, avg_change_percent: number(reason_avg) }
        end }
    end
  end
end
