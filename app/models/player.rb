class Player < ApplicationRecord
  # exists to reduce amount of data to be stored in user
  # to separate game entity from login and stats authentication
  
  belongs_to :user
  belongs_to :room, optional: true # optional makes it not required to have a room

end
