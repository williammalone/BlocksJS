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
		spec = options && options.spec,
		layer = options && options.layer,
		slicesArr = [],
		slicesObj = {},
		curSlice,
		motors = [],
		properties = [],
		
		motorDestroyed = function (motor) {
			
			var i;
			
			motor.removeEventListener("destroyed", motorDestroyed);
			
			for (i = 0 ; i < motors.length; i += 1)  {
				motors.splice(i, 1);
				break;
			}
		};

	// Public Properties
	block.name = (spec && spec.name !== undefined) ? spec.name : undefined;
	
	// Public Methods
	
	block.addSlice = function (options) {
	
		var i, slice;
		
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
			if (layer) {
				slice.layer = layer;
			}
			// Assign the properties of the spec to the new slice
			for (i = 0; i < properties.length; i += 1) {
				if (spec[properties[i]] !== undefined) {
					slice[properties[i]] = spec[properties[i]];
				}
			}
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
	
		var i, newSlice;
		
		newSlice = slicesObj[name];

		if (newSlice && newSlice !== curSlice) {

			// If there is a current slice
			if (curSlice) {
				// Assign the properties of the current slice to the new slice
				for (i = 0; i < properties.length; i += 1) {
					newSlice[properties[i]] = curSlice[properties[i]];
				}
			}
			// Make the new slice the block's current slice
			curSlice = newSlice;

			// If the current slice is an animation then reset and autoplay it
			curSlice.reset();
			if (curSlice.autoPlay) {
				curSlice.play(callback);
			}

			curSlice.dirty = true;
			
			return true;
		} else {
			// If slice does not exist or it is already set then do nothing
			return false;
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
	
	block.destroy = function () {
	
		var i;
		
		if (block) {
			block.removeMotors();
			
			for (i = 0; i < slicesArr.length; i += 1) {
				slicesArr[i].destroy();
			}
			slicesArr = null;
			slicesObj = null;
			curSlice = null;
			block = null;
		}
	};
	
	block.update = function () {
	
		curSlice.update();
	};
	
	block.render = function (e) {
	
		curSlice.render(e);
	};
	
	block.show = function () {
	
		curSlice.show();
	};
	
	block.hide = function () {
		
		curSlice.hide();
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
	
		return curSlice.isPointInside(point);
	};
	
	block.getBounds = function () {

		return curSlice.getBounds();
	};
	
	block.getBoundingBox = function () {
		
		return curSlice.getBoundingBox();
	};
	
	block.isRectInside = function (rect) {
	
		return curSlice.isRectInside(rect);
	};
	
	block.gotoLastFrame = function () {
	
		curSlice.gotoLastFrame();
	};
	
	block.gotoFrame = function (frameIndex) {
	
		curSlice.gotoFrame(frameIndex);
	};
	
	properties.push("stack");
	Object.defineProperty(block, "stack", {
		get: function () {
			return curSlice.stack;
		},
		set: function (value) {
			curSlice.stack = value;
		}
	});
	
	properties.push("worldX");
	Object.defineProperty(block, "worldX", {
		get: function () {
			return curSlice.worldX;
		},
		set: function (value) {
			curSlice.worldX = value;
		}
	});
	
	properties.push("worldY");
	Object.defineProperty(block, "worldY", {
		get: function () {
			return curSlice.worldY;
		},
		set: function (value) {
			curSlice.worldY = value;
		}
	});
	
	properties.push("x");
	Object.defineProperty(block, "x", {
		get: function () {
			return curSlice.x;
		},
		set: function (value) {
			curSlice.x = value;
		}
	});
	
	properties.push("y");
	Object.defineProperty(block, "y", {
		get: function () {
			return curSlice.y;
		},
		set: function (value) {
			curSlice.y = value;
		}
	});
	
	properties.push("width");
	Object.defineProperty(block, "width", {
		get: function () {
			return curSlice.width;
		},
		set: function (value) {
			curSlice.width = value;
		}
	});
	
	properties.push("height");
	Object.defineProperty(block, "height", {
		get: function () {
			return curSlice.height;
		},
		set: function (value) {
			curSlice.height = value;
		}
	});
	
	properties.push("scale");
	Object.defineProperty(block, "scale", {
		get: function () {
			return curSlice.scale;
		},
		set: function (value) {
			curSlice.scale = value;
		}
	});
	
	properties.push("mirrorX");
	Object.defineProperty(block, "mirrorX", {
		get: function () {
			return curSlice.mirrorX;
		},
		set: function (value) {
			curSlice.mirrorX = value;
		}
	});
	
	properties.push("mirrorY");
	Object.defineProperty(block, "mirrorY", {
		get: function () {
			return curSlice.mirrorY;
		},
		set: function (value) {
			curSlice.mirrorY = value;
		}
	});
	
	properties.push("angle");
	Object.defineProperty(block, "angle", {
		get: function () {
			return curSlice.angle;
		},
		set: function (value) {
			curSlice.angle = value;
		}
	});
	
	properties.push("alpha");
	Object.defineProperty(block, "alpha", {
		get: function () {
			return curSlice.alpha;
		},
		set: function (value) {
			curSlice.alpha = value;
		}
	});
	
	properties.push("layer");
	Object.defineProperty(block, "layer", {
		get: function () {
			return curSlice.layer;
		},
		set: function (value) {
			curSlice.layer = value;
		}
	});
	
	properties.push("visible");
	Object.defineProperty(block, "visible", {
		get: function () {
			return curSlice.visible;
		},
		set: function (value) {
			curSlice.visible = value;
		}
	});
	
	properties.push("dirty");
	Object.defineProperty(block, "dirty", {
		get: function () {
			return curSlice.dirty;
		},
		set: function (value) {
			curSlice.dirty = value;
		}
	});
	
	properties.push("justTapped");
	Object.defineProperty(block, "justTapped", {
		get: function () {
			return curSlice.justTapped;
		},
		set: function (value) {
			curSlice.justTapped = value;
		}
	});
	
	properties.push("justNotTapped");
	Object.defineProperty(block, "justNotTapped", {
		get: function () {
			return curSlice.justNotTapped;
		},
		set: function (value) {
			curSlice.justNotTapped = value;
		}
	});
	
	properties.push("dragging");
	Object.defineProperty(block, "dragging", {
		get: function () {
			return curSlice.dragging;
		},
		set: function (value) {
			curSlice.dragging = value;
		}
	});
	
	properties.push("justReleased");
	Object.defineProperty(block, "justReleased", {
		get: function () {
			return curSlice.justReleased;
		},
		set: function (value) {
			curSlice.justReleased = value;
		}
	});
	
	properties.push("tapPos");
	Object.defineProperty(block, "tapPos", {
		get: function () {
			return curSlice.tapPos;
		},
		set: function (value) {
			curSlice.tapPos = value;
		}
	});
	
	(function () {
		var i;

		// If slices defined in the options
		if (spec &&spec.slices) {
			for (i = 0; i < spec.slices.length; i += 1) {
				block.addSlice(spec.slices[i]);
			}
		}
	}());
	
	return block;
};