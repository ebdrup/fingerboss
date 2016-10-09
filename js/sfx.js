var sfx = [
	'crash1',
	'crash2',
	'clap1',
	'clap2',
	'fingerboss',
	'loose',
	'ball1',
	'ball2',
	'whistle',
	'win'
].reduce(function (acc, key) {
	var exts = (window.intel && window.intel.xdk) ? ['wav'] : ['mp3'];
	var urls = exts.map(function (ext) {
		return 'sound/' + key + '.' + ext;
	});
	var sound = new Howl({
		src: urls,
		volume: 0.3
	});
	acc[key] = function (volume) {
		var id = sound.play();
		if (volume) {
			sound.volume(volume, id);
		} else {
			sound.volume(0.3, id);
		}
	};
	return acc;
}, {});
