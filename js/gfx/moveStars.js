function moveStars({dx, dy}) {
	var height = world.height;
	var width = world.width;
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