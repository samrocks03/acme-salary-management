# frozen_string_literal: true

module Seeds
  # The two demo accounts from docs/03-api-contract.md. Idempotent.
  # Password: SEED_PASSWORD when set; the documented demo password only outside production.
  module UserSeeder
    DEMO_PASSWORD = 'Password@123'
    USERS = [
      { email: 'hr@acme.test', name: 'Hana HR', role: 'hr_manager' },
      { email: 'viewer@acme.test', name: 'Victor Viewer', role: 'viewer' }
    ].freeze

    class MissingPassword < StandardError; end

    def self.call(password: default_password)
      USERS.map do |attributes|
        User.find_or_create_by!(email: attributes[:email]) do |user|
          user.assign_attributes(attributes.merge(password:))
        end
      end
    end

    def self.default_password
      password = ENV.fetch('SEED_PASSWORD', nil).presence
      return password if password
      # The demo password is public (README); never let it guard real data.
      raise MissingPassword, 'Set SEED_PASSWORD to seed users in production.' if Rails.env.production?

      DEMO_PASSWORD
    end
  end
end
