# frozen_string_literal: true

module Api
  module V1
    # Unknown /api/* routes answer with the JSON error envelope instead of an empty/HTML 404.
    class ErrorsController < ActionController::API
      def not_found
        render json: { success: false, errors: { base: [I18n.t('errors.route_not_found')] } }, status: :not_found
      end
    end
  end
end
