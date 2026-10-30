# frozen_string_literal: true

module Api
  module V1
    class MeController < ApplicationController
      def show
        authorize current_user, :show?
        render_result AuthService::Me.new(current_user).call
      end
    end
  end
end
