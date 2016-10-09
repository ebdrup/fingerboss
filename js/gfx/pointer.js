function pointer({x, y, text, size}) {
	var height = world.renderer.view.height;
	var width = world.renderer.view.width;
	var s = (width + height) / 2;
	var posX = x - state.pos.x - 0.5;
	var posY = y - state.pos.y - 0.5;
	var angle = Math.atan2(posY, posX);
	var dist = Math.sqrt(Math.pow(posX, 2) + Math.pow(posY, 2));
	var sprite = world.pointers[text] || (world.pointers[text] = new PIXI.Sprite.fromImage('pointer.png'));
	world.stage.removeChild(sprite);
	sprite.anchor.x = 0.5;
	sprite.anchor.y = 0.5;
	var dx = -Math.cos(angle) * (size);
	var dy = -Math.sin(angle) * (size);
	var px = Math.max(Math.min(dx + x - state.pos.x, 1 - size), size) * width;
	var py = Math.max(Math.min(dy + y - state.pos.y, 1 - size), size) * height;
	sprite.width = sprite.height = size/2 * s;
	sprite.position.x = px;
	sprite.position.y = py;
	sprite.rotation = angle + Math.PI / 4;
	var alpha;
	if (distance < 0.1) {
		alpha = 0;
	} else {
		alpha = Math.max(Math.min((dist-0.1) * 2, 1), 0);
	}
	sprite.alpha = alpha;
	world.stage.addChild(sprite);
	//text
	if(!sprite.text){
		var fontSize = sprite.width/1.3;
		sprite.text = getText({text, fontSize})
	}
	sprite.text.position.x = px +(dx/1.3 * width);
	sprite.text.position.y = py +(dy/1.3 * height);
	sprite.text.anchor.x = 0.5;
	sprite.text.anchor.y = 0.5;
	sprite.text.alpha = alpha;
	world.stage.removeChild(sprite.text);
	world.stage.addChild(sprite.text);
}