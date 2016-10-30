require("nodeversioncheck");
const express = require('express');
const compression = require('compression');
const path = require('path');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const staticFiles = require('./staticFiles');
const Snake = require('./js/snake');
const lineIntersect = require('./js/lineIntersect');
global.distance = require('./js/distance');
const Tweeno = require('tweeno');
const ExpressPeerServer = require('peer').ExpressPeerServer;

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
	//0xff2d55,
	//0x4cd964,
	//0x007aff, //too close in colour
	0xff3b30,
	0x5ac8fa,
	//0xffcc00,//too close in colour
	0x34aadc
];
var colorIndex = Math.floor(Math.random() * colors.length);
var socketLastSeen = {};
var TIMEOUT = 20 * 1000;
const VELOCITY = 0.00006;

var games = [];
var miceTypes = [
	{
		type: 'speed',
		chance: 60
	},
	{
		type: 'power',
		chance: 80
	},
]
	.concat(new Array(7).fill(1).map((_, i) => ({
		type: 'item_headgear_' + (i + 1),
		chance: 2
	})))
	.concat(new Array(5).fill(1).map((_, i) => ({
		type: 'item_bow_' + (i + 1),
		chance: 2
	})))
	.concat(new Array(22).fill(1).map((_, i) => ({
		type: 'item_clothes_' + (i + 1),
		chance: 2
	})))
	.reduce((acc, mt) => {
		return acc.concat(new Array(mt.chance).fill(mt.type));
	}, []);
var snakeCounter = 1;

class Game {
	constructor(socket) {
		this.sockets = [socket];
		this.peers = [];
		this.mice = [];
		this.colorIndex = 0;

		this.mouseCounter = 0;
		this.colors = [colors[(colorIndex++) % colors.length], colors[(colorIndex++) % colors.length]];
		socket.color = this.colors[(this.colorIndex++) % this.colors.length];
		this.snakes = {};
		socket.playId = snakeCounter++;
		this.snakes[socket.playId] = new Snake({
			id: socket.playId,
			length: 50,
			color: socket.color,
			velocity: VELOCITY
		});
		this.snakes[socket.playId].socket = socket;
		socket.game = this;
		for (var i = 0; i < 35; i++) {
			this.addMouse();
		}
		this.resetBall();
		this.goals = this.colors.map((color, i) => ({
				color,
				size: 0.06,
				type: 'goal',
				x: {'0': 0.1, '1': 0.9}[i],
				y: {'0': 0.1, '1': 0.9}[i]
			})
		);
		this.scores = this.colors.reduce((acc, color) => {
			acc[color] = 0;
			return acc;
		}, {});
		this.lastMove = this.colors.reduce((acc, color) => {
			acc[color] = 0;
			return acc;
		}, {})
	}

	resetBall() {
		this.ball = {x: 0.5, y: 0.5, size: 0.04};
		delete this.tween;
	}

	addMouse() {
		var x = Math.random();
		var y = Math.random();
		this.mice.push({
			x,
			y,
			size: 0.02,
			id: ++this.mouseCounter,
			type: miceTypes[Math.floor(Math.random() * (miceTypes.length))]
		})
	}

	mouseEaten(mouseId) {
		this.mice = this.mice.filter(m => mouseId !== m.id);
		while (this.mice.length < 10) {
			this.addMouse()
		}
		return this.mice;
	}

	addSnake(socket) {
		socket.playId = snakeCounter++;
		this.sockets.push(socket);
		socket.color = this.colors.sort((c1, c2) => this.lastMove[c1] - this.lastMove[c2])[0];
		this.snakes[socket.playId] = new Snake({
			id: socket.playId,
			length: 50,
			color: socket.color,
			velocity: VELOCITY
		});
		socket.game = this;
		this.snakes[socket.playId].socket = socket;
	}

	removeSnake(socket) {
		delete this.snakes[socket.playId];
	}

	getState() {
		return {
			snakes: Object.keys(this.snakes).map(id => this.snakes[id].serialize()),
			mice: this.mice,
			ball: this.ball,
			goals: this.goals,
			scores: this.scores
		}
	}

