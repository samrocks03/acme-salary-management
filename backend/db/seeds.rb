# frozen_string_literal: true

# bin/rails db:seed
#   SEED_EMPLOYEES=500  fewer employees (default 10,000)
#   SEED_RESET=1        wipe employees + history and re-seed (otherwise skipped when employees exist)
started = Process.clock_gettime(Process::CLOCK_MONOTONIC)

hr_manager, = Seeds::UserSeeder.call
count = Seeds::EmployeeSeeder.call(
  count: Integer(ENV.fetch('SEED_EMPLOYEES', 10_000)),
  changed_by: hr_manager,
  reset: ENV['SEED_RESET'] == '1'
)

elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started
if count.zero?
  puts 'Employees already present - skipped (SEED_RESET=1 to re-seed).'
else
  puts format('Seeded %<employees>d employees, %<revisions>d salary revisions and %<users>d users in %<secs>.1fs',
              employees: Employee.count, revisions: SalaryRevision.count, users: User.count, secs: elapsed)
end
