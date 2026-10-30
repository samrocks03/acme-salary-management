# frozen_string_literal: true

# Shared plumbing for use-case services (`<Domain>Service::<Action> < Base`).
# A service exposes `#call` and returns a ServiceResult built with the helpers below.
class Base
  EXCEPTION_KEY = 'exception.errors'

  private

  def success(data = nil, message_key:, meta: nil, status: :ok, **)
    ServiceResult.ok(data:, message: translate(message_key, **), meta:, status:)
  end

  # Business-rule failure with a translated message under errors.base.
  def failure(key, status: :unprocessable_content, **)
    ServiceResult.error(errors: { base: [translate("#{key}.detail", **)] }, status:)
  end

  # Validation failure from an ActiveModel::Errors (field => messages).
  def validation_failure(errors, status: :unprocessable_content)
    ServiceResult.error(errors: V1::ErrorMessageSerializer.new(errors).serialized_json[:errors], status:)
  end

  def translate(key, **)
    I18n.t(key, **)
  end

  def serialize(serializer, resource, **)
    serializer.new(resource, **).serializable_hash[:data]
  end
end
