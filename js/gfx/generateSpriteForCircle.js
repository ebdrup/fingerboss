function generateSpriteForCircle(world, c) {
	var w = world.renderer.view.width, h = world.renderer.view.height;
	var key = w + '_' + h + '_' + c.color;
	var texture = world.textures[key];
	if (!texture) {
		var gfx = new PIXI.Graphics();
		gfx.beginFill(c.color);
		gfx.drawEllipse(0, 0, 0.1 * w, 0.1 * h);
		world.textures[key] = texture = gfx.generateTexture();
	}
	var sprite = new PIXI.Sprite(texture);
	// center the sprite's anchor point
	sprite.anchor.x = 0.5;
	sprite.anchor.y = 0.5;
	sprite.position.x = c.x * world.renderer.view.width;
	sprite.position.y = c.y * world.renderer.view.height;
	sprite.width = c.size * world.renderer.view.width;
	sprite.height = c.size * world.renderer.view.height;
	return sprite;
}

