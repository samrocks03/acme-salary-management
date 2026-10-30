# frozen_string_literal: true

# Reusable OpenAPI schemas for rswag request specs (referenced as '#/components/schemas/<name>').
module SwaggerSchemas
  module_function

  def all
    {
      error: error,
      user: resource('user', user_attributes),
      employee: resource('employee', employee_attributes),
      employee_input: employee_input
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

  def user_attributes
    { email: { type: :string }, name: { type: :string }, role: { type: :string, enum: %w[hr_manager viewer] } }
  end
end
