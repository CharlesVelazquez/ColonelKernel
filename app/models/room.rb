class Room < ApplicationRecord
  has_many :players
  has_many :things
end
