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
		"end": "#000000"
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
		"min": 0.005,
		"max": 0.01
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
var particleTexture = PIXI.Texture.fromImage('particle.png');
function getEmitter(part) {
	var conf = JSON.parse(JSON.stringify(newCircleEmitterConf));
	conf.color.start = '#' + part.color.toString(16);
	console.log(conf.color.start);
	//conf.color.end = 0;
	var emitter = new cloudkid.Emitter(
		world.stage,
		[particleTexture],
		conf);
	var elapsed = Date.now();
	var update = function () {
		requestAnimationFrame(update);
		if (false) {
			emitter.emit = false;
		} else {
			emitter.emit = true;
			emitter.maxStartRotation = 0;
			emitter.minStartRotation = 0;
			emitter.spawnPos.x = (part.x - state.pos.x) * world.renderer.view.width;
			emitter.spawnPos.y = (part.y - state.pos.y) * world.renderer.view.height;
		}
		var now = Date.now();
		var dt = now - elapsed;
		emitter.update(dt * 0.001);
		//console.log('emitter.update', dt);
		elapsed = now;
	};
	update();
	return emitter;
}