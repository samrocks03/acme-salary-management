# frozen_string_literal: true

# Insights are cached in a memory store; never let one example's cache leak into the next.
RSpec.configure do |config|
  config.before { Rails.cache.clear }
end
