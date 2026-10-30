# frozen_string_literal: true

require 'rails_helper'

RSpec.describe EmployeeService::Export do
  let(:user) { create(:user) }

  def export(params = {})
    result = described_class.new(ActionController::Parameters.new(params), user).call
    CSV.parse(result.data[:content].delete_prefix(described_class::BOM), headers: true)
  end

  before { travel_to Date.new(2026, 10, 30) }

  it 'names the file after today' do
    expect(described_class.new({}, user).call.data[:filename]).to eq('employees-2026-10-30.csv')
  end

  it 'starts with a UTF-8 byte-order mark so Excel reads accented names' do
    expect(described_class.new({}, user).call.data[:content]).to start_with("\uFEFF")
  end

  it 'exports every matching row with local and USD salary' do
    create(:employee, first_name: 'José', last_name: 'Müller', country_code: 'IN', salary: 2_400_000)

    row = export.first

    expect(export.headers).to eq(described_class::HEADERS)
    expect(row.to_h).to include('First Name' => 'José', 'Country' => 'India', 'Currency' => 'INR',
                                'Salary' => '2400000.00', 'Salary (USD)' => '27600.00', 'Hired On' => '2022-04-11')
  end

  it 'applies the list filters and sort, without pagination' do
    create_list(:employee, 3, :us)
    create(:employee, country_code: 'IN')

    rows = export(country: 'US', sort: 'salary', direction: 'desc', page: '2', per_page: '1')

    expect(rows.size).to eq(3)
    expect(rows.pluck('Country').uniq).to eq(['United States'])
  end

  it 'neutralises spreadsheet formulas (CSV injection)' do
    create(:employee, first_name: '=HYPERLINK("http://evil")', last_name: '+1', job_title: '@SUM(A1)')

    row = export.first

    expect(row['First Name']).to eq(%q('=HYPERLINK("http://evil")))
    expect(row['Last Name']).to eq("'+1")
    expect(row['Job Title']).to eq("'@SUM(A1)")
  end
end
