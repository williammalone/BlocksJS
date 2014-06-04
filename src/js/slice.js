/*
Copyright (c) 2013 William Malone (www.williammalone.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*global window, document, Image, Float32Array */

var BLOCKS;

if (BLOCKS === undefined) {
	BLOCKS = {};
}

BLOCKS.slice = function (options) {
	
	"use strict";
	
	var slice = BLOCKS.eventDispatcher(),
	
		// Private Properties
		curFrameIndex = 0,
		imageResource,
		paused = false,
		frameCnt = 0,
		resetOnComplete = options && options.resetOnComplete,
		loopIndex = 0,
		texture,
		centerRegistrationPoint = options && options.centerRegistrationPoint,
		drawBounds = false, // This is used for debug only
		tmpCtx, // Used when colorizing

		// Private Methods
		onResourceLoaded = function () {
		
			// Will be used for webGL enabled contexts
			//if (slice.layer && slice.layer.webGLEnabled) {
			//	prepareWebGLContext(slice.layer.ctx);
			//}
			
			// Set the sprite dimensions to the image dimensions  
			// Note: Divide the width by the number of frames in the sprite sheet if an animation. If the sprite is only an image then the number of frames will be 1.
			
			if (imageResource) {
				slice.width = imageResource.image.width / slice.numberOfFrames;
				slice.height = imageResource.image.height;
			}
			
			// If the registration point should be centered
			if (centerRegistrationPoint) {
				slice.offsetX = -slice.width / 2;
				slice.offsetY = -slice.height / 2;
			}
		};
	
	// Public Properties
	slice.name = (options && options.name !== undefined) ? options.name : undefined;
	slice.width = (options && options.width) || 0;
	slice.height = (options && options.height) || 0;
	slice.x = 0;
	slice.y = 0;
	slice.offsetX = (options && options.offsetX) || 0;
	slice.offsetY = (options && options.offsetY) || 0;
	slice.frameOffsetX = (options && options.frameOffsetX) || 0;
	slice.frameOffsetY = (options && options.frameOffsetY) || 0;
	slice.loop = options && options.loop;
	slice.visible = true;
	slice.dirty = true;
	slice.hotspots = options && options.hotspots;
	slice.minHotspot = options && options.minHotspot;
	slice.layer = options && options.layer;
	slice.cropWidth = (options && options.cropWidth);
	slice.cropHeight = (options && options.cropHeight);
	slice.frameDelay = (options && options.frameDelay !== undefined) ? options.frameDelay : 4;
	slice.numberOfFrames = (options && options.numberOfFrames) || 1;
	slice.autoPlay = (options && options.autoPlay !== undefined) ? options.autoPlay : true;
	slice.angle = (options && options.angle);
	slice.alpha = (options && options.alpha) || 1;
	slice.scale = (options && options.scale) || 1;
	
	// Public Methods
	slice.update = function () {
		
		if (!paused) {
		
			// If the slice has an image associated with it
			if (imageResource) {

				// If the sprite is an animation
				if (slice.numberOfFrames > 1) {
				
					frameCnt += 1;
	
					// If the current frame is the last frame
					if (curFrameIndex >= slice.numberOfFrames - 1) {
						
						if (frameCnt >= slice.frameDelay) {
						
							frameCnt = 0;
							loopIndex += 1;
							
							if (slice.loop === true || (typeof slice.loop === "number" && loopIndex < slice.loop)) {
								// Reset the frame back to the first frame
								curFrameIndex = 0;
								slice.dirty = true;
							
							} else {
							
								if (resetOnComplete) {
									// Reset the frame back to the first frame
									curFrameIndex = 0;
									slice.dirty = true;
								}
								paused = true;
								slice.dispatchEvent("complete");
							}
						}
					} else {
	
						if (frameCnt >= slice.frameDelay) {
							// Go to the next frame
							curFrameIndex += 1;
							frameCnt = 0;
							
							slice.dirty = true;
						}
					}
				}
			}
		}
		
		// Go to the next frame in the animation
	};
	
	slice.pause = function () {
		paused = true;
	};
	
	slice.unpause = function () {
		paused = false;
	};
	
	slice.reset = function () {
		
		if (frameCnt !== 0 || curFrameIndex !== 0 || loopIndex !== 0) {
			slice.dirty = true;
		}
		frameCnt = 0;
		curFrameIndex = 0;
		loopIndex = 0;
	};
	
	slice.stop = function () {
		paused = true;
		slice.reset();
	};
	
	slice.play = function () {
		
		// If on the last frame then start over
		if (curFrameIndex >= slice.numberOfFrames - 1) {
			slice.stop();
		}
		paused = false;
	};
	
	slice.render = function () {
	
		var i, bounds, restoreNeeded, context;
		
		// Prevent alpha from being negative
		if (slice.alpha < 0) {
			slice.alpha = 0;
		} else if (slice.alpha > 1) {
			slice.alpha = 1;
		}
		
		if (slice.dirty && slice.visible && slice.alpha !== 0 && slice.cropWidth !== 0 && slice.cropHeight !== 0) {

			// If the slice has an image associated with it
			if (imageResource) {
			
				context = slice.layer.ctx;
			
				// Using webGL
				if (slice.layer && slice.layer.webGLEnabled) {
				
					//context.bindTexture(context.TEXTURE_2D, texture);
				
					//setBufferData(
					//	slice.x, 
					//	slice.y, 
					//	slice.cropWidth || slice.width, 
					//	slice.cropHeight || slice.height);
						
					//context.drawArrays(context.TRIANGLES, 0, 6);
					
					//context.bindTexture(context.TEXTURE_2D, null);
					
				// Using 2d Canvas
				} else {
			
					if (slice.angle || slice.alpha !== 1 || slice.colorize) {
						context.save();
						restoreNeeded = true;
					}
					
					if (slice.alpha !== 1) {
						context.globalAlpha = slice.alpha;
					}
					
					if (slice.angle) {
						context.translate(slice.x, slice.y);
						context.rotate(slice.angle * Math.PI / 180);
						context.translate(-slice.x, -slice.y);
					}
					
					if (slice.colorize) {
						if (!tmpCtx) {
							tmpCtx = document.createElement("canvas").getContext("2d");
							tmpCtx.canvas.width = context.canvas.width;
							tmpCtx.canvas.height = context.canvas.height;
						}
						context = tmpCtx;
						context.globalCompositeOperation = "copy";
					}

					// If the sprite is an animation
					if (slice.numberOfFrames > 1) {
						context.drawImage(
							imageResource.image,
							curFrameIndex * slice.width + slice.frameOffsetX,
							slice.frameOffsetY,
							slice.cropWidth || slice.width, 
							slice.cropHeight || slice.height,
							slice.x + slice.offsetX,
							slice.y + slice.offsetY, 
							slice.cropWidth || slice.width * slice.scale, 
							slice.cropHeight || slice.height * slice.scale
						);
					// If the sprite is not an animation
					} else {
						context.drawImage(imageResource.image, 
							slice.frameOffsetX, 
							slice.frameOffsetY,
							slice.cropWidth || slice.width, 
							slice.cropHeight || slice.height,
							slice.x + slice.offsetX,
							slice.y + slice.offsetY, 
							slice.cropWidth || slice.width * slice.scale,
							slice.cropHeight || slice.height * slice.scale);
					}
					
					if (slice.colorize) {
						// Draw the color that should be overlayed over the image
						context.fillStyle = slice.colorize;
						context.globalCompositeOperation = "source-in";
						context.fillRect(slice.x, slice.y, slice.width, slice.height);
						context = slice.layer.ctx; // Change back from the temp context
						context.drawImage(tmpCtx.canvas, 0, 0);
					}
					
					if (restoreNeeded) {
						context.restore();
					}
				}
				
				if (drawBounds && context) {
					bounds = slice.getBounds();
					if (!bounds.length) {
						bounds = [bounds];
					}
					
					context.lineWidth = 4;
	
					for (i = 0; i < bounds.length; i += 1) {
					
						if (slice.dragging) {
							context.beginPath();
							context.fillStyle = "rgba(10, 255, 50, 0.4)";
							context.fillRect(bounds[i].x, bounds[i].y, bounds[i].width, bounds[i].height);
							context.closePath();
						} else if (slice.justTapped) {
							context.beginPath();
							context.fillStyle = "rgba(255, 10, 50, 0.4)";
							context.fillRect(bounds[i].x, bounds[i].y, bounds[i].width, bounds[i].height);
							context.closePath();
						} else if (slice.justNotTapped) {
							context.beginPath();
							context.fillStyle = "rgba(255, 10, 255, 0.4)";
							context.fillRect(bounds[i].x, bounds[i].y, bounds[i].width, bounds[i].height);
							context.closePath();
						} else if (slice.justReleased) {
							context.beginPath();
							context.fillStyle = "rgba(125, 10, 255, 0.4)";
							context.fillRect(bounds[i].x, bounds[i].y, bounds[i].width, bounds[i].height);
							context.closePath();
							slice.justReleased = false;
						}
					
						context.beginPath();
						context.strokeStyle = "rgba(96, 255, 0, 0.5)";
						context.strokeRect(bounds[i].x, bounds[i].y, bounds[i].width, bounds[i].height);
						context.closePath();
					}
					
					context.beginPath();
					context.arc(slice.x, slice.y, 7, 0, 2 * Math.PI, false);
					context.fillStyle = "rgba(96, 255, 0, 0.5)";
					context.fill();
				}
			}
		}
		slice.dirty = false;
	};
	
	slice.isPointInside = function (point) {
	
		var i,
			bounds = slice.getBounds(),
			collision = false;
	
		if (!point) {
			BLOCKS.warn("slice.isPointInside point is falsy: " + point);
			return;
		}
		
		if (!bounds.length) {
			bounds = [bounds];
		}
		
		for (i = 0; i < bounds.length; i += 1) {
			
			if (point.x >= bounds[i].x && point.x <= bounds[i].x + bounds[i].width && point.y >= bounds[i].y && point.y <= bounds[i].y + bounds[i].height) {
				
				collision = true;
				break;
			}
		}
		
		return collision;
	};
	
	// - boundingRectOnly returns only the bounding rectangle
	slice.getBounds = function (boundingRectOnly) {
		
		var i, bounds, extraWidth, extraHeight;

		if (boundingRectOnly || (!slice.hotspots && !slice.minHotspot)) {
			bounds =  {
				x: slice.x + slice.offsetX,
				y: slice.y + slice.offsetY,
				width: slice.width,
				height: slice.height
			};
		} else {
			bounds = [];
			if (slice.hotspots) {
				for (i = 0; i < slice.hotspots.length; i += 1) {
					bounds.push({
						x: slice.x + slice.offsetX + slice.hotspots[i].x,
						y: slice.y + slice.offsetY + slice.hotspots[i].y,
						width: slice.hotspots[i].width,
						height: slice.hotspots[i].height
					});
				}
			}
			if (slice.minHotspot) {
			
				extraWidth = slice.width < slice.minHotspot ? slice.minHotspot - slice.width : 0;
				extraHeight = slice.height < slice.minHotspot ? slice.minHotspot - slice.height : 0;

				bounds.push({
					x: slice.x + slice.offsetX - extraWidth / 2,
					y: slice.y + slice.offsetY - extraHeight / 2,
					width: slice.width + extraWidth,
					height: slice.height + extraHeight
				});
			}
			if (bounds.length === 1) {
				bounds = bounds[0];
			}
		}

		return bounds;
	};
	
	slice.isRectInside = function (rect) {
	
		var i, result, bounds;
			
		if (!rect) {
			BLOCKS.warn("slice.isRectangleInside rect is falsy: " + rect);
			return false;
		}

		bounds = slice.getBounds();	
		if (!bounds.length) {
			bounds = [bounds];
		}

		for (i = 0; i < bounds.length; i += 1) {

			if (rect.x + rect.width > bounds[i].x && 
				rect.x < bounds[i].x + bounds[i].width && 
				rect.y + rect.height > bounds[i].y && 
				rect.y < bounds[i].y + bounds[i].height) {
			
				result = true;
				break;
			}
		}
			
		return result;
	};
	
	slice.gotoLastFrame = function () {
	
		if (curFrameIndex !== slice.numberOfFrames - 1) {
			curFrameIndex = slice.numberOfFrames - 1;
			slice.dirty = true;
		}
	};
	
	slice.gotoFrame = function (frameIndex) {
	
		var newFrameCnt = Math.floor(slice.frameDelay * (frameIndex - Math.floor(frameIndex)) / 100);
		frameIndex = Math.floor(frameIndex);
	
		if (curFrameIndex !== frameIndex || frameCnt !== newFrameCnt) {
			curFrameIndex = frameIndex;
			frameCnt = newFrameCnt;
			slice.dirty = true;
		}
	};
	
	slice.show = function () {
	
		if (!slice.visible) {
			slice.dirty = true;
		}
		slice.visible = true;
	};
	
	slice.hide = function () {
	
		if (slice.visible) {
			slice.dirty = true;
		}
		slice.visible = false;
		
	};
	
	slice.destroy = function () {
	
		imageResource = null;
		options = null;
		slice = null;
	};
	
	(function () {
		
		var image = options.image,
			imageSrc = options.imageSrc || (options.image && options.src),
			imagePreloaded = image ? true : false;
			
		if (image || imageSrc) {
		
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
		} else {
			onResourceLoaded();	
		}
	}());
	
	return slice;
};