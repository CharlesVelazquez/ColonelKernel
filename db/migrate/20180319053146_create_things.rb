class CreateThings < ActiveRecord::Migration[5.1]
  def change
    create_table :things do |t|
      t.integer :identity             # what this thing is
                                        # 1 - popcorn kernel placed


      t.float :game_x                 # x,y coordinates in map units
      t.float :game_y

      t.integer :strength             # e.g. range

      t.integer :ms_delay             # if there's a delay, how long it is
        # popcorn kernel has a delayed event that damages players



      t.integer :room_id               # which room this thing is in
      t.integer :player_id            # which player placed it if any

      t.index :room_id                 # look up table by map id for speed
      t.index :player_id              # look up table by player id for speed

      t.timestamps
    end
  end
end
