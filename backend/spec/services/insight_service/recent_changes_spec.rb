# frozen_string_literal: true

require 'rails_helper'

RSpec.describe InsightService::RecentChanges do
  let(:user) { create(:user, :viewer) }

  before { travel_to Date.new(2026, 10, 30) }

  def revision_on(date)
    create(:salary_revision, previous_amount: 100, amount: 110, effective_on: date)
  end

  it 'covers exactly the last `days` days, today included' do
    revision_on(Date.new(2026, 10, 24)) # 6 days ago -> inside a 7-day window
    revision_on(Date.new(2026, 10, 23)) # 7 days ago -> outside

    expect(described_class.new({ days: '7' }, user).call.data).to include(revisions_count: 1)
  end

  it 'counts only today for a 1-day window' do
    revision_on(Date.new(2026, 10, 30))
    revision_on(Date.new(2026, 10, 29))

    expect(described_class.new({ days: '1' }, user).call.data).to include(revisions_count: 1)
  end
end
