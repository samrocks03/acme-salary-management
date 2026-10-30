# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SalaryRevisionService::Create do
  let(:hr_manager) { create(:user) }
  let(:employee) { create(:employee, :with_history, hired_on: Date.new(2022, 4, 11), salary: 1_000_000) }

  before { travel_to Date.new(2026, 10, 30) }

  def call(**params)
    defaults = { amount: '1210000', effective_on: '2026-04-01', reason: 'annual_review' }
    described_class.new(employee.id, defaults.merge(params), hr_manager).call
  end

  it 'appends a revision and makes it the current salary (rule 2)' do
    result = call

    expect(result).to be_success
    expect(employee.reload.salary).to eq(1_210_000)
    expect(employee.salary_revisions.newest_first.first).to have_attributes(previous_amount: 1_100_000,
                                                                            changed_by: hr_manager)
  end

  it 'accepts an unchanged amount as a 0% revision (e.g. an annual review without a raise)' do
    result = call(amount: '1100000')

    expect(result).to be_success
    expect(result.data[:attributes]).to include(amount: 1_100_000.0, previous_amount: 1_100_000.0, change_percent: 0.0)
    expect(employee.reload.salary).to eq(1_100_000)
  end

  it 'rejects a date before the latest revision (rule 5)' do
    result = call(effective_on: '2023-01-01')

    expect(result.errors[:effective_on]).to eq(["can't be before the latest revision (2023-04-11)"])
    expect(employee.reload.salary).to eq(1_100_000)
  end

  it 'rejects the system-only hire reason' do
    expect(call(reason: 'hire').errors[:reason]).to eq(['is not included in the list'])
  end

  it 'ignores attributes the client may not set' do
    result = described_class.new(employee.id, { amount: '1210000', effective_on: '2026-04-01', reason: 'other',
                                                currency: 'USD', previous_amount: '1' }, hr_manager).call

    expect(result.data[:attributes]).to include(currency: 'INR', previous_amount: 1_100_000.0)
  end

  it 'returns 404 for an unknown employee' do
    result = described_class.new(0, {}, hr_manager).call

    expect(result.status).to eq(:not_found)
  end
end
