# frozen_string_literal: true

module Api
  module V1
    # Read-only analytics for both roles. Responses are cached until the data changes.
    class InsightsController < ApplicationController
      def overview
        authorize :insight, :show?
        render_result InsightService::Overview.new(params, current_user).call
      end

      def by_country
        authorize :insight, :show?
        render_result InsightService::ByCountry.new(params, current_user).call
      end

      def by_job_title
        authorize :insight, :show?
        render_result InsightService::ByJobTitle.new(params, current_user).call
      end

      def by_department
        authorize :insight, :show?
        render_result InsightService::ByDepartment.new(params, current_user).call
      end

      def salary_distribution
        authorize :insight, :show?
        render_result InsightService::SalaryDistribution.new(params, current_user).call
      end

      def recent_changes
        authorize :insight, :show?
        render_result InsightService::RecentChanges.new(params, current_user).call
      end
    end
  end
end
