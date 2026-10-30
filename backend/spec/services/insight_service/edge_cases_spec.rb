# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Insights on sparse data' do # rubocop:disable RSpec/DescribeClass
  let(:user) { create(:user, :viewer) }

  it 'returns zero counts, null averages and empty collections when there are no employees' do
    expect(InsightService::Overview.new({}, user).call.data).to include(
      headcount: 0, countries_count: 0, total_payroll_usd: 0.0, avg_salary_usd: nil, median_salary_usd: nil
    )
    expect(InsightService::ByCountry.new({}, user).call.data).to eq([])
    expect(InsightService::SalaryDistribution.new({}, user).call.data).to eq(currency: 'USD', buckets: [])
  end

  it 'returns a null average change (not 0%) when there are no revisions in the window' do
    data = InsightService::RecentChanges.new({}, user).call.data

    expect(data).to eq(days: 90, revisions_count: 0, employees_count: 0, avg_change_percent: nil, by_reason: [])
  end

  it 'returns a single bucket when every salary is equal' do
    create_list(:employee, 2, :us, salary: 100_000)

    buckets = InsightService::SalaryDistribution.new({ country: 'US' }, user).call.data[:buckets]

    expect(buckets).to eq([{ min: 100_000.0, max: 100_000.0, count: 2 }])
  end

  it 'rejects a non-numeric days window' do
    result = InsightService::RecentChanges.new({ days: 'abc' }, user).call

    expect(result.errors).to eq(days: ['must be a whole number between 1 and 365'])
  end

  it 'only groups by allow-listed columns' do
    expect { InsightRepository.grouped_stats(:email, country_code: nil) }.to raise_error(ArgumentError)
  end
end
