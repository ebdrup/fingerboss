var sfx = [
	'newCircle',
	'crash1',
	'crash2',
	'shrink',
	'fingerboss',
	'loose',
	'ball1',
	'ball2',
	'whistle'
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
		console.log('play sfx', key);
	};
	return acc;
}, {});
