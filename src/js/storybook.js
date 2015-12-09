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

BLOCKS.storybook = function (options) {
	
	"use strict";
	
	var storybook = BLOCKS.eventDispatcher(),
	
		motors = [],
		
		// Private Method
		motorDestroyed = function (motor) {
			
			var i;
			
			motor.removeEventListener("destroyed", motorDestroyed);
			
			for (i = 0 ; i < motors.length; i += 1)  {
				motors.splice(i, 1);
				break;
			}
		};
		
	storybook.visible = true;
	
	// Public Methods
	storybook.render = function () {
	
		if (storybook.dirty && storybook.visible) {
		
		
		}
		storybook.dirty = false;
	};
		
	storybook.destroy = function () {
		
		storybook.stopMotors();
		options = null;
		storybook = null;
	};
	
	storybook.motorize = function (motor) {
	
		motor.addEventListener("destroyed", motorDestroyed);
		motors.push(motor);
	};
	
	storybook.stopMotors = function (type) {
		
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


	}());
	
	return storybook;
};