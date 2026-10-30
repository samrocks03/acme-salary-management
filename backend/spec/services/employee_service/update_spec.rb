# frozen_string_literal: true

require 'rails_helper'

RSpec.describe EmployeeService::Update do
  let(:user) { create(:user) }
  let(:employee) { create(:employee) }

  it 'updates profile fields' do
    result = described_class.new(employee.id, { last_name: 'Iyer' }, user).call

    expect(result).to be_success
    expect(result.data[:attributes][:full_name]).to eq("#{employee.first_name} Iyer")
  end

  it 'refuses to change the country (rule 6)' do
    result = described_class.new(employee.id, { country_code: 'DE' }, user).call

    expect(result.errors).to eq(country_code: ["can't be changed"])
    expect(employee.reload.currency).to eq('INR')
  end

  describe 'correcting hired_on (the system hire revision moves with it)' do
    # Hired 2022-04-11 (hire revision that day), annual review effective 2023-04-11.
    let(:employee) { create(:employee, :with_history) }
    let(:hire_revision) { employee.salary_revisions.find_by!(reason: 'hire') }
    let(:raise_revision) { employee.salary_revisions.find_by!(reason: 'annual_review') }

    def update_hired_on(date)
      described_class.new(employee.id, { hired_on: date }, user).call
    end

    it 'moves the hire revision to an earlier hire date' do
      result = update_hired_on('2022-01-03')

      expect(result).to be_success
      expect(hire_revision.reload.effective_on).to eq(Date.new(2022, 1, 3))
    end

    it 'moves the hire revision to a later hire date that is still before the first salary change' do
      result = update_hired_on('2022-06-01')

      expect(result).to be_success
      expect(hire_revision.reload).to have_attributes(effective_on: Date.new(2022, 6, 1), amount: 2_400_000)
      expect(raise_revision.reload.effective_on).to eq(Date.new(2023, 4, 11))
    end

    it 'accepts a hire date on the day of the first salary change' do
      expect(update_hired_on('2023-04-11')).to be_success
      expect(hire_revision.reload.effective_on).to eq(Date.new(2023, 4, 11))
    end

    it 'rejects a hire date after the first salary change and leaves history untouched' do
      result = update_hired_on('2023-05-01')

      expect(result.status).to eq(:unprocessable_content)
      expect(result.errors).to eq(hired_on: ["can't be after the first salary change (2023-04-11)"])
      expect(hire_revision.reload.effective_on).to eq(Date.new(2022, 4, 11))
      expect(employee.reload.hired_on).to eq(Date.new(2022, 4, 11))
    end

    it 'leaves the revisions alone when hired_on does not change' do
      expect { described_class.new(employee.id, { job_title: 'Staff Engineer' }, user).call }
        .not_to(change { hire_revision.reload.effective_on })
    end

    it 'locks the employee row so it cannot race a concurrent salary revision' do
      allow(EmployeeRepository).to receive(:find_for_update).and_call_original

      update_hired_on('2022-01-03')

      expect(EmployeeRepository).to have_received(:find_for_update).with(employee.id)
    end
  end

  it 'returns 404 for an unknown employee' do
    expect(described_class.new(0, {}, user).call.status).to eq(:not_found)
  end
end
