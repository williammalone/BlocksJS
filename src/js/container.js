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
		views = [];
	
	// Public Properties
	container.visible = true;
	container.dirty = true;
	container.layers = {};
	
	// Public Methods
	container.assignLayer = function (name) {
	
		var i, key, found;
		
		if (container.layers[name]) {
			BLOCKS.error("Layer already assigned to this container: " + name);
		} else {
			
			for (i = 0; i < game.layers.length; i += 1) {
			
				found = false;
				for (key in container.layers) {
					if (container.layers.hasOwnProperty(key)) {
						if (game.layers[i] === container.layers[key]) {
							found = true;
							break;
						}
					}
				}
				if (!found) {
					container.layers[name] = game.layers[i];
					return container.layers[name];
				}
			}
		}
	};
	
	container.addView = function (view) {
	
		views.push(view);
	};
	
	container.removeView = function (view) {
	
		var i;
		
		for (i = 0; i < views.length; i += 1) {
			
			if (view === views[i]) {
				views.splice(i, 1);
				break;
			}
		}
	};
	
	container.clear = function () {
	
		var key;
			
		for (key in container.layers) {
			if (container.layers.hasOwnProperty(key)) {
				container.layers[key].clear();
			}
		}
	};
	
	container.update = function () {
	
		var i;
	
		for (i = 0; i < views.length; i += 1) {
			views[i].update();
		}
	};
	
	container.render = function () {
	
		var i, key,
			dirtyLayers = {};
		
		if (container.visible) {
		
			for (i = 0; i < views.length; i += 1) {
				if (views[i].dirty || container.dirty || views[i].layer.dirty) {
					dirtyLayers[views[i].layer.name] = views[i].layer;
				}
			}
			
			for (key in dirtyLayers) {
				if (dirtyLayers.hasOwnProperty(key)) {
					dirtyLayers[key].clear();
				}
			}
		
			for (i = 0; i < views.length; i += 1) {
				if (dirtyLayers[views[i].layer.name]) {
					views[i].dirty = true;
				}
				views[i].render();
			}
		}
		
		container.dirty = false;
	};
		
	container.destroy = function () {
	
		var i;
		
		for (i = 0; i < views.length; i += 1) {
			views[i].destroy();
			views[i] = null;
		}
		views = null;
	};
	
	return container;
};