# frozen_string_literal: true

module Seeds
  # The two demo accounts from docs/03-api-contract.md. Idempotent.
  module UserSeeder
    USERS = [
      { email: 'hr@acme.test', name: 'Hana HR', role: 'hr_manager' },
      { email: 'viewer@acme.test', name: 'Victor Viewer', role: 'viewer' }
    ].freeze

    def self.call(password: ENV.fetch('SEED_PASSWORD', 'Password@123'))
      USERS.map do |attributes|
        User.find_or_create_by!(email: attributes[:email]) do |user|
          user.assign_attributes(attributes.merge(password:))
        end
      end
    end
  end
end
