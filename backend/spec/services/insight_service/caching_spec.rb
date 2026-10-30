# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Insight caching' do # rubocop:disable RSpec/DescribeClass
  include_context 'with insight dataset'

  let(:user) { create(:user, :viewer) }

  def overview = InsightService::Overview.new({}, user).call

  it 'serves repeated requests from the cache while the data is unchanged' do
    allow(InsightRepository).to receive(:overview).and_call_original

    2.times { overview }

    expect(InsightRepository).to have_received(:overview).once
  end

  it 'recomputes after an employee is created' do
    expect(overview.data[:headcount]).to eq(5)

    create(:employee, :us, salary: 300_000)

    expect(overview.data[:headcount]).to eq(6)
  end

  it 'recomputes after an employee is updated (no create or delete involved)' do
    by_job_title = -> { InsightService::ByJobTitle.new({}, user).call.data[:rows].pluck(:job_title) }
    expect(by_job_title.call).not_to include('Staff Engineer')

    us_engineer.update!(job_title: 'Staff Engineer')

    expect(by_job_title.call).to include('Staff Engineer')
  end

  it 'recomputes after an employee is deleted' do
    expect(overview.data[:headcount]).to eq(5)

    in_engineer.destroy!

    expect(overview.data[:headcount]).to eq(4)
  end

  it 'recomputes after a salary revision' do
    before = overview.data[:total_payroll_usd]

    SalaryRevisionService::Create.new(us_engineer.id, { amount: 110_000, effective_on: Date.current.to_s,
                                                        reason: 'annual_review' }, create(:user)).call

    expect(overview.data[:total_payroll_usd]).to eq(before + 10_000)
  end

  it 'keys grouped insights by country' do
    expect(InsightService::ByJobTitle.new({ country: 'IN' }, user).call.data[:currency]).to eq('INR')
    expect(InsightService::ByJobTitle.new({}, user).call.data[:currency]).to eq('USD')
  end
end
