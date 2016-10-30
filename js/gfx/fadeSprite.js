function fadeSprite(stage, sprite, duration) {
	if (sprite.tls) {
		sprite.tls.forEach(tl => tl.stop());
		delete sprite.tls;
	}
	duration = duration || 2000;
	//extra kill of sprite. Sometimes tween fails, for unknown reasons
	setTimeout(()=>{
		stage.removeChild(sprite);
		if (sprite.tls) {
			sprite.tls.forEach(tl => tl.stop());
			delete sprite.tls;
		}
	}, duration);
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