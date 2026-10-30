# frozen_string_literal: true

require 'rails_helper'

RSpec.describe TextNormalizer do
  it 'removes markup and squishes whitespace' do
    expect(described_class.call("  <script>alert(1)</script> Asha \n Rao ")).to eq('alert(1) Asha Rao')
  end

  it 'keeps ampersands and accents readable (no HTML entities)' do
    expect(described_class.call('R&D — José')).to eq('R&D — José')
  end

  it 'strips markup hidden behind HTML entities' do
    expect(described_class.call('&lt;img src=x onerror=alert(1)&gt;Ann')).to eq('Ann')
  end

  it 'turns nil into an empty string (presence validations then apply)' do
    expect(described_class.call(nil)).to eq('')
  end
end
