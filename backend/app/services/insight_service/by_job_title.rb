# frozen_string_literal: true

module InsightService
  class ByJobTitle < GroupedStats
    GROUP_BY = :job_title
    SUCCESS_KEY = 'insight.by_job_title.success.message'
  end
end
