var fire = {
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
		"start": "#fafafa",
		"end": "#fafafa"
	},
	"speed": {
		"start": 500,
		"end": 200
	},
	"acceleration": {
		"x": 0,
		"y": 0
	},
	"startRotation": {
		"min": 0,
		"max": 360
	},
	"rotationSpeed": {
		"min": 50,
		"max": 50
	},
	"lifetime": {
		"min": 0.1,
		"max": 0.75
	},
	"blendMode": "normal",
	"frequency": 0.00001,
	"emitterLifetime": 0.05,
	"maxParticles": 500,
	"addAtBack": false,
	"spawnType": "circle",
	"spawnCircle": {
		"x": 0,
		"y": 0,
		"r": 10
	}
};
function setFire(container, c) {
	var sprite = c.sprite;
	var conf = JSON.parse(JSON.stringify(fire));
	var factor = 0.2 + c.size *2;
	conf.scale.start *= factor;
	conf.scale.end *= factor;
	conf.speed.start *= factor;
	conf.speed.end *= factor;
	conf.color.end =  '#' + ('000000' + parseInt(c.sprite.color, 10).toString(16)).slice(-6);
	conf.pos = sprite.position;
	var emitter = new cloudkid.Emitter(
		container,
		[PIXI.Texture.fromImage('fire.png')],
		conf);
	var elapsed = Date.now();
	var lastDt = 0;
	var update = function () {
		if(lastDt/1000 > conf.emitterLifetime + conf.lifetime.max){
			return emitter.destroy();
		}
		requestAnimationFrame(update);
		var now = Date.now();
		var dt = now - elapsed;
		emitter.update(dt * 0.001);
		elapsed = now;
		lastDt = dt;
	};
	emitter.emit = true;
	update();
}