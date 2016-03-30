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
				if (controller.stopPropagation) {
					e.stopPropagation();
				}

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
	controller.stopPropagation = true;
		
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