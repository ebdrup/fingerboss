function initOnMove() {
	world.socket.on('move', data => {
		if(state.snakes[data.id]){
			return state.snakes[data.id].update(data);
		}
		state.snakes[data.id] = new Snake({data});
	});
}
