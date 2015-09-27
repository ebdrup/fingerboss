function getInteraction(state, world) {
	var gfx = new PIXI.Graphics();
	gfx.beginFill(BACKGROUND_COLOR);
	gfx.drawRect(0, 0, 1, 1);
	var sprite = new PIXI.Sprite(gfx.generateTexture());
	// center the sprite's anchor point
	sprite.width = world.renderer.view.width;
	sprite.height = world.renderer.view.height;
	sprite.interactive = true;
	sprite.on('mousedown', onDown);
	sprite.on('touchstart', onDown);
	sprite.on('mousemove', onMove);
	sprite.on('touchmove', onMove);
	sprite.on('mouseup', onUp);
	sprite.on('touchend', onUp);
	return sprite;

	function onDown(e) {
		world.lastInteraction = Date.now();
		if (state.newCircle || !state.readyToPlay) {
			return;
		}
		if (!state.playing && state.readyToPlay) {
			resetGame(state, world);
		}
		state.newCircle = {
			id: Math.random() + '_' + Date.now(),
			x: getX(e),
			y: getY(e),
			size: START_SIZE,
			color: world.color
		};
		state.newCircle.tl = new TimelineMax({
			autoRemoveChildren: true,
			onComplete: function () {
				onUp();
				help(state, world, 'Auto release');
			}
		}).to(state.newCircle, GROW_TIME, {size: END_SIZE, ease: Power1.easeOut});
		state.newCircle.sprite = generateSpriteForCircle(world, state.newCircle);
		state.newCircle.sprite.alpha = UNCONFIRMED_ALPHA;
		world.stage.addChild(state.newCircle.sprite);
		newCircleEmitter(world, state);
	}

	function getX(e) {
		return Math.min(Math.max(e.data.global.x / world.renderer.view.width, 0), 1);
	}

	function getY(e) {
		return Math.min(Math.max(e.data.global.y / world.renderer.view.height, 0), 1);
	}

	function onMove(e) {
		if (state.newCircle) {
			state.newCircle.x = getX(e);
			state.newCircle.y = getY(e);
		}
	}

	function onUp() {
		world.lastInteraction = Date.now();
		var circle;
		if (state.newCircle) {
			if (state.newCircle.tl) {
				state.newCircle.tl.kill();
				delete state.newCircle.tl;
			}
			world.stage.removeChild(state.newCircle.sprite);
			delete state.newCircle.sprite;
			world.stage.removeChild(state.newCircle.innerSprite);
			delete state.newCircle.innerSprite;
			if (state.newCircle.size > MIN_SIZE) {
				circle = {
					owner: world.id,
					id: state.newCircle.id,
					x: state.newCircle.x,
					y: state.newCircle.y,
					size: state.newCircle.size,
					localTime: Date.now(),
					level: world.level
				};
				state.newCircle.sprite = generateSpriteForCircle(world, state.newCircle);
				state.newCircle.sprite.visible = false;
				state.newCircle.sprite.alpha = UNCONFIRMED_ALPHA;
				state.unconfirmedCircless[state.newCircle.id] = state.newCircle;
				world.stage.addChild(state.newCircle.sprite)
			}
			state.newCircle = null;
			if (circle) {
				var t = getEstimatedServerT(world);
				for (var i = 0; i < state.circles.length; i++) {
					var c1 = state.circles[i];
					if (c1.color !== world.color && isColliding(world, circle, c1)) {

					}
				}
				if (world.players > 1) {
					world.socket.emit('circle', circle);
				} else {
					circle.color = world.color;
					circle.t = getEstimatedServerT(world);
					onCircle(state, world, circle);
					state.lastCircle = circle;
				}
			}
		}
	}
}
