# frozen_string_literal: true

module InsightService
  class ByDepartment < GroupedStats
    GROUP_BY = :department
    SUCCESS_KEY = 'insight.by_department.success.message'
  end
end
