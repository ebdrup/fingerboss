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
app.use(compression());
app.use(express.static(path.join(__dirname, 'favicon')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'js')));
staticFiles.forEach(p => app.get(path.basename(p), (req, res) => res.sendFile(p)));

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

var games = [];

class Game {
	constructor(socket) {
		this.sockets = [socket];
		this.colors = [colors[(colorIndex + 1) % colors.length], colors[(colorIndex + 1) % colors.length]];
		this.colorIndex = 0;
		socket.color = this.colors[(this.colorIndex + 1) % this.colors.length];
		this.snakes = {};
		this.snakes[socket.id] = new Snake({id: socket.id, x: 0.5, y: 0.5, length: 30, color: socket.color});
		socket.game = this;
	}

	addSnake(socket) {
		this.sockets.push(socket);
		socket.color = this.colors[(this.colorIndex + 1) % this.colors.length];
		this.snakes[socket.id] = new Snake({id: socket.id, x: 0.5, y: 0.5, length: 30, color: socket.color});
		socket.game = this;
	}
	removeSnake(socket) {
		this.sockets.push(socket);
		socket.color = this.colors[(this.colorIndex + 1) % this.colors.length];
		this.snakes[socket.id] = new Snake({id: socket.id, x: 0.5, y: 0.5, length: 30, color: socket.color});
		socket.game = this;
	}

	detectCollision(movement){
		return Object.keys(this.snakes)
			.filter(key => key !== movement.id)
			.some(key => {
				let parts = this.snakes[key].parts;
				for(var i= 1; i< parts.length; i++){
					if(lineIntersect(Object.assign({}, movement, {
							x3: parts[i-1].x,
							y3: parts[i-1].y,
							x4: parts[i].x,
							y4: parts[i].y,
						}))){
						return true;
					}
				}
				return false;
			});
	}
}

io.on('connection', function (socket) {
	socketLastSeen[socket.id] = Date.now();
	var velocity = 0.0002;
	if (!games.length) {
		games.push(new Game(socket));
	} else {
		games[0].addSnake(socket);
	}
	var snakes = socket.game.snakes;
	emit(socket, 'start', {
		t: Date.now(),
		velocity,
		id: socket.id,
	});
	broadcast('snakes', Object.keys(snakes).map(id => snakes[id].serialize()));
	socket.on('move', function (angle) {
		if (typeof angle !== 'number' || isNaN(angle)) {
			return;
		}
		socketLastSeen[socket.id] = Date.now();
		var now = Date.now();
		var lastMove = socket.lastMove || now;
		socket.lastMove = now;
		var dt = now - lastMove;
		if (dt <= 0) {
			return;
		}
		var dx = dt * velocity * Math.cos(angle);
		var dy = dt * velocity * Math.sin(angle);
		var move = socket.game.snakes[socket.id].getMaxMove({dx, dy});
		if (!move.dx && !move.dy) {
			return;
		}
		var movement = socket.game.snakes[socket.id].move(move);
		if(socket.game.detectCollision(movement)){
			socket.game.snakes[socket.id].die();
			broadcast('snakes', Object.keys(snakes).map(id => snakes[id].serialize()));
		} else {
			broadcast('move', Object.assign(move, {id: socket.id}));
		}
		checkPlayerCount();
	});
	socket.on('pong', function () {
		socketLastSeen[socket.id] = Date.now();
		checkPlayerCount();
	});
	socket.on('disconnect', function () {
		socket.game.removeSnake(socket);
		broadcast('snakes', Object.keys(snakes).map(id => snakes[id].serialize()));
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
		msg.t += LATENCY / 2;
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

