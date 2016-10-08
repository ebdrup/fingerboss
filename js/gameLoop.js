var state = {};
var world = {};
function fingerboss() {
	initWorld();
	initState();
	initBackground();
	serverEventListeners();

	// start animating
	animate();
	function animate() {
		requestAnimationFrame(animate);
		TWEEN.update();
		if (!state.playing) {
			world.renderer.render(world.mainStage);
			return;
		}
		var now = Date.now();
		var lastMove = world.lastMove = world.lastMove || now;
		var dt = now -lastMove;
		if(dt<= 50){
			return world.renderer.render(world.mainStage);
		}
		world.socket.emit('move', state.angle);
		//ball
		if(state.ball) {
			world.ball && world.stage.removeChild(world.ball);
			world.ball = sprite(Object.assign(state.ball, {type: 'ball'}));
			world.stage.addChild(world.ball);
		}
		//mice
		for (var i = world.mice.children.length - 1; i >= 0; i--) {
			world.mice.removeChild(world.mice.children[i]);
		}
		state.mice.forEach(mouse => {
			world.mice.addChild(sprite(mouse));
		});
		world.renderer.render(world.mainStage);
	}
}

function initBackground() {
	var width = world.renderer.view.width;
	var height = world.renderer.view.height;
	var texture = PIXI.Texture.fromImage('/particle.png');
	world.stars = Array.apply(null, Array(300)).map(() => {
		var star = new PIXI.Sprite(texture);
		star.anchor.x = star.anchor.y = 0.5;
		star.position.x = Math.random() * width;
		star.position.y = Math.random() * height;
		star.scale.x = star.scale.y = (0.25 + Math.random()*0.75)/2;
		star.alpha = (1.15 - star.scale.x*2)/1.15 * (0.95  + 0.1 * Math.random());
		world.starField.addChild(star);
		return star;
	}).concat(Array.apply(null, Array(500)).map(() => {
		var star = new PIXI.Sprite(texture);
		star.anchor.x = star.anchor.y = 0.5;
		star.position.x = Math.random() * width;
		star.position.y = Math.random() * height;
		star.scale.x = star.scale.y = (0.25 + Math.random()*0.75)/8;
		star.alpha = (1.15 - star.scale.x*2)/1.15 * (0.95  + 0.1 * Math.random());
		world.starField.addChild(star);
		return star;
	}));

}