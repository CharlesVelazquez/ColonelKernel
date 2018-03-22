# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20180322062404) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "delayed_jobs", force: :cascade do |t|
    t.integer "priority", default: 0, null: false
    t.integer "attempts", default: 0, null: false
    t.text "handler", null: false
    t.text "last_error"
    t.datetime "run_at"
    t.datetime "locked_at"
    t.datetime "failed_at"
    t.string "locked_by"
    t.string "queue"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.index ["priority", "run_at"], name: "delayed_jobs_priority"
  end

  create_table "players", force: :cascade do |t|
    t.float "game_x"
    t.float "game_y"
    t.integer "lives"
    t.integer "popped"
    t.integer "nonce"
    t.string "color"
    t.integer "user_id"
    t.integer "room_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["room_id"], name: "index_players_on_room_id"
    t.index ["user_id"], name: "index_players_on_user_id", unique: true
  end

  create_table "rooms", force: :cascade do |t|
    t.integer "capacity"
    t.integer "map", array: true
    t.integer "map_max_x"
    t.integer "map_max_y"
    t.boolean "active_round"
    t.datetime "round_start_time"
    t.integer "round_seconds"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "things", force: :cascade do |t|
    t.integer "identity"
    t.float "game_x"
    t.float "game_y"
    t.integer "strength"
    t.integer "ms_delay"
    t.integer "room_id"
    t.integer "player_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["player_id"], name: "index_things_on_player_id"
    t.index ["room_id"], name: "index_things_on_room_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "name"
    t.string "password_digest"
    t.integer "kills"
    t.integer "deaths"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

end
