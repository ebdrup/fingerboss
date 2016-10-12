require("nodeversioncheck");
const express = require('express');
const compression = require('compression');
const path = require('path');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const staticFiles = require('./staticFiles');
const Snake = require('./js/snake');
const lineIntersect = require('./lineIntersect');
global.distance = require('./js/distance');
const Tweeno = require('tweeno');

app.disable('x-powered-by');
app.set('case sensitive routing', false);
app.use(compression());
app.use(express.static(path.join(__dirname, 'favicon')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'js')));
staticFiles.forEach(p => app.get(path.basename(p).toLowerCase(), (req, res) => res.sendFile(p)));

var port = process.env.PORT || 7890;
var colors = [
	0x5856d6,
	//0xff2d55,
	//0x4cd964,
	//0x007aff, //too close in colour
	0xff3b30,
	0x5ac8fa,
	0xffcc00,
	0x34aadc
];
var colorIndex = Math.floor(Math.random() * colors.length);
var socketLastSeen = {};
var TIMEOUT = 20 * 1000;
const VELOCITY = 0.0001;

var games = [];
var miceTypes = ['speed', 'power'];

class Game {
	constructor(socket) {
		this.sockets = [socket];
		this.mice = [];
		this.colorIndex = 0;
		this.colors = [colors[(colorIndex++) % colors.length], colors[(colorIndex++) % colors.length]];
		socket.color = this.colors[(this.colorIndex++) % this.colors.length];
		this.snakes = {};
		this.snakes[socket.id] = new Snake({
			id: socket.id,
			length: 30,
			color: socket.color,
			velocity: VELOCITY
		});
		socket.game = this;
		for (var i = 0; i < 10; i++) {
			this.addMouse();
		}
		this.resetBall();
		this.goals = this.colors.map((color, i) => ({
				color,
				size: 0.06,
				type: 'goal',
				x: {'0': 0.1, '1': 0.9}[i],
				y: {'0': 0.1, '1': 0.9}[i]
			})
		);
		this.scores = this.colors.reduce((acc, color) => {
			acc[color] = 0;
			return acc;
		}, {});
		this.lastMove = this.colors.reduce((acc, color) => {
			acc[color] = 0;
			return acc;
		}, {})
	}

	resetBall() {
		this.ball = {x: 0.5, y: 0.5, size: 0.04};
		delete this.tween;
	}

	addMouse() {
		var x = Math.random();
		var y = Math.random();
		this.mice.push({
			x,
			y,
			size: 0.02,
			type: miceTypes[Math.floor(Math.random() * (miceTypes.length))]
		})
	}

	addSnake(socket) {
		this.sockets.push(socket);
		socket.color = this.colors.sort((c1, c2) => this.lastMove[c1] - this.lastMove[c2])[0];
		this.snakes[socket.id] = new Snake({
			id: socket.id,
			length: 30,
			color: socket.color,
			velocity: VELOCITY
		});
		socket.game = this;
	}

	removeSnake(socket) {
		this.sockets.push(socket);
		socket.color = this.colors[(this.colorIndex + 1) % this.colors.length];
		this.snakes[socket.id] = new Snake({
			id: socket.id,
			length: 30,
			color: socket.color,
			velocity: VELOCITY
		});
		socket.game = this;
	}

	getState() {
		return {
			snakes: Object.keys(this.snakes).map(id => this.snakes[id].serialize()),
			mice: this.mice,
			ball: this.ball,
			goals: this.goals,
			scores: this.scores
		}
	}

	snakeCollision(movement, now) {
		var snake = this.snakes[movement.id];
		return Object.keys(this.snakes)
			.filter(key => snake.color !== this.snakes[key].color)
			.some(key => {
				let snake = this.snakes[key];
				let parts = snake.getParts(now);
				for (var i = 1; i < parts.length; i++) {
					if (lineIntersect(Object.assign({}, movement, {
							x3: parts[i - 1].x,
							y3: parts[i - 1].y,
							x4: parts[i].x,
							y4: parts[i].y,
						}))) {
						return true;
					}
				}
				return false;
			});
	}

	mouseCollision(snake, now) {
		for (var j = 0; j < this.mice.length; j++) {
			var mouse = this.mice[j];
			if (snake.headCollision(mouse)) {
				this.mice.splice(j, 1);
				this.addMouse();
				return mouse;
			}
		}
		return null;
	}

	ballKick(snake) {
		var part = snake.headCollision(this.ball);
		if (!part) {
			return false;
		}
		var kickDistance = 4;
		if(snake.power){
			snake.power--;
			kickDistance *= 4;
		}
		var dx = this.ball.x - part.x;
		var dy = this.ball.y - part.y;
		var x = this.ball.x + (kickDistance + Math.random()) * dx;
		var y = this.ball.y + (kickDistance + Math.random()) * dy;
		this.tween = new Tweeno.Tween({x: this.ball.x, y: this.ball.y}, {
			to: {x, y},
			duration: 1000,
			easing: Tweeno.Easing.Cubic.Out,
			onUpdate: target => {
				var x = Math.abs(target.x);
				if (x > 1) {
					x = 1 - (x - 1);
				}
				this.ball.x = x;
				var y = Math.abs(target.y);
				if (y > 1) {
					y = 1 - (y - 1);
				}
				this.ball.y = y;
				this.onBallUpdate && this.onBallUpdate();
			},
			onComplete: () => delete this.tween
		});
		this.tween.start();
		return true;
	}

