Rails.application.routes.draw do
  get 'rooms/index'

  get 'rooms/show'

  get 'rooms/new'

  get 'rooms/create'

  get 'rooms/update'

  get 'rooms/destroy'

  get 'players/index'

  get 'players/show'

  get 'players/new'

  get 'players/create'

  get 'players/edit'

  get 'players/update'

  get 'players/destroy'

	resources :users
	# resources :account_activations, only: [:edit] (*Emails not ready yet*)
	# resources :password_resets,     only: [:new, :create, :edit, :update] (*Emails not ready yet*)

	root 'users#index'
end
