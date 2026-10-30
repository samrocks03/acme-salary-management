# frozen_string_literal: true

# A tiny, hand-computable dataset for insight specs (USD rates: INR 0.0115, USD 1.0).
#   IN  Software Engineer  1,000,000 INR (11,500 USD)   US  Software Engineer  100,000 USD
#   IN  Software Engineer  2,000,000 INR (23,000 USD)   US  Sales Manager      200,000 USD
#   IN  Accountant         3,000,000 INR (34,500 USD)
RSpec.shared_context 'with insight dataset' do
  let!(:in_engineer) do
    create(:employee, country_code: 'IN', salary: 1_000_000, job_title: 'Software Engineer', department: 'Engineering')
  end
  let!(:in_senior_engineer) do
    create(:employee, country_code: 'IN', salary: 2_000_000, job_title: 'Software Engineer', department: 'Engineering')
  end
  let!(:in_accountant) do
    create(:employee, country_code: 'IN', salary: 3_000_000, job_title: 'Accountant', department: 'Finance')
  end
  let!(:us_engineer) do
    create(:employee, country_code: 'US', salary: 100_000, job_title: 'Software Engineer', department: 'Engineering')
  end
  let!(:us_sales_manager) do
    create(:employee, country_code: 'US', salary: 200_000, job_title: 'Sales Manager', department: 'Sales')
  end
end
