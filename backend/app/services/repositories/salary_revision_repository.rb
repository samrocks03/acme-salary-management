# frozen_string_literal: true

class SalaryRevisionRepository
  class << self
    # Newest first, with the author preloaded (the serializer shows `changed_by_name`).
    def history_for(employee_id)
      SalaryRevision.where(employee_id:).includes(:changed_by).newest_first
    end

    # Keeps the system `hire` revision on the employee's (corrected) hire date (domain rule 4).
    # `update_all` deliberately bypasses SalaryRevision#readonly?: append-only protects the pay history
    # (amounts, order, authorship), and none of that changes here — the hire revision is a system record
    # whose date is defined as `hired_on`, and the caller has already checked that no salary change
    # precedes the new date, so the order of revisions is preserved.
    def move_hire_revision(employee_id, hired_on)
      SalaryRevision.where(employee_id:, reason: 'hire').update_all(effective_on: hired_on) # rubocop:disable Rails/SkipsModelValidations
    end
  end
end
