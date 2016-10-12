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
		var now = Date.now();
		var lastMove = world.lastMove = world.lastMove || now;
		var dt = now - lastMove;
		if (dt <= 50) {
			return world.renderer.render(world.mainStage);
		}
		world.socket.emit('move', state.angle);
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