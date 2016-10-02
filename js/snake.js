class Snake {
	//Either construct with data OR the other properties
	constructor({id, x, y, length, color, data}) {
		if (data) {
			this.unserialize(data);
			this.sprites = this.parts.map(p => getEmitter(p))
		} else {
			this.id = id;
			this.color = color;
			this.parts = Array.apply(null, Array(length)).map(() => new Part(x, y, color));
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

	die() {
		this.parts.forEach(p => p.x = p.y = 0.5);
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