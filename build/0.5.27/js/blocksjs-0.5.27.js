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
		properties = ["stack", "worldX", "worldY", "x", "y", "scale", "width", "height", "centerRegistrationPoint", "mirrorX", "mirrorY", "angle", "alpha", "layer", "visible", "dirty", "justTapped", "justNotTapped", "dragging", "justReleased", "tapPos", "cropWidth", "cropHeight", "frameOffsetX", "frameOffsetY", "offsetX", "offsetY", "minHotspot", "hotspots", "currentFrameIndex"],	
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

BLOCKS.camera = function (options) {
	
	"use strict";
	
	var camera = BLOCKS.gear();
	
	// Public Properties
	camera.x = (options && options.x) || 0;
	camera.y = (options && options.y) || 0;
	camera.width = (options && options.width) || 1024;
	camera.height = (options && options.height) || 768;
	
	return camera;
};
/*
Copyright (c) 2013 William Malone (www.williammalone.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*global window, document */

var BLOCKS;

if (BLOCKS === undefined) {
	BLOCKS = {};
}

BLOCKS.clock = function () {
	
	"use strict";
	
	var clock = BLOCKS.eventDispatcher(),
		paused = true,
		id,
	
		// Private Methods
		loop = function () {
		
			if (!paused) {
				
				// Loop again on next animation frame
				id = window.requestAnimationFrame(loop);
				
				clock.dispatchEvent("tick");
			}
		};

	clock.stop = function () {
	
		window.cancelAnimationFrame(id);
		paused = true;
	};
	
	clock.start = function () {
	
		if (paused) {
			paused = false;
			id = window.requestAnimationFrame(loop);
		}
	};
	
	clock.destroy = function () {
	
		clock.stop();
		clock = null;
	};
	
    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/	
	(function() {
		var lastTime = 0;
		var vendors = ['webkit', 'moz'];
		for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
			window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
			window.cancelAnimationFrame =
				window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
		}
	
		if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	
		if (!window.cancelAnimationFrame)
			window.cancelAnimationFrame = function(id) {
				window.clearTimeout(id);
		};
	}());
	
	return clock;
};
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

