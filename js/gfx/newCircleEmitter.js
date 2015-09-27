var newCircleEmitterConf = {
	"alpha": {
		"start": 0.62,
		"end": 0
	},
	"scale": {
		"start": 0.25,
		"end": 0.75,
		"minimumScaleMultiplier": 1
	},
	"color": {
		"start": "#ffffff",
		"end": "#ff622c"
	},
	"speed": {
		"start": 70,
		"end": 70
	},
	"acceleration": {
		"x": 0,
		"y": 0
	},
	"startRotation": {
		"min": 19,
		"max": 1
	},
	"rotationSpeed": {
		"min": 50,
		"max": 50
	},
	"lifetime": {
		"min": 0.05,
		"max": 0.3
	},
	"blendMode": "add",
	"frequency": 0.001,
	"emitterLifetime": -1,
	"maxParticles": 1000,
	"pos": {
		"x": 0,
		"y": 0
	},
	"addAtBack": false,
	"spawnType": "circle",
	"spawnCircle": {
		"x": 0,
		"y": 0,
		"r": 0
	}
};
function newCircleEmitter(world, state) {
	var conf = JSON.parse(JSON.stringify(newCircleEmitterConf));
	var emitter = new cloudkid.Emitter(
		world.stage,
		[particleTexture],
		conf);
	var elapsed = Date.now();
	var start = Date.now();
	var lastDt = 0;
	var update = function () {
		requestAnimationFrame(update);
		if (!state.newCircle) {
			emitter.emit = false;
		} else {
			emitter.emit = true;
			//emitter.color.end = '#' + ('000000' + parseInt(state.newCircle.color, 10).toString(16)).slice(-6);
			var totalDt = Date.now() - start;
			var rotTime = 500;
			var rot = 360 * ((totalDt % rotTime) - rotTime / 2) / rotTime;
			emitter.maxStartRotation = (rot+10)%360;
			emitter.minStartRotation = (rot-10)%360;
			emitter.spawnPos.x = state.newCircle.sprite.position.x + (Math.sin(rot * Math.PI / 180) * state.newCircle.sprite.width / 2);
			emitter.spawnPos.y = state.newCircle.sprite.position.y + (Math.cos((rot + 180) * Math.PI / 180) * state.newCircle.sprite.height / 2);
		}
		var now = Date.now();
		var dt = now - elapsed;
		emitter.update(dt * 0.001);
		elapsed = now;
		lastDt = dt;
	};
	update();
	newCircleEmitter = function () {
	};
	return emitter;
}