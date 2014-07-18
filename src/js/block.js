/*
Copyright (c) 2013 William Malone (www.williammalone.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*global window */

var BLOCKS;

if (BLOCKS === undefined) {
	BLOCKS = {};
}

BLOCKS.block = function (options) {
	
	"use strict";
	
	var block = BLOCKS.eventDispatcher(),
	
		// Private Properties
		slicesArr = [],
		slicesObj = {},
		curSlice,
		name = options && options.name,
		layer = options && options.layer,
		motors = [],
		stack,
		x = (options && options.x) || 0,
		y = (options && options.y) || 0,
		width = (options && options.width) || 0,
		height = (options && options.height) || 0,
		scale = (options && options.scale !== undefined) ? options.scale : 1,
	
		assignBlockProperties = function () {
		
			curSlice.scale = block.scale;
			curSlice.angle = block.angle;
			if (block.minHotspot >= 0) {
				curSlice.minHotspot = block.minHotspot;
			}
			curSlice.x = block.x;
			curSlice.y = block.y;
			curSlice.visible = block.visible;
			if (block.alpha < 0.01) {
				block.alpha = 0;
			} else if (block.alpha > 0.99) {
				block.alpha = 1;
			}
			curSlice.alpha = block.alpha;
			curSlice.cropWidth = block.cropWidth;
			curSlice.cropHeight = block.cropHeight;
			curSlice.colorize = block.colorize;
		},
		
		motorDestroyed = function (motor) {
			
			var i;
			
			motor.removeEventListener("destroyed", motorDestroyed);
			
			for (i = 0 ; i < motors.length; i += 1)  {
				motors.splice(i, 1);
				break;
			}
		};
	
	// Public Properties
	block.name = (options && options.name !== undefined) ? options.name : undefined;
	block.angle = (options && options.angle) || 0;
	//block.scale = (options && options.scale !== undefined) ? options.scale : 1;
	block.alpha = (options && options.alpha !== undefined) ? options.alpha : 1;
	block.visible = (options && options.visible !== undefined) ? options.visible : true;
	block.dirty = false;
	
	// Public Methods
	block.update = function () {
	
		if (block && curSlice) {
		
			assignBlockProperties();
			curSlice.update();
			// The slice could have been deleted after updating and firing a complete event
			if (curSlice && curSlice.dirty) {
				block.dirty = curSlice.dirty;
			}
		}
	};
	
	block.render = function (e) {
		
		if (block && (block.dirty || curSlice.dirty)) {
		
			curSlice.justTapped = block.justTapped;
			curSlice.justNotTapped = block.justNotTapped;
			curSlice.dragging = block.dragging;
			curSlice.justReleased = block.justReleased;
			curSlice.tapPos = block.tapPos;
		
			assignBlockProperties();
			curSlice.dirty = true;
			curSlice.render(e);
			
			block.dirty = false;
		}
	};
	
	block.addSlice = function (options) {
	
		var slice;
		
		if (layer) {
			options.layer = layer;
		}
		
		slice = BLOCKS.slice(options);

		if (!options.name) {
			slice.name = "unnamedSlice" + slicesArr.length;
		}

		slicesArr.push(slice);	
		slicesObj[options.name] = slice;
		
		slice.addEventListener("complete", function () {
			block.dispatchEvent("complete");
		});
		
		// If first slice then set the block to this slice
		if (slicesArr.length === 1) {
			block.setSlice(options.name);
		}
		
		return slice;
	};
	
	block.getSlice = function (name) {
	
		if (name === undefined) {
			return curSlice;
		} else {
			return slicesObj[name];
		}
	};
	
	block.setSlice = function (name, callback) {
	
		var i, slice;
		
		slice = slicesObj[name];

		if (slice && slice !== curSlice) {

			block.layer = slice.layer;
			block.width = slice.width;
			block.height = slice.height;
			block.dirty = true;
			if (curSlice) {
				curSlice.layer.dirty = true;
			}
			curSlice = slice;
			assignBlockProperties();
			curSlice.reset();
			if (curSlice.autoPlay) {
				curSlice.play(callback);
			}
			
			return true;
		} else {
			// If slice does not exist then do nothing
			return false;
		}
	};
	
	block.show = function () {
	
		if (!block.visible) {
			block.visible = true;
			block.dirty = true;
		}
	};
	
	block.hide = function () {
		
		if (block.visible) {
			block.visible = false;
			block.dirty = true;
		}
	};
	
	block.motorize = function (motor) {
	
		motor.addEventListener("destroyed", motorDestroyed);
		motors.push(motor);
	};
	
	block.removeMotors = function (type) {
		
		var i, motorArr = [];
		
		for (i = 0 ; i < motors.length; i += 1)  {
			if (type) {
				if (motors[i].type === type) {
					motors[i].destroy();
				} else {
					motorArr.push(motors[i]);
				}
			} else {
				motors[i].destroy();
			}
		}
		motors = motorArr;
	};
	
	block.pause = function () {
		
		curSlice.pause();
	};
	
	block.unpause = function () {
		
		curSlice.unpause();
	};
	
	block.reset = function () {
		
		curSlice.reset();
	};
	
	block.stop = function () {
		
		curSlice.stop();
	};
	
	block.play = function (callback) {
		
		curSlice.play(callback);
	};
	
	block.isPointInside = function (point) {
	
		assignBlockProperties();
		return curSlice.isPointInside(point);
	};
	
	block.getBounds = function () {
		
		assignBlockProperties();
		return curSlice.getBounds();
	};
	
	block.getBoundingBox = function () {
		
		assignBlockProperties();
		return curSlice.getBoundingBox();
	};
	
	block.isRectInside = function (rect) {
	
		assignBlockProperties();
		return curSlice.isRectInside(rect);
	};
	
	block.gotoLastFrame = function () {
	
		curSlice.gotoLastFrame();
	};
	
	block.gotoFrame = function (frameIndex) {
		curSlice.gotoFrame(frameIndex);
	};
	
	block.destroy = function () {
	
		var i;
		
		if (block) {
			block.removeMotors();
			
			for (i = 0; i < slicesArr.length; i += 1) {
				if (slicesArr[i].layer && slicesArr[i].layer.container) {
					slicesArr[i].layer.container.removeView(slicesArr[i]);
				}
				slicesArr[i].destroy();
			}
			slicesArr = null;
			slicesObj = null;
			curSlice = null;
			
			block = null;
		}
	};
	
	Object.defineProperty(block, "stack", {
		get: function () {
		
			return stack;
		},
		set: function (value) {
		
			var i;
			
			stack = value;
			
			for (i = 0; i < slicesArr.length; i += 1) {
				slicesArr[i].stack = stack;
			}
		}
	});
	
	Object.defineProperty(block, "x", {
		get: function () {
			return block.stack ? block.stack.x + x : x;
		},
		set: function (value) {
			x = block.stack ? value - block.stack.x : value;
		}
	});
	
	Object.defineProperty(block, "y", {
		get: function () {
			return block.stack ? block.stack.y + y : y;
		},
		set: function (value) {
			y = block.stack ? value - block.stack.y : value;
		}
	});
	
	/*Object.defineProperty(block, "x", {
		get: function () {
			return x;
		},
		set: function (value) {
			x = value;
			curSlice.x = x;
		}
	});
	
	Object.defineProperty(block, "y", {
		get: function () {
			return y;
		},
		set: function (value) {
			y = value;
			curSlice.y = y;
		}
	});*/
	
	Object.defineProperty(block, "localX", {
		get: function () {
			return curSlice.localX;
		},
		set: function (value) {
			x = value;
			curSlice.localX = x;
		}
	});
	
	Object.defineProperty(block, "localY", {
		get: function () {
			return curSlice.localY;
		},
		set: function (value) {
			y = value;
			curSlice.localY = y;
		}
	});
	
	Object.defineProperty(block, "width", {
		get: function () {
			return curSlice.width;
		},
		set: function (value) {
			if (curSlice) {
				curSlice.width = value;
			} else {
				width = value;
			}
		}
	});
	
	Object.defineProperty(block, "height", {
		get: function () {
			return curSlice.height;
		},
		set: function (value) {
			if (curSlice) {
				curSlice.height = value;
			} else {
				height = value;
			}
		}
	});
	
	Object.defineProperty(block, "scale", {
		get: function () {
			return scale;
		},
		set: function (value) {
			if (scale !== value) {
				scale = value;
				curSlice.scale = scale;
			}
		}
	});
	
	/*Object.defineProperty(block, "layer", {
		get: function () {
			return layer;
		},
		set: function (value) {
			layer = value;
			if (curSlice.layer !== layer) {
				curSlice.layer = layer;
				curSlice.dirty = true;
			}
		}
	});*/
	
	(function () {
		var i, spec = options && options.spec;
		
		if (spec) {
			// If slices defined in the options
			if (spec.slices) {
				for (i = 0; i < spec.slices.length; i += 1) {
					block.addSlice(spec.slices[i]);
				}
			}
			
			// Set the position of the block if specified in the spec
			block.x = spec.x || 0;
			block.y = spec.y || 0;
		}
	}());
	
	return block;
};