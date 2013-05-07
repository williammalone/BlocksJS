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
	
	var that = {},
	
		// Private Properties
		slices = [];
	
	// Public Properties
	//that.width;
	//that.height;
	that.x = 0;
	that.y = 0;
	
	// Public Methods
	that.update = function () {
		
		var i;
		
		for (i = 0; i < slices.length; i += 1) {
			slices[i].update();
		}
	};
	
	that.render = function () {
		
		var i;
		
		for (i = 0; i < slices.length; i += 1) {
			slices[i].render();
		}
	};
	
	that.addSlice = function (options) {
		slices.push(BLOCKS.slice(options));	
	};
	
	(function () {

	}());
	
	return that;
};