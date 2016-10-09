function getText({text, color, fontSize}) {
	fontSize = fontSize || getFontSize(text);
	color = color || 0xffffff;
	var style = {
		fontSize: fontSize + 'px',
		fontFamily: 'Impact, Futura-CondensedExtraBold, DroidSans, Charcoal, sans-serif',
		fill: '#' + ('000000' + parseInt(color, 10).toString(16)).slice(-6),
		align: 'center'
	};
	return new PIXI.Text(text, style);
}
