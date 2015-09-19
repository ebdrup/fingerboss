function fingerboss() {
	var state = {};
	var world = {};
	resetGame(state, world);
	initWorld(state, world);

	// start animating
	animate();
	function animate() {
		requestAnimationFrame(animate);
		if (!state.playing) {
			world.renderer.render(world.stage);
			return;
		}
		var estimatedServerT = Date.now() - world.dClock + world.latency / 2;
		state.circles.forEach(function (c1) {
			var y = getMovedCircleY(world, c1, estimatedServerT);
			c1.sprite.position.y = y * world.renderer.view.height;
			var expectedWidth = c1.size * world.renderer.view.width;
			var expectedHeight = c1.size * world.renderer.view.height;
			if (!c1.sprite.tl && (expectedWidth !== c1.sprite.width || expectedHeight !== c1.sprite.height)) {
				//resize sprite
				c1.sprite.tl = new TimelineMax({
					autoRemoveChildren: true,
					onComplete: function () {
						if (c1.sprite.tl) {
							c1.sprite.tl.kill();
							delete c1.sprite.tl;
						}
					}
				}).to(c1.sprite, 0.3, {width: expectedWidth, height: expectedHeight});
			}
		});
		if (state.newCircle) {
			state.newCircle.sprite.position.x = state.newCircle.x * world.renderer.view.width;
			state.newCircle.sprite.position.y = state.newCircle.y * world.renderer.view.height;
			state.newCircle.sprite.width = state.newCircle.size * world.renderer.view.width;
			state.newCircle.sprite.height = state.newCircle.size * world.renderer.view.height;
			var innerCircleSize = getInnerCircleSize(state.newCircle);
			state.newCircle.innerSprite.width = innerCircleSize * world.renderer.view.width;
			state.newCircle.innerSprite.height = innerCircleSize * world.renderer.view.height;
			state.newCircle.innerSprite.position.x = state.newCircle.x * world.renderer.view.width;
			state.newCircle.innerSprite.position.y = state.newCircle.y * world.renderer.view.height;
		}
		//score state.circles out of frame (unverified by server, they might get killed)
		state.circles.forEach(function (c1, i) {
			var y = getMovedCircleY(world, c1, estimatedServerT);
			if (!c1.unverifiedScore && (y < -c1.size || y > 1 + c1.size)) {
				state.scores[c1.color] = state.scores[c1.color] || {value: 0};
				state.scores[c1.color].value += c1.size;
				c1.unverifiedScore = c1.size;
				state.scoreCircles.push(c1);
			}
		});
		// state.scores
		Object.keys(state.scores)
			.sort(function (key1, key2) {
				var score1 = state.scores[key1].value;
				var score2 = state.scores[key2].value;
				return score2 - score1;
			})
			.forEach(function (key, i) {
				var styleColor = '#' +('000000' + parseInt(key, 10).toString(16)).slice(-6);
				var s = state.scores[key];
				var score = Math.ceil(s.value * 500 * CONFIRMED_SIZE_FACTOR);
				var fontSize = Math.max(Math.ceil(world.renderer.view.height * 0.075), 30);
				var style = {
					font: 'bold ' + fontSize + 'px Impact, Futura-CondensedExtraBold, DroidSans, Charcoal, sans-serif',
					fill: styleColor
				};
				if (s.text) {
					s.text.text = score + '';
					s.text.style = style;
				} else {
					s.text = new PIXI.Text(score + '', style);
					world.stage.addChild(s.text);
				}
				s.text.position.y = 10 + Math.round((i * fontSize * 1.1));
				s.text.position.x = 10;
			});
		//new points
		state.scoreCircles.forEach(function (c, i) {
			var styleColor = '#' + ('000000' + parseInt(c.color, 10).toString(16)).slice(-6);
			var scoreSize = c.size === c.unverifiedScore ? c.size : c.size - (c.unverifiedScore || 0);
			var score = Math.max(Math.round(scoreSize * 500 * CONFIRMED_SIZE_FACTOR), 1);
			var scoreSizeFactor = (c.color === state.color) ? 1 : 0.3;
			var fontSize = Math.max(Math.ceil(world.renderer.view.height * (0.015 + scoreSize) * scoreSizeFactor), 30);
			var style = {
				font: 'bold ' + fontSize + 'px Impact, Futura-CondensedExtraBold, DroidSans, Charcoal, sans-serif',
				fill: styleColor
			};
			var text = new PIXI.Text('+' + score + ' ', style);
			text.anchor.x = 0.5;
			text.anchor.y = 0.5;
			var h = Math.ceil(text.height / 2);
			var y = getMovedCircleY(world, c, estimatedServerT);
			if (y > 1) {
				y = world.renderer.view.height - h;
					world.sounds.crash1(scoreSize);
			} else if (y < 0) {
				y = h;
				world.sounds.crash1(scoreSize);
			} else {
				y *= world.renderer.view.height;
				world.sounds.crash2(Math.min(scoreSize * 4, 1));
			}
			text.position.y = y;
			text.position.x = c.x * world.renderer.view.width;
			world.stage.addChild(text);
			text.tl = new TimelineMax({
				autoRemoveChildren: true,
				onComplete: function () {
					world.stage.removeChild(text);
					if (text.tl) {
						text.tl.kill();
						delete text.tl;
					}
				}
			}).to(text, 1.5, {alpha: 0, width: text.width * 1.2, height: text.height * 1.2});
			var targetY = getMovedCircleY(world, c, estimatedServerT) > 1 ? text.position.y - h : text.position.y + h;
			text.tl2 = new TimelineMax({
				autoRemoveChildren: true
			}).to(text.position, 1.5, {y: targetY});
		});
		state.scoreCircles = [];
		//check for winner
		var winner = Object.keys(state.scores)
			.map(function (key) {
				var s = state.scores[key];
				var score = Math.ceil(s.value * 500 * CONFIRMED_SIZE_FACTOR);
				if (score < WINNING_SCORE) {
					return null;
				}
				return {score: score, color: key};
			})
			.filter(Boolean)[0];
		if (winner) {
			var winningScores = state.scores;
			resetGame(state, world);
			var isWinner = winner.color === state.color.toString();
			if (isWinner) {
				world.sounds.win();
			} else {
				world.sounds.loose();
			}
			var str = isWinner ? 'You won!' : 'You lost';
			var fontSize = Math.max(Math.ceil(world.renderer.view.width * 0.20), 30);
			var style = {
				font: 'bold ' + fontSize + 'px Impact, Futura-CondensedExtraBold, DroidSans, Charcoal, sans-serif',
				fill: '#' + ('000000' + parseInt(winner.color, 10).toString(16)).slice(-6)
			};
			var text = new PIXI.Text(str, style);
			text.anchor.x = 0.5;
			text.anchor.y = 0.5;
			text.x = Math.round(world.renderer.view.width / 2);
			text.y = Math.round(world.renderer.view.height / 2);
			Object.keys(winningScores).forEach(function (key) {
				var s = winningScores[key];
				world.stage.addChild(s.text);
			});
			world.stage.addChild(text);
			state.playing = false;
			state.readyToPlay = false;
			setTimeout(function () {
				state.readyToPlay = true;
			}, 1500);
		}
		// render the container
		world.renderer.render(world.stage);
	}
}