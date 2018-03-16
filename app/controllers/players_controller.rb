class PlayersController < ApplicationController
  def index
  end

  def show
  end

  def new
    @player = Player.new
  end

  def create
    user = User.find(params[:id])
    @player = Player.new(player_params)
    @player.user_id = user.id
    if @player.save
      redirect_to root_url
    else
      render 'new'
    end
  end

  def edit
  end

  def update
  end

  def destroy
  end

  private
  def player_params
    params.require(:player).permit(:style, :user_id)
  end
end
