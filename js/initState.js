function initState() {
	state.snakes = {};
	state.angle = 0;
	state.readyToPlay = true;
	state.playing = true;
	state.pos = {
		x: 0,
		y: 0
	};
	state.snake = new Snake({id: world.id, x: 0.5, y: 0.5, length: 30, color: world.color});

	if (world.stage) {
		for (var i = world.stage.children.length - 1; i >= 0; i--) {
			world.stage.removeChild(world.stage.children[i]);
		}
	}
}