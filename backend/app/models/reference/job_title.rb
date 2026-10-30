# frozen_string_literal: true

module Reference
  # Suggested titles mapped to their department (config/job_titles.yml).
  module JobTitle
    def self.departments
      @departments ||= YAML.load_file(Rails.root.join('config/job_titles.yml')).freeze
    end

    def self.all
      departments.keys
    end
  end
end
