# frozen_string_literal: true

require 'rails_helper'

RSpec.describe InsightRepository do
  # Snapshot of the expression the old class-load-time constant produced from config/currencies.yml.
  let(:expected_usd_sql) do
    '(CASE employees.currency ' \
      "WHEN 'USD' THEN employees.salary * 1.0 WHEN 'GBP' THEN employees.salary * 1.27 " \
      "WHEN 'EUR' THEN employees.salary * 1.08 WHEN 'INR' THEN employees.salary * 0.0115 " \
      "WHEN 'CAD' THEN employees.salary * 0.73 WHEN 'AUD' THEN employees.salary * 0.66 " \
      "WHEN 'SGD' THEN employees.salary * 0.75 WHEN 'JPY' THEN employees.salary * 0.0067 " \
      "WHEN 'BRL' THEN employees.salary * 0.18 END)"
  end

  it 'builds the same USD CASE expression, once' do
    expect(described_class.usd_sql).to eq(expected_usd_sql)
    expect(described_class.usd_sql).to equal(described_class.usd_sql)
  end

  it 'loads without a database connection (eager loading, zeitwerk:check)' do
    allow(ActiveRecord::Base).to receive(:connection).and_raise(ActiveRecord::ConnectionNotEstablished)
    source = Rails.root.join('app/services/repositories/insight_repository.rb').read

    # Evaluated into a throwaway namespace: re-`load`ing the real file would reset its coverage data.
    expect { Module.new.module_eval(source) }.not_to raise_error
  end
end
