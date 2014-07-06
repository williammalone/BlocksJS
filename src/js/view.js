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

BLOCKS.view = function (options) {
	
	"use strict";
	
	var view = BLOCKS.eventDispatcher(),
	
		// Properties
		motors, x, y, width, height, offsetX, offsetY, angle, scale, alpha, visible, layer, hotspots, minHotspot, stack,
		
		// Helper function for initializing public properties
		createPublicProperty = function (propertyName, propertyVariable, defaultValue, markDirty) {
		
			propertyVariable = options[propertyName] || defaultValue;
		
			if (markDirty) {
				Object.defineProperty(view, propertyName, {
					get: function () {
						return propertyVariable;
					},
					set: function (value) {
						if (propertyVariable !== value) {
							view.dirty = true;
							propertyVariable = value;
						}
					}
				});
			} else {
				Object.defineProperty(view, propertyName, {
					get: function () {
						return propertyVariable;
					},
					set: function (value) {
						propertyVariable = value;
					}
				});
			}
		},
			
		motorDestroyed = function (motor) {
			
			var i;
			
			motor.removeEventListener("destroyed", motorDestroyed);
			
			for (i = 0 ; i < motors.length; i += 1)  {
				motors.splice(i, 1);
				break;
			}
		};

	// Public Methods
	view.update = function () {
	
	};
	
	view.render = function (e) {
		
		view.dirty = false;
	};
	
	view.show = function () {
	
		if (!view.visible) {
			view.dirty = true;
		}
		view.visible = true;
	};
	
	view.hide = function () {
	
		if (view.visible) {
			view.dirty = true;
		}
		view.visible = false;
		
	};
		
	view.motorize = function (motor) {
	
		motor.addEventListener("destroyed", motorDestroyed);
		motors.push(motor);
	};
	
	view.removeMotors = function (type) {
		
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
	
	view.isPointInside = function (point) {
	
		var i,
			bounds = view.getBounds(),
			collision = false;
	
		if (!point) {
			BLOCKS.warn("view.isPointInside point is falsy: " + point);
			return;
		}
		
		if (!bounds.length) {
			bounds = [bounds];
		}
		
		for (i = 0; i < bounds.length; i += 1) {
			
			if (point.x >= bounds[i].x && point.x <= bounds[i].x + bounds[i].width && point.y >= bounds[i].y && point.y <= bounds[i].y + bounds[i].height) {
				
				collision = true;
				break;
			}
		}
		
		return collision;
	};
	
	view.getBounds = function () {
		
		var i, bounds, extraWidth, extraHeight, x, y;
		
		x = view.x;
		y = view.y;

		if (!view.hotspots && !view.minHotspot) {
			bounds =  {
				x: x + view.offsetX,
				y: y + view.offsetY,
				width: view.width,
				height: view.height
			};
		} else {
			bounds = [];
			if (view.hotspots) {
				for (i = 0; i < view.hotspots.length; i += 1) {
					bounds.push({
						x: x + view.offsetX + view.hotspots[i].x,
						y: y + view.offsetY + view.hotspots[i].y,
						width: view.hotspots[i].width,
						height: view.hotspots[i].height
					});
				}
			}
			if (view.minHotspot) {
			
				extraWidth = view.width < view.minHotspot ? view.minHotspot - view.width : 0;
				extraHeight = view.height < view.minHotspot ? view.minHotspot - view.height : 0;

				bounds.push({
					x: x + view.offsetX - extraWidth / 2,
					y: y + view.offsetY - extraHeight / 2,
					width: view.width + extraWidth,
					height: view.height + extraHeight
				});
			}
			if (bounds.length === 1) {
				bounds = bounds[0];
			}
		}

		return bounds;
	};
	
	view.getBoundingBox = function () {
	
		return {
			x: view.x + view.offsetX,
			y: view.y + view.offsetY,
			width: view.width,
			height: view.height
		};
	};
	
	view.isRectInside = function (rect) {
	
		var i, result, bounds;
			
		if (!rect) {
			BLOCKS.warn("view.isRectangleInside rect is falsy: " + rect);
			return false;
		}

		bounds = view.getBounds();	
		if (!bounds.length) {
			bounds = [bounds];
		}

		for (i = 0; i < bounds.length; i += 1) {

			if (rect.x + rect.width > bounds[i].x && 
				rect.x < bounds[i].x + bounds[i].width && 
				rect.y + rect.height > bounds[i].y && 
				rect.y < bounds[i].y + bounds[i].height) {
			
				result = true;
				break;
			}
		}
			
		return result;
	};
	
	view.destroy = function () {
	
		var i;
		
		if (view) {
			view.removeMotors();
			
			view = null;
		}
	};
	
	// Create public properties
	(function () {
	
		options = options || {};
		
		view.name = options.name;
		
		view.dirty = true;

		x = options.x || 0;
		Object.defineProperty(view, "x", {
			get: function () {
				return view.stack ? view.stack.x + x : x;
			},
			set: function (value) {
				if (x !== value) {
					view.dirty = true;
					x = value;
				}
			}
		});
		
		y = options.y || 0;
		Object.defineProperty(view, "y", {
			get: function () {
				return view.stack ? view.stack.y + y : y;
			},
			set: function (value) {
				if (y !== value) {
					view.dirty = true;
					y = value;
				}
			}
		});
		
		createPublicProperty("width", width, 0, true);
		createPublicProperty("height", height, 0, true);
		createPublicProperty("offsetX", offsetX, 0, true);
		createPublicProperty("offsetY", offsetY, 0, true);
		createPublicProperty("angle", angle, 0, true);
		createPublicProperty("scale", scale, 1, true);
		createPublicProperty("alpha", alpha, 1, true);
		createPublicProperty("visible", visible, 1, true);
		createPublicProperty("layer", layer, undefined, true);
		createPublicProperty("hotspots", hotspots, undefined, true);
		createPublicProperty("minHotspot", minHotspot, undefined, true);
		createPublicProperty("stack", stack, undefined, true);

	}());
	
	return view;
};