BLOCKS.container = function (game) {
	
	"use strict";
	
	var container = BLOCKS.eventDispatcher(),
	
		// Private Properties
		motors = [],
		layers = [],
		views = [],
		layerLabels = {},
		
		// Private Methods
		motorDestroyed = function (motor) {
			
			var i;
			
			motor.removeEventListener("destroyed", motorDestroyed);
			
			for (i = 0 ; i < motors.length; i += 1)  {
				motors.splice(i, 1);
				break;
			}
		};
	
	// Public Properties
	container.visible = true;
	container.dirty = true;
	
	container.assignLayers = function () {
		
		var i, args;
		
		args = Array.prototype.slice.call(arguments);
		
		layerLabels = {};
		
		for (i = 0; i < args.length; i += 1) {	
			layerLabels[args[i]] = game.getLayer(i);
		}
	};
	
	container.getLayer = function (label) {	
		if (layerLabels[label]) {
			return layerLabels[label];
		} else {
			BLOCKS.error("Cannot find container layer: " + label);
		}
	};

	container.addView = function (view) {
	
		var i, layerInArray;

		view.addEventListener("destroyed", container.removeView);
		views.push(view);

		for (i = 0; i < layers.length; i += 1) {
			if (view.layer === layers[i]) {
				layerInArray = true;
				break;
			}
		}
		if (!layerInArray && view.layer) {
			layers.push(view.layer);
		}
	};
	
	container.removeView = function (view) {
	
		var i, layer, keepLayer;
		
		view.removeEventListener("destroyed", container.removeView);
		
		for (i = 0; i < views.length; i += 1) {
			
			if (view === views[i]) {
				layer = views.layer;
				views.splice(i, 1);
				break;
			}
		}
		
		for (i = 0; i < views.length; i += 1) {
			if (view.layer === layer) {
				keepLayer = true;
				break;
			}
		}
		if (!keepLayer) {
			for (i = 0; i < layers.length; i += 1) {
				if (layer === layers[i]) {
					layers.splice(i, 1);
					break;
				}
			}
		}
	};
	
	container.setViewLayerIndex = function (view, newIndex) {
	
		var i, oldIndex;
		
		for (i = 0; i < views.length; i += 1) {
			if (views[i] === view) {
				oldIndex = i;
				break;
			}
		}
		
		if (i === undefined) {
			BLOCKS.warn("Cannot find view to set view's layer index.");
		} else {
			views.splice(oldIndex, 1);
			views.splice(newIndex, 0, view);
			// Redraw this view next time
			view.dirty = true;
		}
	};
	
	container.getViewLayerIndex = function (view) {
	
		var i, index;
		
		for (i = 0; i < views.length; i += 1) {
			if (views[i] === view) {
				index = i;
				break;
			}
		}
		
		return index;
	},
	
	container.clear = function () {
	
		var i;
			
		for (i = 0; i < layers.length; i += 1) {
			container.layers[i].clear();
		}
	};
	
	container.motorize = function (motor) {
	
		motor.addEventListener("destroyed", motorDestroyed);
		motors.push(motor);
	};
	
	container.removeMotors = function (type) {
		
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
	
	container.update = function () {
	
		var i;
	
		for (i = 0; i < views.length; i += 1) {
			views[i].update();
		}
	};
	
	container.render = function (e) {
	
		var i, key,
			dirtyLayers = {};
			
		for (key in layerLabels) {
			if (layerLabels.hasOwnProperty(key)) {
				if (layerLabels[key].dirty || container.dirty) {
					dirtyLayers[layerLabels[key].name] = layerLabels[key];
				}
			}
		}

		// Check if any layers were set to dirty (or the container is dirty)
		for (i = 0; i < layers.length; i += 1) {
			if (layers[i].dirty || container.dirty) {
				dirtyLayers[layers[i].name] = layers[i];
			}
		}
		
		// If any view is dirty then mark its layer dirty
		for (i = 0; i < views.length; i += 1) {
			if (views[i].dirty) {
				dirtyLayers[views[i].layer.name] = views[i].layer;
			}
		}
		
		// Clear all dirty layers
		for (key in dirtyLayers) {
			if (dirtyLayers.hasOwnProperty(key)) {
				dirtyLayers[key].clear();
			}
		}
	
		// Mark all container views dirty
		for (i = 0; i < views.length; i += 1) {
			if (dirtyLayers[views[i].layer.name]) {
				views[i].dirty = true;
			}
			if (container.visible) {
				views[i].render(e);
			}
		}
		
		container.dirty = false;
	};
		
	container.destroy = function () {
	
		var i;
		
		for (i = 0; i < views.length; i += 1) {
			container.removeView(views[i]);
			views[i].destroy();
			views[i] = null;
		}
		views = null;
		layers = null;
		motors = null;
	};
	
	return container;
};
/*
Copyright (c) 2013 William Malone (www.williammalone.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*global window, document */

var BLOCKS;

if (BLOCKS === undefined) {
	BLOCKS = {};
}

BLOCKS.controller = function (element) {
	
	"use strict";
	
	var controller = BLOCKS.eventDispatcher(),
		elementPos,
		
		getElementPos = function (element) {

			var parentOffset, pos;
				
			if (!element) {
				pos = {
					x: 0,
					y: 0
				};
			} else {
			
				pos = {
					x: element.offsetLeft,
					y: element.offsetTop 
				};

				if (element.offsetParent) {
					parentOffset = getElementPos(element.offsetParent);
					pos.x += parentOffset.x;
					pos.y += parentOffset.y;
				}
			}

			return pos;
        },
	
		init = function () {
		
			var target;

			document.addEventListener("keydown", onKeyDownEvent, true);
			document.addEventListener("keyup", onKeyUpEvent, true);
			
			// Listen to the element if it exitst otherwise fall back to the document element
			target = element || document;
			
			target.addEventListener("orientationchange", onOrientationEvent, true);
			
			target.addEventListener("touchstart", onTouchEvent, true);
			target.addEventListener("touchmove", onTouchEvent, true);
			target.addEventListener("touchend", onTouchEvent, true);
			target.addEventListener("touchcancel", onTouchEvent, true);

			target.addEventListener("mousedown", onMouseEvent, true);
			target.addEventListener("mousemove", onMouseEvent, true);
			target.addEventListener("mouseup", onMouseEvent, true);
			target.addEventListener("mousecancel", onMouseEvent, true);	
			
			target.addEventListener("mouseout", onMouseEvent, true);
			
			// Fire a mouseUpOutside event when mouse up detected outside the game
			document.addEventListener("mouseup", function (event) {
				onMouseEvent(event, true);
			}, false);
			
		},
        
        onOrientationEvent = function () {
        
			if (controller.listening) {

				switch (window.orientation) {
				
				case -90:
					controller.orientation = "landscape";
					break;
	
				case 0:
					controller.orientation = "portrait";
					break;
			
				case 90:
					controller.orientation = "landscape";
					break;
			
				case 180:
					controller.orientation = "portrait";
					break;
				}
				
				controller.dispatchEvent("orientationChange", {
					orientation: controller.orientation
				});
			}
		},
		
		onKeyDownEvent = function (e) {
	
			if (controller.listening) {
				controller.dispatchEvent("keyDown", e);
			}
		},
	
		onKeyUpEvent = function (e) {
		
			if (controller.listening) {
				controller.dispatchEvent("keyUp", e);
			}
		},
        
        dispatchTapEvent = function (e, eventType) {
			
			switch (eventType) {
			
			case "tap":

				controller.drag = true;
				controller.dispatchEvent("tap", e);

				break;
				
			case "drag": 
				controller.dispatchEvent("drag", e);
				
				break;    

			case "release": 
				controller.drag = false;
				controller.dispatchEvent("release", e);
				break;
				
			case "cancel":
				controller.drag = false;
				controller.dispatchEvent("cancel", e);
				break;
				
			default: 
				break;
			}
		},
		
		onTouchEvent = function (e) {
		
			var i, key, event, touch, eventType, firstFinger;
			
			if (controller.listening) {
			
				// Disable scrolling on mobile and prevent mouse event on touch
				if (e.preventDefault) {
					e.preventDefault();
				}
				
				// TODO: ElementPos does not have to be calculated every time?
				elementPos = getElementPos(element);
				
				// Select the first changed touch and assign it as the default touch
				firstFinger = e.changedTouches[0];
				
				// Make a copy of the touch event
				event = {};
				for (key in firstFinger) {
					//if (firstFinger.hasOwnProperty(key)) { // Don't use due to Firefox and IE9
						event[key] = firstFinger[key];
					//}
				}
			
				event.x = (firstFinger.pageX - elementPos.x - controller.offsetX) * controller.scaleX;
				event.y = (firstFinger.pageY - elementPos.y - controller.offsetY) * controller.scaleY;
				event.type = e.type;

				event.touches = [];
				// For each touch currently on the screen
				for (i = 0; i < e.touches.length; i += 1) {
					
					event.touches[i] = {};
					for (key in e.touches[i]) {
						if (e.touches[i].hasOwnProperty(key)) {
							event.touches[i][key] = e.touches[i][key];
						}
					}
				
					event.touches[i].x = (event.touches[i].clientX - elementPos.x - controller.offsetX) * controller.scaleX;
					event.touches[i].y = (event.touches[i].clientY - elementPos.y - controller.offsetY) * controller.scaleY;
					
				}
				
				event.changedTouches = [];
				// For each touch invloved in this event on the screen
				for (i = 0; i < e.changedTouches.length; i += 1) {
					
					event.changedTouches[i] = {};
					for (key in e.changedTouches[i]) {
						if (e.changedTouches[i].hasOwnProperty(key)) {
							event.changedTouches[i][key] = e.changedTouches[i][key];
						}
					}
				
					event.changedTouches[i].x = (event.changedTouches[i].pageX - elementPos.x - controller.offsetX) * controller.scaleX;
					event.changedTouches[i].y = (event.changedTouches[i].pageY - elementPos.y - controller.offsetY) * controller.scaleY;
				}
			
				switch (event.type) {
				
				case "touchstart":
	
					eventType = "tap";
					controller.dispatchEvent("touchStart", event);
					break;
					
				case "touchmove": 
					eventType = "drag";
					controller.dispatchEvent("touchMove", event);
					break;    
	
				case "touchend": 
					eventType = "release";
					controller.dispatchEvent("touchEnd", event);
					break;
					
				case "touchcancel":
					eventType = "cancel";
					controller.dispatchEvent("touchCancel", event);
					break;
					
				default: 
					break;
				}

				dispatchTapEvent(event, eventType);
			}
		},
		
		onMouseEvent = function (e, outsideGameBounds) {
		
			var i, key, eventType, event;
			
			if (controller.listening) {
			
				// Stop the mouse event from going to the any elements behind the game
				e.stopPropagation();

				// Disable right click
				//if (e.button === 2) {
				//	return;
				//}
				
				event = {};
				for (key in e) {
					//if (e.hasOwnProperty(key)) { Don't use due to Firefox and IE9
						event[key] = e[key];
					//}
				}
				
				// TODO: ElementPos does not have to be calculated every time?
				elementPos = getElementPos(element);
				
				event.x = (event.pageX - elementPos.x - controller.offsetX) * controller.scaleX;
				event.y = (event.pageY - elementPos.y - controller.offsetY) * controller.scaleY;
				event.identifier = "mouse";
				event.touches = [event];
				event.changedTouches = [event];
				
				if (outsideGameBounds) {
					event.type += "outside";
				}

				switch (event.type) {
				
				case "mousedown":
					eventType = "tap";
					controller.dispatchEvent("mouseDown", event);
				
					break;
					
				case "mousemove":
					eventType = "drag";
					controller.dispatchEvent("mouseMove", event);
					break;
					
				case "mouseup":
					eventType = "release";
					controller.dispatchEvent("mouseUp", event);
					break;
					
				case "mousecancel":
					eventType = "cancel";
					controller.dispatchEvent("mouseCancel", event);
					break;
					
				case "mouseout":
					eventType = "mouseout";
					controller.dispatchEvent("mouseOut", event);
					return; // Don't dispatch tap event
					
				case "mouseupoutside":
					eventType = "mouseupoutside";
					controller.dispatchEvent("mouseUpOutside", event);
					return; // Don't dispatch tap event
					
				default: 
					break;
				}
	
				dispatchTapEvent(event, eventType);
			}
		};
		
	controller.scaleX = 1;
	controller.scaleY = 1;
	controller.offsetX = 0;
	controller.offsetY = 0;
	controller.listening = true;
		
	controller.simulateKeyDownEvent = function (keyCode) {
		onKeyDownEvent({
			keyCode: keyCode
		});
	};
	
	controller.simulateKeyUpEvent = function (keyCode) {
		onKeyUpEvent({
			keyCode: keyCode
		});
	};

	init();

	return controller;
};
/*
Copyright (c) 2013 William Malone (www.williammalone.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*global window, Image */

var BLOCKS;

if (BLOCKS === undefined) {
	BLOCKS = {};
}

BLOCKS.eventDispatcher = function () {
	
	"use strict";
	
	var that = {},
		eventListeners = {};
	
	// Public Methods
	that.dispatchEvent = function (eventName, parameters) {
	
		var i,
			callbacks = [],
			listenerArr = [];
		
		// If something is listening
		if (eventListeners[eventName]) {
			
			// For each item that is listening
			for (i = 0; i < eventListeners[eventName].length; i += 1) {
			
				// Invoke callback on the listener
				callbacks.push(eventListeners[eventName][i].callback);

				// If the event listener should persist
				if (!eventListeners[eventName][i].destroyOnDispatch) {
					listenerArr.push(eventListeners[eventName][i]);
				}
			}
			
			eventListeners[eventName] = listenerArr;
			
			for (i = 0; i < callbacks.length; i += 1) {
			
				// Invoke callback of dispatched event
				callbacks[i](parameters);
			}
		}
	};
	
	that.addEventListener = function (eventName, callback, onlyOnce) {
	
		if (!eventListeners[eventName]) {
			eventListeners[eventName] = [];
		}
		eventListeners[eventName].push({
			name: eventName,
			callback: callback,
			destroyOnDispatch: onlyOnce
		});
//BLOCKS.debug("Add event listener: " + eventName);
	};
	
	that.removeEventListener = function (eventName, callback) {
		
		var i;
			
		if (eventListeners[eventName]) {
			for (i = 0; i < eventListeners[eventName].length; i += 1) {
				if (callback) {
					if (eventListeners[eventName][i].callback === callback) {
//BLOCKS.debug("Remove event listener: " + eventName);
						eventListeners[eventName][i] = null;
						eventListeners[eventName].splice(i, 1);
					}
				} else {
					eventListeners[eventName][i] = null;
					eventListeners[eventName].splice(i, 1);
				}
			}
		}
	};
	
	that.clearEventListeners = function () {
		
		eventListeners = {};
	};
	
	return that;
};
/*
Copyright (c) 2013 William Malone (www.williammalone.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*global window, document, navigator */

var BLOCKS;

if (BLOCKS === undefined) {
	BLOCKS = {};
}

BLOCKS.game = function (spec, element) {
	
	"use strict";
	
	var game = BLOCKS.eventDispatcher(),
		clock = BLOCKS.clock(),
		gameContainer,
		gameCanvas,
		interactionContainer,
		paused = false,
		virtualKeyboard,
		motors = [],
		tickers = [],
		debugPressTimeout,
		lastUpdateTime,
		remainingUpdate,
		minWidth,
		minHeight,
		maxHeight,
		maxWidth,
		scaleLandscape,
		scalePortrait,
		debugLayer,
		gameTappedOnce,
		loaded,
		tickerIndex = 0,
		layerIndex = 0,
		maxLayers,
		prepared,
		wasMutedWhenPaused,
		loadStarted,
		
		handleTickers = function () {
			
			var i, 
				tickerArr = [], 
				callbacks = [];
			
			for (i = 0; i < tickers.length; i += 1) {
				tickers[i].curTick += 1;
				if (tickers[i].curTick >= tickers[i].totalTicks) {
					callbacks.push(tickers[i]);
				} else {
					tickerArr.push(tickers[i]);
				}
			}
			tickers = tickerArr;
			
			for (i = 0; i < callbacks.length; i += 1) {
				callbacks[i].callback(callbacks[i].parameters);
			}
		},

		onOrientationChange = function () {
		
			// Remove the space on iPhone / iPod when in landscape and using minimal ui meta tag
			if ((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i))) {
				if (window.orientation === 90 || window.orientation === -90) {
					window.scrollTo(0, 0);
					resizeGame();
				}
			}
		},
		
		onVisibilityChange = function () {
		
			if (document.hidden || document.webkitHidden || document.mozHidden || document.msHidden) {
				game.pause();
			} else {
				game.unpause();
			}
		},
		
		onFirstTap = function () {
		
			if (!gameTappedOnce) {
				game.controller.removeEventListener("tap", onFirstTap);
				
				game.dispatchEvent("firstTap");
				
				gameTappedOnce = true;
				
				if (game.introScreen) {
					game.state = "loading";
					game.introScreen.destroy();
					game.introScreen = null;
				}
				game.speaker.load();
				checkLoadProgress();
				
				checkInitialScreenProgress();
			}
		},
		
		init = function () {
		
			var i;
			
			if (spec && spec.scaleLandscape !== undefined) {
				scaleLandscape = spec.scaleLandscape;
			} else {
				scaleLandscape = true;
			}
			if (spec && spec.scalePortrait !== undefined) {
				scalePortrait = spec.scalePortrait;
			} else {
				scalePortrait = true;
			}
			
			if (game.element) {
		
				gameContainer = document.createElement("article");
				gameContainer.id = "BlocksGameContainer";
				
				if (spec && spec.minWidth) {
					minWidth = spec.minWidth;
					gameContainer.style.minWidth = minWidth + "px";
				}
				if (spec && spec.minHeight) {
					minHeight = spec.minHeight;
					gameContainer.style.minHeight = minHeight + "px";
				}
				
				if (spec && spec.maxWidth) {
					maxWidth = spec.maxWidth;
					gameContainer.style.maxWidth = maxWidth + "px";
				}
				if (spec && spec.maxHeight) {
					maxHeight = spec.maxHeight;
					gameContainer.style.maxHeight = maxHeight + "px";
				}
	
				game.element.appendChild(gameContainer);
				
				interactionContainer = document.createElement("article");
				interactionContainer.id = "BlocksInteractionContainer";
				gameContainer.appendChild(interactionContainer);

			}
			
			game.controller = BLOCKS.controller(interactionContainer);
			
			// Resize the game the first time to initialize the game scale propetries
			resizeGame();
			
			// Create virtual keyboard
			if (game.debug && game.virtualKeyboardEnabled) {
				virtualKeyboard = BLOCKS.virtualKeyboard(game.controller, {
					layer: game.getLayer(),
					customKeys: spec.customVirtualKeys
				});
			}

			window.addEventListener("orientationchange", onOrientationChange);
			window.addEventListener("resize", resizeGame);
			
			game.controller.addEventListener("keyUp", onKeyUp);
			game.controller.addEventListener("keyDown", onKeyDown);
			
			game.controller.addEventListener("tap", onTap);
			game.controller.addEventListener("drag", onDrag);
			game.controller.addEventListener("release", onRelease);
			game.controller.addEventListener("cancel", onRelease); // Note cancel is retreated as a release
			
			game.controller.addEventListener("touchStart", onTouchStart);
			game.controller.addEventListener("touchMove", onTouchMove);
			game.controller.addEventListener("touchEnd", onTouchEnd);
			game.controller.addEventListener("touchCancel", onTouchEnd); // Note cancel is retreated as a touch end
			
			game.controller.addEventListener("mouseDown", onMouseDown);
			game.controller.addEventListener("mouseMove", onMouseMove);
			game.controller.addEventListener("mouseUp", onMouseUp);
			game.controller.addEventListener("mouseCancel", onMouseUp); // Note cancel is retreated as a mouse up
			game.controller.addEventListener("mouseOut", onMouseOut);
			game.controller.addEventListener("mouseUpOutside", mouseUpOutside);
			
			// Listen to the first time the game is tapped
			game.controller.addEventListener("tap", onFirstTap);

			// Mute and pause the game when the browser is not visible
			if (typeof document.hidden !== "undefined") {	
				document.addEventListener("visibilitychange", onVisibilityChange);
			} else if (typeof document.mozHidden !== "undefined") {
				document.addEventListener("mozvisibilitychange", onVisibilityChange);
			} else if (typeof document.msHidden !== "undefined") {
				document.addEventListener("msvisibilitychange", onVisibilityChange);
			} else if (typeof document.webkitHidden !== "undefined") {
				document.addEventListener("webkitvisibilitychange", onVisibilityChange);
			}
			
			window.onunload = game.destroy;
		},
		
		gameUpdate = function () {
			
			var now;
			
			if (!paused) {

				now = + new Date();
				remainingUpdate += (now - lastUpdateTime);
				lastUpdateTime = now;	
				
				// If too much update then crop it
				if (remainingUpdate > game.maxLoopDuration) {
				
					BLOCKS.warn("Cannot keep up with game loop. Chopping " + Math.ceil((remainingUpdate - game.maxLoopDuration) / 60) + " frames.");
					remainingUpdate = game.maxLoopDuration;
				}
				
				//if (remainingUpdate < 16.666666666666) {
				//	BLOCKS.debug("No update this time: " + remainingUpdate);
				//}
	
				while (remainingUpdate >= 16.666666666666) {
				
					remainingUpdate -= 16.666666666666;
					
					game.dispatchEvent("tick"); // Simulate a clock
				
					game.dispatchEvent("preUpdate");
				
					if (game.debug && virtualKeyboard) {
						virtualKeyboard.update();
					}
					
					handleTickers();
	
					game.update();
					
					game.dispatchEvent("postUpdate");
				}
			}
			
		},
		
		gameRender = function () {
			
			var e = {
				camera: game.camera
			};
		
			if (!paused) {

				game.dispatchEvent("preRender", e);
			
				if (game.debug && virtualKeyboard) {
					virtualKeyboard.render(e);
				}
				
				game.render(e);
				
				game.dispatchEvent("postRender", e);
			}
		},
		
		onClockTick = function () {
			
			gameUpdate();
			gameRender();
		},
		
		onKeyDown = function (e) {
			
			if (game.keyDown) {
				game.keyDown(e);
			}
		},
		
		onKeyUp = function (e) {
			
			if (game.keyUp) {
				game.keyUp(e);
			}
		},
		
		onTap = function (pos) {

			if (game.debug && virtualKeyboard) {
				if (pos.x < 100 && pos.y < 100) {
					debugPressTimeout = window.setTimeout(function () {
						virtualKeyboard.visible = !virtualKeyboard.visible;
						virtualKeyboard.dirty = true;
					}, 1000);
				}
				virtualKeyboard.onTap(pos);
			}
		
			if (game.tap) {
				game.tap(pos);
			}
		},
		
		onDrag = function (pos) {
		
			if (game.debug) {
				window.clearTimeout(debugPressTimeout);
			}
			
			if (game.drag) {
				game.drag(pos);
			}
		},
		
		onRelease = function (pos) {
			
			if (game.debug) {
				window.clearTimeout(debugPressTimeout);
			}
			
			if (game.release) {
				game.release(pos);
			}
		},
		
		onTouchStart = function (pos) {
				
			if (game.touchStart) {
				game.touchStart(pos);
			}
		},
		
		onTouchMove = function (pos) {
		
			if (game.touchMove) {
				game.touchMove(pos);
			}
		},
		
		onTouchEnd = function (pos) {
		
			if (game.touchEnd) {
				game.touchEnd(pos);
			}
		},
		
		onMouseDown = function (pos) {
				
			if (game.mouseDown) {
				game.mouseDown(pos);
			}
		},
		
		onMouseMove = function (pos) {
		
			if (game.mouseMove) {
				game.mouseMove(pos);
			}
		},
		
		onMouseUp = function (pos) {
		
			if (game.mouseUp) {
				game.mouseUp(pos);
			}
		},
		
		onMouseOut = function (pos) {
		
			if (game.mouseOut) {
				game.mouseOut(pos);
			}
		},
		
		mouseUpOutside = function (pos) {
		
			if (game.mouseUpOutside) {
				game.mouseUpOutside(pos);
			}
		},
		
		checkLoadProgress = function () {
		
//BLOCKS.debug("checkLoadProgress: " + gameTappedOnce + " " + game.imageLoader.isLoaded() + " " + game.speaker.isReady());
			if (!loaded) {
				if ((game.introScreen && gameTappedOnce) || !game.introScreen) {
					// If all images are loaded and all sounds (or number of sounds is zero) are laoded
					if (game.imageLoader.isLoaded() && (game.speaker.isReady() || game.speaker.getNumFiles() === 0)) {
		
						loaded = true;
						
						if (game.loadingScreen) {
							game.loadingScreen.destroy();
							game.loadingScreen = null;
						}
						
						// If autoLoad is not turned off then load
						if (game.autoStart !== false) {
							game.start();
						}
						
						game.dispatchEvent("loaded");
					}
				}
			}
		},
		
		// See wmalone.com/scale for an article discussing this scaling approach
		resizeGame = function () {
		
			var i, viewport, newGameWidth, newGameHeight, newGameX, newGameY;
				
			// Get the dimensions of the viewport
			if (game.element) {
				viewport = {
					width: game.element.offsetWidth,
					height: game.element.offsetHeight
				};
			} else {
				viewport = {
					width: window.innerWidth * game.pixelMultiplier,
					height: window.innerHeight * game.pixelMultiplier
				};
			}	
			
			// If the viewport is greater than a minimum or maximum game dimension use that instead
			if (minWidth && viewport.width < minWidth) {
				viewport.width = minWidth;
			}
			if (minHeight && viewport.height < minHeight) {
				viewport.height = minHeight;
			}
			if (maxWidth && viewport.width > maxWidth) {
				viewport.width = maxWidth;
			}
			if (maxHeight && viewport.height > maxHeight) {
				viewport.height = maxHeight;
			}
		
			// If the game should not be scaled
			if (!scaleLandscape && Math.abs(window.orientation) === 90 || 
				!scalePortrait && Math.abs(window.orientation) !== 90) {
			
				newGameHeight = game.height;
				newGameWidth = game.width;
				
			} else {
				// Determine game size
				if (game.height / game.width > viewport.height / viewport.width) {
					if (game.safeHeight / game.width > viewport.height / viewport.width) {
						// A
						newGameHeight = viewport.height * game.height / game.safeHeight;
						newGameWidth = newGameHeight * game.width / game.height;
					} else {
						// B
						newGameWidth = viewport.width;
						newGameHeight = newGameWidth * game.height / game.width;
					}
				} else {
					if (game.height / game.safeWidth > viewport.height / viewport.width) {
						// C
						newGameHeight = viewport.height;
						newGameWidth = newGameHeight * game.width / game.height;
					} else {
						// D
						newGameWidth = viewport.width * game.width / game.safeWidth;
						newGameHeight = newGameWidth * game.height / game.width;
					}
				}
			}
		
			newGameX = (viewport.width - newGameWidth) / 2;
			newGameY = (viewport.height - newGameHeight) / 2;
			
			// Save the game scale amount
			game.scale = newGameWidth / game.width;
			
			// Define the camera
			game.camera.offsetX = -Math.min(newGameX, 0) / game.scale;
			game.camera.offsetY = -Math.min(newGameY, 0) / game.scale;
			game.camera.width = (viewport.width - Math.max(newGameX, 0) * 2) / game.scale;
			game.camera.height = (viewport.height - Math.max(newGameY, 0) * 2) / game.scale;
			
			if (gameContainer) {
				// Resize the game container
				gameContainer.style.width = (viewport.width - Math.max(newGameX, 0) * 2) + "px";
				gameContainer.style.height = (viewport.height - Math.max(newGameY, 0) * 2)+ "px";
						
				// Set the new padding of the game so it will be centered
				gameContainer.style.padding = Math.max(newGameY, 0) + "px " + Math.max(newGameX, 0) + "px";
			}
			
			// Tell the controller the game dimensions
			game.controller.scaleX = (game.width / newGameWidth) * game.pixelMultiplier;
			game.controller.scaleY = (game.height / newGameHeight) * game.pixelMultiplier;
			game.controller.offsetX = -game.camera.offsetX * game.scale / game.pixelMultiplier;
			game.controller.offsetY = -game.camera.offsetY * game.scale / game.pixelMultiplier;

			for (i = 0; i < game.layers.length; i += 1) {			
				game.layers[i].width = game.camera.width;
				game.layers[i].height = game.camera.height;
			}
			
			if (!loaded && game.loadingScreen) {
				game.loadingScreen.dirty = true;
			}
			game.dispatchEvent("resize");
		},
		
		initLoad = function () {
			
			if (!loadStarted) {
				// If autoLoad is not turned off then load
				if (game.autoLoad !== false) {
					game.load();
				}
			}
		},
		
		checkInitialScreenProgress = function () {
			
			if (game.introScreen) {
				if (!game.introScreen.loaded) {
					
					//BLOCKS.debug("waiting for intro screen to load");
					return;
				}
			}
			
			if (game.loadingScreen) {
				if (!game.loadingScreen.loaded) {
					
					//BLOCKS.debug("waiting for loading screen to load");
					return;
				}
			}
			
			//BLOCKS.debug("load game");
			
			initLoad();
		};
	
	// Define spec as empty object if it was specified as a parameter
	spec = spec || {};

	// The element in which the game markup will be injected will be the element with
	//   the "BlockGame" id unless specified via a parameter of the game
	game.element = (element !== undefined) ? element : document.getElementById("BlocksGame");
	
	// If no game element found with matching id, look for one with a matching class name
	if (!game.element) {
		if (document.getElementsByClassName && document.getElementsByClassName("BlocksGame")) {
			game.element = document.getElementsByClassName("BlocksGame")[0];
		}
	}
	if (!game.element) {
		BLOCKS.error("Game does not have a game element");
	}

	// If there is no game element to scale for us we will need to scale manually
	game.pixelMultiplier = !game.element && window.devicePixelRatio ? window.devicePixelRatio : 1;
	// The scale property represents the amount the game is scaled
	game.scale = 1;
	// The singleLayer property will render everything to one layer
	game.singleLayer = spec.singleLayer !== undefined ? spec.singleLayer : false;
	game.layers = [];
	game.width = spec.width !== undefined ? spec.width : 1024;
	game.height = spec.height !== undefined ? spec.height : 768;
	game.safeWidth = spec.safeWidth || game.width;
	game.safeHeight = spec.safeHeight || game.height;
	game.debug = spec.debug !== undefined ? spec.debug : false;
	game.maxLoopDuration = spec.maxLoopDuration !== undefined ? spec.maxLoopDuration : 500;
	game.stage = BLOCKS.container(game);
	game.camera = BLOCKS.camera({
		width: game.width,
		height: game.height
	});
	game.autoLoad = spec.autoLoad !== undefined ? spec.autoLoad : true;
	game.autoStart = spec.autoStart !== undefined ? spec.autoStart : true;
	game.state = "";
	
	// A canvas can be specified to be used for all rendering
	gameCanvas = spec.canvas;
	// If a canvas is specifed then only one layer will be allowed
	if (gameCanvas) {
		maxLayers = 1;
	} else {
		maxLayers = spec.maxLayers !== undefined ? spec.maxLayers : 10;
	}

	game.pause = function () {
	
		if (!paused) {
			//BLOCKS.debug("Game not visible so pause");
			paused = true;
			if (game.speaker) {
				wasMutedWhenPaused = game.speaker.isMuted();
				game.speaker.mute();
				game.speaker.pause();
				game.dispatchEvent("pause");
			}
		}
	};
	
	game.resize = function () {
	
		resizeGame();
	};
	
	game.unpause = function () {
	
		if (paused) {
			//BLOCKS.debug("Game is visible again so unpause");
			
			paused = false;
			lastUpdateTime = + new Date();	
			
			if (game.speaker) {
				if (!wasMutedWhenPaused) {
					game.speaker.unmute();
				}
				game.speaker.unpause();
				game.dispatchEvent("unpause");
			}
		}
	};
	
	game.update = function () {
		
		game.stage.update();
	};
	
	game.render = function (e) {

		game.stage.render(e);
	};
	
	game.clearLayers = function () {
		
		var i;
	
		for (i = 0; i < game.layers.length; i += 1) {
			game.layers[i].clear();
		}
	};
	
	// Label can match a layer's name or id or index
	game.getLayer = function (label) {
		
		var i, layer, index;
		
		if (label === undefined) {
			label = 0;	
		}
		
		if (typeof label === "number") {
			
			index = label;
			// If the index is larger than the number of layers
			if (index > game.layers.length - 1) {
				if (index > maxLayers - 1) {
					layer = game.layers[game.layers.length - 1];
					
					if (!gameCanvas) {
						BLOCKS.warn("Layer index larger than maximum layers, using the top layer instead.");
					}
				} else {
					// Create a new layer
					layer = game.addLayer("FrameworkGameLayer" + index);
				}
			} else {
				layer = game.layers[index];	
			}
		} else {
			// Return the layer with the layer with the matching name
			for (i = 0; i < game.layers.length; i += 1) {
				if (game.layers[i].name === label || game.layers[i].id === label) {
					layer = game.layers[i];
				}
			}
		}

		return layer;
	};
	
	game.createLayer = function (name, options) {
	
		options = options || {};
		options.name = name;
		options.id = (+ new Date()).toString() + tickerIndex;
		
		options.canvas = gameCanvas;
		if (!game.element) {
			options.scale = game.pixelMultiplier / game.scale;
		}
		if (interactionContainer) {
			options.parentElement = interactionContainer;
		}
		if (!options.width) {
			options.width = game.camera.width;
		}
		if (!options.height) {
			options.height = game.camera.height;
		}

		return BLOCKS.layer(options);
	};
	
	game.addLayer = function (name, options) {
	
		var layer;
		
		// If using one layer then return that
		if (gameCanvas && game.layers.length) {
			return game.getLayer();
		} else {
			layer = game.createLayer(name, options);
			game.layers.push(layer);
			return layer;
		}
	};
	
	game.destroyLayer = function (layer) {
		
		if (layer) {
			layer.destroy();
			layer = null;
		}
	};
	
	game.removeLayer = function (name) {
	
		var i;
		
		for (i = 0; i < game.layers.length; i += 1) {
			if (game.layers[i].name === name) {
				game.destroyLayer(game.layers[i]);
				game.layers.splice(i, 1);
				return true;
			}
		}
	};
	
	game.addMotor = function (type) {
	
		var key,
			motor,
			spec = arguments[1] || {};
			
		spec.type = type;
		
		if (spec.type === "drag") {
			spec.controller = game.controller;
		} else {
			spec.clock = game;
		}

		motor = BLOCKS.motor(spec);
		
		if (motor) {
			motor.type = type;
			if (spec.object) {
				spec.object.motorize(motor);
			}
			motor.addEventListener("destroyed", game.removeMotor);
			motors.push(motor);	
		}
		
		return motor;
	};
	
	game.removeMotor = function (motor) {
	
		var i;
			
		for (i = 0; i < motors.length; i += 1)  {
			if (motors[i] === motor) {
				motors.splice(i, 1);
				return true;
			}
		}
	};
	
	game.addTicker = function (callback, duration, parameters) {
	
		var id = (+ new Date()).toString() + tickerIndex;
		
		tickerIndex += 1;
		if (tickerIndex > 99999999) {
			tickerIndex = 0;
		}

		tickers.push({
			id: id,
			curTick: 0,
			totalTicks: Math.ceil(duration * 60 / 1000),
			callback: callback,
			parameters: parameters
		});
		
		return id;
	};
	
	game.removeTicker = function (id) {
		
		var i, existingTickers = [];
		
		for (i = 0; i < tickers.length; i += 1) {
			if (tickers[i].id === id) {
				tickers[i] = null;
			} else {
				existingTickers.push(tickers[i]);
			}
		}
		
		tickers = existingTickers;
	};
	
	game.clearTickers = function () {
	
		tickers = [];
	};
	
	game.load = function () {
	
		var i;
		
		if (!loadStarted) {
			loadStarted = true;

			game.imageLoader.loadFromTree(spec);
	
			// Define game sounds
			if (spec.sounds) {
				for (i = 0; i < spec.sounds.length; i += 1) {
					game.speaker.createSound(spec.sounds[i]);
				}
			}
	
			game.imageLoader.addEventListener("update", function () {
			
				var assetsLoaded = game.imageLoader.getNumFilesLoaded() + game.speaker.getNumFilesLoaded();
	
				if (game.loadingScreen) {
					game.loadingScreen.setProgress(assetsLoaded, game.imageLoader.getNumFiles() + game.speaker.getNumFiles());
				}
			});
			
			game.imageLoader.addEventListener("complete", function () {
			
				checkLoadProgress();
			});
			game.imageLoader.load();
		}
	};
	
	game.stop = function () {
		
		clock.removeEventListener("tick", onClockTick);	
		clock.stop();
	};
	
	game.start = function () {
	
		var i;
	
		lastUpdateTime = + new Date();
		remainingUpdate = 0;
		
		if (!prepared) {
			prepared = true;

			if (game.prepare) {
				game.prepare();
			}
		}
		
		clock.removeEventListener("tick", onClockTick);	
		clock.addEventListener("tick", onClockTick);
		clock.start();
	};
	
	game.destroy = function () {
	
		var i;

		clock.destroy();
		
		if (game.speaker) {
			game.speaker.stop();	
		}
		
		if (game.introScreen) {
			game.introScreen.destroy();
		}
		
		if (game.loadingScreen) {
			game.loadingScreen.destroy();
		}
		
		for (i = 0; i < game.layers; i += 1) {
			game.removeLayer(game.layers[i]);
		}
	};
	
    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/	
	(function() {
		var lastTime = 0;
		var vendors = ['webkit', 'moz'];
		for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
			window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
			window.cancelAnimationFrame =
				window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
		}
	
		if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	
		if (!window.cancelAnimationFrame)
			window.cancelAnimationFrame = function(id) {
				window.clearTimeout(id);
		};
	}());
	
	init();
	
	game.imageLoader = (spec && spec.imagesPath) ? BLOCKS.preloader(spec.imagesPath) : BLOCKS.preloader();
	
	if (spec && spec.loading) {
		game.loadingScreen = BLOCKS.loadingScreen(spec.loading, game);
		game.intro = "loading";
	}
	
	if (spec && spec.intro) {
		game.introScreen = BLOCKS.introScreen(spec.intro, game);
		game.intro = "intro";
	}
	
	// Create sound player
	game.speaker = BLOCKS.speaker({
		path: (spec && spec.audioPath !== undefined) ? spec.audioPath : "",
		src: (spec && spec.audioSpriteSrc !== undefined) ? spec.audioSpriteSrc : "",
		audioPlayerType: spec.audioPlayerType
	});
	
	game.speaker.addEventListener("update", function (e) {
		var assetsLoaded = game.imageLoader.getNumFilesLoaded() + game.speaker.getNumFilesLoaded();

		if (game.loadingScreen) {
			game.loadingScreen.setProgress(assetsLoaded, game.imageLoader.getNumFiles() + game.speaker.getNumFiles());
		}
	});
	
	game.speaker.addEventListener("ready", function () {
		checkLoadProgress();
	}, true);
	
	Object.defineProperty(game, "paused", {
		get: function () {
			return paused;
		}
	});
	
	if (game.loadingScreen) {
		game.loadingScreen.addEventListener("loaded", checkInitialScreenProgress);
	}
	if (game.introScreen) {
		game.introScreen.addEventListener("loaded", checkInitialScreenProgress);
	}
	
	checkInitialScreenProgress();
	
	return game;
};
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

