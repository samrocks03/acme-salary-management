# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ServiceResult do
  it 'renders the success envelope without nil meta' do
    result = described_class.ok(data: { 'id' => '1' }, message: 'Done')

    expect(result).to be_success
    expect(result.status).to eq(:ok)
    expect(result.to_h).to eq(success: true, message: 'Done', data: { 'id' => '1' })
  end

  it 'renders the error envelope' do
    result = described_class.error(errors: { base: ['Nope'] }, status: :not_found)

    expect(result).to be_failure
    expect(result.to_h).to eq(success: false, errors: { base: ['Nope'] })
  end

  it 'is immutable' do
    expect(described_class.ok(data: nil, message: 'x')).to be_frozen
  end
end
