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
		properties = ["stack", "worldX", "worldY", "x", "y", "width", "height", "scale", "mirrorX", "mirrorY", "angle", "alpha", "layer", "visible", "dirty", "justTapped", "justNotTapped", "dragging", "justReleased", "tapPos", "cropWidth", "cropHeight", "frameOffsetX", "frameOffsetY"],
		
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
	
	(function () {
		var i,
		
			createPublicProperty = function (propertyName) {
			
				Object.defineProperty(block, propertyName, {
					get: function () {
						if (curSlice) {
							return curSlice[propertyName];
						}
					},
					set: function (value) {
						if (curSlice) {
							curSlice[propertyName] = value;
						}
					}
				});
			};
		
		for (i = 0; i < properties.length; i += 1) {
		
			createPublicProperty(properties[i]);
		}

		// If slices defined in the options
		if (spec &&spec.slices) {
			for (i = 0; i < spec.slices.length; i += 1) {
				block.addSlice(spec.slices[i]);
			}
		}
	}());
	
	return block;
};