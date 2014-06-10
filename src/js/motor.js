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

BLOCKS.motorTween = function (property, spec) {
	
	"use strict";
	
	// Private Properties
	var motor = BLOCKS.motor(),
		destroyed = false,
		clock = spec.clock,
		object = spec.object,
		callback = spec.callback,
		total = spec.amount,
		current = 0,
		lastDirtyValue = current,
		duration = spec.duration / 1000 * 60, // Convert milliseconds to number of frames
		dirtyTolerance = spec.dirtyTolerance || 0,
		speed;
	
	// Public Properties
	motor.destroy = function () {
	
		if (!destroyed) {
			destroyed = true;
			if (clock) {
				clock.removeEventListener("tick", motor.tick);
			}
			motor.dispatchEvent("destroyed", motor);
			motor = null;
		}
	};
	
	// Public Methods
	motor.tick = function () {
	
		if (!destroyed) {

			if (Math.abs(total - current) < Math.abs(speed)) {
			
				if (speed > 0) {
					object[property] -= Math.abs(total - current);
				} else {
					object[property] += Math.abs(total - current);
				}
				object.dirty = true;
				
				motor.dispatchEvent("complete", motor);
				
				if (callback) {
					callback();
				}
				if (motor) {
					motor.destroy();
				}
			} else {
				object[property] += speed;
				current += speed;
				if (Math.abs(lastDirtyValue - current) > dirtyTolerance) {
					lastDirtyValue = current;
					object.dirty = true;
				}
			}
		}
	};
	
	(function () {
	
		if (!property) {
			BLOCKS.error("Motor property parameter required");
			return null;
		}
	
		if (!object) {
			BLOCKS.error("Object is required for motor property: " + property);
			return null;
		}
		
		if (!duration) {
			BLOCKS.error("Duration is required for motor property: " + property);
			return null;
		} 
		
		if (!total) {
			BLOCKS.error("Amount is required for motor property: " + property);
			return null;
		} 
		
		if (object[property] === undefined) {
			BLOCKS.error("Motor property does not exist on object: " + property);
			return null;
		}

		if (clock) {
			clock.addEventListener("tick", motor.tick);
		}
		
		speed = total / duration;
	}());
	
	return motor;
};

BLOCKS.motor = function () {
	
	"use strict";
	
	// Private Properties
	var motor = BLOCKS.eventDispatcher(),
		destroyed = false;
	
	// Public Properties
	motor.destroy = function () {
		destroyed = true;	
	};
	
	// Public Methods
	motor.tick = function () {
	
		if (!destroyed) {
			
		}
	};
	
	return motor;
};

BLOCKS.motors = {};

// Moves an object to a point
//   -clock
//   -object
//   -x
//   -y
//   -speed (optional)
BLOCKS.motors.moveTo = function (spec) {
	
	"use strict";
	
	// Private Properties
	var motor = BLOCKS.motor(),
		destroyed = false,
		clock = spec.clock,
		object = spec.object,
		destination = {
			x: spec.x || 0,
			y: spec.y || 0
		},
		callback = spec.callback,
		speed = spec.speed || 1;
	
	// Public Properties
	motor.destroy = function () {
		if (!destroyed) {
			destroyed = true;
			if (clock) {
				clock.removeEventListener("tick", motor.tick);
			}
			motor.dispatchEvent("destroyed", motor);
			motor = null;
		}
	};
	
	// Public Methods
	motor.tick = function () {
	
		var distLeft, angle;
	
		if (!destroyed) {
			distLeft = BLOCKS.toolbox.dist(object, destination);
			
			if (distLeft < speed) {
				object.x = destination.x;
				object.y = destination.y;
				
				motor.dispatchEvent("complete", motor);
				
				if (callback) {
					callback();
				}
				if (motor) {
					motor.destroy();
				}
			} else {
				angle = BLOCKS.toolbox.angle(object, destination);
				object.x += speed * Math.cos(angle);
				object.y += speed * Math.sin(angle);
				object.dirty = true;
				object.layer.dirty = true;
			}
		}
	};
	
	(function () {
		if (clock) {
			clock.addEventListener("tick", motor.tick);
		}
	}());
	
	return motor;
};

