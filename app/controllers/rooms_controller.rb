class RoomsController < ApplicationController
   # forces to log in before accessing rooms
  before_action :authorize, :except => [:show_api]
  # before_action :authorize, :except => [:listen_for_players]

  # uncomment to ignore csrf token authentication
  # protect_from_forgery :except => [:show_api]
  # protect_from_forgery :except => [:show_api]

  def index
  end

  def create
    # when creating room, makes sense to create map for everyone to use

    # create a room

    defaultmap = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ]

    mapX = 11;
    mapY = 11;

    # p defaultmap;

    Room.create(
      capacity: 10,
      map: defaultmap,
      map_max_x: 11,
      map_max_y: 11,
      active_round: true,
      round_start_time: DateTime.now,
      round_seconds: 300
    )

    lastRoom = Room.all.last.id

    

    redirect_to room_path(lastRoom)

  end

  def show
    # this is the main location where the game is rendered and played

    @page_room = Room.find_by_id(params[:id]); # accessible on rooms/show.html.erb

    if @page_room
      puts "page found"

      current_user.player.update_attribute(:popped, 0) # set player to this 
      current_user.player.update_attribute(:lives, 1) # set player to this 
      current_user.player.update_attribute(:room_id, params[:id]) # set player to this 
      current_user.player.touch # set player to this new room

    else
      redirect_to rooms_path
    end

  end

  # room data for everyone to get (initially, before they can send)
  def show_api
    # render :json => Room.all.first.players
    this_room = Room.find_by_id(params[:id])
    
    # sleep 1 # simulating lag


    if this_room
      puts "********** api for room #{this_room.id} running! **********"
      render :json =>  {
          'player_info': this_room.players.all,
          'map_info': this_room,
          'things': this_room.things.all
        }

      
    else
      puts "********** room not found *********"
      render :json =>  nil
      
      
    end

  end

  # receiving new data from players
  def listen_for_players


    # sleep 1 # simulating lag **** DISABLE FOR REAL USE!!!!!!!!!!! ****


    # received data processed here after authentication   

    # update logged in user's player location
      # check if players move makes sense here (to do)
    current_player = current_user.player

    current_player.update_attribute(:game_x, params[:X])
    current_player.update_attribute(:game_y, params[:Y])
    current_player.touch # makes sure updated_at is updated

    # place a popcorn (if makes sense with timer and location)


    received_actions = params[:game_actions] # array of actions from json received
    
    if (received_actions) # if actions received
      received_actions.each do |ea_action|
        # for popcorn, strength of popcorn = number of others popped + 3
        # location is always middle of cell of current player

        # thing.id is the nonce for js to know they already have it drawn
        newPopcorn = Thing.new(
          identity: ea_action[:type].to_i,
          game_x: current_player.game_x.floor + 0.5,
          game_y: current_player.game_y.floor + 0.5,
          strength: current_player.popped + 3,
          ms_delay: 3000,
          room_id: current_player.room_id,
          player_id: current_player.id
        )
        newPopcorn.save!

        # now that the thing is made, we create timedelayed event for it to do
        # 1. action (e.g. reduce life of those around them)
        # 2. destroy itself so we keep database thin

        

      end
      

    end

    # act on and remove timed out things
    timeout = 60 # seconds
    this_room = Room.find_by_id(params[:id]) # room object
    stored_players = this_room.players.all # array of stored players for this room
    
    # create a quick array for map
    this_map_basic = this_room.map
    this_map_max_x = this_room.map_max_x
    this_map_max_y = this_room.map_max_y
    # this matrix will have positions of walls
    this_map = Array.new(this_map_max_y){Array.new(this_map_max_x)}
    # this matrix will have positions of players
    player_map = Array.new(this_map_max_y){Array.new(this_map_max_x, [])}

    # puts "0*********************************"
    # p player_map

    (0..this_map_max_x-1).each do |x|
      (0..this_map_max_y-1).each do |y|
        this_map[x][y] = this_map_basic[y * this_map_max_x + x]
      end
    end

    # puts "1 player_map *********************************"
    # p player_map

    # puts "this_room.players *********************************"
    # p this_room.players

    # puts "this_room.players.all *********************************"
    # p this_room.players.all

    # remove timed out players    

    stored_players.each do |ea_player|
      # puts ea_player.id.to_s + ': ' + (Time.now.utc - ea_player.updated_at.utc).to_s
      if (Time.now.utc - ea_player.updated_at.utc) > timeout
        player_to_time_out = Player.find_by_id(ea_player.id).update_attribute(:room_id, nil)
      else
        # if players still around, help with the map
        player_x_square = ea_player.game_x.floor.to_i
        player_y_square = ea_player.game_y.floor.to_i
        player_map[player_x_square][player_y_square].push(ea_player.id);

        # puts "player_x_square *********************************"
        # p player_x_square
        # p player_y_square
        # p player_map

        # this forms a 2d map with array of player id's at each square
      end

    end    

    # p this_map

    # grab array of the room's things
    current_things = this_room.things.all

    # search array for timed out stuff
    # if found act and destroy
    current_things.each do |ea_thing|
      if (Time.now.utc - ea_thing.created_at.utc) > (ea_thing.ms_delay / 1000)
        
        
        # calculate squares affected
        # act on players
        thing_x = ea_thing.game_x.floor.to_i
        thing_y = ea_thing.game_y.floor.to_i

        # puts "1*********************************"
        # p player_map

        # (to do) all this needs to be moved out

        # left check
        search_range = ea_thing.strength
        search_x = thing_x
        search_y = thing_y
        loop do
          break if (search_range < 0)                   # exhaustion of range
          break if (search_x < 0)                       # out of bounds
          break if (this_map[search_x, search_y] == 1)  # hard wall
          # if players found, remove, add popped points to owner
          this_square = player_map[search_x][search_y]
          if this_square
            this_square.each do |ea_square_player_id|
              Player.find_by_id(ea_square_player_id).update_attribute(:lives, 0)
            end
          end
          # update for next loop
          search_x = search_x - 1
          search_y = search_y
          search_range = ea_thing.strength - 1
        end

        # puts "2*********************************"
        # p player_map

        # right check
        search_range = ea_thing.strength
        search_x = thing_x
        search_y = thing_y
        loop do
          break if (search_range < 0)                   # exhaustion of range
          break if (search_x >= this_map_max_x)                       # out of bounds
          break if (this_map[search_x, search_y] == 1)  # hard wall
          # if players found, remove, add popped points to owner
          this_square = player_map[search_x][search_y]
          if this_square
            this_square.each do |ea_square_player_id|
              Player.find_by_id(ea_square_player_id).update_attribute(:lives, 0)
            end
          end
          # update for next loop
          search_x = search_x + 1
          search_y = search_y
          search_range = ea_thing.strength - 1
        end

        # puts "3*********************************"
        # p player_map


        # up check
        search_range = ea_thing.strength
        search_x = thing_x
        search_y = thing_y

        # puts "4*********************************"
        # p player_map

        loop do
          break if (search_range < 0)                   # exhaustion of range
          break if (search_y < 0)                       # out of bounds
          break if (this_map[search_x, search_y] == 1)  # hard wall
          # if players found, remove, add popped points to owner
          this_square = player_map[search_x][search_y]
          if this_square
            this_square.each do |ea_square_player_id|
              Player.find_by_id(ea_square_player_id).update_attribute(:lives, 0)
            end
          end
          # update for next loop
          search_x = search_x
          search_y = search_y - 1
          search_range = ea_thing.strength - 1
        end

        # down check
        search_range = ea_thing.strength
        search_x = thing_x
        search_y = thing_y
        
        loop do
          break if (search_range < 0)                   # exhaustion of range
          break if (search_y >= this_map_max_y)                       # out of bounds
          break if (this_map[search_x, search_y] == 1)  # hard wall
          # if players found, remove, add popped points to owner
          this_square = player_map[search_x][search_y]
          if this_square
            this_square.each do |ea_square_player_id|
              Player.find_by_id(ea_square_player_id).update_attribute(:lives, 0)
            end
          end
          # update for next loop
          search_x = search_x
          search_y = search_y + 1
          search_range = ea_thing.strength - 1
        end



        Thing.find_by_id(ea_thing.id).destroy()
      end

    end



    # response below

    render :json =>  {
      'player_info': stored_players,
      'map_info': this_room,
      'things': current_things
    }

  end

  def find_room
    # just to make sure url in brower is actually updated
    if (params[:id])
      # redirect_to room_path(params[:id])
      redirect_to rooms_path
    end

  end


private

  def room_params
    params.require(:room).permit(:capacity, :map, :map_max_x, :map_max_y, :active_round, :round_start_time, :round_seconds)
  end

end
