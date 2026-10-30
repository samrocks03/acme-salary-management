# frozen_string_literal: true

module Reference
  # Static USD conversion (config/currencies.yml). `rate` = USD per 1 unit of `currency`.
  module Fx
    SQL_IDENTIFIER = /\A[a-z_]+(\.[a-z_]+)?\z/

    class << self
      def config
        @config ||= YAML.load_file(Rails.root.join('config/currencies.yml')).freeze
      end

      def base = config.fetch('base')
      def as_of = config.fetch('as_of')
      def rates = @rates ||= config.fetch('rates').transform_values { |rate| BigDecimal(rate.to_s) }.freeze
      def currencies = rates.keys

      def rate(currency)
        rates.fetch(currency.to_s)
      end

      def to_usd(amount, currency)
        return if amount.nil?

        (BigDecimal(amount.to_s) * rate(currency)).round(2)
      end

      # SQL expression converting `amount_column` (in the row's `currency_column`) to USD.
      # Built only from config values (quoted) and allow-listed identifiers — never from user input.
      def to_usd_sql(amount_column, currency_column = 'employees.currency')
        [amount_column, currency_column].each do |identifier|
          raise ArgumentError, "unsafe SQL identifier: #{identifier}" unless SQL_IDENTIFIER.match?(identifier)
        end

        connection = ActiveRecord::Base.connection
        branches = rates.map do |currency, rate|
          "WHEN #{connection.quote(currency)} THEN #{amount_column} * #{connection.quote(rate)}"
        end
        "(CASE #{currency_column} #{branches.join(' ')} END)"
      end

      def to_h
        { base:, as_of:, rates: rates.transform_values(&:to_f) }
      end
    end
  end
end
