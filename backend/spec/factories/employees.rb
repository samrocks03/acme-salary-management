# frozen_string_literal: true

FactoryBot.define do
  factory :employee do
    sequence(:first_name) { |n| "Asha#{n}" }
    last_name { 'Rao' }
    sequence(:email) { |n| "employee#{n}@acme.test" }
    job_title { 'Software Engineer' }
    department { 'Engineering' }
    country_code { 'IN' }
    salary { 2_400_000 }
    employment_type { 'full_time' }
    hired_on { Date.new(2022, 4, 11) }

    trait :us do
      country_code { 'US' }
      salary { 120_000 }
    end
  end
end
