class CreateRooms < ActiveRecord::Migration[5.1]
  def change
    create_table :rooms do |t|
      t.integer :capacity
      t.belongs_to :player, index: true
    end
  end
end
