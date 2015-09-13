function help(state, world, str) {
	var fontSize = Math.max(Math.ceil(world.renderer.view.width * 2 / str.length), 20);
	var style = {
		font: 'bold ' + fontSize + 'px Impact, Futura-CondensedExtraBold, DroidSans, Charcoal, sans-serif',
		fill: '#' + parseInt(state.color, 10).toString(16)
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
