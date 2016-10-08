function generateSpriteForMouse({type, size, x, y}) {
	var color = 0x4cd964;
	var height = world.renderer.view.height;
	var width = world.renderer.view.width;
	var s = (width + height) / 2;
	var key = s + '_' + color;
	var texture = world.textures[key];
	if (!texture) {
		var gfx = new PIXI.Graphics();
		gfx.beginFill(color, 0.8);
		gfx.drawCircle(0, 0, 0.1 * s);
		console.log({color, s});
		world.textures[key] = texture = gfx.generateTexture(world.renderer);
	}
	var sprite = new PIXI.Sprite(texture);
	// center the sprite's anchor point
	sprite.anchor.x = 0.5;
	sprite.anchor.y = 0.5;
	var px = (x - state.pos.x) * width;
	var py = (y - state.pos.y) * height;
	sprite.position.x = px;
	sprite.position.y = py;
	sprite.width = sprite.height = size * s;
	sprite.color = color;
	return sprite;
}