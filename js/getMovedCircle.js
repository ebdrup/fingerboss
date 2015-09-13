function getMovedCircleY(world, c, t) {
	var dt = c.t - t;
	return c.y > 0.5 ? c.y + dt * world.velocity : c.y - dt * world.velocity;
}
