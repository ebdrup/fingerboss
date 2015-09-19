var SOUND = true;
function sfx() {
	var s = {
		newCircle: new Howl({
			urls: ['newConfirmedCircle.mp3'],
			volume: 0.3
		}),
		crash1: new Howl({
			urls: ['crash1.mp3'],
			volume: 0.3
		}),
		crash2: new Howl({
			urls: ['crash2.mp3'],
			volume: 0.3
		}),
		shrink: new Howl({
			urls: ['shrink.mp3'],
			volume: 0.04
		}),
		fingerboss: new Howl({
			urls: ['fingerboss.mp3'],
			volume: 0.8
		}),
		loose: new Howl({
			urls: ['loose.mp3'],
			volume: 0.3
		})
	};
	return Object.keys(s).reduce(function (acc, key) {
		var sound = s[key];
		acc[key] = function (volume) {
			if (!SOUND) {
				return;
			}
			if (volume) {
				sound._volume = volume;
			}
			sound.play();
		};
		return acc;
	}, {});
}