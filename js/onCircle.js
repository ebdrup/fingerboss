function onCircle(state, world, c) {
	if (!state.playing) {
		return;
	}
	world.sounds.newCircle();
	//remove unconfirmed circle
	var t = c.t;
	c.sprite = generateSpriteForCircle(world, c);
	world.stage.addChild(c.sprite);
	var uc = state.unconfirmedCircless[c.id];
	if (uc) {
		world.stage.removeChild(uc.sprite);
		delete state.unconfirmedCircless[c.id]
	}
	state.circles.push(c);
	var cIndex = state.circles.length - 1;
	//collision:merge same color
	var indexesToRemove;
	var anyMerge = true;
	while (anyMerge) {
		indexesToRemove = [];
		anyMerge = false;
		for (var i = 0; i < state.circles.length && !anyMerge; i++) {
			var c1 = state.circles[i];
			if (!c1 || !c || c1.color !== c.color || c1 === c) {
				continue;
			}
			if (isColliding(c, c1, t)) {
				state.circles.splice(cIndex, 1);
				c1.size = c.size + c1.size;
				killCircleSprite(world.stage, c.sprite);
				c = c1;
				cIndex = i;
				anyMerge = true;
			}
		}
	}
	//collision:kill different colors
	indexesToRemove = [];
	var anyCollision, anyKill;
	for (var i = 0; i < state.circles.length; i++) {
		var c1 = state.circles[i];
		if (!c1 || !c || c1.color === c.color) {
			continue;
		}
		if (isColliding(c, c1, t)) {
			anyCollision = true;
			var cSize = c.size;
			c.size -= c1.size;
			c1.size -= cSize;
			if (c1.size <= KILL_SIZE) {
				anyKill = true;
				indexesToRemove.push(i);
				killCircleSprite(world.stage, c1.sprite);
				//scoreCircle for kill
				state.scores[c.color] = state.scores[c.color] || {value: 0};
				var scoreCircle = {
					t: c.t,
					x: c.x,
					y: c.y,
					size: (c1.size + cSize) * KILL_SCORE_FACTOR,
					color: c.color
				};
				state.scores[c.color].value += scoreCircle.size;
				state.scoreCircles.push(scoreCircle);
				if(c.color === state.color){
					state.killCount++;
					if (state.killCount === 1) {
						help(state, world, 'Your first kill!')
					}
				}
			}
			if (c.size <= KILL_SIZE) {
				indexesToRemove.push(cIndex);
				killCircleSprite(world.stage, c.sprite);
				break;
			}
		}
	}
	if (anyCollision && !anyKill) {
		world.sounds.shrink();
		if (c.color === state.color) {
			state.shrinkCount++;
			if (state.shrinkCount === 1 || state.shrinkCount === 10) {
				help(state, world, 'Try holding down longer');
			}
		}
	}
	indexesToRemove.forEach(function (i) {
		var c1 = state.circles[i];
		state.scores[c1.color] = state.scores[c1.color] || {value: 0};
		state.scores[c1.color].value -= (c1.unverifiedScore || 0); //remove state.scores added but not supposed to be
		delete state.circles[i];
	});
	state.circles = state.circles.filter(Boolean);
	//remove & score circles out of frame
	state.circles.forEach(function (c1, i) {
		var y = getMovedCircleY(world, c1, c.t);
		if (y < -c1.size || y > 1 + c1.size) {
			state.scores[c1.color] = state.scores[c1.color] || {value: 0};
			var scoreToAdd = c1.size - (c1.unverifiedScore || 0);
			state.scores[c1.color].value += scoreToAdd;
			if (scoreToAdd > 0.0000001) {
				state.scoreCircles.push(c1);
			}
			delete state.circles[i];
			world.stage.removeChild(c1.sprite);
		}
	});
	state.circles = state.circles.filter(Boolean);
	return;

	function isColliding(c, c1, t) {
		var distance = Math.sqrt(
			Math.pow(Math.abs(c1.x - c.x), 2) +
			Math.pow(Math.abs(getMovedCircleY(world, c1, t) - getMovedCircleY(world, c, t)), 2)
		);
		var minDistance = (c1.size + c.size);
		return distance < minDistance;

	}
}