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
		motors = [],
		layer = options && options.layer,
		
		assignBlockProperties = function () {
		
			curSlice.scale = block.scale;
			curSlice.angle = block.angle;
			if (block.minHotspot >= 0) {
				curSlice.minHotspot = block.minHotspot;
			}
			curSlice.x = block.x;
			curSlice.y = block.y;
			curSlice.visible = block.visible;
			if (block.alpha < 0) {
				block.alpha = 0;
			} else if (block.alpha > 1) {
				block.alpha = 1;
			}
			curSlice.cropWidth = block.cropWidth;
			curSlice.cropHeight = block.cropHeight;
			curSlice.alpha = block.alpha;
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
	block.x = (options && options.x) || 0;
	block.y = (options && options.y) || 0;
	block.angle = (options && options.angle) || 0;
	block.scale = (options && options.scale !== undefined) ? options.scale : 1;
	block.alpha = (options && options.alpha !== undefined) ? options.alpha : 1;
	block.visible = (options && options.visible !== undefined) ? options.visible : true;
	
	// Public Methods
	block.update = function () {
	
		if (block && curSlice) {
		
			assignBlockProperties();
			curSlice.update();
			if (curSlice.dirty) {
				block.dirty = curSlice.dirty;
			}
		}
	};
	
	block.render = function () {
		
		if (block && (block.dirty || curSlice.dirty)) {
		
			curSlice.justTapped = block.justTapped;
			curSlice.justNotTapped = block.justNotTapped;
			curSlice.dragging = block.dragging;
			curSlice.justReleased = block.justReleased;
			curSlice.tapPos = block.tapPos;
		
			assignBlockProperties();
			curSlice.dirty = true;
			curSlice.render();
			
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
	
	block.setSlice = function (name) {
	
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
				curSlice.play();
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
	
	block.stopMotors = function (type) {
		
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
	
	block.play = function () {
		
		curSlice.play();
	};
	
	block.isPointInside = function (point) {
	
		assignBlockProperties();
		return curSlice.isPointInside(point);
	};
	
	block.getBounds = function (boundingRectOnly) {
		
		assignBlockProperties();
		return curSlice.getBounds(boundingRectOnly);
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
			block.stopMotors();
			
			for (i = 0; i < slicesArr.length; i += 1) {
				slicesArr[i].destroy();
			}
			slicesArr = null;
			slicesObj = null;
			curSlice = null;
			
			block = null;
		}
	};
	
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