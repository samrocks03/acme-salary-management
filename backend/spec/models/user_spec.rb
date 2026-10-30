# frozen_string_literal: true

require 'rails_helper'

RSpec.describe User do
  subject(:user) { build(:user) }

  it { is_expected.to validate_presence_of(:name) }
  it { is_expected.to validate_length_of(:name).is_at_most(100) }
  it do
    expect(user).to define_enum_for(:role)
      .with_values(hr_manager: 'hr_manager', viewer: 'viewer').backed_by_column_of_type(:string)
  end

  it 'downcases and strips the email' do
    expect(create(:user, email: '  Hana@ACME.test ').email).to eq('hana@acme.test')
  end

  it 'strips markup from the name' do
    expect(build(:user, name: '<b>Hana</b>   HR').name).to eq('Hana HR')
  end

  it 'rejects an unknown role' do
    expect(build(:user, role: 'admin')).not_to be_valid
  end

  it 'requires a password of at least 8 characters' do
    expect(build(:user, password: 'short')).not_to be_valid
  end
end
