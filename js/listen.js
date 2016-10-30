function listen() {
	world.emit = function (type, data) {
		var peers = world.peers
			.filter(p => p.open)
			.map(p => p.peerId)
			.concat([world.peerId]);
		world.peers
			.filter(p => p.open)
			.forEach(p => p.send({type, data: Object.assign({}, data, {id: world.id})}));
		data = peers.length > 1 ? Object.assign({}, data, {peers}) : data;
		world.socket.emit(type, data);
	};

	world.socket.on('move', move);

	function move(move) {
		if (move.id === world.id) {
			throw new Error('got move for ourselves');
		}
		if (state.snakes[move.id]) {
			return state.snakes[move.id].move(move);
		}
	}

	world.socket.on('ball', function (ball) {
		state.ball = ball;
		if (ball.kick) {
			sfx['ball' + (Math.floor(Math.random() * 2) + 1)]();
		}
	});

	world.socket.on('mice', function (mice) {
		state.mice = mice;
	});

	world.socket.on('snake', function (data) {
		if (data.id === world.id) {
			throw new Error('got snake for ourselves');
		}
		state.snakes[data.id] && state.snakes[data.id].unserialize(data);
	});

	world.socket.on('missingMove', function () {
		world.socket.emit('snake', state.snakes[world.id].serialize());
	});

	world.socket.on('snakePower', function (data) {
		state.snakes[data.id].power = data.power;
	});

	world.socket.on('state', function (e) {
		if (!state.initialized) {
			state.initialized = true;
			state.playing = true;
		}
		var snakeIds = e.snakes.reduce((acc, s) => (acc[s.id] = true) && acc, {});
		Object.keys(state.snakes).forEach(id => !snakeIds[id] && state.snakes[id].remove());
		e.snakes.forEach(data => {
			if (state.snakes[data.id]) {
				state.snakes[data.id].update(data);
			} else {
				state.snakes[data.id] = new Snake({data});
				state.snakes[data.id].onMissingMove = id => {
					world.socket.emit('missingMove', id);
				}
			}
			if (data.id === world.id) {
				state.pos.x = data.parts[0][0] - 0.5;
				state.pos.y = data.parts[0][1] - 0.5;
			}
		});
		state.mice = e.mice;
		state.ball = e.ball;
		state.goals = e.goals;
		state.scores = e.scores;
		if (e.winner) {
			sfx.whistle();
			if (world.color === e.winner) {
				help({text: 'You won!', color: e.winner});
				sfx.win(0.7);
				setTimeout(() => {
					sfx.fingerboss(0.8);
					help({text: 'You\'re the\nfingerboss', color: e.winner});
				}, 5000);
			} else {
				help({text: 'You lost'});
				sfx.loose();
			}
		} else if (e.score) {
			var score = Object.keys(state.scores)
				.sort((a, b) => a === world.color.toString() ? -1 : 1)
				.map(key => state.scores[key]).join(' - ');
			help({text: `Goal!\n${score}`, color: e.score});
			sfx.whistle();
			sfx['clap' + (Math.floor(Math.random() * 2) + 1)]();
		}
		if (e.kick) {
			sfx['ball' + (Math.floor(Math.random() * 2) + 1)]();
		}
	});

	world.socket.on('start', function (e) {
		world.id = e.id;
		world.color = e.color;
		world.dClock = Date.now() - e.t;
		world.dClocks.push(world.dClock);
		world.peerId = world.id;
		world.peer = new Peer(world.peerId, {host: '192.168.1.134', port: 7890, path: '/peer', debug: 3});
		world.peer.on('error', function (err) {
			console.log(world.peerId, err);
		});
		world.peer.on('open', function () {
			world.socket.emit('peer_open', world.peerId);
		});
		world.peer.on('connection', function (conn) {
			world.socket.emit('peer_connected', world.peerId);
			conn.on('data', function (msg) {
				console.log(new Date(), 'Got peer message', msg);
				switch (msg.type) {
					case 'move':
						move(msg.data);
						break;
					default:
						console.log(world.peerId, 'received uknown message:', msg);
				}
			});
		});

		window.onunload = window.onbeforeunload = function () {
			if (!world.peer.destroyed) {
				world.peer.destroy();
			}
		};

	});
	world.socket.on('peers', function (peers) {
		var existingIds = world.peers.reduce((acc, p) => (acc[p.peerId] = true) && acc, {});
		var newPeers = peers
			.filter(p => (p.peerId !== world.peerId) && (!existingIds[p.peerId]))
			.map(p => Object.assign(world.peer.connect(p.peerId), p));
		newPeers.forEach(p =>
			p
				.on('open', () => {
					console.log('open', p.peerId);
					p.open = true;
				})
				.on('error', function (err) {
					console.error('peer error, removing peer', err);
					world.peers = world.peers.filter(peer => peer !== p);
				})
		);
		world.peers = world.peers.concat(newPeers);
	});
	//world.socket.on('move', onMoveTime);
	world.socket.on('players', onPlayers);
	world.socket.on('ping', onPing);
	return;

	function onMoveTime(c) {
		// find median latency
		if (c.owner === world.id) {
			world.latencies.push(Date.now() - c.localTime);
			world.latencies.sort();
			if (world.latencies.length === 600) {
				world.latencies = world.latencies.slice(200, 400);
			}
			world.latency = world.latencies[Math.floor(world.latencies.length / 2)];
		}
		// find median clockDifference
		if (c.owner === world.id) {
			world.dClocks.push(Date.now() - c.t);
			world.dClocks.sort();
			if (world.dClocks.length === 600) {
				world.dClocks = world.dClocks.slice(200, 400);
			}
			world.dClock = world.dClocks[Math.floor(world.dClocks.length / 2)];
		}
	}

	function onPlayers(e) {
		world.players = parseInt(e, 10);
	}

	function onPing() {
		var timedOut = !world.lastInteraction || (world.lastInteraction + PLAYER_TIMEOUT < Date.now());
		if (!timedOut) {
			world.socket.emit('pong', 1);
		}
	}
}