	ballKick(snake) {
		var part = snake.headCollision(this.ball);
		if (!part) {
			return false;
		}
		var power = false;
		var kickDistance = 4;
		if (snake.power) {
			snake.power--;
			kickDistance *= 4;
			power = true;
		}
		var dx = this.ball.x - part.x;
		var dy = this.ball.y - part.y;
		var x = this.ball.x + (kickDistance + Math.random()) * dx;
		var y = this.ball.y + (kickDistance + Math.random()) * dy;
		this.tween = new Tweeno.Tween({x: this.ball.x, y: this.ball.y}, {
			to: {x, y},
			duration: 1000,
			easing: Tweeno.Easing.Cubic.Out,
			onUpdate: target => {
				var x = Math.abs(target.x);
				if (x > 1) {
					x = 1 - (x - 1);
				}
				this.ball.x = x;
				var y = Math.abs(target.y);
				if (y > 1) {
					y = 1 - (y - 1);
				}
				this.ball.y = y;
				this.onBallUpdate && this.onBallUpdate();
			},
			onComplete: () => delete this.tween
		});
		this.tween.start();
		return {power};
	}

	goal() {
		var goal = this.goals.filter(goal => {
			var d = distance(goal, this.ball);
			return d < (goal.size + this.ball.size) / 2;
		})[0];
		if (!goal) {
			return false;
		}
		var score = goal.color;
		this.scores[score]++;
		this.resetBall();
		var winner = Object.keys(this.scores).filter(color => this.scores[color] >= 10)[0];
		if (winner) {
			winner = parseInt(winner, 10);
			this.colors.forEach(color => this.scores[color] = 0);
		}
		return {score, winner};
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
	var color = socket.color;
	emit(socket, 'start', {
		t: Date.now(),
		id: socket.playId,
		color
	});
	broadcast('state', game.getState());
	snakes[socket.playId].onMove = move => {
		var now = Date.now();
		var snake = snakes[socket.playId];
		var kick = game.ballKick(snake);
		if (kick) {
			var ballState = Object.assign({}, game.ball, {kick: true});
			if (game.lastKick && (now - game.lastKick < 100)) {
				delete ballState.kick;
			}
			game.lastKick = now;
			broadcast('ball', ballState);
			if (kick.power) {
				broadcast('snakePower', {id: snake.id, power: snake.power});
			}
		}
		socket.broadcast.emit('move', move);
		checkPlayerCount();
	};
	snakes[socket.playId].onMissingMove = () => {
		socket.emit('missingMove');
	};
	game.onBallUpdate = () => {
		var score = game.goal();
		if (!score) {
			return broadcast('ball', game.ball);
		}
		broadcast('state', Object.assign({}, game.getState(), score));
	};
	socket.on('missingMove', function (playId) {
		var socketMissingMove = (snakes[playId]|| {}).socket;
		if(socketMissingMove){
			socketMissingMove.emit('missingMove');
		}
	});
	socket.on('mouseEaten', function (data) {
		var mice = game.mouseEaten(data.mouseId);
		var snake = snakes[socket.playId];
		snake.unserialize(data.snake);
		broadcast('mice', mice);
		socket.broadcast.emit('snake', data.snake);
	});
	socket.on('snake', function (data) {
		console.log('got snake');
		var snake = snakes[socket.playId];
		snake.unserialize(data);
		socket.broadcast.emit('snake', data);
	});
	socket.on('die', function (snakeData) {
		var snake = snakes[socket.playId];
		snake.unserialize(snakeData);
		socket.broadcast.emit('snake', snakeData);
	});
	socket.on('move', function (move) {
		var now = Date.now();
		game.lastMove[color] = now;
		socketLastSeen[socket.id] = now;
		socket.lastMove = now;
		var snake = snakes[socket.playId];
		move.id = socket.playId;
		snake.move(move);
	});
	socket.on('pong', function () {
		socketLastSeen[socket.id] = Date.now();
		checkPlayerCount();
	});
	socket.on('peer_connected', function (id) {
		console.log('peer_connected', id);
		if (!game.peers.some(p => p.peerId === id)) {
			game.peers.push({socketId: socket.id, peerId: id});
			broadcast('peers', game.peers);
			console.log('peer_connected breadcast', game.peers);
		}
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

var LATENCY = 100;

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

app.use('/peer', ExpressPeerServer(server, {debug: true}));

server.listen(port, function () {
	console.log('listening on app://localhost:%s', port);
});

