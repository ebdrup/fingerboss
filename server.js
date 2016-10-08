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
	0x4cd964,
	0x007aff,
	0xff3b30,
	0x5ac8fa,
	0xffcc00,
	0x34aadc
];
var colorIndex = Math.round(Math.random() * colors.length);
var socketLastSeen = {};
var TIMEOUT = 20 * 1000;
const VELOCITY = 0.0002;

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
		socket.color = this.colors[(this.colorIndex + 1) % this.colors.length];
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
			mice: this.mice
		}
	}

	snakeCollision(movement) {
		return Object.keys(this.snakes)
			.filter(key => key !== movement.id)
			.some(key => {
				let parts = this.snakes[key].parts;
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

	mouseCollision(snake){
		for(var i = 0; i<snake.parts.length; i++){
			var part = snake.parts[i];
			for(var j = 0; j< this.mice.length; j++){
				var mouse = this.mice[j];
				var distance = Math.sqrt(
					Math.pow(Math.abs(part.x - mouse.x), 2) +
					Math.pow(Math.abs(part.y - mouse.y), 2)
				);
				if(distance<= mouse.size){
					console.log('mouse collision');
					this.mice.splice(j, 1);
					this.addMouse();
					return mouse;
				}
			}
		}
		return null;
	}
}

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
		if (dt > 500) {
			snake.position(snake.parts[0]);
			broadcast('state', game.getState());
			return;
		}
		var velocity = snake.velocity;
		var dx = dt * velocity * Math.cos(angle);
		var dy = dt * velocity * Math.sin(angle);
		var move = socket.game.snakes[socket.id].getMaxMove({dx, dy});
		var movement = socket.game.snakes[socket.id].move(move);
		if (socket.game.snakeCollision(movement)) {
			socket.game.snakes[socket.id].die(VELOCITY);
			var state = game.getState();
			state.die = socket.id;
			socket.lastDeath = Date.now();
			broadcast('state', state);
			return checkPlayerCount();
		}
		var mouseEaten = game.mouseCollision(snake);
		if(mouseEaten){
			snake.velocity += VELOCITY* 0.1;
			broadcast('state', game.getState());
			return checkPlayerCount();
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
		msg.t += LATENCY / 2;
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

