# frozen_string_literal: true

module Api
  module V1
    module Auth
      # POST /api/v1/auth/sign_in  -> 200 + `Authorization: Bearer <jwt>` header (added by devise-jwt)
      # DELETE /api/v1/auth/sign_out -> 200, the token's jti is denylisted
      class SessionsController < Devise::SessionsController
        # Authentication endpoints themselves: there is no resource to authorize yet.
        skip_before_action :authenticate_user!
        skip_after_action :verify_authorized
        skip_before_action :verify_signed_out_user, only: :destroy
        # Devise skips `authenticate_user!` inside its own controllers unless forced.
        before_action -> { authenticate_user!(force: true) }, only: :destroy

        rate_limit to: 10, within: 3.minutes, only: :create, with: :render_rate_limited

        def create
          user = warden.authenticate!(auth_options)
          render_result AuthService::SignIn.new(user).call
        end

        def destroy
          render_result AuthService::SignOut.new(Warden::JWTAuth::HeaderParser.from_env(request.env)).call
        end

        private

        def render_rate_limited
          render_error(I18n.t('auth.sign_in.errors.rate_limited.detail'), status: :too_many_requests)
        end

        # Stateless: authenticate without writing the user into a (non-existent) session.
        def auth_options
          super.merge(store: false)
        end
      end
    end
  end
end
