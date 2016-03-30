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

BLOCKS.tween = function (spec) {
	
	"use strict";
	
	// Private Properties
	var tween = BLOCKS.eventDispatcher(),
		property = spec.property,
		clock = spec.clock,
		object = spec.object,
		total = spec.amount,
		duration = spec.duration / 1000 * 60, // Convert milliseconds to number of frames
		callback = spec.callback,
		easing = spec.easing,
		dirtyTolerance = spec.dirtyTolerance || 0,
		current = 0,
		lastDirtyValue = current,
		speed,
		easeAmt,
		curTick,
		destroyed;
	
	// Public Methods
	tween.tick = function () {
	
		if (!destroyed) {
		
			curTick += 1;
		
			tween.dispatchEvent("tick");
			
			if (easing === "easeIn") {
				easeAmt = Math.pow(curTick / duration, 4) * total;
			} else if (easing === "easeOut") {
				easeAmt = -(Math.pow(curTick / duration - 1, 4) - 1) * total;
			} else if (easing === "easeInOut") {
				if (curTick / (duration / 2) < 1) {
					easeAmt = Math.pow(curTick / (duration / 2), 4) * total / 2;
				} else {
					easeAmt = -(Math.pow(curTick / (duration / 2) - 2, 4) - 2) * total / 2;
				}
			} else if (easing === "easeOutElastic") {
				easeAmt = (Math.pow(2, -10 * curTick / duration) * Math.sin((curTick / duration - 0.075) * (2 * Math.PI) / 0.3) + 1) * total;
			} else {
				easeAmt = current + speed;
			}
			object[property] += easeAmt - current;

			if (curTick === duration) {

				object.dirty = true;
				
				tween.dispatchEvent("complete", tween);
				
				if (callback) {
					callback();
				}
				if (tween) {
					tween.destroy();
				}
			} else {
	
				current = easeAmt;
				if (Math.abs(lastDirtyValue - current) > dirtyTolerance) {
					lastDirtyValue = current;
					object.dirty = true;
				}
			}
		}
	};
	
	tween.destroy = function () {
	
		if (!destroyed) {
			destroyed = true;
			if (clock) {
				clock.removeEventListener("tick", tween.tick);
			}
			tween.dispatchEvent("destroyed", tween);
			tween = null;
		}
	};
	
	(function () {
	
		if (!property) {
			BLOCKS.error("Tween property parameter required");
			return null;
		}
	
		if (!object) {
			BLOCKS.error("Object is required for tween property: " + property);
			return null;
		}
		
		if (!duration) {
			BLOCKS.error("Duration is required for tween property: " + property);
			return null;
		} 
		
		if (!total) {
			if (total !== 0) {
				BLOCKS.error("Amount is required for tween property: " + property);
			}
			return null;
		} 
		
		if (object[property] === undefined) {
			BLOCKS.error("Tween property does not exist on object: " + property);
			return null;
		}

		if (clock) {
			clock.addEventListener("tick", tween.tick);
		}
		
		speed = total / duration;
		
		curTick = 0;
	}());
	
	return tween;
};

