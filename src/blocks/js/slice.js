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

BLOCKS.slice = function (options) {
	
	"use strict";
	
	var that = {},
	
		// Private Properties
		numberOfFrames = options.numberOfFrames || 1,
		curFrameIndex = 0,
		context = options && options.layer && options.layer.ctx,
		imageResource,
	
		// Private Methods
		onResourceLoaded = function () {
			
			// Set the sprite dimensions to the image dimensions
			//     Note: Divide the width by the number of frames in the sprite sheet if an animation.
			//     If the sprite is only an image then the number of frames will be 1.
			that.width = imageResource.image.width / numberOfFrames;
			that.height = imageResource.image.height;
		};
	
	// Public Properties
	that.width;
	that.height;
	that.x = 0;
	that.y = 0;
	
	// Public Methods
	that.update = function () {
		
		// If the sprite is an animation
		if (numberOfFrames > 1) {
			
			// If the current frame is the last frame
			if (curFrameIndex >= numberOfFrames - 1) {
				
				// Reset the frame back to the first frame
				curFrameIndex = 0;
			} else {
				// Go to the next frame
				curFrameIndex += 1;
			}
		}
		
		// Go to the next frame in the animation
	};
	
	that.render = function () {
		
		// If the sprite is an animation
		if (numberOfFrames > 1) {
			
			// ClearRect method approach crashes native browser in Droid Samsung Gt-P3113
			context.clearRect(0, 0, that.width, that.height);
			context.drawImage(
				imageResource.image,
				Math.floor(curFrameIndex * that.width),
				0,
				that.width, 
				that.height,
				0,
				0, 
				that.width,
				that.height
			);
		// If the sprite is not an animation
		} else {
			context.drawImage(imageResource.image, 0, 0, that.width, that.height);
		}
	};
	
	(function () {
		
		var image = options.image,
			imageSrc = options.imageSrc || (options.image && options.src),
			imagePreloaded = options.imagePreloaded || false;
		
		imageResource = {
			image: image,
			imageSrc: imageSrc,
			loaded: imagePreloaded
		};
		
		// If the image is already loaded
		if (imageResource.loaded) {
			onResourceLoaded();	
		} else {
			
			// If there is no image object
			if (!imageResource.image) {
				// Instantiate a new image
				imageResource.image = new Image();
			}
			imageResource.image.addEventListener("load", onResourceLoaded);
			imageResource.image.src = imageResource.imageSrc;
		}
	}());
	
	return that;
};