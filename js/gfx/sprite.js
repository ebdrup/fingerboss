var spriteCache = {};
function sprite({type, size, x, y, color}) {
	color = color || {
			'ball': 0xffffff,
			'speed': 0x4cd964,
			'power': 0xff2d55
		}[type];
	var height = world.renderer.view.height;
	var width = world.renderer.view.width;
	var s = (width + height) / 2;
	var spriteKey = [type, size, x, y, color].join('_');
	var sprite;
	if(spriteCache[spriteKey]){
		sprite = spriteCache[spriteKey];
	} else {
		var textureKey = [s, color, type].join('_');
		var texture = world.textures[textureKey];
		if (!texture) {
			switch (type) {
				case 'power':
					world.textures[textureKey] = texture = new PIXI.Texture.fromImage('power.png');
					break;
				default:
					var gfx = new PIXI.Graphics({cacheAsBitmap: true});
					gfx.beginFill(color, 0.8);
					gfx.drawCircle(0, 0, 0.1 * s);
					world.textures[textureKey] = texture = gfx.generateCanvasTexture(world.renderer);
			}
		}
		sprite = new PIXI.Sprite(texture);
		// center the sprite's anchor point
		sprite.anchor.x = 0.5;
		sprite.anchor.y = 0.5;
		var px = (x - state.pos.x) * width;
		var py = (y - state.pos.y) * height;
		sprite.position.x = px;
		sprite.position.y = py;
		sprite.width = sprite.height = size * s;
	}
	switch (type) {
		case 'power':
			sprite.alpha = 0.5 + (Math.random()*0.5);
			sprite.rotation = (Math.random()-0.5)/6;
			break;
		default:
			sprite.color = color;
	}
	return sprite;
}