function touch() {
	var gfx = new PIXI.Graphics();
	gfx.beginFill(BACKGROUND_COLOR);
	gfx.drawRect(0, 0, 1, 1);
	var sprite = new PIXI.Sprite(gfx.generateCanvasTexture());
	// center the sprite's anchor point
	sprite.width = world.renderer.view.width;
	sprite.height = world.renderer.view.height;
	sprite.interactive = true;
	world.touch = sprite;
	world.touchStage = new PIXI.Container();
	world.touchStage.addChild(world.touch);
	sprite.on('mousemove', onMove);
	sprite.on('touchmove', onMove);
	sprite.on('touchstart', onMove);
	return world.touchStage;

	function getX(e) {
		return Math.min(Math.max((e.data.global.x - world.touchStage.position.x) / world.touchStage.width, 0), 1);
	}

	function getY(e) {
		return Math.min(Math.max((e.data.global.y - world.touchStage.position.y) / world.touchStage.height, 0), 1);
	}

	function onMove(e) {
		if (e.type.indexOf('touch') !== -1) {
			setupTouch();
		}
		var x = getX(e) - 0.5;
		var y = getY(e) - 0.5;
		state.angle = Math.atan2(y, x);
	}

	function setupTouch() {
		if (world.touch.setup) {
			return;
		}
		world.touch.setup = true;
		var gfx = new PIXI.Graphics();
		gfx.beginFill(0x444400);
		gfx.drawRect(0, 0, 1, 1);
		world.touch.texture = gfx.generateCanvasTexture();
		if (world.renderer.view.height > world.renderer.view.width) {
			var height = 0.3 * world.renderer.view.height;
			world.height -= height;
			world.touch.height = height;
			world.touch.width = world.renderer.view.width;
			world.touchStage.position.x = 0;
			world.touchStage.position.y = world.height;
			world.dxZoom = (1 - world.zoom) / 2 * world.width;
			world.dyZoom = (1 - world.zoom) / 2 * world.height;
			world.stage.position.x = world.starField.position.x = world.mice.position.x = world.dxZoom;
			world.stage.position.y = world.starField.position.y = world.mice.position.y = world.dyZoom;
		}
		world.touch.pointers = ['up', 'down', 'left', 'right'].reduce((acc, direction, i) => {
			var sprite = new PIXI.Sprite.fromImage('pointer.png');
			sprite.anchor.x = 0.5;
			sprite.anchor.y = 0.5;
			sprite.width = sprite.height = world.touch.height * 0.2;
			sprite.rotation = i * Math.PI / 2 + Math.PI / 4;
			var d = {
				'0': 1,
				'1': 0,
				'2': -1,
				'3': 0
			};
			sprite.position.x = world.touch.width / 2 + d[i%4] * world.touch.height * 0.2;
			sprite.position.y = world.touch.height / 2+ d[(i+3)%4] * world.touch.height * 0.2;
			world.touchStage.addChild(sprite);
			acc[direction] = sprite;
			return acc;
		}, {});
	}
}


