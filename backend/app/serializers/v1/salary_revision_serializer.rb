# frozen_string_literal: true

module V1
  class SalaryRevisionSerializer
    include JSONAPI::Serializer

    set_type :salary_revision

    attributes :employee_id, :change_percent, :currency, :effective_on, :reason, :note, :created_at

    attribute(:amount) { |revision| revision.amount&.to_f }
    attribute(:previous_amount) { |revision| revision.previous_amount&.to_f }
    attribute(:changed_by_name) { |revision| revision.changed_by.name }
  end
end
