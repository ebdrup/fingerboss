var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

io.on('connection', function(socket){
	socket.on('click', function(msg){
		io.emit('click', msg);
	});
});

http.listen(5678, function(){
	console.log('listening on *:5678');
});