function getText(world, str, color, fontSize) {
	fontSize = fontSize || getFontSize(world, str);
	var style = {
		font: 'bold ' + fontSize + 'px Impact, Futura-CondensedExtraBold, DroidSans, Charcoal, sans-serif',
		fill: '#' + ('000000' + parseInt(color, 10).toString(16)).slice(-6),
		align: 'center'
	};
	return new PIXI.Text(str, style);
}
