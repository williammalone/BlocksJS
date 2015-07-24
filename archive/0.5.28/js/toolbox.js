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