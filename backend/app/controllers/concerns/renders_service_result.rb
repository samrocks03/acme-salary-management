# frozen_string_literal: true

module RendersServiceResult
  extend ActiveSupport::Concern

  private

  def render_result(result)
    render json: result.to_h, status: result.status
  end

  def render_error(message, status:)
    render json: { success: false, errors: { base: Array(message) } }, status:
  end
end
