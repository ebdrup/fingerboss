function getEstimatedServerT(world) {
	return Date.now() - world.dClock + world.latency / 2;
}