BLOCKS.gear = function (options) {
	
	"use strict";
	
	var view = BLOCKS.eventDispatcher(),
	
		// Properties
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
		
	view.motorize = function (motor) {
	
		motor.addEventListener("destroyed", motorDestroyed);
		motors.push(motor);
	};
	
	view.removeMotors = function (type) {
	
		var i, destroyMotorArr = [], motorArr = [];
		
		for (i = 0 ; i < motors.length; i += 1)  {
			if (type) {
				if (motors[i].type === type) {
					motors[i].destroy();
				} else {
					motorArr.push(motors[i]);
				}
			} else {
				// Mark the motor to be destroyed
				destroyMotorArr.push(motors[i]);
			}
		}
		// Destroy all motors marked for destruction
		for (i = 0 ; i < destroyMotorArr.length; i += 1)  {
			destroyMotorArr[i].destroy();
		}
		
		// Update the motors array if only some motors destroyed
		motors = motorArr;
	};
	
	view.destroy = function () {
		
		if (view) {
			view.removeMotors();
			view.dispatchEvent("destroyed", view);
			view = null;
		}
	};
	
	return view;
};
/**
*  introScreen.js
*  _____________________________________________________________________________
*  
*  @author William Malone (www.williammalone.com)
*/

/*global window, BLOCKS, Image */

BLOCKS.introScreen = function (spec, game) {
	
	"use strict";
	
	var introScreen = BLOCKS.eventDispatcher(),
		bg,
		clock,
		layer,
		destroyed,
		button,
		buttonImageLoaded,
		
		createButton = function () {
			if (button === undefined && layer) {
				button = BLOCKS.slice({
					layer: layer,
					image: spec.button.image,
					centerRegistrationPoint: true
				});
				button.x = spec.button.x;
				button.y = spec.button.y;
				
				game.controller.addEventListener("mouseMove", onMouseMove);
			}
		},
		
		loadBg = function () {
			
			spec.bg.image = game.imageLoader.loadNow(spec.bg);
			spec.bg.image.onload = bgLoaded;
		},
		
		bgLoaded = function () {
			
			if (!destroyed) {
				if (spec.bg.image.width !== 0 && spec.bg.image.height !== 0) {
					prepare();
					
					if (button || !spec.button) {
						introScreen.loaded = true;
						introScreen.dispatchEvent("loaded");
					}
				} else {
					if (!destroyed) {
						window.setTimeout(bgLoaded, 10);
					}
				}
			}
		},
		
		loadButton = function () {
			
			if (spec.button) {
				spec.button.image = game.imageLoader.loadNow(spec.button);
				spec.button.image.onload = buttonLoaded;
			}
		},
		
		buttonLoaded = function () {
			
			if (!destroyed) {
				if (spec.button.image.width !== 0 && spec.button.image.height !== 0) {
					buttonImageLoaded = true;
					if (button === undefined) {
						createButton();
					}
					if (bg && !destroyed) {
						introScreen.loaded = true;
						introScreen.dispatchEvent("loaded");
					}
				} else {
					if (!destroyed) {
						window.setTimeout(buttonLoaded, 10);
					}
				}
			}
		},
		
		load = function () {
			
			layer = game.addLayer("intro", {
				zIndex: 1
			});
		
			loadBg();
			loadButton();
		},
		
		onTick = function () {
		
			update();
			render();
		},
		
		prepare = function () {

			if (!destroyed) {

				bg = BLOCKS.slice({
					layer: layer,
					image: spec.bg.image
				});
				
				if (buttonImageLoaded) {
					createButton();
				}
				
				clock = BLOCKS.clock();
				clock.addEventListener("tick", onTick);
				clock.start();
			}
		},
		
		update = function () {

			bg.update();
			
			if (button) {
				button.update();
			}
		},
		
		render = function () {
		
			if (layer.dirty || (button && button.dirty)) {
				bg.dirty = true;
				
				if (button) {
					button.dirty = true;
				}
			}

			bg.render(game);
			
			if (button) {
				button.render(game);
			}
		},
		
		onMouseMove = function (pos) {
				
			if (button.isPointInside(pos)) {
				button.scale = 1.1;
			} else {
				button.scale = 1;
			}
		};
	
	introScreen.destroy = function () {
	
		destroyed = true;
	
		if (clock) {
			clock.destroy();
		}
		
		if (bg) {
			bg.destroy();
		}
		
		if (button) {
			button.destroy();
			game.controller.removeEventListener("mouseMove", onMouseMove);
		}
		
		if (layer) {
			game.removeLayer("intro");
		}

		introScreen = null;
	};
	
	load();
			
	return introScreen;
};
/*
Copyright (c) 2013 William Malone (www.williammalone.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*global document */

var BLOCKS;

if (BLOCKS === undefined) {
	BLOCKS = {};
}

BLOCKS.layer = function (options) {
	
	"use strict";
	
	var layer = {},
		canvasElement,
		parentElement,
		width = (options && options.width) || 300,
		height = (options && options.height) || 150,
		zIndex = (options && options.zIndex !== undefined) ? options.zIndex : 0;
	
	// Public Properties
	layer.name = options && options.name;
	layer.id = options && options.id;
	layer.x = options && options.x;
	layer.y = options && options.y;
	layer.scale = (options && options.scale) || 1;
	
	// Public Methods
	layer.clear = function () {
		
		// TODO: Implement webGL for rendering
		//if (layer.webGLEnabled) {
		//
		//	layer.ctx.colorMask(true, true, true, true);
		//	layer.ctx.clearColor(0, 0, 0, 0);
		//	layer.ctx.clear(layer.ctx.COLOR_BUFFER_BIT);
		//	
		//} else {
		
			// Not using clear rect due to Samsung render issues
			//layer.ctx.clearRect(0, 0, layer.ctx.canvas.width, layer.ctx.canvas.height);
			canvasElement.width = canvasElement.width;
			
		//}
		
		layer.dirty = false;
	};
	
	layer.destroy = function () {
		
		if (parentElement) {
			parentElement.removeChild(canvasElement);
		}
		
		canvasElement = null;
		layer.ctx = null;
		parentElement = null;
		
		layer = null;
	};
	
	Object.defineProperty(layer, "width", {
		get: function () {
			return width;
		},
		set: function (value) {
			if (value !== width) {
				layer.dirty = true;
				width = value;
				canvasElement.width = width;
			}
		}
	});
	
	Object.defineProperty(layer, "height", {
		get: function () {
			return height;
		},
		set: function (value) {
			if (value !== height) {
				layer.dirty = true;
				height = value;
				canvasElement.height = height;
			}
		}
	});
	
	if (!options) {
		options = {};
	}
	
	(function () {	
		
		var i, children, layerInserted;
		
		// If a canvas element is specified
		if (options.canvas) {
		
			canvasElement = options.canvas;
		
		// No canvas element specified so create one	
		} else {
		
			canvasElement = document.createElement("canvas");
			canvasElement.width = width;
			canvasElement.height = height;
			canvasElement.className = "BlocksCanvas";
			canvasElement.style.zIndex = zIndex;
			if (layer.name) {
				canvasElement.id = "BlocksCanvas_" + layer.name;
			}
		
			// If a parent is specified then attach the canvas to it
			if (options.parentElement) {
				parentElement = options.parentElement;
				
				children = parentElement.children;
				for (i = 0; i < children.length; i += 1) {
				
					if (children[i].style.zIndex > zIndex) {
						layerInserted = true;
						parentElement.insertBefore(canvasElement, children[i]);
						break;
					}
				}
				if (!layerInserted) {
					parentElement.appendChild(canvasElement);
				}
			}
			
			// TODO: Implement webGL for rendering
			//if (options.enableWebGL) {
			//	try {
			//		layer.ctx = canvasElement.getContext("webgl") || canvasElement.getContext("experimental-webgl");
			//	} catch(e) {}
			//}
			//
			//if (layer.ctx) {
			//	layer.webGLEnabled = true;
			//} else {
			//	layer.webGLEnabled = false;
			//	
			//	layer.ctx = canvasElement.getContext("2d");
			//}
		}
		
		layer.ctx = canvasElement.getContext("2d");

	}());

	return layer;
};
/**
*  loadingScreen.js
*  _____________________________________________________________________________
*  
*  @author William Malone (www.williammalone.com)
*/

/*global window, BLOCKS, Image */

