class RoomsController < ApplicationController
   # forces to log in before accessing rooms
  before_action :authorize, :except => [:show_api]
  # before_action :authorize, :except => [:listen_for_players]

  # uncomment to ignore csrf token authentication
  protect_from_forgery :except => [:show_api]

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

    Room.create(capacity: 10, map: defaultmap, map_max_x: 11, map_max_y: 11, active_round: true, round_start_time: DateTime.now, round_seconds: 300)

    lastRoom = Room.all.last.id

    

    redirect_to room_path(lastRoom)

  end

  def show
    # this is the main location where the game is rendered and played

    @page_room = Room.find_by_id(params[:id]); # accessible on rooms/show.html.erb

    if @page_room
      puts "page found"

      current_user.player.update_attribute(:room_id, params[:id]) # set player to this new room

    else
      redirect_to rooms_path
    end

  end

  def show_api
    # render :json => Room.all.first.players
    this_room = Room.find_by_id(params[:id])
      
      if this_room
        puts "********** api for room #{this_room.id} running! **********"
        render :json =>  {
            'player_info': this_room.players.all,
            'map_info': this_room
          }

        
      else
        puts "********** room not found *********"
        render :json =>  nil
        
        
      end

  end

  def listen_for_players
    # http://guides.rubyonrails.org/security.html#cross-site-request-forgery-csrf
    
    # p request.body.read()
    # puts "******** parameters received *******"
    # p params
    # puts 'current user is ' + current_user.id.to_s

    # update logged in user's player location
    current_user.player.update_attribute(:game_x, params[:X])
    current_user.player.update_attribute(:game_y, params[:Y])

    # puts "******** /parameters received ******"k
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
