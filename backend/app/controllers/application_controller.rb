# frozen_string_literal: true

class ApplicationController < ActionController::API
  include Pundit::Authorization
  include RendersServiceResult
  include ErrorHandling

  before_action :authenticate_user!
  after_action :verify_authorized
end
