function initWorld() {
	world.dClock = 0;
	world.dClocks = [];
	world.latency = 120;
	world.latencies = [];
	world.peers = [];
	world.socket = io();
	world.textures = {};
	world.scores = {};
	world.pointers = {};
	world.wins = parseInt(readCookie('wins') || '0', 10);
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
	world.mice = new PIXI.Container();
	world.mainStage.addChild(world.mice);
	world.stage = new PIXI.Container();
	world.mainStage.addChild(world.stage);

	window.onresize = function () {
		world.renderer.resize(window.innerWidth, window.innerHeight);
		world.background.width = world.renderer.view.width;
		world.background.height = world.renderer.view.height;
		/*state.snakes.forEach(function (c) {
			world.stage.removeChild(c.sprite);
			c.sprite = sprite(world, c);
			world.stage.addChild(c.sprite);
		});*/
	};
	world.color = COLORS[Math.floor(Math.random() * COLORS.length)];
	world.velocity = VELOCITY;
	world.players = 1;
}