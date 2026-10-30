# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SalaryRevisionPolicy, type: :policy do
  subject(:policy) { described_class }

  permissions :index? do
    it { is_expected.to permit(build_stubbed(:user, :viewer), SalaryRevision) }
    it { is_expected.not_to permit(nil, SalaryRevision) }
  end

  permissions :create? do
    it { is_expected.to permit(build_stubbed(:user), SalaryRevision) }
    it { is_expected.not_to permit(build_stubbed(:user, :viewer), SalaryRevision) }
  end
end
