# frozen_string_literal: true

# Reusable OpenAPI schemas for rswag request specs (referenced as '#/components/schemas/<name>').
module SwaggerSchemas
  module_function

  def all
    {
      error: error,
      user: resource('user', user_attributes),
      employee: resource('employee', employee_attributes),
      employee_input: employee_input,
      salary_revision: resource('salary_revision', salary_revision_attributes),
      salary_revision_input: salary_revision_input
    }
  end

  def error
    {
      type: :object,
      required: %w[success errors],
      properties: {
        success: { type: :boolean, enum: [false] },
        errors: { type: :object, additionalProperties: { type: :array, items: { type: :string } } }
      }
    }
  end

  def envelope(data_schema, meta: false)
    properties = { success: { type: :boolean }, message: { type: :string }, data: data_schema }
    properties[:meta] = pagination_meta if meta
    { type: :object, required: %w[success message data], properties: }
  end

  # Request body `{ <root>: <schema ref> }`.
  def body(root, schema_name)
    { type: :object, required: [root.to_s],
      properties: { root => { '$ref' => "#/components/schemas/#{schema_name}" } } }
  end

  def message_envelope
    { type: :object, required: %w[success message],
      properties: { success: { type: :boolean }, message: { type: :string } } }
  end

  def resource(type, attributes)
    {
      type: :object,
      required: %w[id type attributes],
      properties: {
        id: { type: :string },
        type: { type: :string, enum: [type] },
        attributes: { type: :object, properties: attributes, required: attributes.keys.map(&:to_s) }
      }
    }
  end

  def pagination_meta
    { type: :object, required: %w[page per_page total_count total_pages],
      properties: { page: { type: :integer }, per_page: { type: :integer },
                    total_count: { type: :integer }, total_pages: { type: :integer } } }
  end

  def employee_attributes
    {
      employee_code: { type: :string, example: 'EMP-000123' },
      first_name: { type: :string }, last_name: { type: :string }, full_name: { type: :string },
      email: { type: :string }, job_title: { type: :string }, department: { type: :string },
      country_code: { type: :string, example: 'IN' }, country_name: { type: :string },
      currency: { type: :string, example: 'INR' },
      salary: { type: :number, example: 2_400_000.0 }, salary_usd: { type: :number, example: 27_600.0 },
      employment_type: { type: :string, enum: %w[full_time part_time contractor] },
      hired_on: { type: :string, format: :date },
      created_at: { type: :string, format: 'date-time' }, updated_at: { type: :string, format: 'date-time' }
    }
  end

  def employee_input
    {
      type: :object,
      properties: {
        first_name: { type: :string, example: 'Asha' }, last_name: { type: :string, example: 'Rao' },
        email: { type: :string, example: 'asha.rao@acme.test' },
        job_title: { type: :string, example: 'Software Engineer' },
        department: { type: :string, example: 'Engineering' },
        country_code: { type: :string, example: 'IN' },
        employment_type: { type: :string, enum: %w[full_time part_time contractor] },
        hired_on: { type: :string, format: :date, example: '2022-04-11' },
        salary: { type: :number, example: 2_400_000 }
      }
    }
  end

  def salary_revision_attributes
    {
      employee_id: { type: :integer },
      amount: { type: :number, example: 2_640_000.0 },
      previous_amount: { type: :number, nullable: true, example: 2_400_000.0 },
      change_percent: { type: :number, nullable: true, example: 10.0 },
      currency: { type: :string, example: 'INR' },
      effective_on: { type: :string, format: :date },
      reason: { type: :string, enum: SalaryRevision::REASONS },
      note: { type: :string, nullable: true },
      changed_by_name: { type: :string },
      created_at: { type: :string, format: 'date-time' }
    }
  end

  def salary_revision_input
    {
      type: :object, required: %w[amount effective_on reason],
      properties: {
        amount: { type: :number, example: 2_640_000, minimum: 0, exclusiveMinimum: true, maximum: 100_000_000 },
        effective_on: { type: :string, format: :date, example: '2026-04-01' },
        reason: { type: :string, enum: SalaryRevision::USER_REASONS },
        note: { type: :string, maxLength: 500, example: 'Promoted to Senior' }
      }
    }
  end

  def number = { type: :number }
  def integer = { type: :integer }

  def object(properties)
    { type: :object, required: properties.keys.map(&:to_s), properties: }
  end

  def insight(name, group_key = nil)
    stats = { headcount: integer, min_salary: number, median_salary: number, avg_salary: number, max_salary: number }
    case name
    when :overview
      object(headcount: integer, countries_count: integer, total_payroll_usd: number, avg_salary_usd: number,
             median_salary_usd: number, fx_as_of: { type: :string, format: :date })
    when :country_row
      object(country_code: { type: :string }, country_name: { type: :string }, currency: { type: :string },
             **stats, avg_salary_usd: number, median_salary_usd: number, total_payroll_usd: number)
    when :grouped
      object(currency: { type: :string },
             rows: { type: :array, items: object(group_key => { type: :string }, **stats) })
    when :distribution
      object(currency: { type: :string },
             buckets: { type: :array, items: object(min: number, max: number, count: integer) })
    when :recent_changes
      object(days: integer, revisions_count: integer, employees_count: integer, avg_change_percent: number,
             by_reason: { type: :array,
                          items: object(reason: { type: :string }, count: integer, avg_change_percent: number) })
    end
  end

  def lookups
    strings = { type: :array, items: { type: :string } }
    object(
      countries: { type: :array, items: object(code: { type: :string }, name: { type: :string },
                                               currency: { type: :string }) },
      departments: strings, employment_types: strings, revision_reasons: strings, job_titles: strings,
      fx: object(base: { type: :string }, as_of: { type: :string, format: :date },
                 rates: { type: :object, additionalProperties: number })
    )
  end

  def user_attributes
    { email: { type: :string }, name: { type: :string }, role: { type: :string, enum: %w[hr_manager viewer] } }
  end
end
