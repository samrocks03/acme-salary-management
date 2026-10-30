# frozen_string_literal: true

# All non-trivial Employee querying. Class methods only, no state.
# User input never reaches SQL as a string: search uses bind params + sanitize_sql_like,
# sort column/direction come from allow-lists and are passed to `order` as a hash.
class EmployeeRepository
  SORTABLE_COLUMNS = %w[full_name salary hired_on job_title country_code department created_at].freeze
  DEFAULT_SORT = 'full_name'
  DIRECTIONS = %w[asc desc].freeze
  DEFAULT_DIRECTION = 'asc'
  EXACT_FILTERS = { country: :country_code, department: :department, job_title: :job_title,
                    employment_type: :employment_type }.freeze

  class << self
    def find(id)
      Employee.find_by(id:)
    end

    # Row lock: serialises concurrent salary changes for one employee (domain rule 2).
    def find_for_update(id)
      Employee.lock.find_by(id:)
    end

    # filters: { q:, country:, department:, job_title:, employment_type:, sort:, direction: } (already strings or nil)
    def filtered(filters)
      scope = search(Employee.all, filters[:q])
      EXACT_FILTERS.each do |param, column|
        scope = scope.where(column => filters[param]) if filters[param].present?
      end
      sorted(scope, filters[:sort], filters[:direction])
    end

    def search(scope, query)
      return scope if query.blank?

      pattern = "%#{Employee.sanitize_sql_like(query)}%"
      scope.where('employees.full_name ILIKE :pattern OR employees.email ILIKE :pattern ' \
                  'OR employees.employee_code ILIKE :pattern', pattern:)
    end

    def sorted(scope, sort, direction)
      column = SORTABLE_COLUMNS.include?(sort) ? sort : DEFAULT_SORT
      dir = DIRECTIONS.include?(direction) ? direction : DEFAULT_DIRECTION
      scope.order(column => dir).order(id: dir) # id breaks ties so pages are stable
    end

    def paginate(scope, page:, per_page:)
      scope.limit(per_page).offset((page - 1) * per_page)
    end

    def distinct_job_titles
      Employee.distinct.order(:job_title).pluck(:job_title)
    end
  end
end
