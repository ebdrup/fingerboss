function help(str) {
	var fontSize = getFontSize(str);
	var style = {
		fontSize: fontSize + 'px',
		fontFamily: 'Impact, Futura-CondensedExtraBold, DroidSans, Charcoal, sans-serif',
		//fontStyle: 'bold',
		fill: '#ffffff',// + ('000000' + parseInt(world.color, 10).toString(16)).slice(-6),
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
