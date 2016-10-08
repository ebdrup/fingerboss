const path = require('path');

module.exports = [
	//path.join(require.resolve('tween.js')),
	path.join(path.dirname(require.resolve('socket.io-client')), '../socket.io.js'),
	path.join(path.dirname(require.resolve('pixi.js')), '../bin/pixi.min.js'),
	path.join(path.dirname(require.resolve('howler')), '../dist/howler.min.js'),
	path.join(path.dirname(require.resolve('pixi-particles')), '../dist/pixi-particles.min.js')
].map(p => p.replace('.min.', '.'));