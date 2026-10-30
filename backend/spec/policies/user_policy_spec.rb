# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UserPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:user) { build_stubbed(:user, :viewer) }

  permissions :show? do
    it { is_expected.to permit(user, user) }
    it { is_expected.not_to permit(user, build_stubbed(:user)) }
    it { is_expected.not_to permit(nil, user) }
  end
end
