var express = require('express');
var compression = require('compression');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.disable('x-powered-by');
app.use(compression());
app.use(express.static(path.join(__dirname, 'favicon')));
app.use(express.static(path.join(__dirname, 'public')));
var port = process.env.PORT || 7890;

var colors = [0xefefef, 0x244f6a, 0xfeaa37, 0xe03e27];
var colorIndex = Math.round(Math.random() * colors.length);

io.on('connection', function(socket){
	colorIndex = (colorIndex+1) % colors.length;
	var color = colors[colorIndex];
	socket.emit('color', color);
	socket.on('click', function(msg){
		msg.color = color;
		console.log(msg);
		broadcast('click', msg);
	});
});

function broadcast(type, msg){
	if(!process.env.PORT){
		return setTimeout(emit, 300);
	}
	return emit();

	function emit() {
		io.emit(type, msg);
	}
}

http.listen(port, function(){
	console.log('listening on http://localhost:%s', port);
});