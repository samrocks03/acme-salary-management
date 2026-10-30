# frozen_string_literal: true

class Employee < ApplicationRecord
  MAX_SALARY = 100_000_000

  enum :employment_type, { full_time: 'full_time', part_time: 'part_time', contractor: 'contractor' }, validate: true

  has_many :salary_revisions, dependent: :delete_all

  attr_readonly :employee_code

  # Domain rule 8: plain text only, normalised before validation.
  normalizes :first_name, :last_name, :job_title, :department, with: TextNormalizer
  normalizes :email, with: ->(email) { email.strip.downcase }
  normalizes :country_code, with: ->(code) { code.strip.upcase }

  # Domain rule 1: currency is derived from the country, never user input.
  before_validation :assign_currency

  validates :first_name, :last_name, presence: true, length: { maximum: 50 }
  validates :email, presence: true, length: { maximum: 255 }, format: { with: URI::MailTo::EMAIL_REGEXP },
                    uniqueness: { case_sensitive: false }
  validates :job_title, presence: true, length: { in: 2..100 }
  validates :department, inclusion: { in: ->(_) { Reference::Department.all } }
  validates :country_code, inclusion: { in: ->(_) { Reference::Country.codes } }
  validates :salary, numericality: { greater_than: 0, less_than_or_equal_to: MAX_SALARY }
  validates :hired_on, presence: true
  validates :hired_on, comparison: { less_than_or_equal_to: -> { Date.current } }, allow_nil: true
  validate :country_code_unchanged, on: :update
  validate :hired_on_not_after_first_revision, on: :update

  def country
    Reference::Country.find(country_code)
  end

  def country_name
    country&.name
  end

  def salary_usd
    Reference::Fx.to_usd(salary, currency)&.to_f
  end

  private

  def assign_currency
    self.currency = country&.currency
  end

  # Domain rule 6: relocation means re-pricing in another currency — out of scope for the MVP.
  def country_code_unchanged
    errors.add(:country_code, :immutable) if will_save_change_to_country_code?
  end

  # Keeps domain rule 5 (revisions are effective on/after the hire date) true when hired_on is corrected.
  def hired_on_not_after_first_revision
    return unless hired_on && will_save_change_to_hired_on?

    first = salary_revisions.minimum(:effective_on)
    errors.add(:hired_on, :after_first_revision, date: first.iso8601) if first && hired_on > first
  end
end