BLOCKS.loadingScreen = function (spec, game) {
	
	"use strict";
	
	var loadingScreen = BLOCKS.eventDispatcher(),
		clock,
		bg,
		layers,
		progressBar,
		curPercentage = 0,
		fontFamily = "Arial,sans",
		animation,
		fontSize = "24px",
		fontWeight = "bold",
		fontColor = "#eee",
		messageX = 0,
		messageY = 0,
		messageText = "loading... ",
		progressBarImageLoaded,
		destroyed,
		
		loadAnimation = function () {
			
			if (spec.animation) {
				spec.bg.image = game.imageLoader.loadNow(spec.animation);
				spec.bg.image.onload = animationLoaded;
			}
		},
		
		animationLoaded = function () {
			
			if (!destroyed) {
				if (spec.bg.image.width !== 0 && spec.bg.image.height !== 0) {
					prepare();
					
					if (progressBar) {
						loadingScreen.loaded = true;
						loadingScreen.dispatchEvent("loaded");
					}
				} else {
					if (!destroyed) {
						window.setTimeout(bgLoaded, 10);
					}
				}
			}
		},
		
		loadBg = function () {
			
			if (spec.bg) {
				spec.bg.image = game.imageLoader.loadNow(spec.bg);
				spec.bg.image.onload = bgLoaded;
			}
		},
		
		bgLoaded = function () {
			
			if (!destroyed) {
				if (spec.bg.image.width !== 0 && spec.bg.image.height !== 0) {
					prepare();
					
					if (progressBar) {
						loadingScreen.loaded = true;
						loadingScreen.dispatchEvent("loaded");
					}
				} else {
					if (!destroyed) {
						window.setTimeout(bgLoaded, 10);
					}
				}
			}
		},
		
		loadBar = function () {
			
			if (spec.progressBar) {
				spec.progressBar.image = game.imageLoader.loadNow(spec.progressBar);
				spec.progressBar.image.onload = barLoaded;
			}
		},
		
		barLoaded = function () {
			
			if (!destroyed) {
				if (spec.progressBar.image.width !== 0 && spec.progressBar.image.height !== 0) {
					
					progressBarImageLoaded = true;
					
					if (layers && layers.loading) {
						createProgressBar();
					}
					
					if (bg) {
						loadingScreen.loaded = true;
						loadingScreen.dispatchEvent("loaded");
					}
					
				} else {
					if (!destroyed) {
						window.setTimeout(barLoaded, 10);
					}
				}
			}
		},
		
		createAnimation = function () {
		
			if (!animation) {
				
				spec.animation.layer = layers.loading;
				animation = BLOCKS.slice(spec.animation);
				animation.x = spec.animation.x;
				animation.y = spec.animation.y;
			
				loadingScreen.dirty = true;
			}
		},
		
		createProgressBar = function () {
		
			if (!progressBar) {
				
				spec.progressBar.layer = layers.loading;
				progressBar = BLOCKS.slice(spec.progressBar);
				progressBar.x = spec.progressBar.x;
				progressBar.y = spec.progressBar.y;
			
				loadingScreen.dirty = true;
			}
		},
		
		load = function () {
			
			layers = {
				loadingBg: game.addLayer("loadingBg", {
					enableWebGL: false
				}),
				loading: game.addLayer("loading")
			};

			loadBg();
			
			loadBar();
			
			loadAnimation();
		},
		
		prepare = function () {
		
			if (!destroyed) {
	
				bg = BLOCKS.slice({
					layer: layers.loadingBg,
					image: spec.bg.image
				});
				
				// If the progress bar is ready to be created and was not already created
				if (progressBarImageLoaded && !progressBar) {
					createProgressBar();
				}
				
				// If the animation is ready to be created and was not already created
				if (spec.animation && !animation) {
					createAnimation();
				}
	
				clock = BLOCKS.clock();
				clock.addEventListener("tick", function () {
					update();
					render();
				});
				clock.start();
				
				loadingScreen.dirty = true;
			}
		},
		
		update = function () {
		
			bg.update();
			
			if (progressBar) {
				progressBar.update();
			}
			if (animation) {
				animation.update();
			}
		},
		
		render = function () {
			
			if (loadingScreen.dirty || bg.dirty || (animation && animation.dirty) || (progressBar && progressBar.dirty)) {
			
				layers.loading.clear();
				
				bg.dirty = true;
				if (progressBar) {
					progressBar.cropWidth = progressBar.width * curPercentage;
					progressBar.dirty = true;
				}
				if (animation) {
					animation.dirty = true;
				}
			
				bg.render(game);
			
				layers.loading.ctx.fillStyle = fontColor;
				layers.loading.ctx.font = fontWeight + " " + fontSize + " " + fontFamily;
				layers.loading.ctx.textAlign = "right";
				
				layers.loading.ctx.fillText(messageText, messageX, messageY);
		
				layers.loading.ctx.textAlign = "left";
				layers.loading.ctx.fillText(Math.round(curPercentage * 100, 10) + "%", messageX, messageY);
			
				if (progressBar) {
					progressBar.render(game);
				}
				if (animation) {
					animation.render(game);
				}
			}
			
			loadingScreen.dirty = false;
		};
		
	loadingScreen.dirty = true;
	
	loadingScreen.destroy = function () {
		
		destroyed = true;

		if (clock) {
			
			clock.destroy();
			
			if (layers) {
				game.removeLayer("loadingBg");
				game.removeLayer("loading");
			}
			
			bg.destroy();
			bg = null;
			
			if (progressBar) {
				progressBar.destroy();
				progressBar = null;
			}
			
			if (animation) {
				animation.destroy();
				animation = null;
			}
		}
		
		loadingScreen = null;
	};
	
	loadingScreen.setProgress = function (loaded, total) {
		
		var percentage = loaded / total;
		
		if (curPercentage !== percentage) {
			curPercentage = percentage;
			loadingScreen.dirty = true;
		}
	};
	
	if (spec.message) {
	
		if (spec.message.fontFamily) {
			fontFamily = spec.message.fontFamily;
		}
		if (spec.message.fontSize) {
			fontSize = spec.message.fontSize.toString().replace("px", "") + "px";
		}
		if (spec.message.fontWeight) {
			fontWeight = spec.message.fontWeight;
		}
		if (spec.message.fontColor) {
			fontColor = spec.message.fontColor;
		}
		if (spec.message.x) {
			messageX = spec.message.x;
		}
		if (spec.message.y) {
			messageY = spec.message.y;
		}
		if (spec.message.text) {
			messageText = spec.message.text;
		}
	}
	
	load();
			
	return loadingScreen;
};

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
				duration = spec.duration,
				timesToVibrate = spec.amount,
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
					
					if (timesTillReverseDirection >= 2) {
						timesTillReverseDirection = 0;
						direction *= -1;
					}
					
					if (curMoveMotor) {
						curMoveMotor.removeEventListener("tick", motor.tick);
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
/*
Copyright (c) 2013 William Malone (www.williammalone.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*global window, document, Image, HTMLElement */

var BLOCKS;

if (BLOCKS === undefined) {
	BLOCKS = {};
}

BLOCKS.preloader = function (path) {
	
	"use strict";
	
	var preloader = BLOCKS.eventDispatcher(),
		imageList = [],
		imagesLoaded,
	
		// Private Methods
		imageLoaded = function () {
		
			imagesLoaded += 1;
			
			preloader.dispatchEvent("update", {
				loaded: imagesLoaded,
				total: imageList.length
			});
			
			if (imagesLoaded === imageList.length) {
				preloader.dispatchEvent("complete");
			}
		},

		traverse = function (obj, callback) {
			
			var key, i;
		
			for (key in obj) {

				if (obj.hasOwnProperty(key) && !(obj[key] instanceof HTMLElement)) {
   
					callback.apply(this, [key, obj]);
					if (obj[key] instanceof Object && !(obj[key] instanceof Array)) {
						traverse(obj[key], callback);
					} else if (obj[key] instanceof Array) {
						for (i = 0; i < obj[key].length; i += 1) {
							traverse(obj[key][i], callback);
						}
					}
				}
			}
		};

	// Public Properties
	preloader.path = path || "";

	// Public Methods
	preloader.load = function () {
	
		var i;
		
		imagesLoaded = 0;
		
		for (i = 0; i < imageList.length; i += 1) {
		
			// If image not already loaded
			if (!imageList[i].loadStarted) {
				imageList[i].loadStarted = true;
				imageList[i].image.addEventListener("load", imageLoaded);
				imageList[i].image.src = preloader.path + imageList[i].src;
			}
		}
	};
	
	preloader.loadFromTree = function (spec) {
	
		traverse(spec, function (key, obj) {
			if (key === "src") {
				preloader.add(obj);
			}
		});
	};
	
	preloader.add = function (spec) {
	
		var i, obj;
		
		if (spec && spec.src && (spec.src.toLowerCase().indexOf("jpg") !== -1 || spec.src.toLowerCase().indexOf("png") !== -1)) {
		
			// Check if the image is already in the list
			for (i = 0; i < imageList.length; i += 1) {
				if (imageList[i].src === spec.src) {
					
					spec.image = imageList[i].image;
					// Image already in list, so no need to add it again
					return imageList[i];
				}
			}
			
			obj = {
				image: new Image(),
				src: spec.src,
				loadStarted: false
			};
			spec.image = obj.image;
			
			if (spec.crossOrigin !== undefined) {
				spec.image.crossOrigin = spec.crossOrigin;
			}
			imageList.push(obj);
			return obj;
		}
	};
	
	preloader.loadNow = function (spec) {
	
		var image;
		
		image = new Image();
		if (spec.crossOrigin !== undefined) {
			image.crossOrigin = spec.crossOrigin;
		}
		image.src = preloader.path + spec.src;
		
		return image;
	};
	
	preloader.getNumFiles = function () {
	
		return imageList.length;
	};
	
	preloader.getNumFilesLoaded = function () {
	
		return imagesLoaded;
	};
	
	preloader.isLoaded = function () {
	
		return (imagesLoaded >= imageList.length);
	};
	
	return preloader;
};
/*
Copyright (c) 2013 William Malone (www.williammalone.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*global window, document, Image, Float32Array */

var BLOCKS;

if (BLOCKS === undefined) {
	BLOCKS = {};
}

BLOCKS.slice = function (options) {
	
	"use strict";
	
	var slice = BLOCKS.view(options),
	
		// Properties
		imageResource, frameWidth, frameHeight, paused, texture, tmpCtx, cropWidth, cropHeight, frameOffsetX, frameOffsetY, mirrorX, mirrorY,
		drawBounds = false,
		frameCnt = 0,
		loopIndex = 0,
		rowIndex = 0,
		colIndex = 0,
		curFrameIndex = 0,
		
		// Private Methods
		onResourceLoaded = function () {
		
			// Will be used for webGL enabled contexts
			//if (slice.layer && slice.layer.webGLEnabled) {
			//	prepareWebGLContext(slice.layer.ctx);
			//}
			
			// Set the sprite dimensions to the image dimensions  
			// Note: Divide the width by the number of frames in the sprite sheet if an animation. If the sprite is only an image then the number of frames will be 1.
		
			if (imageResource) {
				frameWidth = imageResource.image.width / slice.numberOfColumns;
				frameHeight = imageResource.image.height / slice.numberOfRows;
				slice.width = imageResource.image.width / slice.numberOfColumns;
				slice.height = imageResource.image.height / slice.numberOfRows;
			}
		},
		
		drawImage = function (spec) {
		
			if (spec.sourceWidth > frameWidth) {
				spec.sourceWidth = frameWidth;
			}
			if (spec.sourceHeight > frameHeight) {
				spec.sourceHeight = frameHeight;
			}
			if (spec.destWidth > slice.width / slice.layer.scale) {
				spec.destWidth = slice.width / slice.layer.scale;
			}
			if (spec.destHeight > slice.height / slice.layer.scale) {
				spec.destHeight = slice.height / slice.layer.scale;
			}
			
//BLOCKS.debug("render: " + spec.image + ", " + spec.sourceX + ", " + spec.sourceY + ", " + spec.sourceWidth + ", " + spec.sourceHeight + ", " + spec.destX + ", " + spec.destY + ", " + spec.destWidth + ", " + spec.destHeight);	
		
			spec.ctx.drawImage(
				spec.image, 
				spec.sourceX, 
				spec.sourceY,
				spec.sourceWidth, 
				spec.sourceHeight,
				spec.destX, 
				spec.destY,
				spec.destWidth, 
				spec.destHeight
			);
		};
	
	slice.loop = options && options.loop;
	slice.frameDelay = (options && options.frameDelay !== undefined) ? options.frameDelay : 4;
	slice.numberOfFrames = (options && options.numberOfFrames) || 1;
	slice.numberOfRows = (options && options.numberOfRows) || 1;
	slice.numberOfColumns = (options && options.numberOfColumns) ? options.numberOfColumns : slice.numberOfFrames;
	slice.autoPlay = (options && options.autoPlay !== undefined) ? options.autoPlay : true;
	slice.resetOnComplete = (options && options.resetOnComplete !== undefined) ? options.resetOnComplete : true;
	
	// Public Methods
	slice.update = function () {
			
		if (!paused) {
		
			// If the slice has an image associated with it
			if (imageResource) {

				// If the sprite is an animation
				if (slice.numberOfFrames > 1) {
				
					frameCnt += 1;
	
					// If the current frame is the last frame
					if (curFrameIndex >= slice.numberOfFrames - 1) {
						
						if (frameCnt >= slice.frameDelay) {
						
							frameCnt = 0;
							loopIndex += 1;
							
							if (slice.loop === true || (typeof slice.loop === "number" && loopIndex < slice.loop)) {
								// Reset the frame back to the first frame
								curFrameIndex = 0;
								rowIndex = 0;
								colIndex = 0;
								slice.dirty = true;
							
							} else {
							
								if (slice.resetOnComplete) {
									// Reset the frame back to the first frame
									curFrameIndex = 0;
									rowIndex = 0;
									colIndex = 0;
									slice.dirty = true;
								}
								paused = true;
								
								(function () {
								
									var callback;

									if (slice.callback) {
										// Save the callback in case the slice is destroyed after the complete event
										callback = slice.callback;
										slice.callback = null;
									}
									// Dispatch the complete event before any callback
									slice.dispatchEvent("complete");
									// If there is a callback then invoke it now
									if (callback) {
										callback();
									}
								}());
							}
						}
					// If the current frame is not the last frame
					} else {
	
						if (frameCnt >= slice.frameDelay) {
							

							// Go to the next frame
							curFrameIndex += 1;
							
							if (slice.numberOfColumns > 1) {
								if (curFrameIndex - rowIndex * slice.numberOfColumns === slice.numberOfColumns) {
									colIndex = 0;
									rowIndex += 1;
								} else {
									colIndex += 1;
								}
							}						
							
							frameCnt = 0;
							
							slice.dirty = true;
						}
					}
				}
			}
		}
		
		// Go to the next frame in the animation
	};
	
	slice.pause = function () {
		paused = true;
	};
	
	slice.unpause = function () {
		paused = false;
	};
	
	slice.reset = function () {
	
		slice.callback = null;
		
		if (frameCnt !== 0 || curFrameIndex !== 0 || loopIndex !== 0) {
			slice.dirty = true;
		}
		frameCnt = 0;
		curFrameIndex = 0;
		loopIndex = 0;
		rowIndex = 0;
		colIndex = 0;
	};
	
	slice.stop = function () {
	
		paused = true;
		slice.reset();
	};
	
	slice.play = function (callback) {
		
		// If on the last frame then start over
		if (curFrameIndex >= slice.numberOfFrames - 1) {
			slice.stop();
		}
		paused = false;
		
		// Assign an optional callback to be played once the animation is complete
		slice.callback = callback;
	};
	
	slice.render = function (e) {
	
		var i, bounds, boundingBox, restoreNeeded, context, cameraOffset, x, y, destCropWidth, destCropHeight;
		
		// Prevent alpha from being negative
		if (slice.alpha < 0) {
			slice.alpha = 0;
		} else if (slice.alpha > 1) {
			slice.alpha = 1;
		}
		
		if (slice.dirty && slice.visible && slice.alpha !== 0 && slice.cropWidth !== 0 && slice.cropHeight !== 0) {
		
			cameraOffset = {
				x: (e && e.camera && e.camera.offsetX) || 0,
				y: (e && e.camera && e.camera.offsetY) || 0
			};
			
			// Set local x and y to increases performance when slice is associated to a stack 
			x = slice.worldX;
			y = slice.worldY;

			// If the slice has an image associated with it
			if (imageResource) {
				
				if (slice.layer) {
			
					context = slice.layer.ctx;
					
					// Using webGL
					//if (slice.layer.webGLEnabled) {
					
						//context.bindTexture(context.TEXTURE_2D, texture);
					
						//setBufferData(
						//	x, 
						//	y, 
						//	slice.cropWidth || slice.width, 
						//	slice.cropHeight || slice.height);
							
						//context.drawArrays(context.TRIANGLES, 0, 6);
						
						//context.bindTexture(context.TEXTURE_2D, null);
						
					// Using 2d Canvas
					//} else {
				
						if (slice.angle || slice.alpha !== 1 || slice.colorize || slice.mirrorX || slice.mirrorY) {
							context.save();
							restoreNeeded = true;
						}
						
						context.globalAlpha = slice.alpha;
						
						if (slice.angle) {
							context.translate((x - cameraOffset.x) / slice.layer.scale, (y - cameraOffset.y) / slice.layer.scale);
														context.rotate(slice.angle * Math.PI / 180);
							context.translate((-x + cameraOffset.x) / slice.layer.scale, (-y + cameraOffset.y) / slice.layer.scale);
						}
						
						// Careful about performance when using mirroring
						if (slice.mirrorX || slice.mirrorY) {
							context.translate(x, y);
							if (slice.mirrorX && slice.mirrorY) {
								context.scale(-1, -1);
							} else if (slice.mirrorX) {
								context.scale(-1, 1);
							} else {
								context.scale(1, -1);
							}
							context.translate(-x, -y);
						}
						
						if (slice.colorize) {
							if (!tmpCtx) {
								tmpCtx = document.createElement("canvas").getContext("2d");
								tmpCtx.canvas.width = context.canvas.width;
								tmpCtx.canvas.height = context.canvas.height;
							}
							context = tmpCtx;
							context.globalCompositeOperation = "copy";
						}
	
						// If the sprite is an animation
						if (slice.numberOfFrames > 1) {
							drawImage({
								ctx: context,
								image: imageResource.image,
								sourceX: colIndex * slice.width / slice.scale + slice.frameOffsetX,
								sourceY: rowIndex * slice.height / slice.scale + slice.frameOffsetY,
								sourceWidth: slice.cropWidth || frameWidth, 
								sourceHeight: slice.cropHeight || frameHeight, 
								destX: (x + slice.offsetX - cameraOffset.x) / slice.layer.scale,
								destY: (y + slice.offsetY - cameraOffset.y) / slice.layer.scale, 
								destWidth: (slice.cropWidth * slice.scale || slice.width) / slice.layer.scale,
								destHeight: (slice.cropHeight * slice.scale || slice.height) / slice.layer.scale
							});
						// If the sprite is not an animation
						} else {
							drawImage({
								ctx: context,
								image: imageResource.image, 
								sourceX: slice.frameOffsetX, 
								sourceY: slice.frameOffsetY,
								sourceWidth: slice.cropWidth || frameWidth, 
								sourceHeight: slice.cropHeight || frameHeight,
								destX: (x + slice.offsetX - cameraOffset.x) / slice.layer.scale,
								destY: (y + slice.offsetY - cameraOffset.y) / slice.layer.scale, 
								destWidth: (slice.cropWidth * slice.scale || slice.width) / slice.layer.scale,
								destHeight: (slice.cropHeight * slice.scale || slice.height) / slice.layer.scale
							});
						}
						
						if (slice.colorize) {
							// Draw the color that should be overlayed over the image
							context.fillStyle = slice.colorize;
							context.globalCompositeOperation = "source-in";
							context.fillRect(x, y, slice.width, slice.height);
							context = slice.layer.ctx; // Change back from the temp context
							context.drawImage(tmpCtx.canvas, 0, 0);
						}
						
						if (restoreNeeded) {
							context.restore();
						}
					}
					
					if (drawBounds && context) {
						bounds = slice.getBounds();
						if (!bounds.length) {
							bounds = [bounds];
						}
						
						context.lineWidth = 4;
		
						for (i = 0; i < bounds.length; i += 1) {
						
							if (slice.dragging) {
								context.beginPath();
								context.fillStyle = "rgba(10, 255, 50, 0.4)";
								context.fillRect((bounds[i].x - cameraOffset.x) / slice.layer.scale, (bounds[i].y - cameraOffset.y) / slice.layer.scale, bounds[i].width / slice.layer.scale, bounds[i].height / slice.layer.scale);
								context.closePath();
							} else if (slice.justTapped) {
								context.beginPath();
								context.fillStyle = "rgba(255, 10, 50, 0.4)";
								context.fillRect((bounds[i].x - cameraOffset.x) / slice.layer.scale, (bounds[i].y - cameraOffset.y) / slice.layer.scale, bounds[i].width / slice.layer.scale, bounds[i].height / slice.layer.scale);
								context.closePath();
							} else if (slice.justNotTapped) {
								context.beginPath();
								context.fillStyle = "rgba(255, 10, 255, 0.4)";
								context.fillRect((bounds[i].x - cameraOffset.x) / slice.layer.scale, (bounds[i].y - cameraOffset.y) / slice.layer.scale, bounds[i].width / slice.layer.scale, bounds[i].height / slice.layer.scale);
								context.closePath();
							} else if (slice.justReleased) {
								context.beginPath();
								context.fillStyle = "rgba(125, 10, 255, 0.4)";
								context.fillRect((bounds[i].x - cameraOffset.x) / slice.layer.scale, (bounds[i].y - cameraOffset.y) / slice.layer.scale, bounds[i].width / slice.layer.scale, bounds[i].height / slice.layer.scale);
								context.closePath();
								slice.justReleased = false;
							}
						
							context.beginPath();
							context.strokeStyle = "rgba(96, 255, 0, 0.5)";
							context.strokeRect((bounds[i].x - cameraOffset.x) / slice.layer.scale, (bounds[i].y - cameraOffset.y) / slice.layer.scale, bounds[i].width / slice.layer.scale, bounds[i].height / slice.layer.scale);
							context.closePath();
						}
						
						context.beginPath();
						context.arc((x - cameraOffset.x) / slice.layer.scale, (y - cameraOffset.y) / slice.layer.scale, 7, 0, 2 * Math.PI, false);
						context.fillStyle = "rgba(96, 255, 0, 0.5)";
						context.fill();
						
						boundingBox = slice.getBoundingBox();
						if (boundingBox.x !== bounds[0].x || boundingBox.y !== bounds[0].y || boundingBox.width !== bounds[0].width || boundingBox.height !== bounds[0].height) {
							context.beginPath();
							context.strokeStyle = "rgba(244, 246, 0, 0.5)";
							context.strokeRect((boundingBox.x - cameraOffset.x) / slice.layer.scale, (boundingBox.y - cameraOffset.y) / slice.layer.scale, boundingBox.width / slice.layer.scale, boundingBox.height / slice.layer.scale);
							context.closePath();
						}
					}
				//}
			}
		}
		slice.dirty = false;
	};
	
	slice.gotoLastFrame = function () {
	
		if (curFrameIndex !== slice.numberOfFrames - 1) {
			curFrameIndex = slice.numberOfFrames - 1;
			rowIndex = slice.numberOfRows;
			colIndex = slice.numberOfColumns;
			slice.dirty = true;
		}
	};
	
	slice.gotoFrame = function (frameIndex) {
	
		var newFrameCnt = Math.floor(slice.frameDelay * (frameIndex - Math.floor(frameIndex)) / 100);
		frameIndex = Math.floor(frameIndex);

		if (curFrameIndex !== frameIndex || frameCnt !== newFrameCnt) {
			curFrameIndex = frameIndex;
			
			rowIndex = Math.floor(curFrameIndex / slice.numberOfColumns);
			colIndex = curFrameIndex - rowIndex * slice.numberOfColumns;

			frameCnt = newFrameCnt;
			slice.dirty = true;
		}
	};
	
	slice.destroy = function () {
	
		if (slice) {
			slice.removeMotors();
			slice.dispatchEvent("destroyed", slice);
		}
		imageResource = null;
		options = null;
		slice = null;
	};
	
	options = options || {};
	

	Object.defineProperty(slice, "currentFrameIndex", {
		get: function () {
			return curFrameIndex;
		},
		set: function (value) {
			slice.gotoFrame(value);
		}
	});
	
	cropWidth = options.cropWidth;
	Object.defineProperty(slice, "cropWidth", {
		get: function () {
			return cropWidth;
		},
		set: function (value) {
			if (cropWidth !== value) {
				slice.dirty = true;
				cropWidth = value;
			}
		}
	});
	
	cropHeight = options.cropHeight;
	Object.defineProperty(slice, "cropHeight", {
		get: function () {
			return cropHeight;
		},
		set: function (value) {
			if (cropHeight !== value) {
				slice.dirty = true;
				cropHeight = value;
			}
		}
	});
	
	frameOffsetX = options.frameOffsetX || 0;
	Object.defineProperty(slice, "frameOffsetX", {
		get: function () {
			return frameOffsetX;
		},
		set: function (value) {
			if (frameOffsetX !== value) {
				slice.dirty = true;
				frameOffsetX = value;
			}
		}
	});
	
	frameOffsetY = options.frameOffsetY || 0;
	Object.defineProperty(slice, "frameOffsetY", {
		get: function () {
			return frameOffsetY;
		},
		set: function (value) {
			if (frameOffsetY !== value) {
				slice.dirty = true;
				frameOffsetY = value;
			}
		}
	});
	
	mirrorX = options.mirrorX;
	Object.defineProperty(slice, "mirrorX", {
		get: function () {
			return mirrorX;
		},
		set: function (value) {
			if (mirrorX !== value) {
				slice.dirty = true;
				mirrorX = value;
			}
		}
	});
	
	mirrorY = options.mirrorY;
	Object.defineProperty(slice, "mirrorY", {
		get: function () {
			return mirrorY;
		},
		set: function (value) {
			if (mirrorY !== value) {
				slice.dirty = true;
				mirrorY = value;
			}
		}
	});
	
	(function () {
		
		var image = options.image,
			imageSrc = options.imageSrc || (options.image && options.src),
			imagePreloaded = image ? true : false;
			
		options = options || {};
			
		// Pause the slice if autoPlay property is set to false
		if (!slice.autoPlay) {
			paused = true;
		}
			
		if (image || imageSrc) {
		
			imageResource = {
				image: image,
				imageSrc: imageSrc,
				loaded: imagePreloaded
			};
			
			// If the image is already loaded
			if (imageResource.loaded) {
				onResourceLoaded();	
			} else {
				
				// If there is no image object
				if (!imageResource.image) {
					// Instantiate a new image
					imageResource.image = new Image();
				}
				imageResource.image.addEventListener("load", onResourceLoaded);
				imageResource.image.src = imageResource.imageSrc;
			}
		} else {
			onResourceLoaded();	
		}
	}());
	
	return slice;
};
/*
Copyright (c) 2013 William Malone (www.williammalone.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*global window, document, navigator */

var BLOCKS;

if (BLOCKS === undefined) {
	BLOCKS = {};
}

BLOCKS.audio = {};

BLOCKS.audio.soundInstance = function (player) {
	
	"use strict";
	
	var inst = {};
	
	inst.stop = player.stopSoundInstance(inst);
	inst.play = player.playSoundInstance(inst);
	inst.getSoundGain = player.getSoundInstanceGain();
	
	return inst;
};

BLOCKS.audio.audioElementPlayer = function (spec) {
	
	"use strict";
	
	var speaker = BLOCKS.eventDispatcher(),
		spriteSrc,
		curSoundInst,
		initialized = false,
		loadStarted = false,
		loadComplete = false,
		ready = false,
		loadPercentage = 0,
		prevLoadPercentage,
		audioElement,
		loadInterval,
		soundCompleteTimer,
		sounds = {},
		muted = false,
		maybeReady = false,
		resetGainValue,
		pausedFirstTime,
		
		testSoundComplete = function () {
		
			if (!ready) {
				ready = true;
				if (speaker.debug) {
					BLOCKS.debug("audio ready");
				}
				speaker.dispatchEvent("ready");
			}
		},
		
		setReady = function () {
		
			if (!maybeReady) {
			
				maybeReady = true;

				speaker.createSound({
					name: "BlocksTestSound",
					start: 0,
					end: 0.5
				});
				playSound("BlocksTestSound", testSoundComplete);
				window.setTimeout(function () {
					if (!ready) {
						playSound("BlocksTestSound", testSoundComplete);
						
						window.setTimeout(function () {
							if (!ready) {
								testSoundComplete();
							}
						}, 10000);
					}
				}, 10000);
			}
		},
		
		onCanPlayThrough = function () {	
			if (speaker.debug) {
				BLOCKS.debug("onCanPlayThrough");	
			}			
			setReady();
		},
		
		load = function () {
		
			if (!audioElement) {
				return;
			}
		
			if (speaker.debug) {
				BLOCKS.debug("load audio sprite: " + spriteSrc);
			}
			
			if (loadInterval) {
				window.clearInterval(loadInterval);
			}

			loadInterval = window.setInterval(function () {
			
				var loadTime, loadPercentage;
				
				//if (speaker.debug) {
				//	BLOCKS.debug("audioElement.buffered.length: " + audioElement.buffered.length);
				//}
		
				if (!audioElement.buffered.length) {
					return;
				}
				
				loadTime = audioElement.buffered.end(audioElement.buffered.length - 1);
				loadPercentage = loadTime / audioElement.duration * 100;

				if (!isNaN(loadPercentage) && prevLoadPercentage !== loadPercentage) {
					prevLoadPercentage = loadPercentage;
					speaker.dispatchEvent("loadUpdate");
					if (speaker.debug) {
						BLOCKS.debug("loadUpdate: " + Math.round(loadPercentage) + "%");
					}
					if (!pausedFirstTime) {
						pausedFirstTime = true;
						audioElement.pause(); 
					}
				}
                                  
				if (window.Math.abs(loadTime - audioElement.duration) < 0.1) {
					window.clearInterval(loadInterval);
					setReady();
					speaker.dispatchEvent("loadComplete");
					if (speaker.debug) {
						BLOCKS.debug("loadComplete");
					}
				}
			}, 100);
			
			audioElement.src = spriteSrc;
			
			audioElement.play();
		},
		
		endSound = function () {
			
			// Clear the sound complete timer
			window.clearInterval(soundCompleteTimer);
			soundCompleteTimer = null;
			//if (audioElement) {
				audioElement.pause();
			//}
		},
		
		stop = function () {
		
			endSound();
			curSoundInst = null;
		},
		
		soundCompleteChecker = function () {
		
			var inst, atEnd;
	
			// If a sound is playing
			if (curSoundInst) {
		
				// If the scrubber is past the sound end time then the sound is complete
				if (audioElement.currentTime >= curSoundInst.end || audioElement.currentTime >= audioElement.duration) {
				
					// If the sound is set to loop then move the scrubber to the beginning of the sound
					if (curSoundInst.loop === true) {
						
						if (audioElement.currentTime >= audioElement.duration) {
							atEnd = true;
						}

						audioElement.currentTime = curSoundInst.start;

						// If the current time is at the end then play after moving scrubber
						if (atEnd) {
							audioElement.play();
						}
					} else {
					
						endSound();
						speaker.dispatchEvent("played");
						
						inst = curSoundInst;
						curSoundInst = null;
						
						if (inst.callback) {
							inst.callback(inst.name);
						}
					}
				}
			} else {
				window.clearInterval(soundCompleteTimer);
			}
		},
		
		playSound = function (name, callback) {
	
			if (speaker.debug) {
				BLOCKS.debug("Play sound: " + name + " (" + sounds[name].start + " - " + sounds[name].end + ")");
			}
	
			if (sounds[name].end >= audioElement.duration) {
				BLOCKS.warn("Sound ('" + sounds[name].name + "') end time is larger than sprite duration. Setting end time to the sprite duration.");
				sounds[name].end = audioElement.duration - 0.0001;
			}
		
			if (sounds[name].start >= 0 && sounds[name].end > 0) {

				// If the previous sound had a different volume set temporarily
				if (resetGainValue >= 0) {
					audioElement.volume = resetGainValue;
					resetGainValue = null;
				}

				// Save the sound about to play
				curSoundInst = {
					name: sounds[name].name,
					start: sounds[name].start,
					end: sounds[name].end,
					loop: sounds[name].loop,
					sound: sounds[name].sound,
					callback: callback
				};
				
				// Move the scrubber to the start of the sound
				audioElement.currentTime = sounds[name].start;
				
				// Play the sound
				audioElement.play();
				
				// Start a listener to check if the sound is complete
				if (soundCompleteTimer) {
					window.clearInterval(soundCompleteTimer);
				}
				soundCompleteTimer = window.setInterval(soundCompleteChecker, 100);
				
				return true;
			} else {
				BLOCKS.warn("Sound parameters not specified.");
				return false;
			}
		},
	
		// Pause the audio element
		pause = function () {
	
			audioElement.pause();
		},
	
		// Play the audio element if a sound is currently playing 
		unpause = function () {
	
			if (curSoundInst) {
				audioElement.play();
			}
		},

		// Mute all sound
		mute = function () {
	
			audioElement.volume = 0;
		},
		
		// Unmute all sound
		unmute = function () {
	
			audioElement.volume = 1;
		};
		
	speaker.setSoundGain = function (name, gain) {
		
		if (curSoundInst && curSoundInst.name === name) {
			// Save the current volume to be reset for next sound
			resetGainValue = audioElement.volume;
			audioElement.volume = gain;
		}
	};
		
	speaker.play = function (name, callback) {
	
		if (sounds[name]) {
			return playSound(name, callback);
		} else {
			BLOCKS.warn("Cannot play sound '" + name + "' because it was not defined");
		}
	};
	
	// Pause the audio element
	speaker.pause = function () {
	
		pause();
	};
	
	// Unpause the audio element
	speaker.unpause = function () {
	
		unpause();
	};
	
	// Pause the audio element and clear the current sound
	speaker.stop = function () {
	
		stop();
	};
	
	// Mute all sound
	speaker.mute = function () {
	
		if (!muted) {
			mute();
		}
	
		muted = true;
	};
	
	// Unmute all sound
	speaker.unmute = function () {
	
		if (muted) {
			unmute();
		}
	
		muted = false;
	};
	
	speaker.isMuted = function () {
		
		return muted;	
	};
	
	// Return if audio is ready to be played
	speaker.isReady = function () {
	
		return ready;
	};
	
	speaker.load = function () {

		if (!loadStarted) {
			loadStarted = true;
			load();
		}
	};
	
	speaker.createSound = function (spec) {
		
		// Support legacy startTime, endTime and duration properties
		if (spec.startTime !== undefined && spec.start === undefined) {
			spec.start = spec.startTime;
		}
		
		if (spec.endTime !== undefined && spec.end === undefined) {
			spec.end = spec.endTime;
		}
		
		if (spec.duration !== undefined && spec.end === undefined) {
			spec.end = spec.start + spec.duration;	
		}
		
		if (spec.end > audioElement.duration) {
			BLOCKS.warn("Sound ('" + spec.name + "') end time is larger than sprite duration. Setting end time to the sprite duration.");
			spec.end = audioElement.duration - 0.0001;
		}

		sounds[spec.name] = {
			name: spec.name,
			start: spec.start,
			end: spec.end,
			loop: spec.loop
		};
	};
	
	speaker.getActiveSounds = function () {
	
		return [curSoundInst];
	};
	
	speaker.getNumFiles = function () {
		
		return 1;
	};
	
	speaker.getNumFilesLoaded = function () {
	
		return ready ? 1 : 0;
	};

	// Create audio element
	(function () {

		if (spec && spec.src) {

			// Add audio path
			if (spec.path) {
				spriteSrc = spec.path;
			} else {
				spriteSrc = "";
			}

			// Add the sprite filename without extension
			spriteSrc += spec.src;
			
			audioElement = document.createElement("audio");
			audioElement.addEventListener("canplaythrough", onCanPlayThrough);
			
						
			// Add the extension
			if (audioElement.canPlayType("audio/mpeg")) {
				spriteSrc += ".mp3";
			} else if (audioElement.canPlayType("audio/ogg")) {
				spriteSrc += ".ogg";
			}
			
			
		} else {
			BLOCKS.error("sprite filename not specified");
		}
	}());
	
	return speaker;
};

BLOCKS.audio.webAudioPlayer = function (spec) {
	
	"use strict";
	
	var speaker = BLOCKS.eventDispatcher(),
		initialized = false,
		loadStarted = false,
		loadComplete = false,
		ready = false,
		muted = false,
		extension,
		path = (spec && spec.path) || "",
		masterGain,
		ctx,
		sounds = {},
		files = {},
		instances = [],
		tracks = {},
		loadTimeoutId,
		maxLoadTime = spec.maxLoadTime || 60000, // The maximum amount of time for all sounds to load
		loadTries = 0,
		maxLoadTries = 5,
		
		createTrack = function (name) {
		
			if (!tracks[name]) {
				tracks[name] = {
					name: name,
					gain: (ctx.createGain) ? ctx.createGain() : ctx.createGainNode()
				};
				
				// Connect the track's gain node to the master node
				tracks[name].gain.connect(masterGain);
			}
			
			return tracks[name];
		},
		
		onFileLoaded = function (file) {
		
			var key, numFilesLoaded, totalNumFiles;
			
			numFilesLoaded = speaker.getNumFilesLoaded();
			totalNumFiles = speaker.getNumFiles();
		
			if (speaker.debug) {
				BLOCKS.debug("load: " + numFilesLoaded + " of " + totalNumFiles);
			}
//BLOCKS.debug("load: " + numFilesLoaded + " of " + totalNumFiles + " (" + file.src + ")");			
			speaker.dispatchEvent("update", numFilesLoaded, totalNumFiles);
			
			if (numFilesLoaded === totalNumFiles) {
				
				if (!ready) {
					ready = true;
					
					// Clear the load timeout
					window.clearTimeout(loadTimeoutId);
					if (speaker.debug) {
						BLOCKS.debug("audio ready");
					}
//BLOCKS.debug("speaker is ready");
					speaker.dispatchEvent("ready");
				}
			}
		},
		
		loadFile = function (file) {
		
			file.request = new window.XMLHttpRequest();
			
			// For Internet Explorer
			if (!("withCredentials" in file.request)) {
				file.request = new window.XDomainRequest();
			}
		
			file.request.open("get", path + file.src + extension, true);
			file.request.responseType = "arraybuffer";

			file.request.onload = function() {

//BLOCKS.debug("Sound Loaded: " + (path + file.src + extension) + " -> " + file.request);

				ctx.decodeAudioData(file.request.response, function(buffer) {

//BLOCKS.debug("Sound Decoded: " + (path + file.src + extension) + " -> " + file.request);
					
					file.buffer = buffer;
					file.loaded = true;
					
					// TODO: Dispatch an notification that the file has been loaded for the first time, in case we want to play it after its loaded
					
					// TODO: Update the progress if we are waiting for pre-load
					onFileLoaded(file);
					
					file.request = null;
					
				}, function (error) {
					if (BLOCKS.debug) {
						BLOCKS.debug("Error decoding buffer: " + path + file.src + extension);
					}
					file.request = null;
				});
			};
			file.request.send();
		},
		
		load = function () {
		
			var source;
			
			loadStarted = true;
		
			source = ctx.createOscillator();

			if (source.start) {
				source.start(0, 0, 1);
			} else if (source.noteGrainOn) {
				source.noteGrainOn(0, 0, 1);
			}
		},
		
		destroyInstance = function (inst) {
			
			var i, index;
			
			for (i = 0; i < instances.length; i += 1) {
			
				if (instances[i] === inst) {
					instances[i] = null;
					index = i;
					break;
				}	
			}

			instances.splice(index, 1);
		},
		
		soundCompleteChecker = function (inst) {
		
			var callback, soundName;
		
			if (speaker.debug) {
				BLOCKS.debug("Sound '" + inst.sound.name + "' Complete");
			}

			if (inst.callback) {
				callback = inst.callback;
				soundName = inst.name;
			}
		
			// Destroy the instance before calling a possible callback
			destroyInstance(inst);
			
			if (callback) {
				callback(soundName);
			}
		},

		stopSound = function (inst) {
		
			window.clearTimeout(inst.timeout);

			if (inst.source.stop) {
				inst.source.stop(0);
			} else if (inst.source.noteGrainOff) {
				inst.source.noteGrainOff(0);
			} else {					
				inst.source.noteOff(0);
			}
			
			destroyInstance(inst);
		},

		getSoundGain = function (inst) {
		
			return inst.gain.gain.value;
		},
		
		setSoundGain = function (inst, gainValue, delay) {
		
			// If the sound doesn't have its own gain then create its own gain we can change
			if (inst.gain === inst.track.gain) {
				
				// Disconnect the source from its track gain node
				inst.source.disconnect(0);
				
				// Create a new gain
				inst.gain = (ctx.createGain) ? ctx.createGain() : ctx.createGainNode();
				inst.gain.connect(masterGain);
				
				// Connect the source to the new gain
				inst.source.connect(inst.gain);
			}
			if (speaker.debug) {
				BLOCKS.debug("speaker.setSoundGain of sound '" + inst.name + "' to '" + gainValue + "'");
			}			
			// If the gain should be faded out
			if (delay) {
				inst.gain.gain.linearRampToValueAtTime(inst.gain.gain.value, ctx.currentTime);
				inst.gain.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + delay);
			} else {
				inst.gain.gain.value = gainValue;
			}
		},
		
		pauseSound = function (inst) {

			window.clearTimeout(inst.timeout);
			
			inst.currentTime = ((+ new Date()) - inst.startTime) / 1000 % inst.source.buffer.duration;
		
			if (inst.source.stop) {
				inst.source.stop(0);
			} else if (inst.source.noteGrainOff) {
				inst.source.noteGrainOff(0);
			} else {					
				inst.source.noteOff(0);
			}
			
			//if (speaker.debug) {
			//	BLOCKS.debug("Pause sound: '" + inst.name + "' at scrubber position of " + inst.currentTime.toFixed(2));
			//}
		},
		
		unpauseSound = function (inst) {
		
			var newInst;
			
			//if (speaker.debug) {
			//	BLOCKS.debug("Unpause sound: '" + inst.name + "'");
			//}
		
			// Play a new instance of the sound
			newInst = playSound(inst.name, inst.callback, inst.track.name, inst.currentTime);

			if (inst.gain.gain.value !== 1) {
				setSoundGain(newInst, inst.gain.gain.value);
			}
			
			// Delete the old instance
			destroyInstance(inst);
		},
		
		playSound = function (name, callback, trackName, currentTime, delay) {
		
			var inst = {};

			if (sounds[name].file.loaded) {
			
				instances.push(inst);
				inst.sound = sounds[name];
				inst.name = name;
				
				// If an offset is set (set when unpausing a sound)
				if (currentTime) {
					inst.currentTime = currentTime;
				} else {
					// Start from the beginning of the sound
					inst.currentTime = 0;
				}
				
				// Save when the sound starts, or would have started if started from the beginning
				inst.startTime = (+ new Date()) - inst.currentTime * 1000;
				
				if (delay) {
					// Play the sound after a delay
					inst.delay = ctx.currentTime + delay;
				} else {
					// Play the sound immediately
					delay = 0;
					inst.delay = 0;
				}
				
				if (trackName) {
					if (!tracks[trackName]) {
						createTrack(trackName);
					}
					inst.track = tracks[trackName];
				} else {
					inst.track = tracks["default"];
				}
				
				// Create a new source for this sound instance
				inst.source = ctx.createBufferSource();
				inst.source.buffer = sounds[name].file.buffer;
				inst.source.loop = sounds[name].loop;
				inst.gain = inst.track.gain;
				
				// Connect the source to the gains
				inst.source.connect(inst.gain);
				
				if (!sounds[name].loop) {
					// Timeout at the end of the sound
					inst.timeout = window.setTimeout(soundCompleteChecker, (delay + inst.source.buffer.duration - inst.currentTime) * 1000, inst);
					
					// Assign a callback to be called once the sound is complete
					inst.callback = callback;
				}

				if (speaker.debug) {
					if (inst.currentTime) {
						BLOCKS.debug("Play sound: " + name + " (" + inst.currentTime + " - " + sounds[name].end + "), src: " + sounds[name].file.src + extension);
					} else {
						BLOCKS.debug("Play sound: " + name + " (" + sounds[name].start + " - " + sounds[name].end + "), src: " + sounds[name].file.src + extension);
					}
				}
							
				// Play the sound
				if (inst.source.start) {
					// If an offset is specified then add the start time and duration parameters
					if (inst.currentTime) {
						inst.source.start(inst.delay, inst.currentTime/*, inst.source.buffer.duration - inst.currentTime*/);
					} else {
						inst.source.start(inst.delay);
					}
				} else if (inst.source.noteGrainOn) {
					inst.source.noteGrainOn(inst.delay, inst.currentTime, inst.source.buffer.duration - inst.currentTime);
				}
				
				return inst;
			} else {
				// TODO: Play the unloaded sound once its loaded
				//if (speaker.debug) {
					BLOCKS.warn("Tried to play sound: " + name + ", but it is not loaded yet");
				//}
			}
		},
		
		createLoadTimer = function () {
			
			loadTimeoutId = window.setTimeout(function () {
			
				var key;
			
				for (key in files) {
					if (files.hasOwnProperty(key)) {
						if (!files[key].loaded) {
							
							// Cancel the request
							if (files[key].request) {
								BLOCKS.warn("Sound file load has timed out. Aborting request and trying again: " + files[key].src);
								files[key].request.abort();
							} else {
								BLOCKS.warn("Sound file load has timed out. Sending additional request: " + files[key].src);
							}
							loadFile(files[key]);
						}
					}
				}
				
				loadTries += 1;
				if (loadTries < maxLoadTries) {
					createLoadTimer();
				}
				
			}, maxLoadTime);
		};

	speaker.play = function (name, callback, trackName, startTime, delay) {

		if (sounds[name]) {
			return playSound(name, callback, trackName, startTime, delay);
		} else {
			BLOCKS.warn("Cannot play sound '" + name + "' because it was not defined");
		}
	};
	
	speaker.getSoundDuration = function (name) {
	
		return sounds[name].file.buffer.duration;
	};
	
	speaker.getSoundInstanceGain = function (inst) {
	
		return getSoundGain(inst);
	};
	
	speaker.getSoundGain = function (name) {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].name === name) {
			
				return getSoundGain(instanceArr[i]);
			}
		}
	};
	
	speaker.setSoundInstanceGain = function (inst, gainValue, delay) {
	
		setSoundGain(inst, gainValue, delay);
	};
	
	speaker.setSoundGain = function (name, gainValue, delay) {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].name === name) {
			
				setSoundGain(instanceArr[i], gainValue, delay);
			}
		}
	};
	
	speaker.stopSound = function (name) {
	
		var i, instanceArr = instances.slice(0);
				
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].name === name) {
				stopSound(instanceArr[i]);
			}
		}
	};
	
	speaker.pauseSound = function (name) {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].name === name) {
				pauseSound(instanceArr[i]);
			}
		}
	};
	
	speaker.unpauseSound = function (name) {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].name === name) {
				unpauseSound(instanceArr[i]);
			}
		}
	};

	speaker.stopTrack = function (trackName) {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].track.name === trackName) {
				stopSound(instanceArr[i]);
			}
		}
	};
	
	speaker.pauseTrack = function (trackName) {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].track.name === trackName) {
				pauseSound(instanceArr[i]);
			}
		}
	};
	
	speaker.unpauseTrack = function (trackName) {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].track.name === trackName) {
				unpauseSound(instanceArr[i]);
			}
		}
	};
	
	// Stop all sounds
	speaker.stop = function () {
	
		var i, instanceArr = instances.slice(0);
		
		for (i = 0; i < instanceArr.length; i += 1) {
			stopSound(instanceArr[i]);
		}
	};
	
	// Pause all sounds
	speaker.pause = function () {
	
		var i, instanceArr = instances.slice(0);
		
		for (i = 0; i < instanceArr.length; i += 1) {
			pauseSound(instanceArr[i]);
		}
	};
	
	// Unpause any paused sounds
	speaker.unpause = function () {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			unpauseSound(instanceArr[i]);
		}
	};
	
	// Mute all sound
	speaker.mute = function () {

		if (!muted) {
			muted = true;
			masterGain.gain.value = 0;
		}
	};
	
	// Unmute all sound
	speaker.unmute = function () {

		if (muted) {
			muted = false;
			masterGain.gain.value = 1;
		}
	};
	
	speaker.isMuted = function () {
		
		return muted;	
	};
	
	// Load the audio element
	speaker.load = function () {

		if (!loadStarted) {
			loadStarted = true;
			
			createLoadTimer();
			
			load();
		}
	};
	
	// Return if audio is ready to be played
	speaker.isReady = function () {
	
		return ready;
	};
	
	speaker.createSound = function (spec) {

		sounds[spec.name] = {
			name: spec.name,
			start: spec.start,
			end: spec.end,
			loop: spec.loop
		};
//BLOCKS.debug("Create Sound: " + spec.name);
		if (!files[spec.src]) {
			files[spec.src] = {
				src: spec.src
			};
			loadFile(files[spec.src]);
//BLOCKS.debug("Load Sound: " + spec.src);
		}
		
		sounds[spec.name].file = files[spec.src];
	};
	
	speaker.getActiveSoundInstances = function () {
	
		return instances;
	};
	
	speaker.getNumFiles = function () {
	
		var key, totalNumFiles;

		totalNumFiles = 0;
		
		// Determine load progress
		for (key in files) {
			if (files.hasOwnProperty(key)) {
				totalNumFiles += 1;
			}
		}
		
		return totalNumFiles;
	};
	
	speaker.getNumFilesLoaded = function () {
	
		var key, numFilesLoaded;
			
		numFilesLoaded = 0;
		
		// Determine load progress
		for (key in files) {
			if (files.hasOwnProperty(key)) {
				if (files[key].loaded) {
					numFilesLoaded += 1;
				}
			}
		}
		
		return numFilesLoaded;
	};
	
	speaker.getCurrentTime = function () {
		
		return ctx.currentTime;
	};
	
	speaker.multipleTracksSupported = true;

	(function () {
	
		var tmpAudioElement = document.createElement("audio"), fireFoxDetected;
		
		// Use ogg for Firefox due to a bud decoding buffer data
		fireFoxDetected = (navigator.userAgent.toLowerCase().indexOf('firefox') > -1);

		if (tmpAudioElement.canPlayType("audio/mpeg;").replace(/no/, "") && !!(tmpAudioElement.canPlayType) && !fireFoxDetected) {
			extension = ".mp3";
		} else {
			extension = ".ogg";
		}
		
		if (typeof AudioContext !== "undefined") {
			ctx = new window.AudioContext();
		} else if (typeof webkitAudioContext !== "undefined") {
			ctx = new window.webkitAudioContext();
		}
		
		if (ctx) {
			// Create the master gain node
			masterGain = (ctx.createGain) ? ctx.createGain() : ctx.createGainNode();
			// Connext the master gain node to the context's output
			masterGain.connect(ctx.destination);
		} else {
			BLOCKS.error("Cannot create audio context.");
		}
		
		createTrack("default");
	}());
	
	return speaker;
};

