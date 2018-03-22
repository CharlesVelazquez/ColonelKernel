class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  # https://rorsecurity.info/portfolio/cross-site-request-forgery-and-rails
  # protect_from_forgery with: :null_session
  protect_from_forgery with: :exception

  # this lets you use current_user everywhere
  def current_user
    # has to be public with @ so accessible everywhere
    # checks if current user is already defined before using database
    #using find_by_id instead of find to avoid errors
    @current_user ||= User.find_by_id(session[:user_id]) if session[:user_id]
  end
  helper_method :current_user

  def authorize
    redirect_to '/login' unless current_user
  end

  # def pop_action
  #   # has to be public with @ so accessible everywhere
  #   # checks if current user is already defined before using database
  #   #using find_by_id instead of find to avoid errors
  #   @current_user ||= User.find_by_id(session[:user_id]) if session[:user_id]
  # end
  # helper_method :pop_action

private

  # game logic needs to go into a async loop (won't have perssistence)
  # OR
  # delayed per user events via db https://github.com/collectiveidea/delayed_job
  # placing a kernel, can create kernel and add a delayed event that pops it later

end
