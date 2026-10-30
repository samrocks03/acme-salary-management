# frozen_string_literal: true

require 'rails_helper'

RSpec.describe EmployeeService::Index do
  let(:user) { create(:user, :viewer) }

  def call(params = {})
    described_class.new(ActionController::Parameters.new(params), user).call
  end

  before do
    create(:employee, first_name: 'Asha', department: 'Engineering', employment_type: 'full_time')
    create(:employee, :us, first_name: 'Bob', department: 'Sales', employment_type: 'contractor')
    create(:employee, :us, first_name: 'Cara', department: 'Sales', job_title: 'Account Manager')
  end

  it 'defaults to page 1, 25 per page, sorted by full name' do
    result = call

    expect(result.meta).to eq(page: 1, per_page: 25, total_count: 3, total_pages: 1)
    expect(result.data.map { |row| row[:attributes][:first_name] }).to eq(%w[Asha Bob Cara])
  end

  it 'combines exact filters' do
    result = call(country: 'us', department: 'Sales', employment_type: 'contractor')

    expect(result.data.map { |row| row[:attributes][:first_name] }).to eq(%w[Bob])
  end

  it 'clamps per_page to 1..100 and page to >= 1' do
    expect(call(per_page: '1000', page: '-3').meta).to include(page: 1, per_page: 100)
    expect(call(per_page: '0').meta).to include(per_page: 1, total_pages: 3)
  end

  it 'clamps a page past the end to the last page and reports it in meta' do
    result = call(per_page: '2', page: '50')

    expect(result.meta).to eq(page: 2, per_page: 2, total_count: 3, total_pages: 2)
    expect(result.data.map { |row| row[:attributes][:first_name] }).to eq(%w[Cara])
  end

  it 'clamps an absurdly large page without sending it to the database' do
    result = call(per_page: '2', page: '99999999999999999999')

    expect(result).to be_success
    expect(result.meta).to include(page: 2, total_pages: 2)
  end

  it 'reports page 1 when nothing matches' do
    expect(call(q: 'nobody', page: '4').meta).to eq(page: 1, per_page: 25, total_count: 0, total_pages: 0)
  end

  it 'ignores non-scalar params instead of failing' do
    result = call(q: ['x'], country: { a: 1 }, page: ['2'])

    expect(result).to be_success
    expect(result.meta[:total_count]).to eq(3)
  end

  it 'falls back to the default sort for unknown columns and directions' do
    result = call(sort: 'encrypted_password', direction: 'sideways')

    expect(result.data.map { |row| row[:attributes][:first_name] }).to eq(%w[Asha Bob Cara])
  end
end
