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
			world.renderer.render(world.mainStage);
			return;
		}
		computerPlayer(state, world);
		var estimatedServerT = getEstimatedServerT(world);
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
				}).to(c1.sprite, 0.3, {ease: Power2.easeOut, width: expectedWidth, height: expectedHeight});
			}
		});
		if (state.newCircle) {
			state.newCircle.sprite.position.x = state.newCircle.x * world.renderer.view.width;
			state.newCircle.sprite.position.y = state.newCircle.y * world.renderer.view.height;
			state.newCircle.sprite.width = state.newCircle.size * world.renderer.view.width;
			state.newCircle.sprite.height = state.newCircle.size * world.renderer.view.height;
		}
		//score state.circles out of frame (unverified by server, they might get killed)
		state.circles.forEach(function (c1) {
			var y = getMovedCircleY(world, c1, estimatedServerT);
			if (!c1.unverifiedScore && (y < -c1.size / 2 || y > 1 + c1.size / 2)) {
				state.scores[c1.color] = state.scores[c1.color] || {value: 0, level: c1.level};
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
				var styleColor = '#' + ('000000' + parseInt(key, 10).toString(16)).slice(-6);
				var s = state.scores[key];
				var score = Math.ceil(s.value * 500);
				var fontSize = Math.max(Math.ceil(world.renderer.view.height * 0.075), 30);
				var style = {
					font: 'bold ' + fontSize + 'px Impact, Futura-CondensedExtraBold, DroidSans, Charcoal, sans-serif',
					fill: styleColor
				};
				var levelStyle = {
					font: 'bold ' + Math.round(fontSize / 2.5) + 'px Impact, Futura-CondensedExtraBold, DroidSans, Charcoal, sans-serif',
					fill: styleColor,
					align: 'center'
				};
				var levelStr = (typeof s.level === 'number') ? 'level\n' + s.level : 'robot';
				if (s.text) {
					s.text.text = score + '';
					s.text.style = style;
					s.levelText.text = levelStr;
					s.levelText.style = levelStyle;
				} else {
					s.text = new PIXI.Text(score + '', style);
					world.stage.addChild(s.text);
					s.levelText = new PIXI.Text(levelStr, levelStyle);
					world.stage.addChild(s.levelText);
					s.text.anchor.y = s.levelText.anchor.y = 0.5;
				}
				s.levelText.position.y = s.text.position.y = 10 + Math.round((i * fontSize * 1.1) + s.text.height / 2);
				s.levelText.position.x = 10;
				s.text.position.x = 20 + s.levelText.width;
			});
		//new points
		state.scoreCircles.forEach(function (c) {
			var scoreSize = c.size === c.unverifiedScore ? c.size : c.size - (c.unverifiedScore || 0);
			if (!scoreSize) {
				killCircleSprite(world.stage, c.sprite);
				return;
			}
			var styleColor = '#' + ('000000' + parseInt(c.color, 10).toString(16)).slice(-6);
			var score = Math.max(Math.round(scoreSize * 500), 1);
			var scoreSizeFactor = (c.color === world.color) ? 1 : 0.3;
			var fontSize = Math.max(Math.ceil(world.renderer.view.height * (0.015 + scoreSize) * scoreSizeFactor), 30);
			var style = {
				font: 'bold ' + fontSize + 'px Impact, Futura-CondensedExtraBold, DroidSans, Charcoal, sans-serif',
				fill: styleColor
			};
			var text = new PIXI.Text('+' + score + ' ', style);
			text.anchor.x = 0.5;
			text.anchor.y = 0.5;
			var h = Math.ceil(text.height / 2);
			var w = Math.ceil(text.width / 2);
			var x = c.x * world.renderer.view.width;
			var y = getMovedCircleY(world, c, estimatedServerT);
			if (y > 1) {
				y = world.renderer.view.height - h;
				world.sounds.crash1(scoreSize);
				world.stage.removeChild(c.sprite);
			} else if (y < 0) {
				y = h;
				world.sounds.crash1(scoreSize);
				world.stage.removeChild(c.sprite);
			} else {
				y *= world.renderer.view.height;
				world.sounds.crash2(Math.min(scoreSize * 4, 1));
				setFire(world.stage, c);
				killCircleSprite(world.stage, c.sprite);
			}
			text.position.y = Math.min(Math.max(y, h), world.renderer.view.height - h);
			text.position.x = Math.min(Math.max(x, w), world.renderer.view.width - w);
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
			}).to(text, 2.5, {alpha: 0, width: text.width * 1.2, height: text.height * 1.2});
			var targetY = getMovedCircleY(world, c, estimatedServerT) > 1 ? text.position.y - h : text.position.y + h;
			text.tl2 = new TimelineMax({
				autoRemoveChildren: true
			}).to(text.position, 2.5, {y: targetY});
		});
		state.scoreCircles = [];
		//check for winner
		var winner = Object.keys(state.scores)
			.map(function (key) {
				var s = state.scores[key];
				var score = Math.ceil(s.value * 500);
				if (score < WINNING_SCORE) {
					return null;
				}
				return {score: score, color: key};
			})
			.filter(Boolean)
			.sort(function (s1, s2) {
				return s2.score - s1.score;
			})[0];
		if (winner) {
			var winningScores = state.scores;
			var levelUp = false;
			resetGame(state, world);
			var isWinner = winner.color === world.color.toString();
			if (isWinner) {
				setTimeout(world.sounds.fingerboss.bind(null, 1), 250);
				world.wins++;
				writeCookie('wins', world.wins);
				var newLevel = levelFromWins(world.wins);
				levelUp = world.level !== newLevel;
				if (levelUp) {
					world.level = newLevel;
				}
			} else {
				world.sounds.loose();
			}
			var str = isWinner ? 'You won!' : 'You lost';
			if (isWinner && levelUp) {
				str += '\nYou are now\nlevel: ' + world.level;
			} else if (isWinner) {
				str += '\nWins: ' + world.wins;
			}
			var text = getText(world, str, winner.color);
			text.anchor.x = 0.5;
			text.anchor.y = 0.5;
			text.x = Math.round(world.renderer.view.width / 2);
			text.y = Math.round(world.renderer.view.height / 2);
			world.stage.addChild(text);
			if (isWinner && !levelUp) {
				var nextLevelText = getText(world, 'Next level is at ' + Math.ceil(world.wins / 10) * 10 + ' wins', winner.color);
				nextLevelText.anchor.x = 0.5;
				nextLevelText.anchor.y = 0.5;
				text.y -= Math.round(nextLevelText.height / 2);
				nextLevelText.x = text.x;
				nextLevelText.y = text.y + Math.round(nextLevelText.height + (text.height / 2.3));
				world.stage.addChild(nextLevelText);
			}
			Object.keys(winningScores).forEach(function (key) {
				var s = winningScores[key];
				world.stage.addChild(s.text);
				world.stage.addChild(s.levelText);
			});
			state.playing = false;
			state.readyToPlay = false;
			setTimeout(function () {
				state.readyToPlay = true;
			}, 1500);
		}
		// render the container
		world.renderer.render(world.mainStage);
	}
}