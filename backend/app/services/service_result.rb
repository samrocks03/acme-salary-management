# frozen_string_literal: true

# Immutable outcome of a use case. Controllers render it; specs assert on it.
# Replaces the OpenStruct responses of the reference codebase: explicit fields, no method_missing.
ServiceResult = Data.define(:success, :data, :message, :errors, :meta, :status) do
  def self.ok(data:, message:, meta: nil, status: :ok)
    new(success: true, data:, message:, errors: nil, meta:, status:)
  end

  def self.error(errors:, status: :unprocessable_content)
    new(success: false, data: nil, message: nil, errors:, meta: nil, status:)
  end

  def success?
    success
  end

  def failure?
    !success
  end

  # The JSON envelope from docs/03-api-contract.md.
  def to_h
    return { success: false, errors: } if failure?

    { success: true, message:, data:, meta: }.compact
  end
end
