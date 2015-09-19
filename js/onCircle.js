
function onCircle(state, world, c) {
	if (!state.playing) {
		return;
	}
	world.sounds.newCircle();
	//remove unconfirmed circle
	c.sprite = generateSpriteForCircle(world, c);
	world.stage.addChild(c.sprite);
	state.circles.push(c);
	var uc = state.unconfirmedCircless[c.id];
	if (uc) {
		world.stage.removeChild(uc.sprite);
		delete state.unconfirmedCircless[c.id]
	}
	var t = c.t;
	//same color collision detection
	merge(state, c, t);
	//collision detection
	var indexesToRemove = [];
	var anyCollision, anyKill;
	for (var i = 0; i < state.circles.length - 1; i++) {
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
				if (state.color === c.color) {
					state.killCount++;
					if (state.killCount === 1) {
						help(state, world, 'Your first kill!')
					}
				}
			}
			if (c.size <= KILL_SIZE) {
				state.circles.pop(); // remove c
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

	function merge(state, c1, t) {
		for (var i = 0; i < state.circles.length; i++) {
			var c2 = state.circles[i];
			if (!c2 || !c1 || c2.color !== c1.color || c2 === c1) {
				continue;
			}
			if (isColliding(c1, c2, t)) {
				if (c2.size > c1.size) {
					c2.size += c1.size;
					c1.size = 0;
					merge(state, c2, t);
				} else {
					c1.size += c2.size;
					c2.size = 0;
					merge(state, c1, t);
				}
			}
		}
	}

	function isColliding(c1, c2, t) {
		if(!c1.size || !c2.size){
			return false;
		}
		var distance = Math.sqrt(
			Math.pow(Math.abs(c2.x - c1.x), 2) +
			Math.pow(Math.abs(getMovedCircleY(world, c2, t) - getMovedCircleY(world, c1, t)), 2)
		);
		var minDistance = (c2.size + c1.size)/Math.sqrt(2);
		return distance < minDistance;
	}
}
