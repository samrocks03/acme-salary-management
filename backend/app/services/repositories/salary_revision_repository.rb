# frozen_string_literal: true

class SalaryRevisionRepository
  class << self
    # Newest first, with the author preloaded (the serializer shows `changed_by_name`).
    def history_for(employee_id)
      SalaryRevision.where(employee_id:).includes(:changed_by).newest_first
    end
  end
end
