# frozen_string_literal: true

# Run with bin/ci — the same steps the GitHub workflow runs.
CI.run do
  step 'Setup', 'bin/setup --skip-server'
  step 'Style: Ruby', 'bin/rubocop'
  step 'Tests: RSpec', 'bundle exec rspec'
  step 'Security: Gem audit', 'bin/bundler-audit'
  step 'Security: Brakeman code analysis', 'bin/brakeman --quiet --no-pager --exit-on-warn --exit-on-error'
end
