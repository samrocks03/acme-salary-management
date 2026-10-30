# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Employee do
  subject(:employee) { build(:employee) }

  describe 'validations' do
    it { is_expected.to validate_presence_of(:first_name) }
    it { is_expected.to validate_length_of(:first_name).is_at_most(50) }
    it { is_expected.to validate_presence_of(:last_name) }
    it { is_expected.to validate_length_of(:last_name).is_at_most(50) }
    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_length_of(:job_title).is_at_least(2).is_at_most(100) }
    it { is_expected.to validate_inclusion_of(:department).in_array(Reference::Department.all) }
    it { is_expected.to validate_presence_of(:hired_on) }

    it do
      expect(employee).to define_enum_for(:employment_type)
        .with_values(full_time: 'full_time', part_time: 'part_time', contractor: 'contractor')
        .backed_by_column_of_type(:string)
    end

    it 'requires a unique email (case-insensitive)' do
      create(:employee, email: 'asha@acme.test')

      expect(build(:employee, email: 'ASHA@acme.test')).not_to be_valid
    end

    it 'rejects malformed emails' do
      expect(build(:employee, email: 'not-an-email')).not_to be_valid
    end

    it 'rejects unknown countries' do
      employee.country_code = 'XX'

      expect(employee).not_to be_valid
      expect(employee.errors[:country_code]).to include('is not included in the list')
    end

    it 'requires a salary between 0 (exclusive) and 100,000,000' do
      expect(build(:employee, salary: 0)).not_to be_valid
      expect(build(:employee, salary: 100_000_001)).not_to be_valid
      expect(build(:employee, salary: 100_000_000)).to be_valid
    end

    it 'rejects a future hire date' do
      travel_to Date.new(2026, 10, 30) do
        expect(build(:employee, hired_on: Date.new(2026, 10, 31))).not_to be_valid
        expect(build(:employee, hired_on: Date.new(2026, 10, 30))).to be_valid
      end
    end
  end

  describe 'rule 1: currency follows the country' do
    it 'derives the currency from the country before validation' do
      employee = build(:employee, country_code: 'de', currency: 'USD')

      employee.validate

      expect(employee.country_code).to eq('DE')
      expect(employee.currency).to eq('EUR')
    end
  end

  describe 'rule 6: country is immutable' do
    it "reports can't be changed when the country is updated" do
      employee = create(:employee)

      expect(employee.update(country_code: 'US')).to be(false)
      expect(employee.errors[:country_code]).to eq(["can't be changed"])
    end
  end

  describe 'rule 8: text normalisation' do
    it 'strips markup and squishes names, titles and departments' do
      employee = build(:employee, first_name: ' <b>Asha</b> ', last_name: "Rao\n<script>x</script>",
                                  job_title: '  Software   Engineer ')

      employee.validate

      expect([employee.first_name, employee.last_name,
              employee.job_title]).to eq(['Asha', 'Rao x', 'Software Engineer'])
    end

    it 'downcases and strips the email' do
      expect(build(:employee, email: '  Asha.Rao@ACME.test ').email).to eq('asha.rao@acme.test')
    end
  end

  describe 'database defaults and constraints' do
    it 'assigns a sequential employee code and the generated full name' do
      first = create(:employee, first_name: 'Asha', last_name: 'Rao').reload
      second = create(:employee).reload

      expect(first.employee_code).to match(/\AEMP-\d{6}\z/)
      expect(second.employee_code.delete_prefix('EMP-').to_i).to eq(first.employee_code.delete_prefix('EMP-').to_i + 1)
      expect(first.full_name).to eq('Asha Rao')
    end

    it 'enforces the salary check constraint even when validations are skipped' do
      employee = create(:employee)

      expect { employee.update_column(:salary, -1) } # rubocop:disable Rails/SkipsModelValidations
        .to raise_error(ActiveRecord::StatementInvalid, /salary_range/)
    end
  end

  describe 'presentation helpers' do
    it 'exposes the country name and USD-normalised salary' do
      employee = build(:employee, country_code: 'IN', salary: 2_400_000)
      employee.validate

      expect(employee.country_name).to eq('India')
      expect(employee.salary_usd).to eq(27_600.0)
    end
  end
end
