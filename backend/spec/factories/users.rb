# frozen_string_literal: true

FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@acme.test" }
    name { 'Hana HR' }
    password { 'Password@123' }
    role { 'hr_manager' }

    trait :viewer do
      name { 'Victor Viewer' }
      role { 'viewer' }
    end

    trait :locked do
      locked_at { Time.current }
      failed_attempts { 5 }
    end
  end
end
