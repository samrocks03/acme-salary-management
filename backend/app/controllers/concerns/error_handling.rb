# frozen_string_literal: true

# Maps framework exceptions to the contract's error envelope so no HTML/stack trace ever leaks.
module ErrorHandling
  extend ActiveSupport::Concern

  included do
    rescue_from ActiveRecord::RecordNotFound do
      render_error(I18n.t('errors.not_found'), status: :not_found)
    end

    rescue_from ActionController::ParameterMissing, ActionDispatch::Http::Parameters::ParseError do |error|
      render_error(I18n.t('errors.bad_request', detail: error.message), status: :bad_request)
    end

    rescue_from Pundit::NotAuthorizedError do
      render_error(I18n.t('errors.forbidden'), status: :forbidden)
    end
  end
end
