function initWorld() {
	world.dClock = 0;
	world.dClocks = [];
	world.latency = 120;
	world.latencies = [];
	world.socket = io();
	world.textures = {};
	world.wins = parseInt(readCookie('wins') || '0', 10);
	world.sounds = sfx();
	world.renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {
		backgroundColor: BACKGROUND_COLOR,
		antialias: true
	});
	document.body.appendChild(world.renderer.view);
	world.mainStage = new PIXI.Container();
	world.background = touch();
	world.mainStage.addChild(world.background);
	world.starField = new PIXI.Container();
	world.mainStage.addChild(world.starField);
	world.stage = new PIXI.Container();
	world.mainStage.addChild(world.stage);

	window.onresize = function () {
		world.renderer.resize(window.innerWidth, window.innerHeight);
		world.background.width = world.renderer.view.width;
		world.background.height = world.renderer.view.height;
		/*state.snakes.forEach(function (c) {
			world.stage.removeChild(c.sprite);
			c.sprite = generateSpriteForCircle(world, c);
			world.stage.addChild(c.sprite);
		});*/
	};
	world.color = COLORS[Math.floor(Math.random() * COLORS.length)];
	world.velocity = VELOCITY;
	world.players = 1;

	world.socket.on('start', function (e) {
		world.id = e.id;
		world.color = e.color;
		world.velocity = e.velocity;
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