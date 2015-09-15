function fadeSprite(stage, sprite) {
	if (sprite.tl) {
		sprite.tl.kill();
		delete sprite.tl;
	}
	sprite.tl = new TimelineMax({
		autoRemoveChildren: true,
		onComplete: function () {
			stage.removeChild(sprite);
			if (sprite.tl) {
				sprite.tl.kill();
				delete sprite.tl;
			}
		}
	}).to(sprite, 8, {alpha: 0});
}
