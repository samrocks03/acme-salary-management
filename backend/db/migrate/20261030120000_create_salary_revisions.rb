# frozen_string_literal: true

# Append-only salary history (domain rule 3): no updated_at, corrections are new rows.
class CreateSalaryRevisions < ActiveRecord::Migration[8.1]
  def change
    create_table :salary_revisions do |t|
      t.references :employee, null: false, index: false, foreign_key: { on_delete: :cascade }
      t.references :changed_by, null: false, foreign_key: { to_table: :users }
      t.decimal :amount, null: false, precision: 14, scale: 2
      t.decimal :previous_amount, precision: 14, scale: 2
      t.string :currency, null: false, limit: 3
      t.date :effective_on, null: false
      t.string :reason, null: false
      t.text :note

      t.datetime :created_at, null: false
    end

    add_index :salary_revisions, %i[employee_id effective_on id], order: { effective_on: :desc, id: :desc },
                                                                  name: 'index_salary_revisions_on_employee_latest'
    add_index :salary_revisions, :effective_on

    add_check_constraint :salary_revisions, 'amount > 0 AND amount <= 100000000', name: 'salary_revisions_amount_range'
    add_check_constraint :salary_revisions, 'previous_amount IS NULL OR previous_amount > 0',
                         name: 'salary_revisions_previous_amount_positive'
    add_check_constraint :salary_revisions,
                         "reason IN ('hire', 'promotion', 'annual_review', 'market_adjustment', 'correction', 'other')",
                         name: 'salary_revisions_reason_check'
    add_check_constraint :salary_revisions, 'note IS NULL OR char_length(note) <= 500',
                         name: 'salary_revisions_note_length'
  end
end
