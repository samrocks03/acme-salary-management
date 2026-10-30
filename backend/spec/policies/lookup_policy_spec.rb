# frozen_string_literal: true

require 'rails_helper'

RSpec.describe LookupPolicy, type: :policy do
  subject(:policy) { described_class }

  permissions :index? do
    it { is_expected.to permit(build_stubbed(:user, :viewer), :lookup) }
    it { is_expected.not_to permit(nil, :lookup) }
  end
end
