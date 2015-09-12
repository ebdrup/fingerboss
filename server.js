var express = require('express');
var compression = require('compression');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
require('./gulpfile');

app.disable('x-powered-by');
app.use(compression());
app.use(express.static(path.join(__dirname, 'favicon')));
app.use(express.static(path.join(__dirname, 'public')));
var port = process.env.PORT || 7890;

var colors = [0xefefef, 0x244f6a, 0xfeaa37, 0xe03e27];
var colorIndex = Math.round(Math.random() * colors.length);

io.on('connection', function (socket) {
	colorIndex = (colorIndex + 1) % colors.length;
	var color = colors[colorIndex];
	emit(socket, 'start', {color: color, t: Date.now(), velocity: 0.0002});
	socket.on('circle', function (c) {
		c.color = color;
		c.t = Date.now();
		broadcast('circle', c);
	});
});

var LATENCY = 300;

function emit(socket, type, msg){
	if (!process.env.PORT) {
		msg.t += LATENCY/2;
		return setTimeout(emit, LATENCY);
	}
	return emit();

	function emit() {
		socket.emit(type, msg);
	}
}

function broadcast(type, msg) {
	if (!process.env.PORT) {
		msg.t += LATENCY/2;
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