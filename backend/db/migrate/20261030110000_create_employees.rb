# frozen_string_literal: true

class CreateEmployees < ActiveRecord::Migration[8.1]
  def change
    enable_extension 'pg_trgm'

    reversible do |dir|
      dir.up { execute 'CREATE SEQUENCE employee_code_seq' }
      dir.down { execute 'DROP SEQUENCE employee_code_seq' }
    end

    create_table :employees do |t|
      t.string :employee_code, null: false,
                               default: -> { "('EMP-' || lpad(nextval('employee_code_seq')::text, 6, '0'))" }
      t.string :first_name, null: false
      t.string :last_name, null: false
      t.virtual :full_name, type: :string, as: "first_name || ' ' || last_name", stored: true
      t.string :email, null: false
      t.string :job_title, null: false
      t.string :department, null: false
      t.string :country_code, null: false, limit: 2
      t.string :currency, null: false, limit: 3
      # Denormalised copy of the latest salary revision (domain rule 2).
      t.decimal :salary, null: false, precision: 14, scale: 2
      t.string :employment_type, null: false, default: 'full_time'
      t.date :hired_on, null: false

      t.timestamps
    end

    add_index :employees, :employee_code, unique: true
    add_index :employees, :email, unique: true
    add_index :employees, %i[country_code job_title]
    add_index :employees, :department
    add_index :employees, :salary
    add_index :employees, :hired_on
    add_index :employees, :full_name, using: :gin, opclass: :gin_trgm_ops, name: 'index_employees_on_full_name_trgm'
    add_index :employees, :email, using: :gin, opclass: :gin_trgm_ops, name: 'index_employees_on_email_trgm'

    add_check_constraint :employees, 'salary > 0 AND salary <= 100000000', name: 'employees_salary_range'
    add_check_constraint :employees, 'char_length(first_name) BETWEEN 1 AND 50', name: 'employees_first_name_length'
    add_check_constraint :employees, 'char_length(last_name) BETWEEN 1 AND 50', name: 'employees_last_name_length'
    add_check_constraint :employees, 'char_length(email) <= 255', name: 'employees_email_length'
    add_check_constraint :employees, 'char_length(job_title) BETWEEN 2 AND 100', name: 'employees_job_title_length'
    add_check_constraint :employees, "country_code ~ '^[A-Z]{2}$'", name: 'employees_country_code_format'
    add_check_constraint :employees, "currency ~ '^[A-Z]{3}$'", name: 'employees_currency_format'
    add_check_constraint :employees, "employment_type IN ('full_time', 'part_time', 'contractor')",
                         name: 'employees_employment_type_check'
  end
end
