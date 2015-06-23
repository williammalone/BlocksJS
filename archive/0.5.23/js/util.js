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
