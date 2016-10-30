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
	world.zoom = 3;
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
	world.stage = new PIXI.Container();
	world.mainStage.addChild(world.stage);
	world.mice = new PIXI.Container();
	world.mainStage.addChild(world.mice);
	world.text = new PIXI.Container();
	world.mainStage.addChild(world.text);
	world.stage.scale.x = world.starField.scale.x = world.mice.scale.x = world.zoom;
	world.stage.scale.y = world.starField.scale.y = world.mice.scale.y = world.zoom;
	world.dxZoom = (1 - world.zoom) / 2 * world.renderer.view.width;
	world.dyZoom = (1 - world.zoom) / 2 * world.renderer.view.height;
	world.stage.position.x = world.starField.position.x = world.mice.position.x = world.dxZoom;
	world.stage.position.y = world.starField.position.y = world.mice.position.y = world.dyZoom;
	world.height = world.renderer.view.height;
	world.width = world.renderer.view.width;
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