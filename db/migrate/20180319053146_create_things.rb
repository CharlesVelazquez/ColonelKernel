class CreateThings < ActiveRecord::Migration[5.1]
  def change
    create_table :things do |t|
      t.integer :identity             # what this thing is
        # 1 - popcorn kernel placed
      t.integer :ms_delay             # if there's a delay, how long it is
        # popcorn kernel has a delayed event that damages players



      t.integer :map_id               # which map this thing is on
      t.integer :player_id            # which player placed it if any

      t.timestamps
    end
  end
end
