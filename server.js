require("nodeversioncheck");
const express = require('express');
const compression = require('compression');
const path = require('path');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const staticFiles = require('./staticFiles');

app.disable('x-powered-by');
app.use(compression());
app.use(express.static(path.join(__dirname, 'favicon')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'js')));
staticFiles.forEach(p => app.get(path.basename(p), (req, res) => res.sendFile(p)));

var port = process.env.PORT || 7890;
var colors = [0x5856d6, 0xff2d55, 0x4cd964, 0x007aff, 0xff3b30, 0x5ac8fa, 0xffcc00, 0x34aadc];//0x8e8e93
var colorIndex = Math.round(Math.random() * colors.length);
var socketLastSeen = {};

var TIMEOUT = 20 * 1000;

io.on('connection', function (socket) {
	socketLastSeen[socket.id] = Date.now();
	colorIndex = (colorIndex + 1) % colors.length;
	var color = colors[colorIndex];
	emit(socket, 'start', {
		color: color,
		t: Date.now(),
		velocity: 0.0002
	});
	socket.on('move', function (snake) {
		socketLastSeen[socket.id] = Date.now();
		snake.color = color;
		snake.t = Date.now();
		broadcast('move', snake);
		checkPlayerCount();
	});
	socket.on('pong', function () {
		socketLastSeen[socket.id] = Date.now();
		checkPlayerCount();
	});
	socket.on('disconnect', function () {
		delete socketLastSeen[socket.id];
		checkPlayerCount();
	});
	broadcast('ping', 1);
	checkPlayerCount();
});


function checkPlayerCount() {
	Object.keys(socketLastSeen).forEach(function (socketId) {
		if ((Date.now() - socketLastSeen[socketId]) > TIMEOUT) {
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

