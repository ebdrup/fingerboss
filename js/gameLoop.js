var state = {};
var world = {};
function fingerboss() {
	initWorld();
	initState();
	initBackground();
	listen();

	// start animating
	animate();
	function animate() {
		requestAnimationFrame(animate);
		TWEEN.update();
		if (!state.playing) {
			world.renderer.render(world.mainStage);
			return;
		}
		//sending snake move to server
		var now = Date.now();
		var lastMove = world.lastMove = world.lastMove || now;
		var dt = now - lastMove;
		if (dt <= 10) {
			return world.renderer.render(world.mainStage);
		}
		if (dt > 100) {
			dt = 100;
		}
		world.lastMove = now;
		var snake = state.snakes[world.id];
		var velocity = snake.velocity;
		var dx = dt * velocity * Math.cos(state.angle);
		var dy = dt * velocity * Math.sin(state.angle);
		var move = Object.assign(snake.getMaxMove({dx, dy}), {c: ++snake.sendCounter});
		world.socket.emit('move', move);
		setTimeout(()=> {
			state.pos.x += move.dx;
			state.pos.y += move.dy;
			moveStars(move);
			var movement = snake.move(move);
			if (snake.snakeCollision(movement, now)) {
				var oldPos = snake.parts[0];
				snake.die();
				sfx['crash' + (Math.floor(Math.random() * 2) + 1)]();
				help({text: 'You Died'});
				state.playing = false;
				setTimeout(() => {
					state.playing = true;
					var x = snake.parts[0].x;
					var y = snake.parts[0].y;
					state.pos.x = x - 0.5;
					state.pos.y = y - 0.5;
					moveStars({dx: x - oldPos.x, dy: y - oldPos.y});
				}, 2000);
				return world.socket.emit('die', snake.serialize());
			}
			var mouseEaten = snake.mouseCollision();
			if (mouseEaten) {
				var text;
				switch (mouseEaten.type) {
					case 'speed':
						if (snake.velocity <= VELOCITY * 1.5) {
							snake.velocity += VELOCITY * 0.1;
							text = 'faster';
						} else {
							snake.addLength(10);
							text = 'longer';
						}
						break;
					case 'power':
						text = '+1 power kick';
						snake.power++;
						break;
				}
				if (text) {
					help({text, alpha: 0.5, duration: 500});
				}
				world.socket.emit('mouseEaten', {mouseId: mouseEaten.id, snake: snake.serialize()});
			}
		}, 50);
		//goals
		if (state.goals) {
			world.goals && world.goals.forEach(goal => world.stage.removeChild(goal));
			world.goals = state.goals.map(goal => sprite(goal))
				.concat(
					state.goals.map(goal => sprite(Object.assign({}, goal, {type: 'goal-net'})))
				);
			world.goals.forEach(goal=> world.stage.addChild(goal));
			var myGoal = state.goals.filter(goal => goal.color === world.color)[0];
			if (myGoal) {
				pointer(Object.assign({}, myGoal, {text: 'Goal'}));
			}
		}
		//ball
		if (state.ball) {
			world.ball && world.stage.removeChild(world.ball);
			world.ball = sprite(Object.assign(state.ball, {type: 'ball'}));
			world.stage.addChild(world.ball);
			pointer(Object.assign({}, state.ball, {text: 'Ball'}));
		}
		//mice
		for (var i = world.mice.children.length - 1; i >= 0; i--) {
			world.mice.removeChild(world.mice.children[i]);
		}
		state.mice.forEach(mouse => {
			world.mice.addChild(sprite(mouse));
		});
		//scores
		if (state.scores) {
			Object.keys(world.scores).forEach(color => {
				if (typeof state.scores[color] !== 'number') {
					world.stage.removeChild(world.scores[color]);
					delete world.scores[color];
				}
			});
			Object.keys(state.scores)
				.sort(function (key1, key2) {
					var score1 = state.scores[key1];
					var score2 = state.scores[key2];
					return score2 - score1;
				})
				.forEach(function (color, i) {
					var styleColor = '#' + ('000000' + parseInt(color, 10).toString(16)).slice(-6);
					var score = state.scores[color];
					var fontSize = Math.max(Math.ceil(world.renderer.view.height * 0.075), 30);
					var style = {
						fontSize: fontSize + 'px',
						fontFamily: 'Impact, Futura-CondensedExtraBold, DroidSans, Charcoal, sans-serif',
						fill: styleColor
					};
					var scoreSprite = world.scores[color];
					if (scoreSprite) {
						scoreSprite.text = score + '';
						scoreSprite.style = style;
					} else {
						scoreSprite = world.scores[color] = new PIXI.Text(score + '', style);
						scoreSprite.anchor.y = 0.5;
						world.stage.addChild(scoreSprite);
					}
					scoreSprite.position.y = 10 + Math.round((i * fontSize * 1.1) + scoreSprite.height / 2);
					scoreSprite.position.x = 20;
				});
		}
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
		star.scale.x = star.scale.y = (0.25 + Math.random() * 0.75) / 2;
		star.alpha = (1.15 - star.scale.x * 2) / 1.15 * (0.95 + 0.1 * Math.random());
		world.starField.addChild(star);
		return star;
	}).concat(Array.apply(null, Array(500)).map(() => {
		var star = new PIXI.Sprite(texture);
		star.anchor.x = star.anchor.y = 0.5;
		star.position.x = Math.random() * width;
		star.position.y = Math.random() * height;
		star.scale.x = star.scale.y = (0.25 + Math.random() * 0.75) / 8;
		star.alpha = (1.15 - star.scale.x * 2) / 1.15 * (0.95 + 0.1 * Math.random());
		world.starField.addChild(star);
		return star;
	}));

}