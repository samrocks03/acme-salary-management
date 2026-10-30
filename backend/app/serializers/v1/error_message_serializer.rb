# frozen_string_literal: true

module V1
  # Turns ActiveModel::Errors into the contract's `{ errors: { field: [messages] } }` shape.
  class ErrorMessageSerializer
    def initialize(errors)
      @errors = errors
    end

    def serialized_json
      { errors: @errors.to_hash.transform_values { |messages| messages.map(&:to_s) } }
    end
  end
end
