# frozen_string_literal: true

require 'csv'

module EmployeeService
  # CSV of the current filtered/sorted list (unpaginated). Cells that a spreadsheet would treat as a formula
  # are prefixed with a single quote (CSV/formula injection).
  class Export < Base
    SUCCESS_KEY = 'employee.export.success.message'
    HEADERS = ['Employee Code', 'First Name', 'Last Name', 'Email', 'Job Title', 'Department', 'Country',
               'Currency', 'Salary', 'Salary (USD)', 'Employment Type', 'Hired On'].freeze
    COLUMNS = %i[employee_code first_name last_name email job_title department country_code currency salary
                 employment_type hired_on].freeze
    FORMULA_TRIGGERS = ['=', '+', '-', '@', "\t", "\r"].freeze
    # Excel only detects UTF-8 (accented names) when the file starts with a byte-order mark.
    BOM = "\uFEFF"

    def initialize(params, current_user)
      super()
      @filters = FilterParams.call(params)
      @current_user = current_user
    end

    def call
      rows = EmployeeRepository.filtered(@filters).pluck(*COLUMNS)
      success({ filename: "employees-#{Date.current.iso8601}.csv", content: BOM + to_csv(rows) },
              message_key: SUCCESS_KEY)
    end

    private

    def to_csv(rows)
      CSV.generate do |csv|
        csv << HEADERS
        rows.each { |row| csv << format_row(*row) }
      end
    end

    def format_row(code, first, last, email, title, department, country_code, currency, salary, type, hired_on) # rubocop:disable Metrics/ParameterLists
      [code, first, last, email, title, department, Reference::Country.find(country_code)&.name || country_code,
       currency, format('%.2f', salary), format('%.2f', Reference::Fx.to_usd(salary, currency)), type,
       hired_on.iso8601].map { |cell| escape_formula(cell) }
    end

    def escape_formula(cell)
      FORMULA_TRIGGERS.any? { |trigger| cell.start_with?(trigger) } ? "'#{cell}" : cell
    end
  end
end