BLOCKS.motor = function (spec) {
	
	"use strict";
	
	// Private Properties
	var motor,
	
		moveMotor = function (spec) {

			// Private Properties
			var motor = BLOCKS.eventDispatcher(),
				destroyed = false,
				clock = spec.clock,
				object = spec.object,
				callback = spec.callback,
				speed = spec.speed,
				easing = spec.easing,
				offset = {
					x: spec.x || 0,
					y: spec.y || 0
				},
				curOffset = {
					x: 0,
					y: 0
				},
				totalDist = BLOCKS.toolbox.dist(curOffset, offset),
				angle = BLOCKS.toolbox.angle(curOffset, offset),
				curTick,
				totalTicks,
				duration,
				deltaX,
				deltaY;
			
			// Public Methods
			motor.tick = function () {
			
				var distLeft, curTime, easeAmt,
					moveAmt = {};
			
				if (!destroyed) {
				
					motor.dispatchEvent("tick");
				
					distLeft = BLOCKS.toolbox.dist(curOffset, offset);
					
					curTick += 1;
					
					object.dirty = true;
					
					if (curTick >= totalTicks) {
					
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
						} else if (easing === "easeInOut") {
							if (curTick / (totalTicks / 2) < 1) {
								easeAmt = Math.pow(curTick / (totalTicks / 2), 4) * totalDist / 2;
							} else {
								easeAmt = -(Math.pow(curTick / (totalTicks / 2) - 2, 4) - 2) * totalDist / 2;
							}
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
			
			(function () {
				if (!totalDist) {
					motor.destroy();
					motor = null;
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
				
				Object.defineProperty(motor, "curOffset", {
					get: function () {
						return curOffset;
					}
				});
			}());
			
			return motor;
		},
		
		vibrateMotor = function (spec) {

			// Private Properties
			var motor = BLOCKS.eventDispatcher(),
				destroyed = false,
				clock = spec.clock,
				object = spec.object,
				callback = spec.callback,
				amplitude = spec.amplitude || 10,
				angle = spec.angle * Math.PI / 180 || 0,
				decay = spec.decay || 1,
				duration = spec.duration,
				timesToVibrate = spec.amount * 4,
				timesVibrated = 0,
				direction = 1,
				timesTillReverseDirection,
				curMoveMotor,
				curOffset = {
					x: 0,
					y: 0
				},
				vibrationComplete,
				
				createMoveMotor = function () {
					
					var dx, dy;
					
					dx = amplitude * direction * Math.cos(angle);
					dy = amplitude * direction * Math.sin(angle);
					
					curMoveMotor = moveMotor({
						object: object,
						x: dx,
						y: dy,
						duration: duration / (timesToVibrate * 2),
						clock: clock,
						easing: timesTillReverseDirection % 2 ? "easeOut" : "easeIn",
						callback: function () {
							
							curOffset.x += dx;
							curOffset.y += dy;
							moveMotorComplete();
						}
					});
					
					curMoveMotor.addEventListener("tick", motor.tick);
				},
				
				moveMotorComplete = function () {
					
					timesVibrated += 1;
					timesTillReverseDirection += 1;
					
					if (timesVibrated % 4 === 0) {
						amplitude *= decay;
					}
					
					if (timesTillReverseDirection >= 2) {
						timesTillReverseDirection = 0;
						direction *= -1;
					}
					
					if (curMoveMotor) {
						curMoveMotor.removeEventListener("tick", motor.tick);
						curMoveMotor = null;
					}
				
					if (timesVibrated >= timesToVibrate) {
						
						vibrationComplete = true;
						
						motor.dispatchEvent("complete", motor);
						
						if (callback) {
							callback();
						}
						if (motor) {
							motor.destroy();
						}
					} else {
						createMoveMotor();
					}
				};
			
			// Public Methods
			motor.tick = function () {
			
				if (!destroyed) {	
					motor.dispatchEvent("tick");
				}
			};
			
			motor.reset = function () {
			
				if (!destroyed) {	
					
					if (timesTillReverseDirection === 1) {
						timesVibrated = -2;
					} else if (timesTillReverseDirection === 0) {
						timesVibrated = -1;
					}
				}
			};
			
			motor.destroy = function () {
	
				if (!destroyed) {
					destroyed = true;

					if (curMoveMotor) {
						curOffset.x += curMoveMotor.curOffset.x;
						curOffset.y += curMoveMotor.curOffset.y;
						curMoveMotor.destroy();
					}
					
					if (!vibrationComplete) {
						object.x -= curOffset.x;
						object.y -= curOffset.y;
					}
					
					motor.dispatchEvent("destroyed", motor);
					motor = null;
				}
			};
			
			(function () {
				if (!object) {
					BLOCKS.error("A vibrate motor will not work without an object");
					return null;
				}
				
				if (!duration) {
					BLOCKS.error("A vibrate motor will not work without a duration");
					return null;
				}
				
				if (!spec.amount) {
					BLOCKS.error("A vibrate motor will not work without an amount");
					return null;
				}

				timesTillReverseDirection = 1;
				createMoveMotor();
			}());
			
			return motor;
		};
		
	if (spec.type === "move") {
	
		motor = moveMotor(spec);
		
	} else if (spec.type === "vibrate") {
	
		motor = vibrateMotor(spec);
		
	} else if (spec.type === "drag") {
	
		motor = (function (spec) {

			// Private Properties
			var motor = BLOCKS.eventDispatcher(),
				object = spec.object,
				controller = spec.controller,
				bounds = spec.bounds,
				horizontalOnly = spec.horizontalOnly,
				verticalOnly = spec.verticalOnly,
				draggingObject,
				destroyed = false,
				snapToRegistrationPoint = spec.snapToRegistrationPoint,
				offsetX,
				offsetY,
				
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
						object.x = Math.round(point.x - offsetX);
					}
					if (!horizontalOnly) {
						object.y = Math.round(point.y - offsetY);
					}
					object.dirty = true;
				},
				
				onTap = function (point) {
				
					if (object.isPointInside(point)) {
		
						object.justTapped = true;
						object.dirty = true;
						
						if (snapToRegistrationPoint === false) {
							offsetX = point.x - object.x;
							offsetY = point.y - object.y;	
						} else {
							offsetX = 0;
							offsetY = 0;
						}
					
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
		}(spec));
			
	} else {
	
		if (spec.type === "rotate") {
	
			if (spec.angle) {
				spec.amount = spec.angle;
			}
			spec.property = "angle";
		} else {
			spec.property = spec.type;
		}
		
		motor = BLOCKS.tween(spec);
	}

	return motor;
};