function initState() {
	state.snakes = {};
	state.mice = [];
	state.angle = 0;
	state.died = 0;
	state.readyToPlay = true;
	state.playing = true;
	state.pos = {
		x: 0,
		y: 0
	};
	if (world.stage) {
		for (var i = world.stage.children.length - 1; i >= 0; i--) {
			world.stage.removeChild(world.stage.children[i]);
		}
	}
}