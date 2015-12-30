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
		x, y, width, height, offsetX, offsetY, angle, scaleX, scaleY, alpha, visible, layer, hotspots, minHotspot, stack, centerRegistrationPoint,
		
		motors = [],
			
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
		
		var i, bounds, extraWidth, extraHeight, x, y, width, height;
		
		x = view.worldX;
		y = view.worldY;
		width = view.cropWidth !== undefined ? view.cropWidth : view.width;
		height = view.cropHeight !== undefined ? view.cropHeight : view.height;

		if (!view.hotspots && !view.minHotspot) {
			bounds =  {
				x: x + view.offsetX,
				y: y + view.offsetY,
				width: width,
				height: height
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
			
				extraWidth = width < view.minHotspot ? view.minHotspot - width : 0;
				extraHeight = height < view.minHotspot ? view.minHotspot - height : 0;

				bounds.push({
					x: x + view.offsetX - extraWidth / 2,
					y: y + view.offsetY - extraHeight / 2,
					width: width + extraWidth,
					height: height + extraHeight
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
			x: view.worldX + view.offsetX,
			y: view.worldY + view.offsetY,
			width: view.cropWidth !== undefined ? view.cropWidth : view.width,
			height: view.cropHeight !== undefined ? view.cropHeight : view.height
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

		if (view) {
			view.removeMotors();
			view.dispatchEvent("destroyed", view);
			view = null;
		}
	};
	
	// Create public properties
	(function () {
	
		options = options || {};
		
		view.name = options.name;
		
		view.dirty = true;
		
		stack = options.stack;
		Object.defineProperty(view, "stack", {
			get: function () {
				return stack;
			},
			set: function (value) {
				if (stack !== value) {
					view.dirty = true;
					stack = value;
				}
			}
		});
		
		Object.defineProperty(view, "worldX", {
			get: function () {
				return view.stack ? view.stack.x + view.x : view.x;
			},
			set: function (value) {
				if (view.x !== value) {
					view.dirty = true;
					view.x = view.stack ? value - view.stack.x : value;
				}
			}
		});
		
		Object.defineProperty(view, "worldY", {
			get: function () {
				return view.stack ? view.stack.y + view.y : view.y;
			},
			set: function (value) {
				if (view.y !== value) {
					view.dirty = true;
					view.y = view.stack ? value - view.stack.y : value;
				}
			}
		});
		
		Object.defineProperty(view, "scale", {
			get: function () {
				
				if (scaleX === scaleY) {
					return scaleX;	
				} else {
					return {
						x: scaleX,
						y: scaleY	
					};
				}
			},
			set: function (value) {
				if (value !== scaleX || value !== scaleY) {
					view.dirty = true;
					scaleX = value;
					scaleY = value;
				}
			}
		});
		
		scaleX = options.scaleX !== undefined ? options.scaleX : (options.scale !== undefined ? options.scale : 1);
		Object.defineProperty(view, "scaleX", {
			get: function () {
				return scaleX;
			},
			set: function (value) {
				if (scaleX !== value) {
					view.dirty = true;
					scaleX = value;
				}
			}
		});
		
		scaleY = options.scaleY !== undefined ? options.scaleY : (options.scale !== undefined ? options.scale : 1);
		Object.defineProperty(view, "scaleY", {
			get: function () {
				return scaleY;
			},
			set: function (value) {
				if (scaleY !== value) {
					view.dirty = true;
					scaleY = value;
				}
			}
		});
		
		width = options.width || 0;
		Object.defineProperty(view, "width", {
			get: function () {
				return width * view.scaleX;
			},
			set: function (value) {
				if (width !== value / view.scaleX) {
					view.dirty = true;
					width = value / view.scaleX;
				}
			}
		});
		
		height = options.height || 0;
		Object.defineProperty(view, "height", {
			get: function () {
				return height * view.scaleY;
			},
			set: function (value) {
				if (height !== value / view.scaleY) {
					view.dirty = true;
					height = value / view.scaleY;
				}
			}
		});
		
		offsetX = options.offsetX || 0;
		Object.defineProperty(view, "offsetX", {
			get: function () {
				return view.centerRegistrationPoint ? -view.width / 2 : offsetX;
			},
			set: function (value) {
				if (offsetX !== value) {
					view.dirty = true;
					offsetX = value;
				}
			}
		});
		
		offsetY = options.offsetY || 0;
		Object.defineProperty(view, "offsetY", {
			get: function () {
				return view.centerRegistrationPoint ? -view.height / 2 : offsetY;
			},
			set: function (value) {
				if (offsetY !== value) {
					view.dirty = true;
					offsetY = value;
				}
			}
		});
		
		angle = options.angle || 0;
		Object.defineProperty(view, "angle", {
			get: function () {
				return angle;
			},
			set: function (value) {
			
				value = value % 360;
				
				if (value < 0) {
					value = 360 + value;
				}
			
				if (angle !== value) {
					view.dirty = true;
					angle = value;
				}
			}
		});
		
		x = options.x || 0;
		Object.defineProperty(view, "x", {
			get: function () {
				return x;
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
				return y;
			},
			set: function (value) {
				if (y !== value) {
					view.dirty = true;
					y = value;
				}
			}
		});
		
		alpha = options.alpha !== undefined ? options.alpha : 1;
		Object.defineProperty(view, "alpha", {
			get: function () {
				return alpha;
			},
			set: function (value) {
				if (alpha !== value) {
				
					// Round the alpha value if it is really close
					if (alpha < 0.0001) {
						alpha = 0;
					} else if (alpha > 0.9999) {
						alpha = 1;
					}
					view.dirty = true;
					alpha = value;
				}
			}
		});
		
		visible = options.visible !== undefined ? options.visible : true;
		Object.defineProperty(view, "visible", {
			get: function () {
				return visible;
			},
			set: function (value) {
				if (visible !== value) {
					view.dirty = true;
					visible = value;
				}
			}
		});
		
		layer = options.layer;
		Object.defineProperty(view, "layer", {
			get: function () {
				return layer;
			},
			set: function (value) {
				if (layer !== value) {
					view.dirty = true;
					layer = value;
				}
			}
		});
		
		hotspots = options.hotspots;
		Object.defineProperty(view, "hotspots", {
			get: function () {
				return hotspots;
			},
			set: function (value) {
				if (hotspots !== value) {
					view.dirty = true;
					hotspots = value;
				}
			}
		});

		minHotspot = options.minHotspot;
		Object.defineProperty(view, "minHotspot", {
			get: function () {
				return minHotspot;
			},
			set: function (value) {
				if (minHotspot !== value) {
					view.dirty = true;
					minHotspot = value;
				}
			}
		});
		
		centerRegistrationPoint = options.centerRegistrationPoint || false;
		Object.defineProperty(view, "centerRegistrationPoint", {
			get: function () {
				return centerRegistrationPoint;
			},
			set: function (value) {
				if (centerRegistrationPoint !== value) {
					view.dirty = true;
					centerRegistrationPoint = value;
				}
			}
		});
	}());
	
	return view;
};