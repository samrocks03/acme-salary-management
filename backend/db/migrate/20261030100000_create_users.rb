# frozen_string_literal: true

class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      ## Database authenticatable
      t.string :email, null: false
      t.string :encrypted_password, null: false

      t.string :name, null: false
      t.string :role, null: false, default: 'viewer'

      ## Trackable
      t.integer  :sign_in_count, default: 0, null: false
      t.datetime :current_sign_in_at
      t.datetime :last_sign_in_at
      t.string   :current_sign_in_ip
      t.string   :last_sign_in_ip

      ## Lockable (unlock strategy :time, so no unlock_token)
      t.integer  :failed_attempts, default: 0, null: false
      t.datetime :locked_at

      t.timestamps
    end

    add_index :users, :email, unique: true
    add_check_constraint :users, "role IN ('hr_manager', 'viewer')", name: 'users_role_check'
  end
end
