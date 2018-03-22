Rails.application.routes.draw do
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html

  # root path
  # root to: 'rooms#index'
  # root :to => "rooms#show", :id => '1'
  root 'rooms#find_room', {id: 1}
  
  # logging in, and logging out.
  get '/login' => 'sessions#new'
  post '/login' => 'sessions#create'
  get '/logout' => 'sessions#destroy'

  # sign up
  get '/signup' => 'users#new'
  post '/users' => 'users#create'

  # api commands

  get '/rooms_api_passive(/:id)', to: "rooms#show_api" # can get state without authentication
  # get '/rooms_api(/:id)', to: "rooms#show_api"

  post '/rooms_api(/:id)', to: "rooms#listen_for_players" #requires authentication
  # get '/rooms_api(/:id)', to: "rooms#listen_for_players"
  

  # rooms
  resources :rooms
  # get '/rooms', to: "rooms#index", :as => :rooms
  # get '/rooms(/:id)', to: "rooms#show" # :as creates rooms_path
  # post '/rooms', to: "rooms#create"
  
  # players
  resources :players
  
end
