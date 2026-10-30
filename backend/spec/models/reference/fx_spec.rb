# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Reference::Fx do
  it 'converts local amounts to USD with the dated static rate' do
    expect(described_class.to_usd(2_400_000, 'INR')).to eq(BigDecimal('27600'))
    expect(described_class.to_usd(nil, 'INR')).to be_nil
    expect(described_class.as_of).to eq('2026-10-01')
  end

  it 'has a rate for every configured country currency' do
    expect(Reference::Country.all.map(&:currency) - described_class.currencies).to be_empty
  end

  it 'builds a CASE expression only from config values' do
    sql = described_class.to_usd_sql('employees.salary')

    expect(sql).to start_with('(CASE employees.currency WHEN ')
    expect(sql).to include("WHEN 'INR' THEN employees.salary * 0.0115")
  end

  it 'refuses unsafe identifiers' do
    expect { described_class.to_usd_sql('salary; DROP TABLE employees') }.to raise_error(ArgumentError)
  end

  it 'evaluates to the same number in SQL and Ruby' do
    employee = create(:employee, country_code: 'JP', salary: 9_000_000)

    usd = Employee.where(id: employee.id).pick(Arel.sql(described_class.to_usd_sql('employees.salary')))

    expect(usd).to eq(described_class.to_usd(9_000_000, 'JPY'))
  end
end
