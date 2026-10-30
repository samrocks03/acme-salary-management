# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Seeds::UserSeeder do
  it 'creates the HR manager and viewer accounts once' do
    2.times { described_class.call(password: 'Password@123') }

    expect(User.order(:email).pluck(:email, :role)).to eq([%w[hr@acme.test hr_manager], %w[viewer@acme.test viewer]])
    expect(User.find_by(email: 'hr@acme.test').valid_password?('Password@123')).to be(true)
  end
end
