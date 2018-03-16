class CreatePlayers < ActiveRecord::Migration[5.1]
  def change
    create_table :players do |t|
      t.float :x_location
      t.float :y_location
      t.integer :room_id
      t.integer :user_id
      t.timestamps
    end
  end
end
