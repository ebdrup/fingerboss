class Snake {
	//Either construct with data OR the other properties
	constructor({id, length, color, velocity, data}) {
		if (data) {
			this.unserialize(data);
			var gfx;
			var update = (function () {
				if(this.removed){
					if (gfx) {
						world.stage.removeChild(gfx);
					}
					return;
				}
				requestAnimationFrame(update);
				if (gfx) {
					world.stage.removeChild(gfx);
				}
				gfx = new PIXI.Graphics();
				var width = world.renderer.view.width;
				var height = world.renderer.view.height;
				gfx.beginFill('#FFFF00');
				gfx.lineStyle(Math.round((height + width) / 200), data.color);
				for (var i = this.parts.length - 2; i >= 0; i--) {
					var x1 = (this.parts[i + 1].x - state.pos.x) * width;
					var y1 = (this.parts[i + 1].y - state.pos.y) * height;
					var x2 = (this.parts[i].x - state.pos.x) * width;
					var y2 = (this.parts[i].y - state.pos.y) * height;
					gfx.moveTo(x1, y1);
					gfx.lineTo(x2, y2);
				}
				gfx.endFill();
				gfx.visible = true;
				gfx.x = 0;
				gfx.y = 0;
				world.stage.addChild(gfx);
			}).bind(this);
			update();
		} else {
			this.id = id;
			this.color = color;
			this.velocity = velocity;
			this.startVelocity = velocity;
			this.parts = Array.apply(null, Array(length)).map(() => new Part(0, 0, color));
			this.randomPosition();
		}
	}

	getMaxMove({dx, dy}) {
		var head = this.parts[0];
		if ((head.x + dx) > 1) {
			dx = 1 - head.x;
		}
		if ((head.x + dx) < 0) {
			dx = -head.x;
		}
		if ((head.y + dy) > 1) {
			dy = 1 - head.y;
		}
		if ((head.y + dy) < 0) {
			dy = -head.y;
		}
		return {dx, dy}
	}

	move({dx, dy}) {
		if (typeof dx !== 'number') throw new Error('dx not number ' + dx);
		if (typeof dy !== 'number') throw new Error('dy not number ' + dy);
		var last = this.parts.pop();
		last.x = this.parts[0].x + dx;
		last.y = this.parts[0].y + dy;
		this.parts.unshift(last);
		return {x1: this.parts[0].x, y1: this.parts[0].y, x2: this.parts[1].x, y2: this.parts[1].y, id: this.id};
	}

	position({x, y}) {
		this.parts.forEach(p => {
			p.x = x;
			p.y = y
		});
	}

	randomPosition() {
		var x = 0.25 + Math.random() / 2;
		var y = 0.25 + Math.random() / 2;
		this.position({x, y});
	}

	die() {
		this.randomPosition();
		this.velocity = this.startVelocity;
	}

	remove() {
		this.removed = true;
	}

	serialize() {
		return {
			id: this.id,
			color: this.color,
			parts: this.parts.map(p => [p.x, p.y])
		}
	}

	unserialize(data) {
		this.id = data.id;
		this.color = data.color;
		this.parts = data.parts.map(p => new Part(p[0], p[1], this.color));
	}

	update(data) {
		data.parts.forEach((p, i) => {
			this.parts[i].x = p[0];
			this.parts[i].y = p[1];
		});
	}
}

class Part {
	constructor(x, y, color) {
		if (typeof x !== 'number') throw new Error('x not number ' + x);
		if (typeof y !== 'number') throw new Error('y not number ' + y);
		if (typeof color !== 'number') throw new Error('color not number ' + color);
		this.x = x;
		this.y = y;
		this.color = color;
	}
}

if (typeof module === 'object' && module && typeof module.exports === 'object') {
	module.exports = Snake;
}