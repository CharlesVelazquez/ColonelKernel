class SessionsController < ApplicationController

  def new
  end

  def create
    user = User.find_by_name(params[:name])

    # If the user exists AND the password entered is correct.
    if user && user.authenticate(params[:password])

      # Save the user id inside the browser cookie. This is how we keep the user 
      # logged in when they navigate around our website.
      session[:user_id] = user.id

      # trying to get authenticity token to work for api
      # response.headers['X-CSRF-Token'] = form_authenticity_token

      redirect_to '/'
    else

    # If user's login doesn't work, send them back to the login form.
      redirect_to '/login'
    end
  end

  def destroy
    # destroys the session
    # session[:user_id] = nil
    session.delete(:user_id) # this is better bc doesn't leave key around

    # sends back to login screen
    redirect_to '/login'
  end
  
end
