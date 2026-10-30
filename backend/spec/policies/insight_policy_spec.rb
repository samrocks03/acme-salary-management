# frozen_string_literal: true

require 'rails_helper'

RSpec.describe InsightPolicy, type: :policy do
  subject(:policy) { described_class }

  permissions :show? do
    it { is_expected.to permit(build_stubbed(:user), :insight) }
    it { is_expected.to permit(build_stubbed(:user, :viewer), :insight) }
    it { is_expected.not_to permit(nil, :insight) }
  end
end
