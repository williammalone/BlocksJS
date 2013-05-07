/*
Copyright (c) 2013 William Malone (www.williammalone.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var BLOCKS;

if (BLOCKS === undefined) {
	BLOCKS = {};
}

BLOCKS.layer = function (parentElement, options) {
	
	"use strict";
	
	var that = {},
		name = options && options.name;
	
	// Public Properties
	that.width = options && options.width;
	that.height = options && options.height;
	that.x = options && options.x;
	that.y = options && options.y;
	that.ctx;
	
	// Public Methods
	that.clear = function () {
		
		that.ctx.clearRect(0, 0, that.ctx.canvas.width, that.ctx.canvas.height);
		//that.ctx.canvas.width = that.ctx.canvas.width;
	};
	
	(function () {
		var canvasElement;
		
		canvasElement = document.createElement("canvas");
		canvasElement.width = that.width || 1000;
		canvasElement.height = that.height || 1000;
		canvasElement.className = "BlocksCanvas";
		canvasElement.id = that.name + "Canvas";
		
		that.ctx = parentElement.appendChild(canvasElement).getContext("2d");
	}());

	return that;
};