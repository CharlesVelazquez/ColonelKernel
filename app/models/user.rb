class User < ApplicationRecord
  has_one :player
  
  has_secure_password

end
