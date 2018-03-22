class CreatePlayers < ActiveRecord::Migration[5.1]
  def change
    create_table :players do |t|
      t.float :game_x
      t.float :game_y
      t.integer :lives
      t.integer :popped
      t.integer :nonce

      # last time mine set (so can't spam)

      # need style later for persistent color
      t.string :color
      t.integer :user_id
      t.integer :room_id
      
      t.index :user_id, unique: true # look up table by users id for speed
      t.index :room_id  # look up table by rooms id for speed

      t.timestamps
    end
  end
end
