class CreateRooms < ActiveRecord::Migration[5.1]
  def change
    create_table :rooms do |t|
      t.integer :capacity                       # max players per room
      t.integer :map, :array => true            # map array
      t.integer :map_max_x                      # num of tiles in X
      t.integer :map_max_y                      # num of tiles in Y
      t.boolean :active_round                   # is game round happening now
      t.timestamp :round_start_time             # when round started
      t.integer :round_seconds                  # how long each round should be

      t.timestamps
    end
  end
end
