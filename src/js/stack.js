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

BLOCKS.stack = function (options) {
	
	"use strict";
	
	var stack = BLOCKS.eventDispatcher(),
		views = [],
		dirty,
		alpha,
		motors = [],
		
		motorDestroyed = function (motor) {
			
			var i;
			
			motor.removeEventListener("destroyed", motorDestroyed);
			
			for (i = 0 ; i < motors.length; i += 1)  {
				motors.splice(i, 1);
				break;
			}
		};
	
	// Public Properties
	stack.x = (options && options.x) || 0;
	stack.y = (options && options.y) || 0;
	stack.visible = true;
	
	// Public Methods
	stack.addView = function (view) {
	
		view.stack = stack;
		views.push(view);
	};
	
	stack.getView = function (name) {
	
		var i;
		
		for (i = 0; i < views.length; i += 1) {
			if (views[i].name === name) {
				return views[i];
			}
		}
	};
	
	stack.removeView = function (view) {
	
		var i;
		
		for (i = 0; i < views.length; i += 1) {
			if (views[i] === view) {
				views[i].splice(i, 1);
				break;
			}
		}
	};
	
	stack.show = function () {
	
		var i;
	
		if (!stack.visible) {
			stack.visible = true;

			for (i = 0; i < views.length; i += 1) {
				views[i].show();
			}
		}
	};
	
	stack.hide = function () {
	
		var i;
		
		if (stack.visible) {
			stack.visible = false;
			stack.dirty = true;
			
			views[i].hide();
		}
	};
	
	stack.isPointInside = function (pos) {
	
		var i;
		
		for (i = 0; i < views.length; i += 1) {
			if (views[i].visible && views[i].isPointInside(pos)) {
				return true;
			}
		}
		
		return false;
	};
	
	stack.motorize = function (motor) {
	
		motor.addEventListener("destroyed", motorDestroyed);
		motors.push(motor);
	};
	
	stack.removeMotors = function (type) {
		
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
	
	stack.destroy = function () {
	
		var i;
		
		for (i = 0; i < views.length; i += 1) {
			if (views[i].layer && views[i].layer.container) {
				views[i].layer.container.removeView(views[i]);
			}
			views[i].destroy();
		}
		views = [];
		stack = null;
	};
	
	Object.defineProperty(stack, "dirty", {
		get: function () {
			return dirty;
		},
		set: function (value) {
			var i;
				
			for (i = 0; i < views.length; i += 1) {
				views[i].dirty = value;
			}
		}
	});
	
	Object.defineProperty(stack, "alpha", {
		get: function () {
			return alpha !== undefined ? alpha : 1;
		},
		set: function (value) {
			var i;
			
			alpha = value;
				
			for (i = 0; i < views.length; i += 1) {
				views[i].alpha = value;
			}
		}
	});
	
	Object.defineProperty(stack, "width", {
		get: function () {
		
			var i, 
				largestWidth = 0;
				
			for (i = 0; i < views.length; i += 1) {
				if (views[i].visible && views[i].width > largestWidth) {
					largestWidth = views[i].width;
				}
			}
		
			return largestWidth;
		}
	});
	
	Object.defineProperty(stack, "height", {
		get: function () {
		
			var i, 
				largestHeight = 0;
				
			for (i = 0; i < views.length; i += 1) {
				if (views[i].visible && views[i].height > largestHeight) {
					largestHeight = views[i].height;
				}
			}
		
			return largestHeight;
		}
	});
	
	return stack;
};