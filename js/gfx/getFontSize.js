function getFontSize(world, str){
	var l = str.split('\n').reduce(function(l, line){
		return Math.max(l,line.length);
	}, 1);
	return Math.max(Math.ceil(world.renderer.view.width * 2 / l), 20)
}