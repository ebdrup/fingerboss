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

	update(data){
		console.log('update', data);
		data.parts.forEach((p,i) => {
			this.parts[i].x = p[0];
			this.parts[i].y = p[1];
		});
	}
}

class Part {
	constructor(x, y, color) {
		this.x = x;
		this.y = y;
		this.color = color;
	}
}