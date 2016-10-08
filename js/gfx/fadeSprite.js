function fadeSprite(stage, sprite) {
	if (sprite.tl) {
		sprite.tl.stop();
		delete sprite.tl;
	}
	sprite.tl = new TWEEN.Tween(sprite)
		.to({alpha: 0}, 2000)
		.onComplete(function () {
			stage.removeChild(sprite);
			if (sprite.tl) {
				sprite.tl.stop();
				delete sprite.tl;
			}
		})
		.start();
}