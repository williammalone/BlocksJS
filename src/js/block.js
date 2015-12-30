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
		motors = [],
		// The order of properties matters in cases of dependencies
		properties = ["stack", "worldX", "worldY", "x", "y", "scale", "scaleX", "scaleY", "width", "height", "centerRegistrationPoint", "mirrorX", "mirrorY", "angle", "alpha", "layer", "visible", "dirty", "justTapped", "justNotTapped", "dragging", "justReleased", "tapPos", "cropWidth", "cropHeight", "frameOffsetX", "frameOffsetY", "offsetX", "offsetY", "minHotspot", "hotspots", "currentFrameIndex"],	
		methods = ["update", "render", "show", "hide", "pause", "unpause", "reset", "stop", "play", "isPointInside", "getBounds", "getBoundingBox", "isRectInside", "gotoLastFrame", "gotoFrame"],
		
		motorDestroyed = function (motor) {
			
			var i;
			
			motor.removeEventListener("destroyed", motorDestroyed);
			
			for (i = 0 ; i < motors.length; i += 1)  {
				if (motors[i] === motor) {
					motors.splice(i, 1);
				}
				break;
			}
		};
		
	options = options || {};

	// Block Specific Public Properties
	block.name = options.name;
	
	// BLock Specific Public Methods
	block.addSlice = function (spec) {
	
		var i, slice;
		
		slice = BLOCKS.slice(spec);

		if (!spec.name) {
			slice.name = "unnamedSlice" + slicesArr.length;
		}

		slicesArr.push(slice);	
		slicesObj[spec.name] = slice;
		
		slice.addEventListener("complete", function () {
			block.dispatchEvent("complete");
		});
		
		// If first slice then set the block to this slice
		if (slicesArr.length === 1) {
			// Assign the properties of the spec to the new slice
			for (i = 0; i < properties.length; i += 1) {
				if (options[properties[i]] !== undefined) {
					slice[properties[i]] = options[properties[i]];
				}
			}
			block.setSlice(spec.name);
		}
		
		return slice;
	};
	
	block.removeSlice = function (name, destroyOptions) {
	
		if (slicesObj[name]) {
			slicesObj[name].destroy(destroyOptions);
			slicesObj[name] = null;
		}
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
					if (properties[i] !== "width" && properties[i] !== "height" && properties[i] !== "offsetX" && properties[i] !== "offsetY") {
					newSlice[properties[i]] = curSlice[properties[i]];
					}
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
		
		var i, 
			motorsToDestroy = [],
			newMotorArr = [];
		
		// Mark all motors to be destroyed. Don't destroy them yet because
		//   the motors array will change because an event is dispatched
		//   when the destroy method is called which alters the motor array
		for (i = 0 ; i < motors.length; i += 1)  {
			if (type) {
				if (motors[i].type === type) {
					motorsToDestroy.push(motors[i]);
				} else {
					newMotorArr.push(motors[i]);
				}
			} else {
				motorsToDestroy.push(motors[i]);
			}
		}
		
		// Destroy all motors marked for destruction
		for (i = 0 ; i < motorsToDestroy.length; i += 1)  {
			motorsToDestroy[i].destroy();
		}
		
		motors = newMotorArr;
	};
	
	block.destroy = function (options) {
	
		var i;
		
		if (block) {
			block.removeMotors();
			
			for (i = 0; i < slicesArr.length; i += 1) {
				slicesArr[i].destroy(options);
			}
			slicesArr = null;
			slicesObj = null;
			curSlice = null;
			
			block.dispatchEvent("destroyed", block);
			block = null;
		}
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
			},
			
			createPublicMethod = function (methodName) {
		
				block[methodName] = function (parameter) {
				
					return curSlice[methodName](parameter);
				};
			};
		
		for (i = 0; i < properties.length; i += 1) {
			createPublicProperty(properties[i]);
		}
		
		for (i = 0; i < methods.length; i += 1) {
			createPublicMethod(methods[i]);
		}

		// If slices defined in the options
		if (options.slices) {
			for (i = 0; i < options.slices.length; i += 1) {
				block.addSlice(options.slices[i]);
			}
		}
	}());
	
	return block;
};