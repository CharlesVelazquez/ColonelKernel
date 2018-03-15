class CreatePlayers < ActiveRecord::Migration[5.1]
  def change
    create_table :players do |t|
      t.integer :style
      t.integer :room
      t.float :K_D
      t.belongs_to :user, index: true
      t.timestamps
    end
  end
end
