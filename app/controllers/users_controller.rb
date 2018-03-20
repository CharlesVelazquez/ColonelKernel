class UsersController < ApplicationController

  def new
  end

  def index
  end


  def create
    #creates a user

    new_user = User.new(user_params)
    if new_user.save
      # creates a session
      session[:user_id] = new_user.id

      # redirect_to :controller => 'players', :action => 'create', :method => 'post'
      # player_params[:game_x] = 0.5;
      # player_params[:game_y] = 0.5;
      # player_params[:lives] = 1;
      # player_params[:user_id] = current_user.id;
      # player_params[:room_id] = nil;
      

      new_player = Player.new(game_x: 0.5, game_y: 0.5, lives: 1, user_id: new_user.id, room_id: nil)
      # room must exist according to exception thrown, optional true added to model
      new_player.save!

      # sends to root
      redirect_to '/'
    else
      # otherwise sends back
      redirect_to '/signup'
    end
  end  

private
  def user_params
    params.require(:user).permit(:name, :password, :password_confirmation)
    # these are fields necessary to create a user
  end


end
