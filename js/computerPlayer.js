function computerPlayer(state, world) {
	if (world.players > 1) {
		return;
	}
	if (state.nextComputerFire && (state.nextComputerFire > Date.now())) {
		return;
	}
	var s = Math.random() / 5;
	state.nextComputerFire = s * 5900 + 500 + Date.now();
	var x, y;
	if (state.lastCircle && Math.random() > 0.5) {
		x = state.lastCircle.x;
		y = state.lastCircle.y;
		state.lastCircle = null;
	} else {
		x = Math.random();
		y = Math.random();
	}
	onCircle(state, world, {
		id: Math.random() + '_' + Date.now(),
		t: getEstimatedServerT(world),
		color: 0xff9500,
		x: x,
		y: y,
		size: s
	});
}