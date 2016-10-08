function moveStars({dx, dy}) {
	var height = world.renderer.view.height;
	var width = world.renderer.view.width;
	world.stars.forEach(s=> {
		s.position.x -= dx * s.scale.x * 2 * width;
		s.position.y -= dy * s.scale.y * 2 * height;
		if (s.position.x < -s.height / 2) {
			s.position.x = width + s.height / 2;
			s.position.y = Math.random() * height;
		} else if (s.position.x > width + s.height / 2) {
			s.position.x = -s.height / 2;
			s.position.y = Math.random() * height;
		} else if (s.position.y < -s.width / 2) {
			s.position.x = Math.random() * width;
			s.position.y = height + s.width / 2;
		} else if (s.position.y > height + s.width / 2) {
			s.position.x = Math.random() * width;
			s.position.y = -s.width / 2;
		}
		var x = state.pos.x + s.position.x / width;
		var y = state.pos.y + s.position.y / height;
		if (x < 0 || x > 1 || y < 0 || y > 1) {
			s.visible = false;
		} else {
			s.visible = true;
		}
	});
}
function initOnMove() {
	world.socket.on('move', data => {
		if (data.id === world.id) {
			state.pos.x += data.dx;
			state.pos.y += data.dy;
			moveStars(data);
		}
		if (state.snakes[data.id]) {
			return state.snakes[data.id].move(data);
		}
	});

	world.socket.on('state', function (e) {
		var snakeIds = e.snakes.reduce((acc, s) => (acc[s.id] = true) && acc, {});
		Object.keys(state.snakes).forEach(id => !snakeIds[id] && state.snakes[id].remove());
		e.snakes.forEach(data => {
			if(state.snakes[data.id]){
				state.snakes[data.id].update(data);
			} else {
				state.snakes[data.id] = new Snake({data})
			}
			if (data.id === world.id) {
				state.pos.x = data.parts[0][0] -0.5;
				state.pos.y = data.parts[0][1] -0.5;
			}
		});
		if(e.die === world.id){
			moveStars({dx:0, dy:0})
			world.sounds.crash2();
			state.died = Date.now();
			help('You Died');
			state.playing = false;
			setTimeout(() => state.playing = true, 2000);
		}
		state.mice = e.mice;
	});
}
