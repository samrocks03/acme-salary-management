# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SalaryRevision do
  subject(:revision) { build(:salary_revision, employee:) }

  let(:employee) { create(:employee, hired_on: Date.new(2022, 4, 11)) }

  before { travel_to(Date.new(2026, 10, 30)) }

  describe 'associations and validations' do
    it { is_expected.to belong_to(:employee) }
    it { is_expected.to belong_to(:changed_by).class_name('User') }
    it { is_expected.to validate_length_of(:note).is_at_most(500) }

    it 'requires 0 < amount <= 100,000,000' do
      expect(build(:salary_revision, employee:, amount: 0)).not_to be_valid
      expect(build(:salary_revision, employee:, amount: 100_000_001)).not_to be_valid
    end

    it 'rejects unknown reasons' do
      expect(build(:salary_revision, employee:, reason: 'bonus')).not_to be_valid
    end

    it 'does not allow the system-only hire reason for manual changes' do
      revision.reason = 'hire'

      expect(revision).to be_valid
      expect(revision.valid?(:manual_change)).to be(false)
      expect(revision.errors[:reason]).to eq(['is not included in the list'])
    end
  end

  it 'takes the currency from the employee' do
    revision.validate

    expect(revision.currency).to eq('INR')
  end

  it 'blank notes become nil and markup is stripped' do
    expect(build(:salary_revision, note: '   ').note).to be_nil
    expect(build(:salary_revision, note: '<i>Great</i> year').note).to eq('Great year')
  end

  describe 'rule 5: effective date window' do
    it 'rejects a future date' do
      revision.effective_on = Date.new(2026, 10, 31)

      expect(revision).not_to be_valid
      expect(revision.errors[:effective_on]).to eq(["can't be in the future"])
    end

    it 'rejects a date before the hire date' do
      revision.effective_on = Date.new(2022, 4, 10)

      expect(revision).not_to be_valid
      expect(revision.errors[:effective_on]).to eq(["can't be before the hire date"])
    end

    it 'rejects a date before the latest revision' do
      create(:salary_revision, employee:, effective_on: Date.new(2025, 4, 1))
      revision.effective_on = Date.new(2025, 3, 31)

      expect(revision).not_to be_valid
      expect(revision.errors[:effective_on]).to eq(["can't be before the latest revision (2025-04-01)"])
    end

    it 'accepts today and the same day as the latest revision' do
      create(:salary_revision, employee:, effective_on: Date.new(2026, 10, 30))
      revision.effective_on = Date.new(2026, 10, 30)

      expect(revision).to be_valid
    end
  end

  describe 'rule 3: append-only' do
    it 'cannot be updated or destroyed once saved' do
      saved = create(:salary_revision, employee:)

      expect { saved.update!(note: 'changed') }.to raise_error(ActiveRecord::ReadOnlyRecord)
      expect { saved.destroy }.to raise_error(ActiveRecord::ReadOnlyRecord)
    end

    it 'is removed together with its employee' do
      create(:salary_revision, employee:)

      expect { employee.destroy }.to change(described_class, :count).by(-1)
    end
  end

  describe '#change_percent' do
    it 'is the % change from the previous amount' do
      expect(build(:salary_revision, amount: 2_640_000, previous_amount: 2_400_000).change_percent).to eq(10.0)
    end

    it 'is nil for the first (hire) revision' do
      expect(build(:salary_revision, previous_amount: nil).change_percent).to be_nil
    end
  end

  it 'orders newest first' do
    older = create(:salary_revision, employee:, effective_on: Date.new(2024, 1, 1))
    newer = create(:salary_revision, employee:, effective_on: Date.new(2025, 1, 1))

    expect(employee.salary_revisions.newest_first).to eq([newer, older])
  end
end
