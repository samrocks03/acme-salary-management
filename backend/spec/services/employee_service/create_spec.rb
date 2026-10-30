# frozen_string_literal: true

require 'rails_helper'

RSpec.describe EmployeeService::Create do
  subject(:result) { described_class.new(params, hr_manager).call }

  let(:hr_manager) { create(:user) }
  let(:params) do
    { first_name: 'Asha', last_name: 'Rao', email: 'asha@acme.test', job_title: 'Software Engineer',
      department: 'Engineering', country_code: 'IN', employment_type: 'full_time', hired_on: '2022-04-11',
      salary: '2400000' }
  end

  it 'creates the employee with the currency of their country' do
    expect(result).to be_success
    expect(result.status).to eq(:created)
    expect(result.data[:attributes]).to include(currency: 'INR', salary: 2_400_000.0, full_name: 'Asha Rao')
  end

  it 'records the hire revision authored by the current user (rule 4)' do
    result
    revision = Employee.find_by!(email: 'asha@acme.test').salary_revisions.sole

    expect(revision).to have_attributes(reason: 'hire', amount: 2_400_000, previous_amount: nil,
                                        effective_on: Date.new(2022, 4, 11), changed_by: hr_manager, currency: 'INR')
  end

  it 'ignores a currency sent by the client (rule 1)' do
    params[:currency] = 'USD'

    expect(result.data[:attributes][:currency]).to eq('INR')
  end

  it 'returns field errors and creates nothing when invalid' do
    params.merge!(salary: '-5', email: '')

    expect(result).to be_failure
    expect(result.status).to eq(:unprocessable_content)
    expect(result.errors).to include(:salary, :email)
    expect(SalaryRevision.count).to eq(0)
  end

  it 'rolls back the employee if the hire revision cannot be written' do
    allow(SalaryRevision).to receive(:new).and_wrap_original do |original, *args, **kwargs|
      original.call(*args, **kwargs).tap { |revision| revision.changed_by = nil }
    end

    expect { result }.not_to change(Employee, :count)
    expect(result).to be_failure
  end
end
