function getFontSize(strOrLength){
	var l = typeof strOrLength === 'number' ? strOrLength : strOrLength.split('\n').reduce(function(l, line){
		return Math.max(l,line.length);
	}, 1);
	return Math.max(Math.ceil(world.renderer.view.width * 1.3 / l), 20)
}