	goal() {
		var goal = this.goals.filter(goal => {
			var d = distance(goal, this.ball);
			return d < (goal.size + this.ball.size) / 2;
		})[0];
		if (!goal) {
			return false;
		}
		var score = goal.color;
		this.scores[score]++;
		this.resetBall();
		var winner = Object.keys(this.scores).filter(color => this.scores[color] >= 10)[0];
		if (winner) {
			winner = parseInt(winner, 10);
			this.colors.forEach(color => this.scores[color] = 0);
		}
		return {score, winner};
	}
}

setInterval(()=>games.forEach(game => game.tween && game.tween.update(Date.now())), 10);

io.on('connection', function (socket) {
	socketLastSeen[socket.id] = Date.now();
	if (!games.length) {
		games.push(new Game(socket));
	} else {
		games[0].addSnake(socket);
	}
	var game = socket.game;
	var snakes = socket.game.snakes;
	var color = socket.color;
	emit(socket, 'start', {
		t: Date.now(),
		id: socket.id,
		color
	});
	broadcast('state', game.getState());
	game.onBallUpdate = () => {
		var score = game.goal();
		if (!score) {
			return broadcast('ball', game.ball);
		}
		broadcast('state', Object.assign({}, game.getState(), score));
	};
	socket.on('move', function (angle) {
		if (typeof angle !== 'number' || isNaN(angle)) {
			return;
		}
		var state;
		var now = Date.now();
		game.lastMove[color] = now;
		socketLastSeen[socket.id] = now;
		var lastMove = socket.lastMove || now;
		socket.lastMove = now;
		if (socket.lastDeath && now - socket.lastDeath < 2000) {
			return;
		}
		var dt = now - lastMove;
		if (dt <= 0) {
			return;
		}
		var snake = snakes[socket.id];
		var velocity = snake.velocity;
		var dx = dt * velocity * Math.cos(angle);
		var dy = dt * velocity * Math.sin(angle);
		var move = socket.game.snakes[socket.id].getMaxMove({dx, dy});
		var movement = socket.game.snakes[socket.id].move(move);
		if (socket.game.snakeCollision(movement, now)) {
			socket.game.snakes[socket.id].die();
			state = Object.assign({}, game.getState(), {die: socket.id});
			socket.lastDeath = Date.now();
			broadcast('state', state);
			return checkPlayerCount();
		}
		var mouseEaten = game.mouseCollision(snake, now);
		if (mouseEaten) {
			state = game.getState();
			var help;
			switch(mouseEaten.type) {
				case 'speed':
					if (snake.velocity <= VELOCITY * 1.5) {
						snake.velocity += VELOCITY * 0.1;
						help = 'faster';
					} else {
						snake.addLength(10);
						help = 'longer';
					}
					break;
				case 'power':
					help = '+1 power kick';
					snake.power++;
					break;
			}
			help && (state = Object.assign({}, state, {help}));
			broadcast('state', state);
			return checkPlayerCount();
		}
		if (game.ballKick(snake)) {
			//we need to broadcast full state, because power may have been used
			state = Object.assign({}, game.getState(), {kick: true});
			if (game.lastKick && (now - game.lastKick < 100)) {
				delete state.kick;
			}
			game.lastKick = now;
			broadcast('state', state);
			return checkPlayerCount();
		}
		broadcast('move', Object.assign({}, move, {id: socket.id}));
		checkPlayerCount();
	});
	socket.on('pong', function () {
		socketLastSeen[socket.id] = Date.now();
		checkPlayerCount();
	});
	socket.on('disconnect', function () {
		socket.game.removeSnake(socket);
		broadcast('state', game.getState());
		delete socketLastSeen[socket.id];
		checkPlayerCount();
	});
	broadcast('ping', 1);
	checkPlayerCount();
});


function checkPlayerCount() {
	Object.keys(socketLastSeen).forEach(function (socketId) {
		if ((Date.now() - socketLastSeen[socketId]) > TIMEOUT) {
			io.sockets.sockets[socketId].disconnect();
			delete socketLastSeen[socketId];
		}
	});
	var players = Object.keys(socketLastSeen).length;
	Object.keys(io.sockets.sockets).forEach(id => {
		var socket = io.sockets.sockets[id];
		var shouldEmit = (players === 1 && socketLastSeen[socket.id]) || players > 1;
		var isNonEmittedCount = !socket.lastPlayerCount || socket.lastPlayerCount !== players;
		if (shouldEmit && isNonEmittedCount) {
			socket.emit('players', players);
			socket.lastPlayerCount = players;
		}
	});
}

var LATENCY = 100;

function emit(socket, type, msg) {
	if (!process.env.PORT) {
		if (msg && msg.t) {
			msg.t += LATENCY / 2;
		}
		return setTimeout(emit, LATENCY);
	}
	return emit();

	function emit() {
		socket.emit(type, msg);
	}
}

function broadcast(type, msg) {
	if (!process.env.PORT) {
		if (msg.t) {
			msg.t += LATENCY / 2;
		}
		return setTimeout(emit, LATENCY);
	}
	return emit();

	function emit() {
		io.emit(type, msg);
	}
}

http.listen(port, function () {
	console.log('listening on http://localhost:%s', port);
});

