class Thing < ApplicationRecord
  belongs_to :room
  belongs_to :player, optional: true
end
