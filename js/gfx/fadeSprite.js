function fadeSprite(stage, sprite) {
	if (sprite.tls) {
		sprite.tls.forEach(tl => tl.stop());
		delete sprite.tls;
	}
	var duration = 2000;
	sprite.tls = [
		new TWEEN.Tween(sprite)
			.to({alpha: 0}, duration)
			.onComplete(function () {
				stage.removeChild(sprite);
				if (sprite.tls) {
					sprite.tls.forEach(tl => tl.stop());
					delete sprite.tls;
				}
			})
			.start(),
		new TWEEN.Tween({x:1, y:1})
			.to({x: 1.2, y: 1.2}, duration)
			.onUpdate(function() {
				sprite.scale.set(this.x, this.y);
			})
			.start()
	];
}