# frozen_string_literal: true

module Reference
  module Department
    def self.all
      @all ||= YAML.load_file(Rails.root.join('config/departments.yml')).freeze
    end
  end
end
