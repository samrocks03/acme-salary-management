# frozen_string_literal: true

module EmployeeService
  class Index < Base
    SUCCESS_KEY = 'employee.index.success.message'
    DEFAULT_PER_PAGE = 25
    MAX_PER_PAGE = 100

    def initialize(params, current_user)
      super()
      @filters = FilterParams.call(params)
      @page = [params[:page].to_s.to_i, 1].max
      @per_page = per_page_from(params[:per_page])
      @current_user = current_user
    end

    def call
      scope = EmployeeRepository.filtered(@filters)
      total_count = scope.count
      employees = EmployeeRepository.paginate(scope, page: @page, per_page: @per_page)

      success(serialize(V1::EmployeeSerializer, employees), message_key: SUCCESS_KEY, meta: meta(total_count))
    end

    private

    def per_page_from(value)
      return DEFAULT_PER_PAGE if value.blank?

      value.to_s.to_i.clamp(1, MAX_PER_PAGE)
    end

    def meta(total_count)
      { page: @page, per_page: @per_page, total_count:, total_pages: (total_count.to_f / @per_page).ceil }
    end
  end
end
