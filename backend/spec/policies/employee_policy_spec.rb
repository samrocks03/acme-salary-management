# frozen_string_literal: true

require 'rails_helper'

RSpec.describe EmployeePolicy, type: :policy do
  subject(:policy) { described_class }

  let(:hr_manager) { build_stubbed(:user) }
  let(:viewer) { build_stubbed(:user, :viewer) }

  permissions :index?, :show? do
    it { is_expected.to permit(hr_manager, Employee) }
    it { is_expected.to permit(viewer, Employee) }
    it { is_expected.not_to permit(nil, Employee) }
  end

  permissions :create?, :update?, :destroy?, :export? do
    it { is_expected.to permit(hr_manager, Employee) }
    it { is_expected.not_to permit(viewer, Employee) }
  end
end
