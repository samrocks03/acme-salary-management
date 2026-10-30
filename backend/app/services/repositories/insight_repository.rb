# frozen_string_literal: true

# Read-only aggregates over `employees` / `salary_revisions`. Thanks to the denormalised current salary
# (domain rule 2) every figure is a single-table GROUP BY; medians use percentile_cont.
# The only SQL fragments interpolated below are constants or Reference::Fx.to_usd_sql (config-built);
# every user-supplied value is a bound parameter.
class InsightRepository
  USD = Reference::Fx.to_usd_sql('employees.salary')
  BUCKETS = 10
  CHANGE_PERCENT_AVG =
    'AVG((salary_revisions.amount - salary_revisions.previous_amount) / salary_revisions.previous_amount * 100)'

  class << self
    # Cheap fingerprint of the data; part of every insights cache key, so any write invalidates the cache.
    def data_version
      count, updated_at = Employee.pick(Arel.sql('COUNT(*)'), Arel.sql('MAX(employees.updated_at)'))
      [count, updated_at&.utc&.iso8601(6), SalaryRevision.maximum(:id)].join('-')
    end

    def overview
      Employee.pick(
        Arel.sql('COUNT(*)'), Arel.sql('COUNT(DISTINCT employees.country_code)'),
        Arel.sql(round("SUM(#{USD})")), Arel.sql(round("AVG(#{USD})")), Arel.sql(median(USD))
      )
    end

    def by_country
      Employee.group(:country_code, :currency)
              .order(Arel.sql('COUNT(*) DESC'), :country_code)
              .pluck(:country_code, :currency, Arel.sql('COUNT(*)'), *stats('employees.salary'),
                     Arel.sql(round("AVG(#{USD})")), Arel.sql(median(USD)), Arel.sql(round("SUM(#{USD})")))
    end

    # Grouped stats in local currency when `country_code` is given, otherwise USD-normalised.
    # `column` is :job_title or :department (allow-listed by the caller).
    def grouped_stats(column, country_code:)
      raise ArgumentError, "unsupported column #{column}" unless %i[job_title department].include?(column)

      Employee.where(country_filter(country_code))
              .group(column)
              .order(Arel.sql("AVG(#{amount(country_code)}) DESC"), column)
              .pluck(column, Arel.sql('COUNT(*)'), *stats(amount(country_code)))
    end

    # => [min, max, { bucket_number (1..BUCKETS) => count }]
    def distribution(country_code:)
      scope = Employee.where(country_filter(country_code))
      value = Arel.sql(amount(country_code))
      min, max = scope.pick(Arel::Nodes::Min.new([value]), Arel::Nodes::Max.new([value]))
      return [min, max, {}] if min.nil?
      return [min, max, { 1 => scope.count }] if min == max

      bucket = ActiveRecord::Base.sanitize_sql_array(
        ["LEAST(width_bucket(#{value}, ?, ?, #{BUCKETS}), #{BUCKETS})", min, max]
      )
      [min, max, scope.group(Arel.sql(bucket)).count]
    end

    # => [[revisions_count, employees_count, avg_change_percent], [[reason, count, avg_change_percent], ...]]
    def recent_changes(since:)
      scope = SalaryRevision.where.not(reason: 'hire').where(effective_on: since..Date.current)
      avg_change = Arel.sql(round(CHANGE_PERCENT_AVG))
      totals = scope.pick(Arel.sql('COUNT(*)'), Arel.sql('COUNT(DISTINCT salary_revisions.employee_id)'), avg_change)
      by_reason = scope.group(:reason).order(Arel.sql('COUNT(*) DESC'), :reason)
                       .pluck(:reason, Arel.sql('COUNT(*)'), avg_change)
      [totals, by_reason]
    end

    private

    def country_filter(country_code)
      country_code ? { country_code: } : {}
    end

    def amount(country_code)
      country_code ? 'employees.salary' : USD
    end

    def stats(value)
      [Arel.sql(round("MIN(#{value})")), Arel.sql(median(value)), Arel.sql(round("AVG(#{value})")),
       Arel.sql(round("MAX(#{value})"))]
    end

    def median(value)
      round("percentile_cont(0.5) WITHIN GROUP (ORDER BY #{value})")
    end

    def round(expression)
      "ROUND((#{expression})::numeric, 2)"
    end
  end
end
