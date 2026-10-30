# frozen_string_literal: true

# One change to an employee's base salary. Append-only (domain rule 3): persisted rows are read-only.
class SalaryRevision < ApplicationRecord
  REASONS = %w[hire promotion annual_review market_adjustment correction other].freeze
  # `hire` is written by the system when an employee is created (domain rule 4).
  USER_REASONS = (REASONS - %w[hire]).freeze
  MAX_NOTE_LENGTH = 500

  enum :reason, REASONS.index_by(&:itself), validate: true

  belongs_to :employee
  belongs_to :changed_by, class_name: 'User', inverse_of: :salary_revisions

  normalizes :note, with: ->(note) { TextNormalizer.call(note).presence }

  before_validation :assign_currency

  validates :amount, numericality: { greater_than: 0, less_than_or_equal_to: Employee::MAX_SALARY }
  validates :effective_on, presence: true
  validates :note, length: { maximum: MAX_NOTE_LENGTH }
  validates :reason, inclusion: { in: USER_REASONS }, on: :manual_change
  validate :effective_on_not_in_future, :effective_on_not_before_hire, :effective_on_not_before_latest_revision

  scope :newest_first, -> { order(effective_on: :desc, id: :desc) }

  def readonly?
    persisted? || super
  end

  def change_percent
    return if previous_amount.blank?

    (((amount - previous_amount) / previous_amount) * 100).round(2).to_f
  end

  private

  def assign_currency
    self.currency = employee&.currency
  end

  # Domain rule 5: hired_on <= effective_on <= today, and never before the latest revision.
  # Keeps "current salary = latest revision" true without scheduling future changes.
  def effective_on_not_in_future
    errors.add(:effective_on, :in_future) if effective_on && effective_on > Date.current
  end

  def effective_on_not_before_hire
    return unless effective_on && employee&.hired_on

    errors.add(:effective_on, :before_hire) if effective_on < employee.hired_on
  end

  def effective_on_not_before_latest_revision
    return unless effective_on && employee

    latest = latest_effective_on
    errors.add(:effective_on, :before_latest_revision, date: latest.iso8601) if latest && effective_on < latest
  end

  def latest_effective_on
    scope = SalaryRevision.where(employee_id: employee.id)
    scope = scope.where.not(id:) if id
    scope.maximum(:effective_on)
  end
end
