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