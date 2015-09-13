function initGameState(state) {
	state.circles = [];
	state.unconfirmedCircless = {};
	state.scores = {};
	state.newCircle = null;
	state.scoreCircles = [];
	state.readyToPlay = true;
	state.playing = true;
	state.shrinkCount = 0;
	state.killCount = 0;
	if (state.stage) {
		for (var i = state.stage.children.length - 1; i >= 0; i--) {
			state.stage.removeChild(state.stage.children[i]);
		}
		if (state.background) {
			state.stage.addChild(state.background);
		}
	}
}