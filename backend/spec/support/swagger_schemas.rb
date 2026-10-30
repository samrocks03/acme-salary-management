# frozen_string_literal: true

# Reusable OpenAPI schemas for rswag request specs (referenced as '#/components/schemas/<name>').
module SwaggerSchemas
  module_function

  def all
    {
      error: error,
      user: resource('user', user_attributes)
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

  def user_attributes
    { email: { type: :string }, name: { type: :string }, role: { type: :string, enum: %w[hr_manager viewer] } }
  end
end
