# Shell Game

A single‐player shell game built with OpenAI o1 model utilizing Node.js, React (frontend) and Express + Redis (backend).

Demo availble [here](https://shell-game-88b6a1a8adfc.herokuapp.com)

## Game Concept

- You have **3 spheres** and **1 ball**.  
- The ball is placed under one of the spheres at random.  
- The player must guess which spheres hides the ball.  
- A correct guess is a **win**, an incorrect guess is a **loss**.  
- After each round, you can play again.

## Features

- **Multi‐Player**: 3 players are required to sign up/sign in to start game 
- **Lightweight Database**: Uses [redis](https://github.com/redis/ioredis) to record results on the backend.  
- **Fun Sound Effects**: Background music and correct/wrong guess sounds (you can add your own `.mp3` files).  

## Installation & Configuration

1. **Clone** or copy this repository to your local machine.
2. **Install server dependencies**:
   ```bash
   cd shell-game
   npm install
   npm run install-client

## Run Game

Run the app  (game should be opened on your browser at http://localhost:3000)

  ```bash
npm start
