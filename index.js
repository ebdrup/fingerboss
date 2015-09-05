var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));
var colors = [0xefefef, 0x244f6a, 0xfeaa37, 0xe03e27];
var colorIndex = Math.round(Math.random() * colors.length);

io.on('connection', function(socket){
	colorIndex = (colorIndex+1) % colors.length;
	var color = colors[colorIndex];
	socket.on('click', function(msg){
		msg.color = color;
		msg.size = Math.round(Math.random()*15) + 5;
		console.log(msg);
		io.emit('click', msg);
	});
});

http.listen(5678, function(){
	console.log('listening on *:5678');
});