var state = {};
var world = {};
function fingerboss() {
	initWorld();
	initState();
	initBackground();
	initOnMove();

	// start animating
	animate();
	function animate() {
		requestAnimationFrame(animate);
		if (!state.playing) {
			world.renderer.render(world.mainStage);
			return;
		}
		var estimatedServerT = getEstimatedServerT(world);
		state.lastMove = state.lastMove || estimatedServerT;
		var dt = estimatedServerT - state.lastMove;
		if (dt <= 0) {
			return world.renderer.render(world.mainStage);
		}
		//move
		var height = world.renderer.view.height;
		var width = world.renderer.view.width;
		var velocity = world.velocity;
		var angle = state.angle;
		var dx = dt * velocity * Math.cos(angle);
		var dy = dt * velocity * Math.sin(angle);
		state.pos.x += dx;
		state.pos.y += dy;
		state.snake.move({dx, dy});
		world.socket.emit('move', state.snake.serialize());
		world.stars.forEach(s=> {
			s.position.x -= dx* s.scale.x * 2 * width;
			s.position.y -= dy* s.scale.y * 2 * height;
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
				s.position.y = - s.width / 2;
			}
		});
		state.lastMove = estimatedServerT;
		// render the container
		world.renderer.render(world.mainStage);
	}
}

function initBackground() {
	var width = world.renderer.view.width;
	var height = world.renderer.view.height;
	var texture = PIXI.Texture.fromImage('/particle.png');
	world.stars = Array.apply(null, Array(300)).map(() => {
		var star = new PIXI.Sprite(texture);
		star.anchor.x = star.anchor.y = 0.5;
		star.position.x = Math.random() * width;
		star.position.y = Math.random() * height;
		star.scale.x = star.scale.y = (0.25 + Math.random()*0.75)/2;
		star.alpha = (1.15 - star.scale.x*2)/1.15 * (0.95  + 0.1 * Math.random());
		world.starField.addChild(star);
		return star;
	}).concat(Array.apply(null, Array(500)).map(() => {
		var star = new PIXI.Sprite(texture);
		star.anchor.x = star.anchor.y = 0.5;
		star.position.x = Math.random() * width;
		star.position.y = Math.random() * height;
		star.scale.x = star.scale.y = (0.25 + Math.random()*0.75)/8;
		star.alpha = (1.15 - star.scale.x*2)/1.15 * (0.95  + 0.1 * Math.random());
		world.starField.addChild(star);
		return star;
	}));

}