// Moves an object to a point
//   -clock
//   -object
//   -x
//   -y
//   -speed (optional)
BLOCKS.motors.move = function (spec) {
	
	"use strict";
	
	// Private Properties
	var motor = BLOCKS.motor(),
		destroyed = false,
		clock = spec.clock,
		object = spec.object,
		offset = {
			x: spec.x || 0,
			y: spec.y || 0
		},
		callback = spec.callback,
		curOffset = {
			x: 0,
			y: 0
		},
		totalDist = BLOCKS.toolbox.dist(curOffset, offset),
		angle = BLOCKS.toolbox.angle(curOffset, offset),
		curTick,
		totalTicks,
		speed = spec.speed,
		duration,
		easing = spec.easing,
		deltaX,
		deltaY;
	
	// Public Properties
	motor.destroy = function () {
	
		if (!destroyed) {
			destroyed = true;
			if (clock) {
				clock.removeEventListener("tick", motor.tick);
			}
			motor.dispatchEvent("destroyed", motor);
			motor = null;
		}
	};
	
	// Public Methods
	motor.tick = function () {
	
		var distLeft, curTime, easeAmt,
			moveAmt = {};
	
		if (!destroyed) {
		
			distLeft = BLOCKS.toolbox.dist(curOffset, offset);
			
			curTick += 1;
			
			object.dirty = true;
			object.layer.dirty = true;
			
			if (distLeft <= speed) {
			
				object.x += distLeft * Math.cos(angle);
				object.y += distLeft * Math.sin(angle);
				
				motor.dispatchEvent("complete", motor);
				
				if (callback) {
					callback();
				}
				if (motor) {
					motor.destroy();
				}
			} else {
				
				if (easing === "easeIn") {
					easeAmt =  Math.pow(curTick / totalTicks, 4) * totalDist;
					deltaX = easeAmt * Math.cos(angle) - curOffset.x;
					deltaY = easeAmt * Math.sin(angle) - curOffset.y;
				} else if (easing === "easeOut") {
					easeAmt = -(Math.pow(curTick / totalTicks - 1, 4) - 1) * totalDist;
					deltaX = easeAmt * Math.cos(angle) - curOffset.x;
					deltaY = easeAmt * Math.sin(angle) - curOffset.y;
				}
				curOffset.x += deltaX;
				curOffset.y += deltaY;
				object.x += deltaX;
				object.y += deltaY;
			}
		}
	};
	
	(function () {
		if (!totalDist) {
			motor.destroy();
			return null;
		}
		
		if (clock) {
			clock.addEventListener("tick", motor.tick);
		}

		if (spec.duration) {
			duration = spec.duration;
			speed = totalDist / (spec.duration / 1000 * 60);
		} else {
			duration = (totalDist / speed) * (1000 / 60);
		}

		deltaX = speed * Math.cos(angle);
		deltaY = speed * Math.sin(angle);
		
		curTick = 0;
		totalTicks = totalDist / speed;
	}());
	
	return motor;
};

// Animations the rotate an object
//   -clock
//   -object
//   -amount
//   -speed (optional)
BLOCKS.motors.rotate = function (spec) {
	
	"use strict";
	
	if (spec.angle) {
		spec.amount = spec.angle;
	}
	
	return BLOCKS.motorTween("angle", spec);
};

// Animations the scale an object
//   -clock
//   -object
//   -amount
//   -speed (optional)
BLOCKS.motors.scale = function (spec) {
	
	"use strict";
	
	return BLOCKS.motorTween("scale", spec);
};

// Animations the transparency an object
//   -clock
//   -object
//   -amount
//   -speed (optional)
BLOCKS.motors.alpha = function (spec) {
	
	"use strict";
	
	return BLOCKS.motorTween("alpha", spec);
};

// Moves an object to follow the drag
//   -clock
//   -controller
//   -object
BLOCKS.motors.drag = function (spec) {
	
	"use strict";
	
	// Private Properties
	var motor = BLOCKS.motor(),
		destroyed = false,
		controller = spec.controller,
		object = spec.object,
		bounds = spec.bounds,
		horizontalOnly = spec.horizontalOnly,
		verticalOnly = spec.verticalOnly,
		draggingObject,
		
		convertToBoundedPos = function (point) {
			
			if (spec.bounds) {
				
				if (point.x < bounds.x) {
					point.x = bounds.x;
				}
				if (point.x > bounds.x + bounds.width) {
					point.x = bounds.x + bounds.width;
				}
				if (point.y < bounds.y) {
					point.y = bounds.y;
				}
				if (point.y > bounds.y + bounds.height) {
					point.y = bounds.y + bounds.height;
				}
			}
			
			return point;
		},
		
		updatePos = function (point) {
		
			point = convertToBoundedPos(point);
			
			if (!verticalOnly) {
				object.x = Math.round(point.x);
			}
			if (!horizontalOnly) {
				object.y = Math.round(point.y);
			}
			object.dirty = true;
		},
		
		onTap = function (point) {
		
			if (object.isPointInside(point)) {

				object.justTapped = true;
				object.dirty = true;
			
				draggingObject = true;
				updatePos(point);
			} else {

				object.justNotTapped = true;
				object.dirty = true;
			}
		},
		
		onDrag = function (point) {
		
			object.tapPos = point;
			
			if (controller.drag && draggingObject) {
				updatePos(point);
				if (!object.dragging) {
					object.dispatchEvent("onDragStart", object);
				}
				object.dragging = true;
			}
		},
		
		onRelease = function (point) {	
		
			if (object.justTapped) {
				object.justTapped = false;
				object.dirty = true;
			}
			if (object.justNotTapped) {
				object.justNotTapped = false;
				object.dirty = true;
			}
			
			if (draggingObject) {	
				object.justReleased = true;
				object.dispatchEvent("onDragEnd", object);
			}
			
			object.dragging = false;
			draggingObject = false;
		};
	
	// Public Properties
	motor.destroy = function () {
		if (!destroyed) {
			destroyed = true;
			controller.removeEventListener("tap", onTap);
			controller.removeEventListener("drag", onDrag);
			controller.removeEventListener("release", onRelease);
			controller.removeEventListener("cancel", onRelease);
			motor.dispatchEvent("destroyed", motor);
			motor = null;
		}
	};
	
	(function () {
	
		if (controller) {
			controller.addEventListener("tap", onTap);
			controller.addEventListener("drag", onDrag);
			controller.addEventListener("release", onRelease);
			controller.addEventListener("cancel", onRelease);
		} else {
			BLOCKS.error("A drag motor will not work without a controller");
			motor.destroy();
			return false;
		}
	}());
	
	return motor;
};

(function () {
	var key;
	
	for (key in BLOCKS.motors) {
		if (BLOCKS.motors.hasOwnProperty()) {
			BLOCKS.motors[key].type = key;
		}
	}
}());