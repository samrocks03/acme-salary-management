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
      get 'lookups', to: 'lookups#index'

      resources :employees, only: %i[index show create update destroy] do
        get :export, on: :collection
        resources :salary_revisions, only: %i[index create]
      end

      scope 'insights', controller: :insights, as: :insights do
        get :overview
        get :by_country
        get :by_job_title
        get :by_department
        get :salary_distribution
        get :recent_changes
      end
    end
  end
end
