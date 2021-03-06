var spriteCache = {};
function sprite({type, size, x, y, color, snakeId, rotation}) {
	var height = world.height;
	var width = world.width;
	var s = (width + height) / 2;
	var spriteKey;
	var isItem = type.indexOf('item_') === 0;
	switch (type) {
		case 'ball':
			spriteKey = type;
			break;
		default:
			if (isItem && snakeId) {
				spriteKey = [type, snakeId].join('_');
			} else {
				spriteKey = [type, size, x, y, color].join('_');
			}
	}
	var sprite;
	if (spriteCache[spriteKey]) {
		sprite = spriteCache[spriteKey];
	} else {
		var textureKey = [s, color, type].join('_');
		var texture = world.textures[textureKey];
		if (!texture) {
			switch (type) {
				case 'goal-net':
					world.textures[textureKey] = texture = new PIXI.Texture.fromImage('goal.png');
					break;
				case 'power':
					world.textures[textureKey] = texture = new PIXI.Texture.fromImage('power.png');
					break;
				case 'ball':
					world.textures[textureKey] = texture = new PIXI.Texture.fromImage('ball.png');
					break;
				case 'speed':
					world.textures[textureKey] = texture = new PIXI.Texture.fromImage('spiral.png');
					break;
				default:
					if (isItem) {
						world.textures[textureKey] = texture = new PIXI.Texture.fromImage(`${type.replace('item_', '')}.png`)
					} else {
						var gfx = new PIXI.Graphics({cacheAsBitmap: true});
						gfx.beginFill(color, 0.8);
						gfx.drawCircle(0, 0, 0.1 * s);
						world.textures[textureKey] = texture = gfx.generateCanvasTexture(world.renderer);
					}
			}
		}
		sprite = new PIXI.Sprite(texture);
		// center the sprite's anchor point
		sprite.anchor.x = 0.5;
		sprite.anchor.y = 0.5;
		sprite.width = sprite.height = size * s;
		spriteCache[spriteKey] = sprite;
		if (type === 'speed') {
			sprite.rotation = Math.random() * Math.PI;
		}
	}
	var px = (x - state.pos.x) * width;
	var py = (y - state.pos.y) * height;
	sprite.position.x = px;
	sprite.position.y = py;
	var now = Date.now();
	sprite.t = sprite.t || now;
	var dt = now - sprite.t;
	switch (type) {
		case 'goal-net':
		case 'power':
		case 'speed':
			sprite.alphaStep = sprite.alphaStep || 1;
			sprite.alpha += dt * sprite.alphaStep * Math.random() / 500;
			if (sprite.alpha >= 1) {
				sprite.alphaStep = -1;
				sprite.alpha = 1;
			} else if (sprite.alpha <= 0.5) {
				sprite.alphaStep = 1;
				sprite.alpha = 0.5;
			}
			break;
		default:
			sprite.color = color;
	}
	switch (type) {
		case 'power':
			sprite.rotation = (Math.random() - 0.5) / 6;
			break;
		case 'speed':
			sprite.rotation += -dt / 500;
			break;
		default:
			if (typeof color !== undefined) {
				sprite.color = color;
			}
	}
	if (typeof rotation !== 'undefined') {
		sprite.rotation = rotation;
	}
	sprite.t = now;
	return sprite;
}