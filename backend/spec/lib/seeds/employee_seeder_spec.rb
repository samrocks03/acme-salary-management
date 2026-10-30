# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Seeds::EmployeeSeeder do
  let(:hr_manager) { create(:user) }
  let(:today) { Date.new(2026, 10, 30) }

  def seed(reset: false) = described_class.call(count: 50, changed_by: hr_manager, today:, reset:)

  def snapshot
    Employee.order(:id).pluck(:email, :country_code, :job_title, :salary, :hired_on, :employment_type)
  end

  it 'inserts the requested number of employees with 1-4 revisions each' do
    expect(seed).to eq(50)

    counts = SalaryRevision.group(:employee_id).count.values
    expect(Employee.count).to eq(50)
    expect(counts).to all(be_between(1, 4))
  end

  it 'is deterministic across runs' do
    seed
    first_run = snapshot

    seed(reset: true)

    expect(snapshot).to eq(first_run)
    expect(Employee.order(:id).pick(:employee_code)).to eq('EMP-000001') # reset restarts the code sequence
  end

  it 'is idempotent unless reset is requested' do
    seed

    expect(seed).to eq(0)
    expect(Employee.count).to eq(50)
  end

  it 'keeps every domain invariant' do # rubocop:disable RSpec/MultipleExpectations
    seed

    Employee.includes(:salary_revisions).find_each do |employee|
      history = employee.salary_revisions.sort_by { |revision| [revision.effective_on, revision.id] }

      expect(employee).to be_valid
      expect(employee.currency).to eq(Reference::Country.find(employee.country_code).currency)
      expect(history.first).to have_attributes(reason: 'hire', effective_on: employee.hired_on, previous_amount: nil)
      expect(employee.salary).to eq(history.last.amount) # rule 2
      history.each_cons(2) do |previous, current|
        expect(current).to have_attributes(previous_amount: previous.amount, currency: employee.currency)
        expect(current.effective_on).to be > previous.effective_on
        expect(current.effective_on).to be <= today
      end
    end
  end

  it 'spreads employees over several countries and departments' do
    seed

    expect(Employee.distinct.count(:country_code)).to be >= 5
    expect(Employee.distinct.count(:department)).to be >= 5
  end
end
