function help(str, color) {
	var fontSize = getFontSize(str);
	var fill = color ? '#' + ('000000' + parseInt(color, 10).toString(16)).slice(-6) : '#ffffff';
	var style = {
		fontSize: fontSize + 'px',
		fontFamily: 'Impact, Futura-CondensedExtraBold, DroidSans, Charcoal, sans-serif',
		fill,
		align: 'center'
	};
	var text = new PIXI.Text(str, style);
	text.anchor.x = 0.5;
	text.anchor.y = 0.5;
	var h = text.height;
	text.x = Math.round(world.renderer.view.width / 2);
	text.y = Math.round(h / 2 + (world.renderer.view.height - h) * Math.random());
	world.stage.addChild(text);
	fadeSprite(world.stage, text)
}
