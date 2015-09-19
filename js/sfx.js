function sfx() {
	return ['newCircle', 'crash1', 'crash2', 'shrink', 'fingerboss', 'loose'].reduce(function(acc, key){
		var exts = window.intel ? ['wav', 'mp3'] : ['mp3', 'wav'];
		var urls = exts.map(function(ext){
			return 'sound/' + key + '.' + ext;
		});
		var sound = new Howl({
			urls: urls,
			volume: 0.3
		});
		acc[key] = function (volume) {
			if (volume) {
				sound._volume = volume;
			}
			sound.play();
		};
		return acc;
	}, {});
}