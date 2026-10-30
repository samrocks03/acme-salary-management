# frozen_string_literal: true

module Api
  module V1
    # Append-only: there are deliberately no update/destroy actions (domain rule 3).
    class SalaryRevisionsController < ApplicationController
      def index
        authorize SalaryRevision
        render_result SalaryRevisionService::Index.new(params[:employee_id], current_user).call
      end

      def create
        authorize SalaryRevision
        render_result SalaryRevisionService::Create.new(params[:employee_id], revision_params, current_user).call
      end

      private

      def revision_params
        params.expect(salary_revision: %i[amount effective_on reason note])
      end
    end
  end
end
