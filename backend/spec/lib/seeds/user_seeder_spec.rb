# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Seeds::UserSeeder do
  def with_env(seed_password:, rails_env: 'test')
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with('SEED_PASSWORD', nil).and_return(seed_password)
    allow(Rails).to receive(:env).and_return(ActiveSupport::EnvironmentInquirer.new(rails_env))
  end

  def hr = User.find_by(email: 'hr@acme.test')

  it 'creates the HR manager and viewer accounts once' do
    2.times { described_class.call(password: 'Password@123') }

    expect(User.order(:email).pluck(:email, :role)).to eq([%w[hr@acme.test hr_manager], %w[viewer@acme.test viewer]])
    expect(hr.valid_password?('Password@123')).to be(true)
  end

  it 'defaults to the documented demo password outside production' do
    with_env(seed_password: nil)

    described_class.call

    expect(hr.valid_password?('Password@123')).to be(true)
  end

  it 'uses SEED_PASSWORD when it is set' do
    with_env(seed_password: 'Sup3r-Secret!pw', rails_env: 'production')

    described_class.call

    expect(hr.valid_password?('Sup3r-Secret!pw')).to be(true)
  end

  it 'refuses to seed production with the public demo password' do
    with_env(seed_password: ' ', rails_env: 'production')

    expect { described_class.call }.to raise_error(Seeds::UserSeeder::MissingPassword, /SEED_PASSWORD/)
    expect(User.count).to eq(0)
  end
end
