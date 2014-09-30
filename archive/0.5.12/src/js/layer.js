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
	layer.x = options && options.x;
	layer.y = options && options.y;
	
	// Public Methods
	layer.clear = function () {
		
		if (layer.webGLEnabled) {
		
			layer.ctx.colorMask(true, true, true, true);
			layer.ctx.clearColor(0, 0, 0, 0);
			layer.ctx.clear(layer.ctx.COLOR_BUFFER_BIT);
			
		} else {
			// Not using clear rect due to Samsung render issues
			//layer.ctx.clearRect(0, 0, layer.ctx.canvas.width, layer.ctx.canvas.height);
			canvasElement.width = canvasElement.width;
		}
		
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
		
		canvasElement = document.createElement("canvas");
		canvasElement.width = width;
		canvasElement.height = height;
		canvasElement.className = "BlocksCanvas";
		canvasElement.style.zIndex = zIndex;
		if (layer.name) {
			canvasElement.id = "BlocksCanvas_" + layer.name;
		}
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

		if (false && options.enableWebGL) {
			try {
				layer.ctx = canvasElement.getContext("webgl") || canvasElement.getContext("experimental-webgl");
			} catch(e) {}
		}
		
		if (layer.ctx) {
			layer.webGLEnabled = true;
		} else {
			layer.webGLEnabled = false;
			layer.ctx = canvasElement.getContext("2d");
		}
	}());

	return layer;
};