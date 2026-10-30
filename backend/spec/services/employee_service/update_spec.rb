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

  it 'returns 404 for an unknown employee' do
    expect(described_class.new(0, {}, user).call.status).to eq(:not_found)
  end
end
