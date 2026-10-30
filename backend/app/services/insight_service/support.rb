# frozen_string_literal: true

module InsightService
  # Shared by the insight use cases: caching keyed by data version and `country` param validation.
  module Support
    INVALID_COUNTRY = 'insight.errors.invalid_country.detail'
    CACHE_TTL = 12.hours

    private

    # Cached until the data changes (the key embeds InsightRepository.data_version) — no manual busting.
    def cached(name, *params, &)
      Rails.cache.fetch(['insights', name, *params, InsightRepository.data_version], expires_in: CACHE_TTL, &)
    end

    def normalize_country(value)
      value.is_a?(String) ? value.strip.upcase.presence : nil
    end

    def valid_country?(code)
      code.nil? || Reference::Country.codes.include?(code)
    end

    def invalid_country
      ServiceResult.error(errors: { country: [translate(INVALID_COUNTRY)] })
    end

    def currency_for(country_code)
      country_code ? Reference::Country.find(country_code).currency : Reference::Fx.base
    end

    # nil stays nil: an average/median over no rows is "no data", not a real 0. Counts are never passed here.
    def number(value)
      value&.to_f
    end
  end
end
