class PlayersController < ApplicationController

  def create

    player_params[:game_x] = 0.5;
    player_params[:game_y] = 0.5;
    player_params[:lives] = 1;
    player_params[:user_id] = current_user.id;
    player_params[:room_id] = nil;

    new_player = Player.new(player_params)

    if new_player.save
      # creates a session
      puts "********** saved new player ***********"
      redirect_to '/'
    else
      # otherwise sends back
      # redirect_to '/signup'
      puts "********** failed to create player ***********"
      redirect_to '/'
    end

  end




private

  def player_params
    params.require(:player).permit(:game_x, :game_y, :lives, :user_id, :room_id)
    # these are fields necessary to create a player
  end

end