BLOCKS.audio.multiAudioElementPlayer = function (spec) {

	"use strict";
	
	var speaker = BLOCKS.eventDispatcher(),
		initialized = false,
		loadStarted = false,
		loadComplete = false,
		ready = false,
		muted = false,
		extension,
		path = (spec && spec.path) || "",
		masterGain,
		ctx,
		sounds = {},
		files = {},
		instances = [],
		tracks = {},
		loadTimeoutId,
		maxLoadTime = spec.maxLoadTime || 60000, // The maximum amount of time for all sounds to load
		loadTries = 0,
		maxLoadTries = 5,
		
		createTrack = function (name) {
		
			if (!tracks[name]) {
				tracks[name] = {
					name: name,
					gain: (ctx.createGain) ? ctx.createGain() : ctx.createGainNode()
				};
				
				// Connect the track's gain node to the master node
				tracks[name].gain.connect(masterGain);
			}
			
			return tracks[name];
		},
		
		onFileLoaded = function (file) {
		
			var key, numFilesLoaded, totalNumFiles;
			
			numFilesLoaded = speaker.getNumFilesLoaded();
			totalNumFiles = speaker.getNumFiles();
		
			if (speaker.debug) {
				BLOCKS.debug("load: " + numFilesLoaded + " of " + totalNumFiles);
			}
		
			speaker.dispatchEvent("update", numFilesLoaded, totalNumFiles);
			
			if (numFilesLoaded === totalNumFiles) {
				
				if (!ready) {
					ready = true;
					
					// Clear the load timeout
					window.clearTimeout(loadTimeoutId);
					if (speaker.debug) {
						BLOCKS.debug("audio ready");
					}

					speaker.dispatchEvent("ready");
				}
			}
		},
		
		loadFile = function (file) {

			file.audioElement = document.createElement("audio");
			
			file.audioElement.preload = true;
			file.audioElement.src = (path + file.src + extension);
			file.audioElement.load();
			file.audioElement.addEventListener("canplaythrough", function () {
				BLOCKS.debug("Audio element loaded: " + (path + file.src + extension));
				file.loaded = true;
				onFileLoaded(file);
			});
			//document.body.appendChild(file.audioElement);
		},
		
		load = function () {
		
			/*
			var source;
			
			loadStarted = true;
		
			source = ctx.createOscillator();

			if (source.start) {
				source.start(0, 0, 1);
			} else if (source.noteGrainOn) {
				source.noteGrainOn(0, 0, 1);
			}
			*/
		},
		
		destroyInstance = function (inst) {
			
			var i, index;
			
			for (i = 0; i < instances.length; i += 1) {
			
				if (instances[i] === inst) {
					instances[i] = null;
					index = i;
					break;
				}	
			}

			instances.splice(index, 1);
		},
		
		soundCompleteChecker = function (inst) {
		
			var callback, soundName;
		
			if (speaker.debug) {
				BLOCKS.debug("Sound '" + inst.sound.name + "' Complete");
			}

			if (inst.callback) {
				callback = inst.callback;
				soundName = inst.name;
			}
		
			// Destroy the instance before calling a possible callback
			destroyInstance(inst);
			
			if (callback) {
				callback(soundName);
			}
		},

		stopSound = function (inst) {
		
			if (inst.timeout) {
				window.clearTimeout(inst.timeout);
			}
			if (inst.fadeTimeout) {
				window.clearTimeout(inst.fadeTimeout);
			}
			/*
			if (inst.source.stop) {
				inst.source.stop(0);
			} else if (inst.source.noteGrainOff) {
				inst.source.noteGrainOff(0);
			} else {					
				inst.source.noteOff(0);
			}
			*/
			
			inst.sound.file.audioElement.pause();
			
			destroyInstance(inst);
		},

		getSoundGain = function (inst) {
		
			return inst.sound.file.audioElement.volume;
		},
		
		setSoundGain = function (inst, gainValue, delay) {
			
			var fadeInterval = 10;
			
			// Clear previous fade if it's still going
			if (inst.fadeTimeout) {
				inst.sound.file.audioElement.volume = inst.fadeTarget;
				window.clearInterval(inst.fadeTimeout);
				inst.fadeTarget = 0;
				inst.fadeAmount = 0;
			}
		
			if (delay) {

				// Create timer to fade the gain over time
				inst.fadeTarget = gainValue;
				inst.fadeAmount = (gainValue - inst.sound.file.audioElement.volume) / ((delay * 1000) / fadeInterval);
				inst.fadeTimeout = window.setInterval(function () {
					if (inst.sound.file.audioElement.volume === inst.fadeTarget) {
						window.clearInterval(inst.fadeTimeout);
					}
					inst.sound.file.audioElement.volume += inst.fadeAmount;
				}, fadeInterval);
			} else {
				inst.sound.file.audioElement.volume = gainValue;
			}
		},
		
		pauseSound = function (inst) {

			window.clearTimeout(inst.timeout);
			
			inst.currentTime = ((+ new Date()) - inst.startTime) / 1000 % inst.sound.file.audioElement.duration;
			
			inst.sound.file.audioElement.pause();
		},
		
		unpauseSound = function (inst) {
		
			var newInst;
			
			//if (speaker.debug) {
			//	BLOCKS.debug("Unpause sound: '" + inst.name + "'");
			//}

			newInst = playSound(inst.name, inst.callback, null, inst.currentTime);

			// Delete the old instance
			destroyInstance(inst);
		},
		
		playSound = function (name, callback, trackName, currentTime, delay) {
		
			var inst = {};

			if (sounds[name].file.loaded) {
			
				instances.push(inst);
				inst.sound = sounds[name];
				inst.name = name;
				
				// If an offset is set (set when unpausing a sound)
				if (currentTime) {
					inst.currentTime = currentTime;
				} else {
					// Start from the beginning of the sound
					inst.currentTime = 0;
				}
				
				// Save when the sound starts, or would have started if started from the beginning
				inst.startTime = (+ new Date()) - inst.currentTime * 1000;
				
				if (delay) {
					// Play the sound after a delay
					inst.delay = ctx.currentTime + delay;
				} else {
					// Play the sound immediately
					delay = 0;
					inst.delay = 0;
				}
				
				if (trackName) {
					if (!tracks[trackName]) {
						createTrack(trackName);
					}
					inst.track = tracks[trackName];
				} else {
					inst.track = tracks["default"];
				}
				
				// Create a new source for this sound instance
				//inst.source = ctx.createBufferSource();
				//inst.source.buffer = sounds[name].file.buffer;
				//inst.source.loop = sounds[name].loop;
				//inst.gain = inst.track.gain;
				
				
				
				// Connect the source to the gains
				//inst.source.connect(inst.gain);
				
				if (!sounds[name].loop) {
					// Timeout at the end of the sound
					//inst.timeout = window.setTimeout(soundCompleteChecker, (delay + inst.source.buffer.duration - inst.currentTime) * 1000, inst);
					
					// Assign a callback to be called once the sound is complete
					inst.callback = callback;
				} else {
					inst.sound.file.audioElement.loop = true;
				}

				if (speaker.debug) {
					if (inst.currentTime) {
						BLOCKS.debug("Play sound: " + name + " (" + inst.currentTime + " - " + sounds[name].end + "), src: " + sounds[name].file.src + extension);
					} else {
						BLOCKS.debug("Play sound: " + name + " (" + sounds[name].start + " - " + sounds[name].end + "), src: " + sounds[name].file.src + extension);
					}
				}
				
				inst.sound.file.audioElement.currentTime = inst.currentTime;
				inst.sound.file.audioElement.play();
				
				/*
				// Play the sound
				if (inst.source.start) {
					// If an offset is specified then add the start time and duration parameters
					if (inst.currentTime) {
						inst.source.start(inst.delay, inst.currentTime, inst.source.buffer.duration - inst.currentTime);
					} else {
						inst.source.start(inst.delay);
					}
				} else if (inst.source.noteGrainOn) {
					inst.source.noteGrainOn(inst.delay, inst.currentTime, inst.source.buffer.duration - inst.currentTime);
				}
				*/
				
				return inst;
			} else {
				// TODO: Play the unloaded sound once its loaded
				//if (speaker.debug) {
					BLOCKS.warn("Tried to play sound: " + name + ", but it is not loaded yet");
				//}
			}
		},
		
		createLoadTimer = function () {
			
			loadTimeoutId = window.setTimeout(function () {
			
				var key;
			
				for (key in files) {
					if (files.hasOwnProperty(key)) {
						if (!files[key].loaded) {
							
							// Cancel the request
							if (files[key].request) {
								BLOCKS.warn("Sound file load has timed out. Aborting request and trying again: " + files[key].src);
								files[key].request.abort();
							} else {
								BLOCKS.warn("Sound file load has timed out. Sending additional request: " + files[key].src);
							}
							loadFile(files[key]);
						}
					}
				}
				
				loadTries += 1;
				if (loadTries < maxLoadTries) {
					createLoadTimer();
				}
				
			}, maxLoadTime);
		};

	speaker.play = function (name, callback, trackName, startTime, delay) {

		if (sounds[name]) {
			return playSound(name, callback, trackName, startTime, delay);
		} else {
			BLOCKS.warn("Cannot play sound '" + name + "' because it was not defined");
		}
	};
	
	speaker.getSoundDuration = function (name) {
	
		return sounds[name].file.buffer.duration;
	};
	
	speaker.getSoundInstanceGain = function (inst) {
	
		return getSoundGain(inst);
	};
	
	speaker.getSoundGain = function (name) {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].name === name) {
			
				return getSoundGain(instanceArr[i]);
			}
		}
	};
	
	speaker.setSoundInstanceGain = function (inst, gainValue, delay) {
	
		setSoundGain(inst, gainValue, delay);
	};
	
	speaker.setSoundGain = function (name, gainValue, delay) {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].name === name) {
			
				setSoundGain(instanceArr[i], gainValue, delay);
			}
		}
	};
	
	speaker.stopSound = function (name) {
	
		var i, instanceArr = instances.slice(0);
				
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].name === name) {
				stopSound(instanceArr[i]);
			}
		}
	};
	
	speaker.pauseSound = function (name) {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].name === name) {
				pauseSound(instanceArr[i]);
			}
		}
	};
	
	speaker.unpauseSound = function (name) {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].name === name) {
				unpauseSound(instanceArr[i]);
			}
		}
	};

	speaker.stopTrack = function (trackName) {
	
		//var i, instanceArr = instances.slice(0);
		//	
		//for (i = 0; i < instanceArr.length; i += 1) {
		//	if (instanceArr[i].track.name === trackName) {
		//		stopSound(instanceArr[i]);
		//	}
		//}
	};
	
	speaker.pauseTrack = function (trackName) {
	
		//var i, instanceArr = instances.slice(0);
		//	
		//for (i = 0; i < instanceArr.length; i += 1) {
		//	if (instanceArr[i].track.name === trackName) {
		//		pauseSound(instanceArr[i]);
		//	}
		//}
	};
	
	speaker.unpauseTrack = function (trackName) {
	
		//var i, instanceArr = instances.slice(0);
		//	
		//for (i = 0; i < instanceArr.length; i += 1) {
		//	if (instanceArr[i].track.name === trackName) {
		//		unpauseSound(instanceArr[i]);
		//	}
		//}
	};
	
	// Stop all sounds
	speaker.stop = function () {
	
		var i, instanceArr = instances.slice(0);
		
		for (i = 0; i < instanceArr.length; i += 1) {
			stopSound(instanceArr[i]);
		}
	};
	
	// Pause all sounds
	speaker.pause = function () {
	
		var i, instanceArr = instances.slice(0);
		
		for (i = 0; i < instanceArr.length; i += 1) {
			pauseSound(instanceArr[i]);
		}
	};
	
	// Unpause any paused sounds
	speaker.unpause = function () {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			unpauseSound(instanceArr[i]);
		}
	};
	
	// Mute all sound
	speaker.mute = function () {
	
		if (!muted) {
			muted = true;
// TODO: mute all sounds
		}
	};
	
	// Unmute all sound
	speaker.unmute = function () {
	
		if (muted) {
			muted = false;
// TODO: unmute all sounds
		}
	};
	
	speaker.isMuted = function () {
		
		return muted;	
	};
	
	// Load the audio element
	speaker.load = function () {

		if (!loadStarted) {
			loadStarted = true;
			
			createLoadTimer();
			
			load();
		}
	};
	
	// Return if audio is ready to be played
	speaker.isReady = function () {
	
		return ready;
	};
	
	speaker.createSound = function (spec) {

		sounds[spec.name] = {
			name: spec.name,
			start: spec.start,
			end: spec.end,
			loop: spec.loop
		};
//BLOCKS.debug("Create Sound: " + spec.name);
		if (!files[spec.src]) {
			files[spec.src] = {
				src: spec.src
			};
			loadFile(files[spec.src]);
//BLOCKS.debug("Load Sound: " + spec.src);
		}
		
		sounds[spec.name].file = files[spec.src];
	};
	
	speaker.getActiveSoundInstances = function () {
	
		return instances;
	};
	
	speaker.getNumFiles = function () {
	
		var key, totalNumFiles;

		totalNumFiles = 0;
		
		// Determine load progress
		for (key in files) {
			if (files.hasOwnProperty(key)) {
				totalNumFiles += 1;
			}
		}
		
		return totalNumFiles;
	};
	
	speaker.getNumFilesLoaded = function () {
	
		var key, numFilesLoaded;
			
		numFilesLoaded = 0;
		
		// Determine load progress
		for (key in files) {
			if (files.hasOwnProperty(key)) {
				if (files[key].loaded) {
					numFilesLoaded += 1;
				}
			}
		}
		
		return numFilesLoaded;
	};
	
	speaker.getCurrentTime = function () {
		
		// Since multiple sounds could be playing this returns nothing
		return null;
	};
	
	speaker.multipleTracksSupported = true;

	(function () {
	
		extension = ".mp3";

	}());
	
	return speaker;
};

