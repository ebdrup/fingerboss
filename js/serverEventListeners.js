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

function serverEventListeners() {
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
		if(ball.kick){
			var n = Math.floor(Math.random()*2) +1;
			sfx['ball' + n]();
		}
	});

	world.socket.on('state', function (e) {
		var snakeIds = e.snakes.reduce((acc, s) => (acc[s.id] = true) && acc, {});
		Object.keys(state.snakes).forEach(id => !snakeIds[id] && state.snakes[id].remove());
		e.snakes.forEach(data => {
			if(state.snakes[data.id]){
				state.snakes[data.id].update(data);
			} else {
				state.snakes[data.id] = new Snake({data})
			}
			if (data.id === world.id) {
				state.pos.x = data.parts[0][0] -0.5;
				state.pos.y = data.parts[0][1] -0.5;
			}
		});
		if(e.die && (e.die === world.id)){
			moveStars({dx:0, dy:0});
			sfx.crash2();
			help('You Died');
			state.playing = false;
			setTimeout(() => state.playing = true, 2000);
		}
		state.mice = e.mice;
		state.ball = e.ball;
		state.goals = e.goals;
		state.scores = e.scores;
		if(e.score){
			console.log('goal', e.score);
			help('Goal!', e.score);
			sfx.whistle();
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
