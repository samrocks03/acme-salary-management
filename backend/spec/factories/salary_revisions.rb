# frozen_string_literal: true

FactoryBot.define do
  factory :salary_revision do
    employee
    changed_by factory: :user
    amount { 2_640_000 }
    previous_amount { 2_400_000 }
    effective_on { Date.new(2024, 4, 1) }
    reason { 'promotion' }
    note { 'Promoted to Senior' }
  end
end
