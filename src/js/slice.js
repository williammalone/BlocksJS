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
	
	var slice = BLOCKS.view(options),
	
		// Properties
		imageResource, frameWidth, frameHeight, paused, texture, tmpCtx, cropWidth, cropHeight, frameOffsetX, frameOffsetY, mirrorX, mirrorY,
		drawBounds = false,
		frameCnt = 0,
		loopIndex = 0,
		rowIndex = 0,
		colIndex = 0,
		curFrameIndex = 0,
		
		// Private Methods
		onResourceLoaded = function () {
		
			// Will be used for webGL enabled contexts
			//if (slice.layer && slice.layer.webGLEnabled) {
			//	prepareWebGLContext(slice.layer.ctx);
			//}
			
			// Set the sprite dimensions to the image dimensions  
			// Note: Divide the width by the number of frames in the sprite sheet if an animation. If the sprite is only an image then the number of frames will be 1.
		
			if (imageResource) {
				frameWidth = options.frameWidth ? options.frameWidth : imageResource.image.width / slice.numberOfColumns;
				frameHeight = options.frameHeight ? options.frameHeight : imageResource.image.height / slice.numberOfRows;
				slice.width = frameWidth;
				slice.height = frameHeight;
			}
		},
		
		drawImage = function (spec) {
		
			// These four conditions must exist to prevent the error in Firefox: IndexSizeError: Index or size is negative or greater than the allowed amount
			if (spec.sourceWidth > frameWidth) {
				spec.sourceWidth = frameWidth;
			}
			if (spec.sourceHeight > frameHeight) {
				spec.sourceHeight = frameHeight;
			}
			if (spec.destWidth > slice.width / slice.layer.scale) {
				spec.destWidth = slice.width / slice.layer.scale;
			}
			if (spec.destHeight > slice.height / slice.layer.scale) {
				spec.destHeight = slice.height / slice.layer.scale;
			}
			
//BLOCKS.debug("render: " + spec.image + ", " + spec.sourceX + ", " + spec.sourceY + ", " + spec.sourceWidth + ", " + spec.sourceHeight + ", " + spec.destX + ", " + spec.destY + ", " + spec.destWidth + ", " + spec.destHeight);	
		
			spec.ctx.drawImage(
				spec.image, 
				spec.sourceX, 
				spec.sourceY,
				spec.sourceWidth, 
				spec.sourceHeight,
				spec.destX, 
				spec.destY,
				spec.destWidth, 
				spec.destHeight
			);
		};
	
	slice.loop = options && options.loop;
	slice.frameDelay = (options && options.frameDelay !== undefined) ? options.frameDelay : 4;
	slice.numberOfFrames = (options && options.numberOfFrames) || 1;
	slice.numberOfRows = (options && options.numberOfRows) || 1;
	slice.numberOfColumns = (options && options.numberOfColumns) ? options.numberOfColumns : slice.numberOfFrames;
	slice.autoPlay = (options && options.autoPlay !== undefined) ? options.autoPlay : true;
	slice.resetOnComplete = (options && options.resetOnComplete !== undefined) ? options.resetOnComplete : true;
	
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
								rowIndex = 0;
								colIndex = 0;
								slice.dirty = true;
							
							} else {
							
								if (slice.resetOnComplete) {
									// Reset the frame back to the first frame
									curFrameIndex = 0;
									rowIndex = 0;
									colIndex = 0;
									slice.dirty = true;
								}
								paused = true;
								
								(function () {
								
									var callback;

									if (slice.callback) {
										// Save the callback in case the slice is destroyed after the complete event
										callback = slice.callback;
										slice.callback = null;
									}
									// Dispatch the complete event before any callback
									slice.dispatchEvent("complete");
									// If there is a callback then invoke it now
									if (callback) {
										callback();
									}
								}());
							}
						}
					// If the current frame is not the last frame
					} else {
	
						if (frameCnt >= slice.frameDelay) {
							

							// Go to the next frame
							curFrameIndex += 1;
							
							if (slice.numberOfColumns > 1) {
								if (curFrameIndex - rowIndex * slice.numberOfColumns === slice.numberOfColumns) {
									colIndex = 0;
									rowIndex += 1;
								} else {
									colIndex += 1;
								}
							}						
							
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
	
		slice.callback = null;
		
		if (frameCnt !== 0 || curFrameIndex !== 0 || loopIndex !== 0) {
			slice.dirty = true;
		}
		frameCnt = 0;
		curFrameIndex = 0;
		loopIndex = 0;
		rowIndex = 0;
		colIndex = 0;
	};
	
	slice.stop = function () {
	
		paused = true;
		slice.reset();
	};
	
	slice.play = function (callback) {
		
		// If on the last frame then start over
		if (curFrameIndex >= slice.numberOfFrames - 1) {
			slice.stop();
		}
		paused = false;
		
		// Assign an optional callback to be played once the animation is complete
		slice.callback = callback;
	};
	
	slice.render = function (e) {
	
		var i, bounds, boundingBox, restoreNeeded, context, cameraOffset, x, y, destCropWidth, destCropHeight;
		
		// Prevent alpha from being negative
		if (slice.alpha < 0) {
			slice.alpha = 0;
		} else if (slice.alpha > 1) {
			slice.alpha = 1;
		}
		
		if (slice.dirty && slice.visible && slice.alpha !== 0 && slice.cropWidth !== 0 && slice.cropHeight !== 0 && slice.scaleX !== 0 && slice.scaleY !== 0) {
		
			cameraOffset = {
				x: (e && e.camera && e.camera.offsetX) || 0,
				y: (e && e.camera && e.camera.offsetY) || 0
			};
			
			// Set local x and y to increases performance when slice is associated to a stack 
			x = slice.worldX;
			y = slice.worldY;

			// If the slice has an image associated with it
			if (imageResource) {
				
				if (slice.layer) {
			
					context = slice.layer.ctx;
					
					// Using webGL
					//if (slice.layer.webGLEnabled) {
					
						//context.bindTexture(context.TEXTURE_2D, texture);
					
						//setBufferData(
						//	x, 
						//	y, 
						//	slice.cropWidth || slice.width, 
						//	slice.cropHeight || slice.height);
							
						//context.drawArrays(context.TRIANGLES, 0, 6);
						
						//context.bindTexture(context.TEXTURE_2D, null);
						
					// Using 2d Canvas
					//} else {
				
						if (slice.angle || slice.alpha !== 1 || slice.colorize || slice.mirrorX || slice.mirrorY) {
							context.save();
							restoreNeeded = true;
						}
						
						context.globalAlpha = slice.alpha;
						
						if (slice.angle) {
							context.translate((x - cameraOffset.x) / slice.layer.scale, (y - cameraOffset.y) / slice.layer.scale);
														context.rotate(slice.angle * Math.PI / 180);
							context.translate((-x + cameraOffset.x) / slice.layer.scale, (-y + cameraOffset.y) / slice.layer.scale);
						}
						
						// Careful about performance when using mirroring
						if (slice.mirrorX || slice.mirrorY) {
							context.translate(x, y);
							if (slice.mirrorX && slice.mirrorY) {
								context.scale(-1, -1);
							} else if (slice.mirrorX) {
								context.scale(-1, 1);
							} else {
								context.scale(1, -1);
							}
							context.translate(-x, -y);
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
							drawImage({
								ctx: context,
								image: imageResource.image,
								sourceX: colIndex * slice.width / slice.scaleX + slice.frameOffsetX,
								sourceY: rowIndex * slice.height / slice.scaleY + slice.frameOffsetY,
								sourceWidth: slice.cropWidth || frameWidth, 
								sourceHeight: slice.cropHeight || frameHeight, 
								destX: (x + slice.offsetX - cameraOffset.x) / slice.layer.scale,
								destY: (y + slice.offsetY - cameraOffset.y) / slice.layer.scale, 
								destWidth: (slice.cropWidth * slice.scaleX || slice.width) / slice.layer.scale,
								destHeight: (slice.cropHeight * slice.scaleY || slice.height) / slice.layer.scale
							});
						// If the sprite is not an animation
						} else {
							drawImage({
								ctx: context,
								image: imageResource.image, 
								sourceX: slice.frameOffsetX, 
								sourceY: slice.frameOffsetY,
								sourceWidth: slice.cropWidth || frameWidth, 
								sourceHeight: slice.cropHeight || frameHeight,
								destX: (x + slice.offsetX - cameraOffset.x) / slice.layer.scale,
								destY: (y + slice.offsetY - cameraOffset.y) / slice.layer.scale, 
								destWidth: (slice.cropWidth * slice.scaleX || slice.width) / slice.layer.scale,
								destHeight: (slice.cropHeight * slice.scaleY || slice.height) / slice.layer.scale
							});
						}
						
						if (slice.colorize) {
							// Draw the color that should be overlayed over the image
							context.fillStyle = slice.colorize;
							context.globalCompositeOperation = "source-in";
							context.fillRect(x, y, slice.width, slice.height);
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
								context.fillRect((bounds[i].x - cameraOffset.x) / slice.layer.scale, (bounds[i].y - cameraOffset.y) / slice.layer.scale, bounds[i].width / slice.layer.scale, bounds[i].height / slice.layer.scale);
								context.closePath();
							} else if (slice.justTapped) {
								context.beginPath();
								context.fillStyle = "rgba(255, 10, 50, 0.4)";
								context.fillRect((bounds[i].x - cameraOffset.x) / slice.layer.scale, (bounds[i].y - cameraOffset.y) / slice.layer.scale, bounds[i].width / slice.layer.scale, bounds[i].height / slice.layer.scale);
								context.closePath();
							} else if (slice.justNotTapped) {
								context.beginPath();
								context.fillStyle = "rgba(255, 10, 255, 0.4)";
								context.fillRect((bounds[i].x - cameraOffset.x) / slice.layer.scale, (bounds[i].y - cameraOffset.y) / slice.layer.scale, bounds[i].width / slice.layer.scale, bounds[i].height / slice.layer.scale);
								context.closePath();
							} else if (slice.justReleased) {
								context.beginPath();
								context.fillStyle = "rgba(125, 10, 255, 0.4)";
								context.fillRect((bounds[i].x - cameraOffset.x) / slice.layer.scale, (bounds[i].y - cameraOffset.y) / slice.layer.scale, bounds[i].width / slice.layer.scale, bounds[i].height / slice.layer.scale);
								context.closePath();
								slice.justReleased = false;
							}
						
							context.beginPath();
							context.strokeStyle = "rgba(96, 255, 0, 0.5)";
							context.strokeRect((bounds[i].x - cameraOffset.x) / slice.layer.scale, (bounds[i].y - cameraOffset.y) / slice.layer.scale, bounds[i].width / slice.layer.scale, bounds[i].height / slice.layer.scale);
							context.closePath();
						}
						
						context.beginPath();
						context.arc((x - cameraOffset.x) / slice.layer.scale, (y - cameraOffset.y) / slice.layer.scale, 7, 0, 2 * Math.PI, false);
						context.fillStyle = "rgba(96, 255, 0, 0.5)";
						context.fill();
						
						boundingBox = slice.getBoundingBox();
						if (boundingBox.x !== bounds[0].x || boundingBox.y !== bounds[0].y || boundingBox.width !== bounds[0].width || boundingBox.height !== bounds[0].height) {
							context.beginPath();
							context.strokeStyle = "rgba(244, 246, 0, 0.5)";
							context.strokeRect((boundingBox.x - cameraOffset.x) / slice.layer.scale, (boundingBox.y - cameraOffset.y) / slice.layer.scale, boundingBox.width / slice.layer.scale, boundingBox.height / slice.layer.scale);
							context.closePath();
						}
					}
				//}
			}
		}
		slice.dirty = false;
	};
	
	slice.gotoLastFrame = function () {
	
		if (curFrameIndex !== slice.numberOfFrames - 1) {
			curFrameIndex = slice.numberOfFrames - 1;
			rowIndex = slice.numberOfRows;
			colIndex = slice.numberOfColumns;
			slice.dirty = true;
		}
	};
	
	slice.gotoFrame = function (frameIndex) {
	
		var newFrameCnt = Math.floor(slice.frameDelay * (frameIndex - Math.floor(frameIndex)) / 100);
		frameIndex = Math.floor(frameIndex);

		if (curFrameIndex !== frameIndex || frameCnt !== newFrameCnt) {
			curFrameIndex = frameIndex;
			
			rowIndex = Math.floor(curFrameIndex / slice.numberOfColumns);
			colIndex = curFrameIndex - rowIndex * slice.numberOfColumns;

			frameCnt = newFrameCnt;
			slice.dirty = true;
		}
	};
	
	slice.destroy = function (spec) {
		
		var src, img;
	
		if (slice) {
			slice.removeMotors();
			slice.dispatchEvent("destroyed", slice);
		}

		// Optional destroy behavior
		if (imageResource && imageResource.image && spec && spec.resetSrc) {
			src = imageResource.image.src;
			imageResource.image.src = null;
			imageResource.image.src = src;
		}
		
		imageResource = null;
		options = null;
		slice = null;
		options = null;
	};
	
	options = options || {};
	

	Object.defineProperty(slice, "currentFrameIndex", {
		get: function () {
			return curFrameIndex;
		},
		set: function (value) {
			slice.gotoFrame(value);
		}
	});
	
	cropWidth = options.cropWidth;
	Object.defineProperty(slice, "cropWidth", {
		get: function () {
			return cropWidth;
		},
		set: function (value) {
			if (cropWidth !== value) {
				slice.dirty = true;
				cropWidth = value;
			}
		}
	});
	
	cropHeight = options.cropHeight;
	Object.defineProperty(slice, "cropHeight", {
		get: function () {
			return cropHeight;
		},
		set: function (value) {
			if (cropHeight !== value) {
				slice.dirty = true;
				cropHeight = value;
			}
		}
	});
	
	frameOffsetX = options.frameOffsetX || 0;
	Object.defineProperty(slice, "frameOffsetX", {
		get: function () {
			return frameOffsetX;
		},
		set: function (value) {
			if (frameOffsetX !== value) {
				slice.dirty = true;
				frameOffsetX = value;
			}
		}
	});
	
	frameOffsetY = options.frameOffsetY || 0;
	Object.defineProperty(slice, "frameOffsetY", {
		get: function () {
			return frameOffsetY;
		},
		set: function (value) {
			if (frameOffsetY !== value) {
				slice.dirty = true;
				frameOffsetY = value;
			}
		}
	});
	
	mirrorX = options.mirrorX;
	Object.defineProperty(slice, "mirrorX", {
		get: function () {
			return mirrorX;
		},
		set: function (value) {
			if (mirrorX !== value) {
				slice.dirty = true;
				mirrorX = value;
			}
		}
	});
	
	mirrorY = options.mirrorY;
	Object.defineProperty(slice, "mirrorY", {
		get: function () {
			return mirrorY;
		},
		set: function (value) {
			if (mirrorY !== value) {
				slice.dirty = true;
				mirrorY = value;
			}
		}
	});
	
	(function () {
		
		var image = options.image,
			imageSrc = options.imageSrc || (options.image && options.src),
			imagePreloaded = image ? true : false;
			
		options = options || {};
			
		// Pause the slice if autoPlay property is set to false
		if (!slice.autoPlay) {
			paused = true;
		}
			
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