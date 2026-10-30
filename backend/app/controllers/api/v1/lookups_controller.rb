# frozen_string_literal: true

module Api
  module V1
    class LookupsController < ApplicationController
      def index
        authorize :lookup, :index?
        render_result LookupService::Index.new(current_user).call
      end
    end
  end
end
