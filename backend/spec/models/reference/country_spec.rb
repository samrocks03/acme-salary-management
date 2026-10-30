# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Reference::Country do
  it 'lists the 10 configured countries' do
    expect(described_class.codes).to eq(%w[US GB DE NL IN CA AU SG JP BR])
  end

  it 'finds a country case-insensitively' do
    expect(described_class.find('in')).to have_attributes(name: 'India', currency: 'INR')
    expect(described_class.find('XX')).to be_nil
  end

  it 'maps every suggested job title to a known department' do
    expect(Reference::JobTitle.departments.values - Reference::Department.all).to be_empty
  end
end
