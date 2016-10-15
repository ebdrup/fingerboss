function listen() {
	world.socket.on('move', move => {
		if (move.id === world.id) {
			throw new Error('got move for ourselves');
		}
		console.log('move', move);
		if (state.snakes[move.id]) {
			return state.snakes[move.id].move(move);
		}
	});

	world.socket.on('ball', function (ball) {
		state.ball = ball;
		if (ball.kick) {
			sfx['ball' + (Math.floor(Math.random() * 2) + 1)]();
		}
	});

	world.socket.on('state', function (e) {
		if(!state.initialized){
			state.initialized = true;
			state.playing = true;
		}
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
				help({text: 'You Died'});
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
		if (e.help && e.help.id === world.id) {
			help({text: e.help.text, alpha: 0.5, duration: 500});
		}
	});

	world.socket.on('start', function (e) {
		world.id = e.id;
		world.color = e.color;
		world.dClock = Date.now() - e.t;
		world.dClocks.push(world.dClock);
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