BLOCKS.speaker = function (spec) {
	
	"use strict";
	
	var speaker;
	
	// Create audio element
	(function () {
	
		if (!spec) {
			spec = {};
		}
		
		if (spec.audioPlayerType === "multiAudioElementPlayer") {
			speaker = BLOCKS.audio.multiAudioElementPlayer(spec);
		} else if (spec.audioPlayerType !== "audioElementPlayer" && (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') && spec.webAudioEnabled !== false) {
			speaker = BLOCKS.audio.webAudioPlayer(spec);
		} else {
			speaker = BLOCKS.audio.audioElementPlayer(spec);
		}
	}());
	
	speaker.debug = false;
	
	return speaker;
};
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
		x,
		y,
		visible,
		
		motorDestroyed = function (motor) {
			
			var i;
			
			motor.removeEventListener("destroyed", motorDestroyed);
			
			for (i = 0 ; i < motors.length; i += 1)  {
				motors.splice(i, 1);
				break;
			}
		},
		
		setViewsDirty = function (value) {
			var i;
				
			for (i = 0; i < views.length; i += 1) {
				views[i].dirty = value;
			}
		};
		
	options = options || {};
	
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
	
		if (!visible) {
			visible = true;

			for (i = 0; i < views.length; i += 1) {
				views[i].show();
			}
		}
	};
	
	stack.hide = function () {
	
		var i;
		
		if (visible) {
			visible = false;
			dirty = true;
			
			for (i = 0; i < views.length; i += 1) {
				views[i].hide();
			}
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
			setViewsDirty(value);
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
	
	x = options.x || 0;
	Object.defineProperty(stack, "x", {
		get: function () {
			return x;
		},
		set: function (value) {
			if (x !== value) {
				x = value;
				setViewsDirty(true);
			}
		}
	});
	
	y = options.y || 0;
	Object.defineProperty(stack, "y", {
		get: function () {
			return y;
		},
		set: function (value) {
			if (y !== value) {
				y = value;
				setViewsDirty(true);
			}
		}
	});
	
	visible = options.visible || true;
	Object.defineProperty(stack, "visible", {
		get: function () {
			return visible;
		},
		set: function (value) {
			if (value) {
				stack.show();
			} else {
				stack.hide();
			}
		}
	});
	
	return stack;
};
/*
Copyright (c) 2013 William Malone (www.williammalone.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*global window, JSON */

var BLOCKS;

if (BLOCKS === undefined) {
	BLOCKS = {};
}

BLOCKS.storage = function () {
	
	"use strict";
	
	var storage = BLOCKS.eventDispatcher();

	storage.get = function (item) {
	
		if (!window.localStorage) {
			return null;
		}
	
		return JSON.parse(window.localStorage.getItem(item)); 
	};
	
	storage.save = function (item, str) {
	
		window.localStorage.setItem(item, JSON.stringify(str));
	};
	
	storage.destroy = function () {
	
		storage = null;
	};
		
	return storage;
};
/*
Copyright (c) 2013 William Malone (www.williammalone.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*global window, Image */

var BLOCKS;

if (BLOCKS === undefined) {
	BLOCKS = {};
}

BLOCKS.textField = function (options) {
	
	"use strict";
	
	var textField = BLOCKS.view(options),
	
		drawBounds = false, motors = [],
		
		// Private Method
		motorDestroyed = function (motor) {
			
			var i;
			
			motor.removeEventListener("destroyed", motorDestroyed);
			
			for (i = 0 ; i < motors.length; i += 1)  {
				motors.splice(i, 1);
				break;
			}
		};
	
	// Public Properties
	//textField.name = (options && options.name !== undefined) ? options.name : undefined;
	//textField.width = options.width || 0;
	//textField.height = options.height || 0;
	//textField.x = options.x || 0;
	//textField.y = options.y || 0;
	//textField.layer = options && options.layer;
	//textField.angle = (options && options.angle);
	//textField.alpha = (options && options.alpha);
	//textField.scale = (options && options.scale) || 1;
	//textField.visible = true;
	//textField.dirty = true;
	
	// Public Methods
	textField.render = function () {
	
		var i, bounds, restoreNeeded, wordArr, curLine, tempLine, xLoc, yLoc,
			context;
		
		if (textField.dirty && textField.visible && textField.layer) {
		
			context = textField.layer.ctx;
		
			if (textField.angle || textField.alpha !== 1) {
				context.save();
				restoreNeeded = true;
			}
			
			if (textField.alpha !== 1) {
				context.globalAlpha = textField.alpha;
			}
			
			if (textField.angle) {
				context.translate(textField.x, textField.y);
				context.rotate(textField.angle * Math.PI / 180);
				context.translate(-textField.x, -textField.y);
			}
		
			context.fillStyle = textField.fontColor;
			context.font = textField.fontWeight + " " + (Number(textField.fontSize.toString().replace("px", "")) * textField.scale + "px") + " " + textField.fontFamily;
			context.textAlign = textField.textAlign;
			
			wordArr = (textField.prependText + textField.text).split(" ");
			curLine = "";
			
			xLoc = textField.x;
			yLoc = textField.y;
			context.textBaseline = textField.textBaseline;
			for (i = 0; i < wordArr.length; i += 1) {
				tempLine = curLine + wordArr[i] + " ";
				if (i && textField.width && context.measureText(tempLine).width > textField.width) {
					context.fillText(curLine, xLoc, yLoc);
					curLine = wordArr[i] + " ";
					yLoc += 20;
				} else {
					curLine = tempLine;
				}
			}
			context.fillText(curLine, xLoc, yLoc);
			
			//context.fillText(textField.prependText + textField.text, textField.x, textField.y);
						
			if (restoreNeeded) {
				context.restore();
			}

			if (drawBounds) {
				context.beginPath();
				context.strokeStyle = "rgba(255, 80, 0, 0.5)";
				context.strokeRect(textField.x, textField.y, textField.width, textField.height);
				context.closePath();
			}
		}
		textField.dirty = false;
	};
		
	textField.destroy = function () {
		
		textField.stopMotors();
		options = null;
		textField = null;
	};
	
	textField.motorize = function (motor) {
	
		motor.addEventListener("destroyed", motorDestroyed);
		motors.push(motor);
	};
	
	textField.stopMotors = function (type) {
		
		var i, motorArr = motors.slice(0);
		
		for (i = 0 ; i < motorArr.length; i += 1)  {
			if (type) {
				if (motorArr[i].type === type) {
					motorArr[i].destroy();
				}
			} else {
				motorArr[i].destroy();
			}
		}
	};
	
	(function () {
		
		options = options || {};
		
		textField.fontColor = options.fontColor || "#000000";
		textField.fontFamily = options.fontFamily || "Arial,sans";
		textField.fontSize = (options.fontSize && Number(options.fontSize.toString().replace("px", ""))) || 24;
		textField.fontWeight = options.fontWeight || "bold";
		textField.textAlign = options.textAlign || "center";
		textField.prependText = options.prependText || "";
		textField.textBaseline = options.textBaseline || "top";
		textField.text = options.text || "";

	}());
	
	return textField;
};
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

BLOCKS.tileCollection = function (options) {
	
	"use strict";
	
	var collection = BLOCKS.eventDispatcher(),
		tiles = [],
		tileWidth,
		tileHeight,
		tileIndexArray = [],
		visibleTiles = [],
		dirty,
		layer,
		alpha,
		motors = [],
		width,
		height,
		x,
		y,
		visible,
		prevCamera,
		speed,
		loopX,
		
		motorDestroyed = function (motor) {
			
			var i;
			
			motor.removeEventListener("destroyed", motorDestroyed);
			
			for (i = 0 ; i < motors.length; i += 1)  {
				motors.splice(i, 1);
				break;
			}
		},
		
		setTilesDirty = function (value) {
			
			var i;
				
			for (i = 0; i < visibleTiles.length; i += 1) {
				visibleTiles[i].dirty = value;
			}
		},

		init = function () {
			
			var i, tmpSlice;
			
			if (options.tiles) {
				for (i = 0; i < options.tiles.length; i += 1) {
					
					// If the tile has an id
					if (options.tiles[i].id) {
						tiles[options.tiles[i].id] = options.tiles[i];
					} else {
						tiles[i] = options.tiles[i];
					}
				}

				// If an image is loaded for the first tile
				if (options.tiles[0].image) {
					tileWidth = options.tiles[0].image.width;
					tileHeight = options.tiles[0].image.height;
				}
				
			} else {
				BLOCKS.error("No tiles specified in tile collection.");
			}
			
			if (options.order) {
				tileIndexArray = options.order;
			} else {
				BLOCKS.error("No tile order specified in tile collection.");
			}
		},
		
		drawTile = function (spec) {
			
			var tilePos;
			
			if (tileWidth && tileHeight) {

				// Determine the tile position relative to the collection
				tilePos = {
					x: -(spec.camera.x * speed - tileWidth * spec.column),
					y: -(spec.camera.y * speed - tileHeight * spec.row)
				};
				
				spec.image = tiles[spec.id].image;
	
				// If tile outside bounds on the left (maybe right too)
				if (tilePos.x + x + spec.camera.offsetX < 0) {
					spec.sourceX = x - tilePos.x + spec.camera.offsetX;
					spec.destX = 0;
					
					// If outside bounds on the right too
					if (tilePos.x + tileWidth > spec.camera.width + spec.camera.offsetX) {
						spec.sourceWidth = spec.camera.width;

//BLOCKS.debug(collection.name + ":If tile outside bounds on the left and right: sourceX: " + spec.sourceX + ", sourceWidth: " + spec.sourceWidth + ", x: " + x +", tilePos.x: " + tilePos.x + ", spec.camera.x: " + spec.camera.x + ", (sourceX + sourceWidth > tileWidth): " + Boolean(spec.sourceX + spec.sourceWidth > tileWidth));
					// If outside bounds on the left but not the right
					} else {
						spec.sourceWidth = tileWidth + tilePos.x - spec.camera.offsetX;

//BLOCKS.debug(collection.name + ":If tile outside bounds on the left: sourceX: " + spec.sourceX + ", sourceWidth: " + spec.sourceWidth + ", x: " + x +", tilePos.x: " + tilePos.x + ", spec.camera.x: " + spec.camera.x + ", (sourceX + sourceWidth > tileWidth): " + Boolean(spec.sourceX + spec.sourceWidth > tileWidth) + ", spec.camera.offsetX;: " + spec.camera.offsetX);
					}

				// If tile outside bounds on the right only
				} else if (tilePos.x + tileWidth > x + spec.camera.offsetX + spec.camera.width) {
					spec.sourceX = 0;
					spec.destX = tilePos.x + x - spec.camera.offsetX;
					spec.sourceWidth = spec.camera.width + spec.camera.offsetX - (tilePos.x + x);
//BLOCKS.debug(collection.name + ": If tile outside bounds on the right only: sourceX: " + spec.sourceX + ", sourceWidth: " + spec.sourceWidth + ", x: " + x +", tilePos.x: " + tilePos.x + ", spec.camera.x: " + spec.camera.x);
				// If tile is inside bounds on the left and right
				} else {
					spec.sourceX = 0;
					spec.destX = x - spec.camera.offsetX + tilePos.x;
					spec.sourceWidth = tileWidth;

//BLOCKS.debug(collection.name + ": If tile inside horizontal bounds: sourceX: " + spec.sourceX + ", sourceWidth: " + spec.sourceWidth + ", x: " + x +", tilePos.x: " + tilePos.x + ", spec.camera.x: " + spec.camera.x);
				}
				
				// If tile outside bounds on the top (maybe bottom too)
				if (tilePos.y + y + spec.camera.offsetY < 0) {

					spec.sourceY = -tilePos.y - y + spec.camera.offsetY;
					spec.destY = 0;
					
					// If outside bounds on the bottom too
					if (tilePos.y + tileHeight > spec.camera.height) {
						spec.sourceHeight = spec.camera.height;
					// If outside bounds on the top but not the bottom
					} else {
						spec.sourceHeight = tileHeight - tilePos.y;
					}

//BLOCKS.debug(collection.name + "(" + spec.id + "): If tile outside bounds on the top: sourceY: " + spec.sourceY + ", sourceHeight: " + spec.sourceHeight + ", y: " + y +", tilePos.y: " + tilePos.y + ", spec.camera.y: " + spec.camera.y);

				// If tile outside bounds on the bottom only
				} else if (tilePos.y + tileHeight > y + spec.camera.offsetY + spec.camera.height) {
					
					spec.sourceY = 0;
					spec.destY = tilePos.y + y - spec.camera.offsetY;
					spec.sourceHeight = spec.camera.height + spec.camera.offsetY - (tilePos.y + y);
					
//BLOCKS.debug(collection.name + ": If tile outside bounds on the bottom: destY: " + spec.destY);
					
				// If tile is inside bounds on the top and bottom
				} else {
	
					spec.sourceY = 0;
					spec.destY = y - spec.camera.offsetY + tilePos.y;
					spec.sourceHeight = tileHeight;
//BLOCKS.debug(collection.name + ": If tile inside vertical bounds: destY: " + spec.destY);
				}
				
				spec.destWidth = spec.sourceWidth;
				spec.destHeight = spec.sourceHeight;
	
//BLOCKS.debug(spec.id + ": " + spec.sourceWidth + ", x: " + x + ", spec.sourceX: " + spec.sourceX + ", spec.destX: " + spec.destX);
//BLOCKS.debug(spec.id + " > spec.sourceHeight: " + spec.sourceHeight + ", y: " + y + ", spec.sourceY: " + spec.sourceY + ", spec.destY: " + spec.destY);
	
				if (spec.sourceWidth && spec.sourceHeight) {
			
					collection.layer.ctx.drawImage(
						spec.image,
						spec.sourceX,
						spec.sourceY,
						spec.sourceWidth,
						spec.sourceHeight,
						spec.destX / layer.scale,
						spec.destY / layer.scale, 
						spec.destWidth / layer.scale,
						spec.destHeight / layer.scale
					);
				}
			} else {
			
				// If an image is loaded for the first tile
				if (options.tiles[0].image) {
					tileWidth = options.tiles[0].image.width;
					tileHeight = options.tiles[0].image.height;
				}	
			}
		};
		
	options = options || {};
	
	// Public Methods
	collection.update = function () {
	
	};
	
	collection.render = function (e) {
		
		var i, j, minColIndex, maxColIndex, minRowIndex, maxRowIndex, col, row, previousAlpha;

		if (dirty && visible) {
			
			previousAlpha = collection.layer.ctx.globalAlpha;
			collection.layer.ctx.globalAlpha = alpha;
			
			minColIndex = Math.floor((e.camera.x * speed - x) / tileWidth);
			if (loopX) {
//BLOCKS.debug("minColIndex: " + minColIndex);
				maxColIndex = Math.ceil((e.camera.x + e.camera.width + e.camera.offsetX) / tileWidth) - 1;
//BLOCKS.debug("maxColIndex: " + maxColIndex);
//BLOCKS.debug(Math.floor((e.camera.x * speed - x) / tileWidth) + " -      " + minColIndex + " > " + maxColIndex + "    - " + tileIndexArray[0].length);
			} else {
				maxColIndex = Math.floor((e.camera.x * speed + e.camera.width + e.camera.offsetX) / tileWidth);
			}			
			minRowIndex = Math.floor((e.camera.y * speed - y) / tileHeight);
			maxRowIndex = Math.floor((e.camera.y * speed - y + e.camera.height + e.camera.offsetY) / tileHeight);
			
			for (i = minColIndex; i <= maxColIndex; i += 1) {
				for (j = minRowIndex; j <= maxRowIndex; j += 1) { 

					// Enable looping					
					if (loopX && tileIndexArray[j]) {
						//BLOCKS.debug("(" + i + ", " + j + "): " + i + " >=" + tileIndexArray[j].length);
						if (i >= tileIndexArray[j].length) {
							col = i % tileIndexArray[j].length;
					//BLOCKS.debug(j + ": minColIndex out of range: " + minColIndex + ", " + i + " > " + col);
						} else {
							col = i;
					//BLOCKS.debug(j + ": minColIndex in range: " + i);
						}
					} else {
						col = i;	
					}
					row = j;
					
					if (tileIndexArray && tileIndexArray[row] && tileIndexArray[row][col]) {
					
						
						drawTile({
							id: tileIndexArray[row][col],
							row: j,
							column: i,
							camera: {
								x: e.camera.x,
								y: e.camera.y,
								offsetX: e.camera.offsetX,
								offsetY: e.camera.offsetY,
								width: e.camera.width,
								height: e.camera.height
							}
						});
					}
				}
			}
			
			collection.layer.ctx.globalAlpha = previousAlpha;
		}
		dirty = false;
	};
	
	collection.show = function () {
	
		collection.visible = true;
	};
	
	collection.hide = function () {
	
		collection.visible = false;
	};
	
	collection.isPointInside = function (pos) {
	
		var i;
		
		for (i = 0; i < visibleTiles.length; i += 1) {
			if (visibleTiles[i].visible && visibleTiles[i].isPointInside(pos)) {
				return true;
			}
		}
		
		return false;
	};
	
	collection.motorize = function (motor) {
	
		motor.addEventListener("destroyed", motorDestroyed);
		motors.push(motor);
	};
	
	collection.removeMotors = function (type) {
		
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
	
	collection.destroy = function () {
	
		var i;
		
		for (i = 0; i < visibleTiles.length; i += 1) {
			visibleTiles[i].destroy();
		}
		visibleTiles = [];
		collection = null;
	};
	
	Object.defineProperty(collection, "dirty", {
		get: function () {
			return dirty;
		},
		set: function (value) {
			if (dirty !== value) {
				dirty = value;
			}
		}
	});
	
	alpha = options.alpha || 1;
	Object.defineProperty(collection, "alpha", {
		get: function () {
			return alpha !== undefined ? alpha : 1;
		},
		set: function (value) {
			if (alpha !== value) {
				
				// Round the alpha value if it is really close
				if (value < 0.0001) {
					value = 0;
				} else if (value > 0.9999) {
					value = 1;
				}
				alpha = value;
				
				dirty = true;
			}
		}
	});
	
	Object.defineProperty(collection, "width", {
		get: function () {
			return tileIndexArray[0].length * tileWidth;
		}
	});
	
	Object.defineProperty(collection, "height", {
		get: function () {
			return tileIndexArray.length * tileHeight;
		}
	});
	
	x = options.x || 0;
	Object.defineProperty(collection, "x", {
		get: function () {
			return x;
		},
		set: function (value) {
			if (x !== value) {
				x = value;
				dirty = true;
			}
		}
	});
	
	y = options.y || 0;
	Object.defineProperty(collection, "y", {
		get: function () {
			return y;
		},
		set: function (value) {
			if (y !== value) {
				y = value;
				dirty = true;
			}
		}
	});
	
	layer = options.layer;
	Object.defineProperty(collection, "layer", {
		get: function () {
			return layer;
		},
		set: function (value) {
			if (layer !== value) {
				layer = value;
				dirty = true;
			}
		}
	});
	
	visible = options.visible || true;
	Object.defineProperty(collection, "visible", {
		get: function () {
			return visible;
		},
		set: function (value) {
			if (visible !== value) {
				visible = value;
				dirty = true;
			}
		}
	});
	
	speed = options.speed || 1;
	Object.defineProperty(collection, "speed", {
		get: function () {
			return speed;
		},
		set: function (value) {
			if (speed !== value) {
				speed = value;
			}
		}
	});
	
	loopX = options.loopX;
	Object.defineProperty(collection, "loopX", {
		get: function () {
			return loopX;
		},
		set: function (value) {
			if (loopX !== value) {
				loopX = value;
			}
		}
	});
	
	Object.defineProperty(collection, "tileWidth", {
		get: function () {
			return tileWidth;
		}
	});
	
	Object.defineProperty(collection, "tileHeight", {
		get: function () {
			return tileHeight;
		}
	});
	
	init();
	
	return collection;
};
/*
Copyright (c) 2013 William Malone (www.williammalone.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*global window, document */

var BLOCKS;

if (BLOCKS === undefined) {
	BLOCKS = {};
}

BLOCKS.toolbox = {};

BLOCKS.toolbox.angle = function (p1, p2) {

	"use strict";

	var angle,
		dx = p2.x - p1.x,
		dy = p2.y - p1.y;

	if (dx === 0) {
		angle = dy > 0 ? Math.PI / 2 : -Math.PI / 2;
	} else {
		// Quadrant 1
		angle = Math.atan(dy / dx);
		
		if (dy > 0) {
			if (dx < 0) {
				// Quadrant 2
				angle = Math.PI + angle;
			}
		} else {
			
			if (dx < 0) {
				// Quadrant 3
				angle = Math.PI + angle;
			} else {
				// Quadrant 4
				angle = 2 * Math.PI + angle;
			}
		}
	}
	
	return angle;
};

BLOCKS.toolbox.randomizeArr = function (arr) {

	var i, j, k;
	
	for (i = arr.length; i; j = parseInt(Math.random() * i, 10), k = arr[--i], arr[i] = arr[j], arr[j] = k) {
		// Loop until randomized
	}
};

BLOCKS.toolbox.isPointInsideRect = function (point, rect) {

	return (point.x > rect.x && point.x < rect.x + rect.width && point.y > rect.y && point.y < rect.y + rect.height);
};

BLOCKS.toolbox.isRectInsideRect = function (rect1, rect2) {

	return (rect1.x + rect1.width > rect2.x && 
		rect1.x < rect2.x + rect2.width && 
		rect1.y + rect1.height > rect2.y && 
		rect1.y < rect2.y + rect2.height);
};

BLOCKS.toolbox.dist = function (p1, p2) {
	
	"use strict";
	
	var dx = p1.x - p2.x,
		dy = p1.y - p2.y;
		
	return Math.sqrt(dx * dx + dy * dy);
};

BLOCKS.toolbox.vector = function (x, y) {
	
	var vector = {
		x: x,
		y: y
	};
	
	vector.scale = function(factor) {
	
		vector.x *= factor;
		vector.y *= factor;
		return vector;
	};
	
	vector.normalize = function () {
	
		return vector.scale(1 / vector.magnitude());
	};
	
	vector.magnitude = function () {
	
		return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
	};

	return vector;
};

BLOCKS.toolbox.sum = function(p1, p2) {
	return {
		x: p1.x + p2.x,
		y: p1.y + p2.y
	};
};

BLOCKS.toolbox.diff = function(p1, p2) {

	return {
		x: p1.x - p2.x,
		y: p1.y - p2.y
	};
};

BLOCKS.toolbox.dot = function (p1, p2) {
	return p1.x * p2.x + p1.y * p2.y;
};
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

BLOCKS.log = function (message) {
			
	if (window.console) {
		if (window.console.log) {
			window.console.log(message);
		}
	}
};
		
BLOCKS.warn = function (message) {
	
	if (window.console) {
		if (window.console.warn) {
			window.console.warn(message);
		} else if (window.console.log) {
			window.console.log(message);
		}
	}
};
	
BLOCKS.debug = function (message) {
		
	if (window.console) {
		if (window.console.debug) {
			window.console.debug(message);
		} else if (window.console.log) {
			window.console.log(message);
		}
	}
};

BLOCKS.error = function (message) {
		
	if (window.console) {
		if (window.console.error) {
			window.console.error(message);
		} else if (window.console.log) {
			window.console.log(message);
		}
	}
};

BLOCKS.dir = function (obj) {
		
	if (window.console) {
		if (window.console.dir) {
			window.console.dir(obj);
		} else if (window.console.log) {
			window.console.log(obj);
		}
	}
};

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
		x, y, width, height, offsetX, offsetY, angle, scale, alpha, visible, layer, hotspots, minHotspot, stack, centerRegistrationPoint,
		
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
		
		scale = options.scale !== undefined ? options.scale : 1;
		Object.defineProperty(view, "scale", {
			get: function () {
				return scale;
			},
			set: function (value) {
				if (scale !== value) {
					view.dirty = true;
					scale = value;
				}
			}
		});
		
		width = options.width || 0;
		Object.defineProperty(view, "width", {
			get: function () {
				return width * view.scale;
			},
			set: function (value) {
				if (width !== view.scale ? value / view.scale : value) {
					view.dirty = true;
					width = view.scale ? value / view.scale : value;
				}
			}
		});
		
		height = options.height || 0;
		Object.defineProperty(view, "height", {
			get: function () {
				return height * view.scale;
			},
			set: function (value) {
				if (height !== view.scale ? value / view.scale : value) {
					view.dirty = true;
					height = view.scale ? value / view.scale : value;
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
/**
*  keyboard.js
*  _____________________________________________________________________________
*  
*  @author William Malone (www.williammalone.com)
*/

/*global window, BLOCKS, Image */

BLOCKS.key = function (spec) {

	
	"use strict";
	
	var key = BLOCKS.eventDispatcher();
	
	key.name = spec.name;
	key.keyCode = spec.keyCode;
	key.layer = spec.layer;
	key.x = spec.x || 0;
	key.y = spec.y || 0;
	key.width = spec.width || 80;
	key.height = spec.height || 80;
	key.scale = spec.scale || 1;
	key.visible = spec.visible || false;
	key.alpha = spec.alpha || 1;
	key.color = spec.color || "#333";
	key.textColor = spec.textColor || "#eee";
	key.dirty = true;
	
	key.update = function () {
	
	};
	
	key.render = function () {
	
		if (key.dirty && key.visible) {
		
			key.layer.ctx.save();
			
			// Draw key background
			key.layer.ctx.globalAlpha = key.alpha;
			key.layer.ctx.fillStyle = key.color;
			key.layer.ctx.fillRect(key.x, key.y, key.width, key.height);
			
			// Draw key name
			key.layer.ctx.fillStyle = key.textColor;
			key.layer.ctx.font = "bold 24px sans-serif";
			key.layer.ctx.textAlign = "center";
			key.layer.ctx.fillText(key.name, key.x + key.width / 2, key.y + key.height / 2 + 7);
				
			key.layer.ctx.restore();
		}
	};
	
	key.destroy = function () {
	
		key = null;
	};
		
	return key;
};

BLOCKS.virtualKeyboard = function (controller, spec) {
	
	"use strict";
	
	var keyboard = BLOCKS.eventDispatcher(),
		layer = spec.layer,
		keySpec = [
			[{
				name: "1",
				keyCode: 49
			}, {
				name: "2",
				keyCode: 50
			}, {
				name: "3",
				keyCode: 51
			}, {
				name: "4",
				keyCode: 52
			}, {
				name: "5",
				keyCode: 53
			}, {
				name: "6",
				keyCode: 54
			}, {
				name: "7",
				keyCode: 55
			}, {
				name: "8",
				keyCode: 56
			}, {
				name: "9",
				keyCode: 57
			}, {
				name: "0",
				keyCode: 48
			}]/*,
			[{
				name: "space",
				keyCode: 32,
				scale: 5
			}]*/
		],
		keys = [],
	
		init = function () {
		
			var i, j, key, margin = 20, padding = 20;
			
			// If any custom keys
			if (spec.customKeys) {
				for (i = 0; i < spec.customKeys.length; i += 1) {
					keySpec.push(spec.customKeys[i]);
				}
			}
			
			for (i = 0; i < keySpec.length; i += 1) {
			
				for (j = 0; j < keySpec[i].length; j += 1) {
			
					keySpec[i][j].layer = layer;
					key = BLOCKS.key(keySpec[i][j]);
					
					key.width = (key.width * key.scale);
					if (key.scale < 1) {
						key.width += (key.scale - 1) * (padding * j);
					}
					
					key.x = keyboard.x + margin + key.width * j;
					if (j <= keySpec[i].length - 1) {
						key.x += padding * j;
					}
					key.y = keyboard.y + margin + key.height * i;
					if (i <= keySpec.length - 1) {
						key.y += padding * i;
					}
					
					keys.push(key);
				}
			}
		};
	
	keyboard.x = spec.x || 0;
	keyboard.y = spec.y || 0;
	keyboard.width = spec.width || 640;
	keyboard.height = spec.height || 480;
	keyboard.dirty = false;
	keyboard.alpha = 0.8;
	keyboard.visible = false;
		
	keyboard.update = function () {

		var i;
		
		for (i = 0; i < keys.length; i += 1) {
			keys[i].update();
		}
	},
	
	keyboard.render = function () {
	
		var i;
		
		if (keyboard.dirty) {

			layer.clear();
			
			// Set all the keys dirty
			for (i = 0; i < keys.length; i += 1) {
				keys[i].visible = keyboard.visible;
				keys[i].dirty = true;
			}

			if (keyboard.visible) {
				// Draw background
				layer.ctx.save();
				layer.ctx.globalAlpha = keyboard.alpha;
				layer.ctx.fillStyle = "white";
				layer.ctx.fillRect(keyboard.x, keyboard.y, keyboard.width, keyboard.height);
				layer.ctx.restore();
			}
			keyboard.dirty = false;
		}
		
		for (i = 0; i < keys.length; i += 1) {
			keys[i].render();
		}
	};
	
	keyboard.destroy = function () {
	
		var i;
		
		for (i = 0; i < keys.length; i += 1) {
			keys[i].destroy();
		}
	};
	
	keyboard.onTap = function (pos) {
	
		var i;
		
		if (keyboard.visible) {
		
			for (i = 0; i < keys.length; i += 1) {
				if (BLOCKS.toolbox.isPointInsideRect(pos, keys[i])) {
				
					controller.simulateKeyDownEvent(keys[i].keyCode);
					break;
				}
			}
		}
	
		keyboard.visible = false;
		keyboard.dirty = true;
	};
	
	init();
			
	return keyboard;
};