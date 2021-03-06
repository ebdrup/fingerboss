function distance(p1, p2){
	return Math.sqrt(
		Math.pow(Math.abs(p1.x - p2.x), 2) +
		Math.pow(Math.abs(p1.y - p2.y), 2)
	)
}

if (typeof module === 'object' && module && typeof module.exports === 'object') {
	module.exports = distance;
}