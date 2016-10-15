# ![logo](http://fingerboss.com/favicon-32x32.png) [fingerboss](http://www.fingerboss.com)

Webserver for the [fingerboss game](http://fingerboss.com).

You need [Node.js](http://nodejs.org) to run it.

# License
[Attribution-NonCommercial-ShareAlike 4.0 International](http://creativecommons.org/licenses/by-nc-sa/4.0/)

You can't use the favicon. I bought it at [iconfinder](http://iconfinder.com).

## You are free to
- *Share* copy and redistribute the material in any medium or format. 
- *Adapt* — remix, transform, and build upon the material. 

## The licensor cannot revoke these freedoms as long as you follow the license terms.
- *Attribution* — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
- *NonCommercial* — You may not use the material for commercial purposes.
- *ShareAlike* — If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.

# About
This is my second game ever. I made it because I teach kids programming as a volunteer at
[coding pirates](http://codingpirates.dk/).
The kids really want to make games, it's a great way to learn programming. So I made this game to try it myself, so
I can be better at teaching them.

# Principals of the game
- There should be no need for any text in the game (Damn I have added some help)
- There is very little build in chance, the game is designed to be as equal as possible, it's about skill not luck
- The game can resize to any screen size and any phone orientation

# The game

## Joining
- 1 player play against the computer
- 2+ players, play against each other and the computer
- No matter what, the game just starts as soon as it's loaded

## Ideas
- A ball and two goals
- Kick the ball when head of snake hits it
- A map in the corner of the playing field
- Eat things (mice) to get bigger/faster/power kick

- Zoom (phone is too small)
- Joystick at bottom(portrait) left(landscape) on touch devices

Avoiding lag
- Each player is master of it's own snake
- sends dx/dy to server, that broadcasts to others
- updates own dx/dy after 2*lag (to even playing chances and make player views similar)
- counter on dx/dy
	- if server is missing dx/dy (see it on counter) asks player for it's snake and sends snake to all players
	- if player is missing dx/dy (see it on counter) asks server for snake, server sends it's copy of snake
- player sends to server when eating mouse and when dying


## Winning
- When time is up, the team with the most goals wins.
