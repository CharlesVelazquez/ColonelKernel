class RoomsController < ApplicationController
  def index
    render :json => Room.all
  end

  def show
    render :json => Room.first(params[:id]).players
  end

  def show_api
    # render :json => Room.all.first.players
    this_room = Room.find_by_id(params[:id])
      if this_room
        render :json =>  this_room.players

      else
        render :json =>  nil
      end
    #binding.pry
  end

  def new
  end

  def create
  end

  def update
  end

  def destroy
  end

  private
  def room_params
    params.require(:room).permit(:capacity, :player_id, :user_id)
  end

end
