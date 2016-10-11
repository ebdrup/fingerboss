function moveStars({dx, dy}) {
	var height = world.renderer.view.height;
	var width = world.renderer.view.width;
	world.stars.forEach(s=> {
		s.position.x -= dx * s.scale.x * 2 * width;
		s.position.y -= dy * s.scale.y * 2 * height;
		if (s.position.x < -s.height / 2) {
			s.position.x = width + s.height / 2;
			s.position.y = Math.random() * height;
		} else if (s.position.x > width + s.height / 2) {
			s.position.x = -s.height / 2;
			s.position.y = Math.random() * height;
		} else if (s.position.y < -s.width / 2) {
			s.position.x = Math.random() * width;
			s.position.y = height + s.width / 2;
		} else if (s.position.y > height + s.width / 2) {
			s.position.x = Math.random() * width;
			s.position.y = -s.width / 2;
		}
		var x = state.pos.x + s.position.x / width;
		var y = state.pos.y + s.position.y / height;
		if (x < 0 || x > 1 || y < 0 || y > 1) {
			s.visible = false;
		} else {
			s.visible = true;
		}
	});
}

function listen() {
	world.socket.on('move', data => {
		if (data.id === world.id) {
			state.pos.x += data.dx;
			state.pos.y += data.dy;
			moveStars(data);
		}
		if (state.snakes[data.id]) {
			return state.snakes[data.id].move(data);
		}
	});

	world.socket.on('ball', function (ball) {
		state.ball = ball;
		if (ball.kick) {
			sfx['ball' + (Math.floor(Math.random() * 2) + 1)]();
		}
	});

	world.socket.on('state', function (e) {
		var snakeIds = e.snakes.reduce((acc, s) => (acc[s.id] = true) && acc, {});
		Object.keys(state.snakes).forEach(id => !snakeIds[id] && state.snakes[id].remove());
		e.snakes.forEach(data => {
			if (state.snakes[data.id]) {
				state.snakes[data.id].update(data);
			} else {
				state.snakes[data.id] = new Snake({data})
			}
			if (data.id === world.id) {
				state.pos.x = data.parts[0][0] - 0.5;
				state.pos.y = data.parts[0][1] - 0.5;
			}
		});
		if (e.die) {
			sfx['crash' + (Math.floor(Math.random() * 2) + 1)]();
			if (e.die === world.id) {
				moveStars({dx: 0, dy: 0});
				help('You Died');
				state.playing = false;
				setTimeout(() => state.playing = true, 2000);
			}
		}
		state.mice = e.mice;
		state.ball = e.ball;
		state.goals = e.goals;
		state.scores = e.scores;
		if (e.winner) {
			sfx.whistle();
			if (world.color === e.winner) {
				help('You won!', e.winner);
				sfx.win(0.7);
				setTimeout(() => {
					sfx.fingerboss(0.8);
					help('You\'re the\nfingerboss', e.winner);
				}, 5000);
			} else {
				help('You lost');
				sfx.loose();
			}
		} else if (e.score) {
			help('Goal!', e.score);
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
		world.peerId = world.id.replace('/#', '');
		world.peer = new Peer(world.peerId, {key: '9hehijcmhh4u0udi', debug: 3});
		world.socket.emit('peer_connected', world.peerId);
		world.peer.on('error', function (err) {
			console.log(err);
		});
		world.peer.on('connection', function (conn) {
			conn.on('data', function (data) {
				// Will print 'hi!'
				console.log(world.peerId, 'received:', data, {dt: Date.now() - data.now});
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
		world.peers = peers
			.filter(p => p.peerId !== world.peerId && !existingIds[p.peerId])
			.map(p => Object.assign(world.peer.connect(p.peerId), p));
		world.peers.forEach(p =>
			p
				.on('open', function () {
					p.interval = setInterval(function () {
						p.send({now: Date.now(), from: world.peerId});
					}, 2000);
				})
				.on('error', function (err) {
					console.error('peer error, removing peer', err);
					p.interval && clearInterval(p.interval);
					world.peers = world.peers.filter(peer => peer !== p);
				})
		);
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
