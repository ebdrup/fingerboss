function touch() {
	var gfx = new PIXI.Graphics();
	gfx.beginFill(BACKGROUND_COLOR);
	gfx.drawRect(0, 0, 1, 1);
	var sprite = new PIXI.Sprite(gfx.generateTexture());
	// center the sprite's anchor point
	sprite.width = world.renderer.view.width;
	sprite.height = world.renderer.view.height;
	sprite.interactive = true;
	sprite.on('mousemove', onMove);
	sprite.on('touchmove', onMove);
	return sprite;

	function getX(e) {
		return Math.min(Math.max(e.data.global.x / world.renderer.view.width, 0), 1);
	}

	function getY(e) {
		return Math.min(Math.max(e.data.global.y / world.renderer.view.height, 0), 1);
	}

	function onMove(e) {
		var x = getX(e) - 0.5;
		var y = getY(e) - 0.5;
		state.angle = Math.atan2(y, x);
	}
}
