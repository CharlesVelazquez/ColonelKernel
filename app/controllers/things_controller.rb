class ThingsController < ApplicationController

  def new
  end

  def create
  end




private

  def thing_params
    params.require(:thing).permit(:identity, :game_x, :game_y, :strength, :ms_delay, :map_id, :player_id)
    # these are fields necessary to create a thing
  end

end
