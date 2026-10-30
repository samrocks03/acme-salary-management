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

    # Hire revision + one annual raise; `salary` mirrors the latest revision (domain rule 2).
    trait :with_history do
      after(:create) do |employee|
        hr = create(:user)
        hire_amount = employee.salary
        raised = (hire_amount * 1.1).round(2)
        create(:salary_revision, employee:, changed_by: hr, reason: 'hire', amount: hire_amount,
                                 previous_amount: nil, effective_on: employee.hired_on, note: nil)
        create(:salary_revision, employee:, changed_by: hr, reason: 'annual_review', amount: raised,
                                 previous_amount: hire_amount, effective_on: employee.hired_on + 1.year)
        employee.update_column(:salary, raised) # rubocop:disable Rails/SkipsModelValidations
      end
    end

    trait :us do
      country_code { 'US' }
      salary { 120_000 }
    end
  end
end
