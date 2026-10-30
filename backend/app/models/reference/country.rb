# frozen_string_literal: true

module Reference
  # Countries are configuration, not a table (config/countries.yml).
  Country = Data.define(:code, :name, :currency) do
    def self.all
      @all ||= YAML.load_file(Rails.root.join('config/countries.yml'))
                   .map { |row| new(**row.symbolize_keys) }
                   .freeze
    end

    def self.codes
      all.map(&:code)
    end

    def self.find(code)
      all.find { |country| country.code == code.to_s.upcase }
    end
  end
end
