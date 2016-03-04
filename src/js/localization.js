/*
Copyright (c) 2015 William Malone (www.williammalone.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*global navigator */

var BLOCKS;

if (BLOCKS === undefined) {
	BLOCKS = {};
}

BLOCKS.localization = function (options) {
	
	"use strict";
	
	var localization = BLOCKS.eventDispatcher(),
		autoDetect,
		currentLanguage;
		
	if (!options) {
		options = {};	
	}
	
	currentLanguage = "english";
	Object.defineProperty(localization, "language", {
		get: function () {
			
			if (currentLanguage && !autoDetect) {
				return currentLanguage;
			}
			
			if (autoDetect) {
				return navigator.language;
			}
		},
		set: function (value) {
			currentLanguage = value;
		}
	});
	
	//Object.defineProperty(localization, "languageCode", {
	//	get: function () {
	//		if (autoDetect) {
	//			return navigator.language;
	//		}
	//		return currentLanguage;
	//	},
	//	set: function (value) {
	//		autoDetect = Boolean(value);
	//	}
	//});
	
	autoDetect = options.autoDetect || false;
	Object.defineProperty(localization, "autoDetect", {
		get: function () {
			return autoDetect;
		},
		set: function (value) {
			autoDetect = Boolean(value);
		}
	});
	
	return localization;
};