# frozen_string_literal: true

module EmployeeService
  # Normalises list/export query params: only scalar strings survive, everything else is ignored.
  module FilterParams
    KEYS = %i[q country department job_title employment_type sort direction].freeze

    def self.call(params)
      filters = KEYS.index_with { |key| scalar(params[key]) }
      filters[:country] = filters[:country]&.upcase
      filters
    end

    def self.scalar(value)
      value.is_a?(String) ? value.strip.presence : nil
    end
  end
end
