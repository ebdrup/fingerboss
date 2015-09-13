function initWorld(world){
	world.dClocks = [];
	world.latency = 120;
	world.latencies = [];
	world.id = Math.random() + '_' + Date.now();
}