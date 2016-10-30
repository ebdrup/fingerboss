function initState() {
	state.snakes = {};
	state.mice = [];
	state.angle = 0;
	state.initialized = false;
	state.playing = false;
	state.pos = {
		x: 0,
		y: 0
	};
	if (world.stage) {
		for (var i = world.stage.children.length - 1; i >= 0; i--) {
			world.stage.removeChild(world.stage.children[i]);
		}
	}
	help({text: 'fingerboss'})
}