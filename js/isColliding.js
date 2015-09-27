function isColliding(world, c1, c2, t) {
	if (!c1.size || !c2.size) {
		return false;
	}
	var distance = Math.sqrt(
		Math.pow(Math.abs(c2.x - c1.x), 2) +
		Math.pow(Math.abs(getMovedCircleY(world, c2, t) - getMovedCircleY(world, c1, t)), 2)
	);
	var minDistance = (c2.size + c1.size) / 2;
	return distance < minDistance;
}
