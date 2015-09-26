function levelFromWins(wins) {
	if (wins === 0) {
		return 0;
	}
	return Math.ceil((wins + 1) / 10);
}