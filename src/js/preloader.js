/*
Copyright (c) 2013 William Malone (www.williammalone.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*global window, document, Image, HTMLElement, navigator */

var BLOCKS;

if (BLOCKS === undefined) {
	BLOCKS = {};
}

BLOCKS.preloader = function (path) {
	
	"use strict";
	
	var preloader = BLOCKS.eventDispatcher(),
		imageList = [],
		imagesLoaded,
		iOS = /iPad|iPhone|iPod/.test(navigator.userAgent),
	
		// Private Methods
		imageLoaded = function () {
		
			imagesLoaded += 1;
			
			preloader.dispatchEvent("update", {
				loaded: imagesLoaded,
				total: imageList.length
			});
			
			if (imagesLoaded === imageList.length) {
				preloader.dispatchEvent("complete");
			}
		},

		traverse = function (obj, callback) {
			
			var key, i;
		
			for (key in obj) {

				if (obj.hasOwnProperty(key) && !(obj[key] instanceof HTMLElement)) {
   
					callback.apply(this, [key, obj]);
					if (obj[key] instanceof Object && !(obj[key] instanceof Array)) {
						traverse(obj[key], callback);
					} else if (obj[key] instanceof Array) {
						for (i = 0; i < obj[key].length; i += 1) {
							traverse(obj[key][i], callback);
						}
					}
				}
			}
		};

	// Public Properties
	preloader.path = path || "";

	// Public Methods
	preloader.load = function () {
	
		var i;
		
		imagesLoaded = 0;
		
		for (i = 0; i < imageList.length; i += 1) {
		
			// If image not already loaded
			if (!imageList[i].loadStarted) {
				imageList[i].loadStarted = true;
				imageList[i].image.addEventListener("load", imageLoaded);
				imageList[i].image.src = preloader.path + imageList[i].src;
			}
		}
	};
	
	preloader.loadFromTree = function (spec) {
	
		traverse(spec, function (key, obj) {
			if (key === "src") {
				preloader.add(obj);
			}
		});
	};
	
	preloader.add = function (spec) {
	
		var i, obj;
		
		if (!iOS) {
			if (spec.src.toLowerCase().indexOf("pvr") !== -1) {
				spec.src = spec.src.slice(0, -4) + ".png";
			}
		}
		
		if (spec && spec.src && (spec.src.toLowerCase().indexOf("jpg") !== -1 || spec.src.toLowerCase().indexOf("png") !== -1 || spec.src.toLowerCase().indexOf("pvr") !== -1)) {
		
			// Check if the image is already in the list
			for (i = 0; i < imageList.length; i += 1) {
				if (imageList[i].src === spec.src) {
					
					spec.image = imageList[i].image;
					// Image already in list, so no need to add it again
					return imageList[i];
				}
			}
			
			obj = {
				image: new Image(),
				src: spec.src,
				loadStarted: false
			};
			spec.image = obj.image;
			
			if (spec.crossOrigin !== undefined) {
				spec.image.crossOrigin = spec.crossOrigin;
			}
			imageList.push(obj);
			return obj;
		}
	};
	
	preloader.loadNow = function (spec) {
	
		var image;
		
		image = new Image();
		if (spec.crossOrigin !== undefined) {
			image.crossOrigin = spec.crossOrigin;
		}
		image.src = preloader.path + spec.src;
		
		return image;
	};
	
	preloader.getNumFiles = function () {
	
		return imageList.length;
	};
	
	preloader.getNumFilesLoaded = function () {
	
		return imagesLoaded;
	};
	
	preloader.isLoaded = function () {
	
		return (imagesLoaded >= imageList.length);
	};
	
	return preloader;
};