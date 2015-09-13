function resetGame(state, world) {
	state.circles = [];
	state.unconfirmedCircless = {};
	state.scores = {};
	state.newCircle = null;
	state.scoreCircles = [];
	state.readyToPlay = true;
	state.playing = true;
	state.shrinkCount = 0;
	state.killCount = 0;
	if (world.stage) {
		for (var i = world.stage.children.length - 1; i >= 0; i--) {
			world.stage.removeChild(world.stage.children[i]);
		}
		if (world.background) {
			world.stage.addChild(world.background);
		}
	}
}