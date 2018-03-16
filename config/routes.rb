Rails.application.routes.draw do

	get '/rooms_api(/:id)', to: "rooms#show_api"

  resources :users
  resources :players
  resources :rooms
	# resources :account_activations, only: [:edit] (*Emails not ready yet*)
	# resources :password_resets,     only: [:new, :create, :edit, :update] (*Emails not ready yet*)

	root 'users#index'
end
