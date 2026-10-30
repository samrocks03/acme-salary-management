# frozen_string_literal: true

require 'rails_helper'

RSpec.describe EmployeeService::Destroy do
  let(:user) { create(:user) }

  it 'deletes the employee with their history' do
    employee = create(:employee, :with_history, first_name: 'Asha', last_name: 'Rao')

    result = described_class.new(employee.id, user).call

    expect(result.message).to eq('Employee Asha Rao deleted successfully.')
    expect(SalaryRevision.count).to eq(0)
  end

  it 'returns 404 for an unknown employee' do
    expect(described_class.new(0, user).call.to_h).to eq(success: false, errors: { base: ['Employee not found.'] })
  end
end
