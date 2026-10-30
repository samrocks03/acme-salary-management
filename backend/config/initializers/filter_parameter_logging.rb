# frozen_string_literal: true

# Keep credentials and pay data out of the logs (partial match: also filters `password_confirmation`, `amount`, etc.).
Rails.application.config.filter_parameters += %i[
  passw email secret token _key crypt salt certificate otp ssn cvv cvc jwt salary amount
]
