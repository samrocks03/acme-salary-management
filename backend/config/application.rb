# frozen_string_literal: true

require_relative 'boot'

require 'rails'
require 'active_model/railtie'
require 'active_job/railtie'
require 'active_record/railtie'
require 'action_controller/railtie'
require 'action_view/railtie'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module AcmeSalary
  class Application < Rails::Application
    config.load_defaults 8.1

    config.autoload_lib(ignore: %w[assets tasks])

    # Repositories are top-level constants (EmployeeRepository), as in the reference codebase.
    config.autoload_paths << Rails.root.join('app/services/repositories')
    config.eager_load_paths << Rails.root.join('app/services/repositories')

    # JSON API only: no sessions, cookies or views. Auth is a stateless Bearer JWT.
    config.api_only = true
    # Request bodies must use the documented root key ({ "employee": { ... } }); a missing root is a 400.
    config.action_controller.wrap_parameters_by_default = false

    config.time_zone = 'UTC'
    config.active_record.default_timezone = :utc

    # The employee_code sequence can't be expressed in schema.rb, so dump the schema as SQL.
    config.active_record.schema_format = :sql

    # Insights are cached in-process; the cache key embeds a data version so writes invalidate it.
    config.cache_store = :memory_store, { size: 32 * 1024 * 1024 }

    config.generators do |g|
      g.test_framework :rspec
      g.orm :active_record
    end
  end
end
