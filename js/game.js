function fingerboss() {
	var START_SIZE = 170 / 800;
	var KILL_SIZE = 5 / 800;
	var MIN_SIZE = START_SIZE + KILL_SIZE + 1 / 800;
	var END_SIZE = 700 / 800;
	var GROW_TIME = 6;
	var GROWING_ALPHA = 0.5;
	var UNCONFIRMED_ALPHA = 0.8;
	var CONFIRMED_SIZE_FACTOR = 1 / 3;
	var KILL_SCORE_FACTOR = 2;
	var WINNING_SCORE = 50;
	var socket = io();
	var textures = {};
	var state = {};
	var world = {};
	var sounds = sfx();
	initWorld(world);
	resetGame(state);
	
	socket.on('start', function (e) {
		state.color = e.color;
		world.velocity = e.velocity;
		world.dClock = Date.now() - e.t;
		world.dClocks.push(world.dClock);
	});
	var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {
		backgroundColor: 0x000000,
		antialias: true
	});
	document.body.appendChild(renderer.view);
	window.onresize = function () {
		renderer.resize(window.innerWidth, window.innerHeight);
		state.background.width = renderer.view.width;
		state.background.height = renderer.view.height;
		state.circles.forEach(function (c) {
			state.stage.removeChild(c.sprite);
			c.sprite = generateSpriteForCircle(c);
			state.stage.addChild(c.sprite);
		});
	};
	state.stage = new PIXI.Container();
	state.background = getInteraction(state);
	state.stage.addChild(state.background);

	function getInnerCircleSize(newCircle) {
		return (newCircle.size - START_SIZE) * CONFIRMED_SIZE_FACTOR;
	}

	function getInteraction(state) {
		var gfx = new PIXI.Graphics();
		gfx.beginFill(0x000000);
		gfx.drawRect(0, 0, 1, 1);
		var sprite = new PIXI.Sprite(gfx.generateTexture());
		// center the sprite's anchor point
		sprite.width = renderer.view.width;
		sprite.height = renderer.view.height;
		sprite.interactive = true;
		sprite.on('mousedown', onDown);
		sprite.on('touchstart', onDown);
		sprite.on('mousemove', onMove);
		sprite.on('touchmove', onMove);
		sprite.on('mouseup', onUp);
		sprite.on('touchend', onUp);
		return sprite;

		function onDown(e) {
			if (state.newCircle || !state.color || !state.readyToPlay) {
				return;
			}
			if (!state.playing && state.readyToPlay) {
				resetGame(state);
			}
			state.newCircle = {
				id: Math.random() + '_' + Date.now(),
				x: getX(e),
				y: getY(e),
				size: START_SIZE,
				color: state.color
			};
			var innerCircle = JSON.parse(JSON.stringify(state.newCircle));
			innerCircle.size = getInnerCircleSize(state.newCircle);
			state.newCircle.tl = new TimelineMax()
				.to(state.newCircle, GROW_TIME, {size: END_SIZE, ease: Power1.easeOut})
			state.newCircle.sprite = generateSpriteForCircle(state.newCircle);
			state.newCircle.sprite.alpha = GROWING_ALPHA;
			state.newCircle.innerSprite = generateSpriteForCircle(innerCircle);
			state.newCircle.innerSprite.alpha = UNCONFIRMED_ALPHA;
			state.stage.addChild(state.newCircle.sprite);
			state.stage.addChild(state.newCircle.innerSprite);
		}

		function getX(e) {
			return Math.min(Math.max(e.data.global.x / renderer.view.width, 0), 1);
		}

		function getY(e) {
			return Math.min(Math.max(e.data.global.y / renderer.view.height, 0), 1);
		}

		function onMove(e) {
			if (state.newCircle) {
				state.newCircle.x = getX(e);
				state.newCircle.y = getY(e);
			}
		}

		function onUp(e) {
			if (state.newCircle) {
				state.newCircle.tl.kill();
				delete state.newCircle.tl;
				state.stage.removeChild(state.newCircle.sprite);
				delete state.newCircle.sprite;
				state.stage.removeChild(state.newCircle.innerSprite);
				delete state.newCircle.innerSprite;
				if (state.newCircle.size > MIN_SIZE) {
					state.newCircle.size = getInnerCircleSize(state.newCircle);
					socket.emit('circle', {
						owner: world.id,
						id: state.newCircle.id,
						x: state.newCircle.x,
						y: state.newCircle.y,
						size: state.newCircle.size,
						localTime: Date.now()
					});
					state.newCircle.sprite = generateSpriteForCircle(state.newCircle);
					state.newCircle.sprite.alpha = UNCONFIRMED_ALPHA;
					state.unconfirmedCircless[state.newCircle.id] = state.newCircle;
					state.stage.addChild(state.newCircle.sprite)
				}
				state.newCircle = null;
			}
		}
	}

	function generateSpriteForCircle(c) {
		var w = renderer.view.width, h = renderer.view.height;
		var key = w + '_' + h + '_' + c.color;
		var texture = textures[key];
		if (!texture) {
			var gfx = new PIXI.Graphics();
			gfx.beginFill(c.color);
			gfx.drawEllipse(0, 0, 0.1 * w, 0.1 * h);
			textures[key] = texture = gfx.generateTexture();
		}
		var sprite = new PIXI.Sprite(texture);
		// center the sprite's anchor point
		sprite.anchor.x = 0.5;
		sprite.anchor.y = 0.5;
		sprite.position.x = c.x * renderer.view.width;
		sprite.position.y = c.y * renderer.view.height;
		sprite.width = c.size * renderer.view.width;
		sprite.height = c.size * renderer.view.height;
		return sprite;
	}

	socket.on('circle', function (c) {
		// find median latency
		if (c.owner === world.id) {
			world.latencies.push(Date.now() - c.localTime);
			world.latencies.sort();
			if (world.latencies.length === 600) {
				world.latencies = world.latencies.slice(200, 400);
			}
			world.latency = world.latencies[Math.floor(world.latencies.length / 2)];
		}
		// find median clockDifference
		if (c.owner === world.id) {
			world.dClocks.push(Date.now() - c.t);
			world.dClocks.sort();
			if (world.dClocks.length === 600) {
				world.dClocks = world.dClocks.slice(200, 400);
			}
			world.dClock = world.dClocks[Math.floor(world.dClocks.length / 2)];
		}
		if (!state.playing) {
			return;
		}
		//play sound
		sounds.newCircle();
		//remove unconfirmed circle
		c.sprite = generateSpriteForCircle(c);
		state.stage.addChild(c.sprite);
		state.circles.push(c);
		var uc = state.unconfirmedCircless[c.id];
		if (uc) {
			state.stage.removeChild(uc.sprite);
			delete state.unconfirmedCircless[c.id]
		}
		//collision detection
		var indexesToRemove = [];
		var anyCollision, anyKill;
		for (var i = 0; i < state.circles.length - 1; i++) {
			var c1 = state.circles[i];
			if (!c1 || !c || c1.color === c.color) {
				continue;
			}
			var distance = Math.sqrt(
				Math.pow(Math.abs(c1.x - c.x), 2) +
				Math.pow(Math.abs(getMovedCircleY(c1, c.t) - getMovedCircleY(c, c.t)), 2)
			);
			var minDistance = (c1.size + c.size);
			if (distance < minDistance) {
				var anyCollision = true;
				var cSize = c.size;
				c.size -= c1.size;
				c1.size -= cSize;
				if (c1.size <= KILL_SIZE) {
					anyKill = true;
					indexesToRemove.push(i);
					killCircleSprite(state.stage, c1.sprite);
					//scoreCircle for kill
					state.scores[c.color] = state.scores[c.color] || {value: 0};
					var scoreCircle = {
						t: c.t,
						x: c.x,
						y: c.y,
						size: (c1.size + cSize) * KILL_SCORE_FACTOR,
						color: c.color
					};
					state.scores[c.color].value += scoreCircle.size;
					state.scoreCircles.push(scoreCircle);
					state.killCount++;
					if (state.killCount === 1) {
						help('Your first kill!')
					}
				}
				if (c.size <= KILL_SIZE) {
					state.circles.pop(); // remove c
					killCircleSprite(state.stage, c.sprite);
					break;
				}
			}
		}
		if (anyCollision && !anyKill) {
			sounds.shrink();
			if (c.color === state.color) {
				state.shrinkCount++;
				if (state.shrinkCount === 1 || state.shrinkCount === 10) {
					help('Try holding down longer');
				}
			}
		}
		indexesToRemove.forEach(function (i) {
			var c1 = state.circles[i];
			state.scores[c1.color] = state.scores[c1.color] || {value: 0};
			state.scores[c1.color].value -= (c1.unverifiedScore || 0); //remove state.scores added but not supposed to be
			delete state.circles[i];
		});
		state.circles = state.circles.filter(Boolean);
		//remove state.circles out of frame
		state.circles.forEach(function (c1, i) {
			var y = getMovedCircleY(c1, c.t);
			if (y < -c1.size || y > 1 + c1.size) {
				state.scores[c1.color] = state.scores[c1.color] || {value: 0};
				var scoreToAdd = c1.size - (c1.unverifiedScore || 0);
				state.scores[c1.color].value += scoreToAdd;
				if (scoreToAdd > 0.0000001) {
					state.scoreCircles.push(c1);
				}
				delete state.circles[i];
				state.stage.removeChild(c1.sprite);
			}
		});
		state.circles = state.circles.filter(Boolean);

	});
	function getMovedCircleY(c, t) {
		var dt = c.t - t;
		return c.y > 0.5 ? c.y + dt * world.velocity : c.y - dt * world.velocity;
	}

	// start animating
	animate();
	function animate() {
		requestAnimationFrame(animate);
		if (!state.playing) {
			renderer.render(state.stage);
			return;
		}
		var estimatedServerT = Date.now() - world.dClock + world.latency / 2;
		state.circles.forEach(function (c1) {
			var y = getMovedCircleY(c1, estimatedServerT);
			c1.sprite.position.y = y * renderer.view.height;
			var expectedWidth = c1.size * renderer.view.width;
			var expectedHeight = c1.size * renderer.view.height;
			if (!c1.sprite.tl && (expectedWidth !== c1.sprite.width || expectedHeight !== c1.sprite.height)) {
				//resize sprite
				c1.sprite.tl = new TimelineMax({
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
			state.newCircle.sprite.position.x = state.newCircle.x * renderer.view.width;
			state.newCircle.sprite.position.y = state.newCircle.y * renderer.view.height;
			state.newCircle.sprite.width = state.newCircle.size * renderer.view.width;
			state.newCircle.sprite.height = state.newCircle.size * renderer.view.height;
			var innerCircleSize = getInnerCircleSize(state.newCircle);
			state.newCircle.innerSprite.width = innerCircleSize * renderer.view.width;
			state.newCircle.innerSprite.height = innerCircleSize * renderer.view.height;
			state.newCircle.innerSprite.position.x = state.newCircle.x * renderer.view.width;
			state.newCircle.innerSprite.position.y = state.newCircle.y * renderer.view.height;
		}
		//score state.circles out of frame (unverified by server, they might get killed)
		state.circles.forEach(function (c1, i) {
			var y = getMovedCircleY(c1, estimatedServerT);
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
				var styleColor = '#' + parseInt(key, 10).toString(16);
				var s = state.scores[key];
				var score = Math.ceil(s.value * 500 * CONFIRMED_SIZE_FACTOR);
				var fontSize = Math.max(Math.ceil(renderer.view.height * 0.075), 30);
				var style = {
					font: 'bold ' + fontSize + 'px Impact, Futura-CondensedExtraBold, DroidSans, Charcoal, sans-serif',
					fill: styleColor
				};
				if (s.text) {
					s.text.text = score + '';
					s.text.style = style;
				} else {
					s.text = new PIXI.Text(score + '', style);
					state.stage.addChild(s.text);
				}
				s.text.position.y = 10 + Math.round((i * fontSize * 1.1));
				s.text.position.x = 10;
			});
		//new points
		state.scoreCircles.forEach(function (c, i) {
			var styleColor = '#' + parseInt(c.color, 10).toString(16);
			var scoreSize = c.size === c.unverifiedScore ? c.size : c.size - (c.unverifiedScore || 0);
			var score = Math.max(Math.round(scoreSize * 500 * CONFIRMED_SIZE_FACTOR), 1);
			var scoreSizeFactor = (c.color === state.color) ? 1 : 0.3;
			var fontSize = Math.max(Math.ceil(renderer.view.height * (0.015 + scoreSize) * scoreSizeFactor), 30);
			var style = {
				font: 'bold ' + fontSize + 'px Impact, Futura-CondensedExtraBold, DroidSans, Charcoal, sans-serif',
				fill: styleColor
			};
			var text = new PIXI.Text('+' + score + ' ', style);
			text.anchor.x = 0.5;
			text.anchor.y = 0.5;
			var h = Math.ceil(text.height / 2);
			var y = getMovedCircleY(c, estimatedServerT);
			if (y > 1) {
				y = renderer.view.height - h;
					sounds.crash1(scoreSize);
			} else if (y < 0) {
				y = h;
				sounds.crash1(scoreSize);
			} else {
				y *= renderer.view.height;
				sounds.crash2(Math.min(scoreSize * 4, 1));
			}
			text.position.y = y;
			text.position.x = c.x * renderer.view.width;
			state.stage.addChild(text);
			text.tl = new TimelineMax({
				onComplete: function () {
					state.stage.removeChild(text);
					if (text.tl) {
						text.tl.kill();
						delete text.tl;
					}
				}
			}).to(text, 1.5, {alpha: 0, width: text.width * 1.2, height: text.height * 1.2});
			var targetY = getMovedCircleY(c, estimatedServerT) > 1 ? text.position.y - h : text.position.y + h;
			text.tl2 = new TimelineMax({}).to(text.position, 1.5, {y: targetY});

		});
		state.scoreCircles = [];
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
			resetGame(state);
			var isWinner = winner.color === state.color.toString();
			if (isWinner) {
				sounds.win();
			} else {
				sounds.loose();
			}
			var str = isWinner ? 'You won!' : 'You lost';
			var fontSize = Math.max(Math.ceil(renderer.view.width * 0.20), 30);
			var style = {
				font: 'bold ' + fontSize + 'px Impact, Futura-CondensedExtraBold, DroidSans, Charcoal, sans-serif',
				fill: '#' + parseInt(winner.color, 10).toString(16)
			};
			var text = new PIXI.Text(str, style);
			text.anchor.x = 0.5;
			text.anchor.y = 0.5;
			text.x = Math.round(renderer.view.width / 2);
			text.y = Math.round(renderer.view.height / 2);
			Object.keys(winningScores).forEach(function (key) {
				var s = winningScores[key];
				state.stage.addChild(s.text);
			});
			state.stage.addChild(text);
			state.playing = false;
			state.readyToPlay = false;
			setTimeout(function () {
				state.readyToPlay = true;
			}, 2000);
		}
		// render the container
		renderer.render(state.stage);
	}


	function killCircleSprite(stage, sprite) {
		if (sprite.tl) {
			sprite.tl.kill();
			delete sprite.tl;
		}
		sprite.tl = new TimelineMax({
			onComplete: function () {
				stage.removeChild(sprite);
				if (sprite.tl) {
					sprite.tl.kill();
					delete sprite.tl;
				}
			}
		}).to(sprite.scale, 0.5, {x: 0, y: 0});
	}

	function help(str) {
		var fontSize = Math.max(Math.ceil(renderer.view.width * 2 / str.length), 20);
		var style = {
			font: 'bold ' + fontSize + 'px Impact, Futura-CondensedExtraBold, DroidSans, Charcoal, sans-serif',
			fill: '#' + parseInt(state.color, 10).toString(16)
		};
		var text = new PIXI.Text(str, style);
		text.anchor.x = 0.5;
		text.anchor.y = 0.5;
		var h = text.height;
		text.x = Math.round(renderer.view.width / 2);
		text.y = Math.round(h / 2 + (renderer.view.height - h) * Math.random());
		state.stage.addChild(text);
		fadeSprite(state.stage, text)

	}

	function fadeSprite(stage, sprite) {
		if (sprite.tl) {
			sprite.tl.kill();
			delete sprite.tl;
		}
		sprite.tl = new TimelineMax({
			onComplete: function () {
				stage.removeChild(sprite);
				if (sprite.tl) {
					sprite.tl.kill();
					delete sprite.tl;
				}
			}
		}).to(sprite, 8, {alpha: 0});
	}
}