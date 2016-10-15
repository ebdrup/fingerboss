function help({text, color, alpha, duration}) {
	var fontSize = getFontSize(text);
	var fill = color ? '#' + ('000000' + parseInt(color, 10).toString(16)).slice(-6) : '#ffffff';
	var style = {
		fontSize: fontSize + 'px',
		fontFamily: 'Impact, Futura-CondensedExtraBold, DroidSans, Charcoal, sans-serif',
		fill,
		align: 'center'
	};
	var sprite = new PIXI.Text(text, style);
	sprite.anchor.x = 0.5;
	sprite.anchor.y = 0.5;
	var h = sprite.height;
	sprite.x = Math.round(world.renderer.view.width / 2);
	sprite.y = Math.round(h / 2 + (world.renderer.view.height - h) * Math.random());
	typeof alpha === 'number' && (sprite.alpha = alpha);
	world.text.addChild(sprite);
	fadeSprite(world.text, sprite, duration)
}
