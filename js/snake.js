class Snake {
	//Either construct with data OR the other properties
	constructor({id, length, color, velocity, data}) {
		this.power = 0;
		this.counter = 1;
		this.moveCache = {};
		this.lastMoves = [];
		if (data) {
			this.unserialize(data);
			this.startVelocity = data.velocity;
			this.startLength = data.parts.length;
			var gfx;
			var update = (function () {
				var now = Date.now();
				if (this.removed) {
					if (gfx) {
						world.stage.removeChild(gfx);
					}
					return;
				}
				requestAnimationFrame(update);
				if (gfx) {
					world.stage.removeChild(gfx);
					this.itemSprites && this.itemSprites.forEach(s => world.stage.removeChild(s));
				}
				if (!state.playing) {
					return;
				}
				//snake
				gfx = new PIXI.Graphics();
				var width = world.width;
				var height = world.height;
				var lineThickness = (height + width) / 200;
				gfx.lineStyle(lineThickness, data.color, 0.8);
				var parts = this.getParts(now);
				var headColor;
				switch (this.power) {
					case 0:
						headColor = 0xffffff;
						break;
					case 1:
						headColor = 0xbb4444;
						break;
					case 2:
						headColor = 0xdd2222;
						break;
					default:
						headColor = 0xff0000;
				}
				for (var i = parts.length - 3; i >= 0; i--) {
					if (i == 4) {
						gfx.lineStyle(lineThickness, headColor, 0.8);
					}
					var x1 = (parts[i + 2].x - state.pos.x) * width;
					var y1 = (parts[i + 2].y - state.pos.y) * height;
					var x2 = (parts[i + 1].x - state.pos.x) * width;
					var y2 = (parts[i + 1].y - state.pos.y) * height;
					var x3 = (parts[i].x - state.pos.x) * width;
					var y3 = (parts[i].y - state.pos.y) * height;
					gfx.moveTo(x1, y1);
					gfx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
				}
				gfx.endFill();
				gfx.visible = true;
				gfx.x = 0;
				gfx.y = 0;
				world.stage.addChild(gfx);
				//items
				if (this.items) {
					this.itemSprites = Object.keys(this.items).map(key => {
						var type = ['item', key, this.items[key]].join('_');
						var position, rotation = 0, size = 0.015;
						switch (key) {
							case 'glasses':
								position = 3;
								break;
							case 'bow':
								position = this.parts.length - 4;
								rotation = Math.PI;
								break;
							case 'clothes':
								position = Math.round(this.parts.length / 2) - 5;
								rotation = Math.PI;
								size = 0.023;
								break;
						}
						rotation -= Math.atan2(
							(this.parts[position].x - this.parts[position + 1].x) * world.width,
							(this.parts[position].y - this.parts[position + 1].y) * world.height
						);
						return sprite({
							x: this.parts[position].x,
							y: this.parts[position].y,
							type,
							snakeId: this.id,
							rotation,
							size
						});
					});
					this.itemSprites.forEach(s => world.stage.addChild(s));
				}
			}).bind(this);
			update();
		} else {
			this.id = id;
			this.color = color;
			this.velocity = velocity;
			this.startVelocity = velocity;
			this.startLength = length;
			this.parts = Array.apply(null, Array(length)).map(() => new Part(0, 0, color));
			this.items = {};
			this.randomPosition();
		}
	}

	getParts(now) {
		return this.parts.filter(p => p.t >= (now - this.parts.length * 50));
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

	snakeCollision(movement, now) {
		var snake = this;
		return Object.keys(state.snakes)
			.filter(key => snake.color !== state.snakes[key].color)
			.some(key => {
				let snake = state.snakes[key];
				let parts = snake.getParts(now);
				for (var i = 1; i < parts.length; i++) {
					if (lineIntersect(Object.assign({}, movement, {
							x3: parts[i - 1].x,
							y3: parts[i - 1].y,
							x4: parts[i].x,
							y4: parts[i].y,
						}))) {
						return true;
					}
				}
				return false;
			});
	}

	mouseCollision() {
		for (var j = 0; j < state.mice.length; j++) {
			var mouse = state.mice[j];
			if (this.headCollision(mouse)) {
				state.mice.splice(j, 1);
				return mouse;
			}
		}
		return null;
	}

	mouseEaten(mouse) {
		var text;
		switch (mouse.type) {
			case 'speed':
				if (this.velocity <= VELOCITY * 1.5) {
					this.velocity += VELOCITY * 0.1;
					text = 'faster';
				} else {
					this.addLength(5);
					text = 'longer';
				}
				break;
			case 'power':
				text = '+1 power kick';
				this.power++;
				break;
			default:
				if (mouse.type.indexOf('item_') === 0) {
					var itemParts = mouse.type.split('_');
					this.items[itemParts[1]] = itemParts[2];
					text = itemParts[1];
				}
		}
		return text;
	}

	headCollision(element) {
		var check = checkPart.bind(this);
		return check(this.parts[0]) || check(this.parts[1]);

		function checkPart(part) {
			var d = distance(part, element);
			return d <= (element.size / 2) + 0.0003 ? part : false;
		}
	}

	move({dx, dy, c}) {
		if (typeof dx !== 'number') throw new Error('dx not number ' + dx);
		if (typeof dy !== 'number') throw new Error('dy not number ' + dy);
		if (c <= this.counter) {
			return;
		}
		if (c && (c !== this.counter + 1)) {
			var worldId = (typeof module !== 'object') && world && world.id || 'NA';
			console.log(`Expecting counter ${this.counter + 1} got ${c}. id: ${this.id}, worldId: ${worldId}`);
			this.moveCache[c] = arguments[0];
			if (Object.keys(this.moveCache).length >= 50 && !this.waitingForUnserialize) {
				this.waitingForUnserialize = true;
				console.log('onMissingMove');
				this.onMissingMove && this.onMissingMove(this.id);
			}
			var move;
			for (var i = this.counter + 1; move = this.moveCache[i]; i++) {
				this.move(move);
				delete this.moveCache[i];
			}
			return;
		}
		this.counter = c;
		var last = this.parts.pop();
		last.x = this.parts[0].x + dx;
		last.y = this.parts[0].y + dy;
		last.t = Date.now();
		this.parts.unshift(last);
		this.onMove && this.onMove(arguments[0]);
		this.lastMoves.push(arguments[0]);
		this.lastMoves.slice(this.lastMoves.length - 100, 100);
		return {x1: this.parts[0].x, y1: this.parts[0].y, x2: this.parts[1].x, y2: this.parts[1].y, id: this.id};
	}

	addLength(length) {
		for (var i = 0; i < length; i++) {
			this.parts.push(this.parts[this.parts.length - 1].clone());
		}
	}

	position({x, y}) {
		var now = Date.now();
		this.parts.forEach(p => {
			p.x = x;
			p.y = y;
			p.t = now;
		});
	}

	randomPosition() {
		var x = 0.25 + Math.random() / 2;
		var y = 0.25 + Math.random() / 2;
		this.position({x, y});
	}

	die() {
		this.velocity = this.startVelocity;
		this.parts = this.parts.slice(0, this.startLength);
		this.items = {};
		this.randomPosition();
	}

	remove() {
		this.removed = true;
	}

	serialize() {
		return {
			id: this.id,
			color: this.color,
			parts: this.parts.map(p => [p.x, p.y]),
			power: this.power,
			velocity: this.velocity,
			counter: this.counter,
			items: this.items
		}
	}

	unserialize(data) {
		this.id = data.id;
		this.color = data.color;
		this.parts = data.parts.map(p => new Part(p[0], p[1], this.color));
		this.power = data.power;
		this.velocity = data.velocity;
		this.counter = data.counter;
		this.items = data.items;
		this.waitingForUnserialize = false;
		Object.keys(this.moveCache).forEach(counter => (this.counter >= counter) && (delete this.moveCache[counter]));
		//replay any lost moves
		this.lastMoves.forEach(move => {
			if (move.c === this.counter + 1) {
				this.move(move);
			}
		})
	}

	update(data) {
		this.parts = this.parts.slice(0, data.parts.length);
		data.parts.forEach((p, i) => {
			if (!this.parts[i]) {
				this.addLength(1)
			}
			this.parts[i].x = p[0];
			this.parts[i].y = p[1];
		});
		this.power = data.power;
		this.items = data.items;
	}
}

class Part {
	constructor(x, y, color) {
		if (typeof x !== 'number') throw new Error('x not number ' + x);
		if (typeof y !== 'number') throw new Error('y not number ' + y);
		if (typeof color !== 'number') throw new Error('color not number ' + color);
		this.x = x;
		this.y = y;
		this.t = Date.now();
		this.color = color;
	}

	clone() {
		return new Part(this.x, this.y, this.color);
	}
}

if (typeof module === 'object' && module && typeof module.exports === 'object') {
	module.exports = Snake;
}