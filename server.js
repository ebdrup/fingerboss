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
var lastCircle;

var socketLastSeen = {};

io.on('connection', function (socket) {
	socketLastSeen[socket.id] = Date.now();
	colorIndex = (colorIndex + 1) % colors.length;
	var color = colors[colorIndex];
	emit(socket, 'start', {color: color, t: Date.now(), velocity: 0.0002});
	socket.on('circle', function (c) {
		socketLastSeen[socket.id] = Date.now();
		c.color = color;
		c.t = Date.now();
		lastCircle = c;
		broadcast('circle', c);
	});
	socket.on('disconnect', function(){
		delete socketLastSeen[socket.id];
	});
});

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

var TIMEOUT = 1000 * 20;

function fire() {
	Object.keys(socketLastSeen).forEach(function(socketId){
		if((Date.now()-socketLastSeen[socketId])>TIMEOUT){
			delete socketLastSeen[socketId];
		}
	});
	var activeSockets = Object.keys(socketLastSeen).length;
	if(activeSockets>1){
		return setTimeout(fire, TIMEOUT);
	}
	var s = Math.random() / 5;
	var t = s * 6500 + 500;
	var x, y;
	if (lastCircle && Math.random() > 0.5) {
		x = lastCircle.x;
		y = lastCircle.y;
		lastCircle = null;
	} else {
		x = Math.random();
		y = Math.random();
	}
	broadcast('circle', {
		id: Math.random() + '_' + Date.now(),
		t: Date.now(),
		color: 0xff9500,
		x: x,
		y: y,
		size: s
	});
	setTimeout(fire, t);
}
fire();
