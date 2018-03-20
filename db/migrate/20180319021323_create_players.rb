class CreatePlayers < ActiveRecord::Migration[5.1]
  def change
    create_table :players do |t|
      t.float :game_x
      t.float :game_y
      t.integer :lives
      # last time mine set (so can't spam)

      # need style later for persistent color


      t.integer :user_id
      t.integer :room_id
      
      t.timestamps
    end
  end
end
