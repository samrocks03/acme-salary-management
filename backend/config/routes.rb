# frozen_string_literal: true

Rails.application.routes.draw do
  get 'up', to: 'rails/health#show', as: :rails_health_check

  devise_for :users, skip: :all
  devise_scope :user do
    scope 'api/v1/auth', defaults: { format: :json } do
      post 'sign_in', to: 'api/v1/auth/sessions#create', as: :user_session
      delete 'sign_out', to: 'api/v1/auth/sessions#destroy', as: :destroy_user_session
    end
  end

  namespace :api, defaults: { format: :json } do
    namespace :v1 do
      get 'me', to: 'me#show'

      resources :employees, only: %i[index show create update destroy]
    end
  end
end
