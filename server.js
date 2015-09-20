require("nodeversioncheck");
var express = require('express');
var compression = require('compression');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.disable('x-powered-by');
app.use(compression());
app.use(express.static(path.join(__dirname, 'favicon')));
app.use(express.static(path.join(__dirname, 'js')));
app.use(express.static(path.join(__dirname, 'public')));

var port = process.env.PORT || 7890;
var colors = [0x5856d6, 0xff2d55, 0x4cd964, 0x007aff, 0xff3b30, 0x5ac8fa, 0xffcc00, 0x34aadc];//0x8e8e93
var colorIndex = Math.round(Math.random() * colors.length);
var lastPlayerCount = 0;
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
	socket.on('circle', function (c) {
		socketLastSeen[socket.id] = Date.now();
		c.color = color;
		c.t = Date.now();
		broadcast('circle', c);
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
	if (lastPlayerCount === 1) {
		broadcast('ping', 1);
	} else {
		checkPlayerCount();
	}
});


function checkPlayerCount() {
	Object.keys(socketLastSeen).forEach(function (socketId) {
		if ((Date.now() - socketLastSeen[socketId]) > TIMEOUT) {
			delete socketLastSeen[socketId];
		}
	});
	var players = Object.keys(socketLastSeen).length;
	io.sockets.sockets.forEach(function (socket) {
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

