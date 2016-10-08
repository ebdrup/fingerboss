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
const distance = require('./distance');
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
	0xff2d55,
	//0x4cd964,
	0x007aff,
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
var miceTypes = ['speed'];//, 'speed', 'shrink'];

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
	}

	resetBall() {
		this.ball = {x: 0.5, y: 0.5, size: 0.04};
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
		socket.color = this.colors[(this.colorIndex++) % this.colors.length];
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
			ball: this.ball
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
		var part = snake.parts[0];
		for (var j = 0; j < this.mice.length; j++) {
			var mouse = this.mice[j];
			var d = distance(part, mouse);
			if (d <= mouse.size) {
				this.mice.splice(j, 1);
				this.addMouse();
				return mouse;
			}
		}
		return null;
	}

	ballKick(snake) {
		var part = snake.parts[0];
		var d = distance(part, this.ball);
		if (d > (this.ball.size / 2)) {
			return false;
		}
		var dx = this.ball.x - part.x;
		var dy = this.ball.y - part.y;
		//this.ball.x += dx;
		//this.ball.y += dy;
		var x = Math.max(Math.min(this.ball.x + (4 + Math.random()) * dx, 0.995), 0.005);
		var y = Math.max(Math.min(this.ball.y + (4 + Math.random()) * dy, 0.995), 0.005);

		this.tween = new Tweeno.Tween(this.ball, {
			to: {x, y},
			duration: 1000,
			easing: Tweeno.Easing.Cubic.Out,
			onUpdate: ()=> {
				this.onBallUpdate && this.onBallUpdate();
			},
			onComplete: () => delete this.tween
		});
		this.tween.start();
		return true;
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
	emit(socket, 'start', {
		t: Date.now(),
		id: socket.id,
	});
	broadcast('state', game.getState());
	game.onBallUpdate = () => {
		broadcast('ball', game.ball);
	};
	socket.on('move', function (angle) {
		if (typeof angle !== 'number' || isNaN(angle)) {
			return;
		}
		socketLastSeen[socket.id] = Date.now();
		var now = Date.now();
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
			var state = game.getState();
			state.die = socket.id;
			socket.lastDeath = Date.now();
			broadcast('state', state);
			return checkPlayerCount();
		}
		var mouseEaten = game.mouseCollision(snake, now);
		if (mouseEaten) {
			if (snake.velocity <= VELOCITY * 1.5) {
				snake.velocity += VELOCITY * 0.1;
			} else {
				snake.addLength(10);
			}
			broadcast('state', game.getState());
			return checkPlayerCount();
		}
		if (game.ballKick(snake)) {
			broadcast('ball', game.ball);
		}
		broadcast('move', Object.assign(move, {id: socket.id}));
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

var LATENCY = 300;

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

