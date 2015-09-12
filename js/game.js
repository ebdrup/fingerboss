function game() {
	var START_SIZE = 170 / 800;
	var KILL_SIZE = 5 / 800;
	var MIN_SIZE = START_SIZE + KILL_SIZE + 1 / 800;
	var END_SIZE = 700 / 800;
	var GROW_TIME = 6;
	var GROWING_ALPHA = 0.5;
	var UNCONFIRMED_ALPHA = 0.8;
	var CONFIRMED_SIZE_FACTOR = 1 / 3;
	var KILL_SCORE_FACTOR = 2;
	var SOUND = true;
	var newConfirmedCircleSound = new Howl({
		urls: ['newConfirmedCircle.mp3'],
		volume: 0.3
	});
	var crashSound1 = new Howl({
		urls: ['crash1.mp3'],
		volume: 0.3
	});
	var crashSound2 = new Howl({
		urls: ['crash2.mp3'],
		volume: 0.3
	});
	var socket = io();
	var circles = [];
	var unconfirmedCircles = {};
	var newCircle, scoreCircles = [];
	var color, dClock, dClocks = [], latency = 120, latencies = [], velocity, textures = {}, scores = {};
	var myId = Math.random() + '_' + Date.now();
	socket.on('start', function (e) {
		color = e.color;
		velocity = e.velocity;
		dClock = Date.now() - e.t;
		dClocks.push(dClock);
	});
	var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {
		backgroundColor: 0x000000,
		antialias: true
	});
	document.body.appendChild(renderer.view);
	window.onresize = function () {
		renderer.resize(window.innerWidth, window.innerHeight);
		bg.width = renderer.view.width;
		bg.height = renderer.view.height;
		circles.forEach(function (c) {
			stage.removeChild(c.sprite);
			c.sprite = generateSpriteForCircle(c);
			stage.addChild(c.sprite);
		});
	};
	var stage = new PIXI.Container();
	var bg = getInteraction();
	stage.addChild(bg);

	function getInnerCircleSize(newCircle) {
		return (newCircle.size - START_SIZE) * CONFIRMED_SIZE_FACTOR;
	}

	function getInteraction() {
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
			if (newCircle || !color) {
				return;
			}
			newCircle = {
				id: Math.random() + '_' + Date.now(),
				x: getX(e),
				y: getY(e),
				size: START_SIZE,
				color: color
			};
			var innerCircle = JSON.parse(JSON.stringify(newCircle));
			innerCircle.size = getInnerCircleSize(newCircle);
			newCircle.tl = new TimelineMax()
				.to(newCircle, GROW_TIME, {size: END_SIZE, ease: Power1.easeOut})
			newCircle.sprite = generateSpriteForCircle(newCircle);
			newCircle.sprite.alpha = GROWING_ALPHA;
			newCircle.innerSprite = generateSpriteForCircle(innerCircle);
			newCircle.innerSprite.alpha = UNCONFIRMED_ALPHA;
			stage.addChild(newCircle.sprite);
			stage.addChild(newCircle.innerSprite);
		}

		function getX(e) {
			return Math.min(Math.max(e.data.global.x / renderer.view.width, 0), 1);
		}

		function getY(e) {
			return Math.min(Math.max(e.data.global.y / renderer.view.height, 0), 1);
		}

		function onMove(e) {
			if (newCircle) {
				newCircle.x = getX(e);
				newCircle.y = getY(e);
			}
		}

		function onUp(e) {
			if (newCircle) {
				newCircle.tl.kill();
				delete newCircle.tl;
				stage.removeChild(newCircle.sprite);
				delete newCircle.sprite;
				stage.removeChild(newCircle.innerSprite);
				delete newCircle.innerSprite;
				if (newCircle.size > MIN_SIZE) {
					newCircle.size = getInnerCircleSize(newCircle);
					socket.emit('circle', {
						owner: myId,
						id: newCircle.id,
						x: newCircle.x,
						y: newCircle.y,
						size: newCircle.size,
						localTime: Date.now()
					});
					newCircle.sprite = generateSpriteForCircle(newCircle);
					newCircle.sprite.alpha = UNCONFIRMED_ALPHA;
					unconfirmedCircles[newCircle.id] = newCircle;
					stage.addChild(newCircle.sprite)
				}
				newCircle = null;
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
		if (c.owner === myId) {
			latencies.push(Date.now() - c.localTime);
			latencies.sort();
			if (latencies.length === 600) {
				latencies = latencies.slice(200, 400);
			}
			latency = latencies[Math.floor(dClocks.length / 2)];
		}
		// find median clockDifference
		if (c.owner === myId) {
			dClocks.push(Date.now() - c.t);
			dClocks.sort();
			if (dClocks.length === 600) {
				dClocks = dClocks.slice(200, 400);
			}
			dClock = dClocks[Math.floor(dClocks.length / 2)];
		}
		//play sound
		SOUND && newConfirmedCircleSound.play();
		//remove unconfirmed circle
		c.sprite = generateSpriteForCircle(c);
		stage.addChild(c.sprite);
		circles.push(c);
		var uc = unconfirmedCircles[c.id];
		if (uc) {
			stage.removeChild(uc.sprite);
			delete unconfirmedCircles[c.id]
		}
		//collision detection
		var indexesToRemove = [];
		for (var i = 0; i < circles.length - 1; i++) {
			var c1 = circles[i];
			if (!c1 || !c || c1.color === c.color) {
				continue;
			}
			var distance = Math.sqrt(
				Math.pow(Math.abs(c1.x - c.x), 2) +
				Math.pow(Math.abs(getMovedCircleY(c1, c.t) - getMovedCircleY(c, c.t)), 2)
			);
			var minDistance = (c1.size + c.size);
			if (distance < minDistance) {
				var cSize = c.size;
				c.size -= c1.size;
				c1.size -= cSize;
				if (c1.size <= KILL_SIZE) {
					indexesToRemove.push(i);
					killCircleSprite(stage, c1.sprite);
					//scoreCircle for kill
					scores[c.color] = scores[c.color] || {value: 0};
					var scoreCircle = {
						t: c.t,
						x: c.x,
						y: c.y,
						size: (c1.size + cSize) * KILL_SCORE_FACTOR,
						color: c.color
					};
					scores[c.color].value += scoreCircle.size;
					scoreCircles.push(scoreCircle);
				}
				if (c.size <= KILL_SIZE) {
					circles.pop(); // remove c
					killCircleSprite(stage, c.sprite);
					break;
				}
			}
		}
		indexesToRemove.forEach(function (i) {
			var c1 = circles[i];
			scores[c1.color] = scores[c1.color] || {value: 0};
			scores[c1.color].value -= (c1.unverifiedScore || 0); //remove scores added but not supposed to be
			delete circles[i];
		});
		circles = circles.filter(Boolean);
		//remove circles out of frame
		circles.forEach(function (c1, i) {
			var y = getMovedCircleY(c1, c.t);
			if (y < -c1.size || y > 1 + c1.size) {
				scores[c1.color] = scores[c1.color] || {value: 0};
				var scoreToAdd = c1.size - (c1.unverifiedScore || 0);
				scores[c1.color].value += scoreToAdd;
				if (scoreToAdd > 0.0000001) {
					scoreCircles.push(c1);
				}
				delete circles[i];
				stage.removeChild(c1.sprite);
			}
		});
		circles = circles.filter(Boolean);

	});
	function getMovedCircleY(c, t) {
		var dt = c.t - t;
		return c.y > 0.5 ? c.y + dt * velocity : c.y - dt * velocity;
	}

	// start animating
	animate();
	function animate() {
		requestAnimationFrame(animate);
		var estimatedServerT = Date.now() - dClock + latency / 2;
		circles.forEach(function (c1) {
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
		if (newCircle) {
			newCircle.sprite.position.x = newCircle.x * renderer.view.width;
			newCircle.sprite.position.y = newCircle.y * renderer.view.height;
			newCircle.sprite.width = newCircle.size * renderer.view.width;
			newCircle.sprite.height = newCircle.size * renderer.view.height;
			var innerCircleSize = getInnerCircleSize(newCircle);
			newCircle.innerSprite.width = innerCircleSize * renderer.view.width;
			newCircle.innerSprite.height = innerCircleSize * renderer.view.height;
			newCircle.innerSprite.position.x = newCircle.x * renderer.view.width;
			newCircle.innerSprite.position.y = newCircle.y * renderer.view.height;
		}
		//score circles out of frame (unverified by server, they might get killed)
		circles.forEach(function (c1, i) {
			var y = getMovedCircleY(c1, estimatedServerT);
			if (!c1.unverifiedScore && (y < -c1.size || y > 1 + c1.size)) {
				scores[c1.color] = scores[c1.color] || {value: 0};
				scores[c1.color].value += c1.size;
				c1.unverifiedScore = c1.size;
				scoreCircles.push(c1);
			}
		});
		// scores
		Object.keys(scores).forEach(function (key, i) {
			var color = '#' + parseInt(key, 10).toString(16);
			var s = scores[key];
			var score = Math.ceil(s.value * 500 * CONFIRMED_SIZE_FACTOR);
			var fontSize = Math.max(Math.ceil(renderer.view.height * 0.075), 30);
			var style = {
				font: 'bold ' + fontSize + 'px Impact, Futura-CondensedExtraBold, DroidSans, Charcoal, sans-serif',
				fill: color
			};
			if (s.text) {
				s.text.text = score + '';
				s.text.style = style;
			} else {
				s.text = new PIXI.Text(score + '', style);
				stage.addChild(s.text);
			}
			s.text.position.y = 10 + Math.round((i * fontSize * 1.1));
			s.text.position.x = 10;
		});
		//new points
		scoreCircles.forEach(function (c, i) {
			var color = '#' + parseInt(c.color, 10).toString(16);
			var scoreSize = c.size === c.unverifiedScore ? c.size : c.size - (c.unverifiedScore || 0);
			var score = Math.max(Math.round(scoreSize * 500 * CONFIRMED_SIZE_FACTOR), 1);
			var fontSize = Math.max(Math.ceil(renderer.view.height * (0.015 + scoreSize)), 30);
			var style = {
				font: 'bold ' + fontSize + 'px Impact, Futura-CondensedExtraBold, DroidSans, Charcoal, sans-serif',
				fill: color
			};
			var text = new PIXI.Text('+' + score + ' ', style);
			text.anchor.x = 0.5;
			text.anchor.y = 0.5;
			var h = Math.ceil(text.height / 2);
			var y = getMovedCircleY(c, estimatedServerT);
			if (y > 1) {
				y = renderer.view.height - h;
				if (SOUND) {
					crashSound1._volume = scoreSize;
					crashSound1.play();
				}
			} else if (y < 0) {
				y = h;
				if (SOUND) {
					crashSound1._volume = scoreSize;
					crashSound1.play();
				}
			} else {
				y *= renderer.view.height;
				if (SOUND) {
					crashSound2._volume = Math.min(scoreSize * 4, 1);
					crashSound2.play();
				}
			}
			text.position.y = y;
			text.position.x = c.x * renderer.view.width;
			stage.addChild(text);
			text.tl = new TimelineMax({
				onComplete: function () {
					stage.removeChild(text);
					if (text.tl) {
						text.tl.kill();
						delete text.tl;
					}
				}
			}).to(text, 1.5, {alpha: 0, width: text.width * 1.2, height: text.height * 1.2});
			var targetY = getMovedCircleY(c, estimatedServerT) > 1 ? text.position.y - h : text.position.y + h;
			text.tl2 = new TimelineMax({}).to(text.position, 1.5, {y: targetY});

		});
		scoreCircles = [];
		// render the container
		renderer.render(stage);
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
}