

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

	move({dx, dy}) {
		if (typeof dx !== 'number') throw new Error('dx not number ' + dx);
		if (typeof dy !== 'number') throw new Error('dy not number ' + dy);
		var last = this.parts.pop();
		last.x = this.parts[0].x + dx;
		last.y = this.parts[0].y + dy;
		this.parts.unshift(last);
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

module.exports = Snake;