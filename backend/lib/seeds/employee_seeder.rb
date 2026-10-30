# frozen_string_literal: true

module Seeds
  # Deterministic, realistic ACME workforce: `count` employees across the 10 countries, each with a
  # hire revision plus 0-3 raises; `employees.salary` always equals the latest revision (domain rule 2).
  # Uses insert_all in batches, so 10k employees + history load in a few seconds.
  class EmployeeSeeder
    BATCH_SIZE = 1_000
    NAME_POOL_SIZE = 150
    SEED = 42

    # Rough share of headcount per country (India / US heavy).
    COUNTRY_WEIGHTS = { 'IN' => 30, 'US' => 24, 'GB' => 8, 'DE' => 8, 'CA' => 6, 'NL' => 4, 'AU' => 5,
                        'SG' => 4, 'JP' => 5, 'BR' => 6 }.freeze
    # Pay level relative to the US for the same role.
    COST_FACTORS = { 'US' => 1.0, 'GB' => 0.78, 'DE' => 0.82, 'NL' => 0.8, 'IN' => 0.32, 'CA' => 0.82,
                     'AU' => 0.85, 'SG' => 0.88, 'JP' => 0.7, 'BR' => 0.38 }.freeze
    NAME_LOCALES = { 'IN' => 'en-IND', 'US' => 'en-US', 'GB' => 'en-GB', 'DE' => 'de', 'NL' => 'nl',
                     'CA' => 'en-CA', 'AU' => 'en-AU', 'SG' => 'en', 'JP' => 'en', 'BR' => 'pt-BR' }.freeze
    # US-level annual base salary band in USD and relative headcount weight per job title.
    TITLES = {
      'Software Engineer' => [[95_000, 140_000], 14], 'Senior Software Engineer' => [[135_000, 185_000], 9],
      'Staff Engineer' => [[180_000, 240_000], 3], 'Engineering Manager' => [[170_000, 230_000], 3],
      'QA Engineer' => [[75_000, 110_000], 5], 'DevOps Engineer' => [[105_000, 155_000], 4],
      'Data Scientist' => [[115_000, 165_000], 3], 'Product Manager' => [[115_000, 160_000], 4],
      'Senior Product Manager' => [[150_000, 200_000], 2], 'Product Designer' => [[90_000, 135_000], 3],
      'UX Researcher' => [[85_000, 125_000], 2], 'Account Executive' => [[70_000, 120_000], 6],
      'Account Manager' => [[65_000, 100_000], 5], 'Sales Development Representative' => [[50_000, 70_000], 6],
      'Sales Manager' => [[120_000, 170_000], 2], 'Marketing Manager' => [[90_000, 140_000], 3],
      'Content Strategist' => [[60_000, 90_000], 2], 'Customer Support Specialist' => [[40_000, 60_000], 9],
      'Support Team Lead' => [[60_000, 85_000], 2], 'Financial Analyst' => [[70_000, 105_000], 3],
      'Accountant' => [[60_000, 90_000], 3], 'HR Business Partner' => [[75_000, 115_000], 2],
      'Recruiter' => [[55_000, 85_000], 3], 'Operations Manager' => [[80_000, 125_000], 3],
      'Legal Counsel' => [[140_000, 210_000], 1]
    }.freeze
    EMPLOYMENT_TYPES = { 'full_time' => 86, 'part_time' => 6, 'contractor' => 8 }.freeze
    # reason => [weight, min %, max %]
    RAISES = { 'annual_review' => [62, 3, 8], 'promotion' => [18, 10, 15], 'market_adjustment' => [15, 4, 10],
               'correction' => [5, 3, 5] }.freeze
    NOTES = { 'annual_review' => 'Annual review', 'promotion' => 'Promotion',
              'market_adjustment' => 'Market adjustment', 'correction' => 'Corrected after payroll audit' }.freeze

    def self.call(**) = new(**).call

    def initialize(count:, changed_by:, today: Date.current, reset: false)
      @count = count
      @changed_by = changed_by
      @today = today
      @reset = reset
    end

    # => number of employees inserted (0 when skipped because data already exists)
    def call
      reset! if @reset
      return 0 if Employee.exists?

      with_deterministic_random do
        (0...@count).each_slice(BATCH_SIZE) { |indexes| insert_batch(indexes) }
      end
      @count
    end

    private

    def reset!
      ActiveRecord::Base.connection.execute('TRUNCATE salary_revisions, employees RESTART IDENTITY')
      ActiveRecord::Base.connection.execute('ALTER SEQUENCE employee_code_seq RESTART WITH 1')
    end

    def with_deterministic_random
      @random = Random.new(SEED)
      previous = Faker::Config.random
      Faker::Config.random = Random.new(SEED)
      yield
    ensure
      Faker::Config.random = previous
    end

    # Bulk insert on purpose (speed): rows are generated within the validated domain rules, the DB check
    # constraints still apply, and attribute normalisation still runs. The seeder spec asserts validity.
    def insert_batch(indexes)
      people = indexes.map { |index| build_person(index) }
      now = Time.current
      ids = Employee.insert_all!(people.map { |person| employee_row(person, now) }, returning: %w[id email])
                    .rows.to_h { |id, email| [email, id] }
      revisions = people.flat_map { |person| revision_rows(person, ids.fetch(person[:email])) }
      SalaryRevision.insert_all!(revisions)
    end

    def build_person(index)
      country = Reference::Country.find(pick(COUNTRY_WEIGHTS))
      title = pick(TITLES.transform_values(&:last))
      first_name, last_name = name_for(country.code)
      hired_on = @today - @random.rand(3650)
      history = salary_history(starting_salary(title, country), hired_on, country.currency)

      { first_name:, last_name:, country:, title:, hired_on:, history:,
        email: "#{"#{first_name}.#{last_name}".parameterize(separator: '.')}.#{index + 1}@acme.test" }
    end

    def employee_row(person, now)
      { first_name: person[:first_name], last_name: person[:last_name], email: person[:email],
        job_title: person[:title], department: Reference::JobTitle.departments.fetch(person[:title]),
        country_code: person[:country].code, currency: person[:country].currency,
        salary: person[:history].last[:amount], employment_type: pick(EMPLOYMENT_TYPES),
        hired_on: person[:hired_on], created_at: now, updated_at: now }
    end

    def revision_rows(person, employee_id)
      person[:history].map do |change|
        change.merge(employee_id:, changed_by_id: @changed_by.id, currency: person[:country].currency,
                     created_at: change[:effective_on].to_time.change(hour: 12))
      end
    end

    def name_for(country_code)
      first_names, last_names = name_pools.fetch(country_code)
      [first_names.sample(random: @random), last_names.sample(random: @random)]
    end

    # Faker is slow per call for some locales, so draw a pool of names per country once and sample from it.
    def name_pools
      @name_pools ||= NAME_LOCALES.transform_values do |locale|
        Faker::Base.with_locale(locale) do
          [Array.new(NAME_POOL_SIZE) { Faker::Name.first_name.first(50) }.uniq,
           Array.new(NAME_POOL_SIZE) { Faker::Name.last_name.first(50) }.uniq]
        end
      end
    end

    # Band picked uniformly, scaled by country cost and ±10 % noise, converted to local currency.
    def starting_salary(title, country)
      (min, max), = TITLES.fetch(title)
      usd = @random.rand(min..max) * COST_FACTORS.fetch(country.code) * @random.rand(0.9..1.1)
      round_local(usd / Reference::Fx.rate(country.currency).to_f, country.currency)
    end

    def salary_history(start, hired_on, currency)
      history = [{ amount: start, previous_amount: nil, effective_on: hired_on, reason: 'hire', note: nil }]
      raise_dates(hired_on).each do |date|
        reason = pick(RAISES.transform_values(&:first))
        _, min, max = RAISES.fetch(reason)
        previous = history.last[:amount]
        amount = round_local(previous * (1 + (@random.rand(min..max) / 100.0)), currency, minimum: previous)
        history << { amount:, previous_amount: previous, effective_on: date, reason:, note: NOTES.fetch(reason) }
      end
      history
    end

    # 0-3 raises (more tenure, more chances) on distinct dates after the hire date, never in the future.
    def raise_dates(hired_on)
      tenure = (@today - hired_on).to_i
      possible = [tenure / 180, 3].min
      return [] if possible.zero?

      Array.new(@random.rand(0..possible)) { hired_on + 1 + @random.rand(tenure) }.uniq.sort
    end

    def round_local(amount, currency, minimum: 0)
      step = %w[INR JPY].include?(currency) ? 1_000 : 100
      [(amount / step).round * step, minimum + step].max.to_f.round(2)
    end

    def pick(weights)
      target = @random.rand(weights.values.sum)
      weights.each do |key, weight|
        return key if target < weight

        target -= weight
      end
    end
  end
end
