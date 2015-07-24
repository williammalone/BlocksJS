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

BLOCKS.tileCollection = function (options) {
	
	"use strict";
	
	var collection = BLOCKS.eventDispatcher(),
		tiles = [],
		tileWidth,
		tileHeight,
		tileIndexArray = [],
		visibleTiles = [],
		dirty,
		layer,
		alpha,
		motors = [],
		width,
		height,
		x,
		y,
		visible,
		prevCamera,
		speed,
		loopX,
		
		motorDestroyed = function (motor) {
			
			var i;
			
			motor.removeEventListener("destroyed", motorDestroyed);
			
			for (i = 0 ; i < motors.length; i += 1)  {
				motors.splice(i, 1);
				break;
			}
		},
		
		setTilesDirty = function (value) {
			
			var i;
				
			for (i = 0; i < visibleTiles.length; i += 1) {
				visibleTiles[i].dirty = value;
			}
		},

		init = function () {
			
			var i, tmpSlice;
			
			if (options.tiles) {
				for (i = 0; i < options.tiles.length; i += 1) {
					
					// If the tile has an id
					if (options.tiles[i].id) {
						tiles[options.tiles[i].id] = options.tiles[i];
					} else {
						tiles[i] = options.tiles[i];
					}
					
if (options.tiles[i].image) {
tileWidth = options.tiles[i].image.width;
}
				}

				// If an image is loaded for the first tile
				if (options.tiles[0].image) {
					tileWidth = options.tiles[0].image.width;
					tileHeight = options.tiles[0].image.height;
				}
				
			} else {
				BLOCKS.error("No tiles specified in tile collection.");
			}
			
			if (options.order) {
				tileIndexArray = options.order;
			} else {
				BLOCKS.error("No tile order specified in tile collection.");
			}
		},
		
		drawTile = function (spec) {
			
			var tilePos;
			
			if (tileWidth && tileHeight) {

				// Determine the tile position relative to the collection
				tilePos = {
					x: -(spec.camera.x * speed - tileWidth * spec.column),
					y: -(spec.camera.y * speed - tileHeight * spec.row)
				};
				
				spec.image = tiles[spec.id].image;
	
				// If tile outside bounds on the left (maybe right too)
				if (tilePos.x + x + spec.camera.offsetX < 0) {
					spec.sourceX = x - tilePos.x + spec.camera.offsetX;
					spec.destX = 0;
					
					// If outside bounds on the right too
					if (tilePos.x + tileWidth > spec.camera.width + spec.camera.offsetX) {
						spec.sourceWidth = spec.camera.width;

//BLOCKS.debug(collection.name + ":If tile outside bounds on the left and right: sourceX: " + spec.sourceX + ", sourceWidth: " + spec.sourceWidth + ", x: " + x +", tilePos.x: " + tilePos.x + ", spec.camera.x: " + spec.camera.x + ", (sourceX + sourceWidth > tileWidth): " + Boolean(spec.sourceX + spec.sourceWidth > tileWidth));
					// If outside bounds on the left but not the right
					} else {
						spec.sourceWidth = tileWidth + tilePos.x - spec.camera.offsetX;

//BLOCKS.debug(collection.name + ":If tile outside bounds on the left: sourceX: " + spec.sourceX + ", sourceWidth: " + spec.sourceWidth + ", x: " + x +", tilePos.x: " + tilePos.x + ", spec.camera.x: " + spec.camera.x + ", (sourceX + sourceWidth > tileWidth): " + Boolean(spec.sourceX + spec.sourceWidth > tileWidth) + ", spec.camera.offsetX;: " + spec.camera.offsetX);
					}

				// If tile outside bounds on the right only
				} else if (tilePos.x + tileWidth > x + spec.camera.offsetX + spec.camera.width) {
					spec.sourceX = 0;
					spec.destX = tilePos.x + x - spec.camera.offsetX;
					spec.sourceWidth = spec.camera.width + spec.camera.offsetX - (tilePos.x + x);
//BLOCKS.debug(collection.name + ": If tile outside bounds on the right only: sourceX: " + spec.sourceX + ", sourceWidth: " + spec.sourceWidth + ", x: " + x +", tilePos.x: " + tilePos.x + ", spec.camera.x: " + spec.camera.x);
				// If tile is inside bounds on the left and right
				} else {
					spec.sourceX = 0;
					spec.destX = x - spec.camera.offsetX + tilePos.x;
					spec.sourceWidth = tileWidth;

//BLOCKS.debug(collection.name + ": If tile inside horizontal bounds: sourceX: " + spec.sourceX + ", sourceWidth: " + spec.sourceWidth + ", x: " + x +", tilePos.x: " + tilePos.x + ", spec.camera.x: " + spec.camera.x);
				}
				
				// If tile outside bounds on the top (maybe bottom too)
				if (tilePos.y + y + spec.camera.offsetY < 0) {

					spec.sourceY = -tilePos.y - y + spec.camera.offsetY;
					spec.destY = 0;
					
					// If outside bounds on the bottom too
					if (tilePos.y + tileHeight > spec.camera.height) {
						spec.sourceHeight = spec.camera.height;
					// If outside bounds on the top but not the bottom
					} else {
						spec.sourceHeight = tileHeight - tilePos.y;
					}

//BLOCKS.debug(collection.name + "(" + spec.id + "): If tile outside bounds on the top: sourceY: " + spec.sourceY + ", sourceHeight: " + spec.sourceHeight + ", y: " + y +", tilePos.y: " + tilePos.y + ", spec.camera.y: " + spec.camera.y);

				// If tile outside bounds on the bottom only
				} else if (tilePos.y + tileHeight > y + spec.camera.offsetY + spec.camera.height) {
					
					spec.sourceY = 0;
					spec.destY = tilePos.y + y - spec.camera.offsetY;
					spec.sourceHeight = spec.camera.height + spec.camera.offsetY - (tilePos.y + y);
					
//BLOCKS.debug(collection.name + ": If tile outside bounds on the bottom: destY: " + spec.destY);
					
				// If tile is inside bounds on the top and bottom
				} else {
	
					spec.sourceY = 0;
					spec.destY = y - spec.camera.offsetY + tilePos.y;
					spec.sourceHeight = tileHeight;
//BLOCKS.debug(collection.name + ": If tile inside vertical bounds: destY: " + spec.destY);
				}
				
				spec.destWidth = spec.sourceWidth;
				spec.destHeight = spec.sourceHeight;
	
//BLOCKS.debug(spec.id + ": " + spec.sourceWidth + ", x: " + x + ", spec.sourceX: " + spec.sourceX + ", spec.destX: " + spec.destX);
//BLOCKS.debug(spec.id + " > spec.sourceHeight: " + spec.sourceHeight + ", y: " + y + ", spec.sourceY: " + spec.sourceY + ", spec.destY: " + spec.destY);
	
				if (spec.sourceWidth && spec.sourceHeight) {
			
					collection.layer.ctx.drawImage(
						spec.image,
						spec.sourceX,
						spec.sourceY,
						spec.sourceWidth,
						spec.sourceHeight,
						spec.destX / layer.scale,
						spec.destY / layer.scale, 
						spec.destWidth / layer.scale,
						spec.destHeight / layer.scale
					);
				}
			} else {
			
				// If an image is loaded for the first tile
				if (options.tiles[0].image) {
					tileWidth = options.tiles[0].image.width;
					tileHeight = options.tiles[0].image.height;
				}	
			}
		};
		
	options = options || {};
	
	// Public Methods
	collection.update = function () {
	
	};
	
	collection.render = function (e) {
		
		var i, j, minColIndex, maxColIndex, minRowIndex, maxRowIndex, col, row, previousAlpha;

		if (dirty && visible) {
			
			previousAlpha = collection.layer.ctx.globalAlpha;
			collection.layer.ctx.globalAlpha = alpha;
			
			minColIndex = Math.floor((e.camera.x * speed - x) / tileWidth);
			if (loopX) {
//BLOCKS.debug("minColIndex: " + minColIndex);
				maxColIndex = Math.ceil((e.camera.x + e.camera.width + e.camera.offsetX) / tileWidth) - 1;
//BLOCKS.debug("maxColIndex: " + maxColIndex);
//BLOCKS.debug(Math.floor((e.camera.x * speed - x) / tileWidth) + " -      " + minColIndex + " > " + maxColIndex + "    - " + tileIndexArray[0].length);
			} else {
				maxColIndex = Math.floor((e.camera.x * speed + e.camera.width + e.camera.offsetX) / tileWidth);
			}			
			minRowIndex = Math.floor((e.camera.y * speed - y) / tileHeight);
			maxRowIndex = Math.floor((e.camera.y * speed - y + e.camera.height + e.camera.offsetY) / tileHeight);
			
			for (i = minColIndex; i <= maxColIndex; i += 1) {
				for (j = minRowIndex; j <= maxRowIndex; j += 1) { 

					// Enable looping					
					if (loopX && tileIndexArray[j]) {
						//BLOCKS.debug("(" + i + ", " + j + "): " + i + " >=" + tileIndexArray[j].length);
						if (i >= tileIndexArray[j].length) {
							col = i % tileIndexArray[j].length;
					//BLOCKS.debug(j + ": minColIndex out of range: " + minColIndex + ", " + i + " > " + col);
						} else {
							col = i;
					//BLOCKS.debug(j + ": minColIndex in range: " + i);
						}
					} else {
						col = i;	
					}
					row = j;
					
					if (tileIndexArray && tileIndexArray[row] && tileIndexArray[row][col]) {
					
						
						drawTile({
							id: tileIndexArray[row][col],
							row: j,
							column: i,
							camera: {
								x: e.camera.x,
								y: e.camera.y,
								offsetX: e.camera.offsetX,
								offsetY: e.camera.offsetY,
								width: e.camera.width,
								height: e.camera.height
							}
						});
					}
				}
			}
			
			collection.layer.ctx.globalAlpha = previousAlpha;
		}
		dirty = false;
	};
	
	collection.show = function () {
	
		collection.visible = true;
	};
	
	collection.hide = function () {
	
		collection.visible = false;
	};
	
	collection.isPointInside = function (pos) {
	
		var i;
		
		for (i = 0; i < visibleTiles.length; i += 1) {
			if (visibleTiles[i].visible && visibleTiles[i].isPointInside(pos)) {
				return true;
			}
		}
		
		return false;
	};
	
	collection.motorize = function (motor) {
	
		motor.addEventListener("destroyed", motorDestroyed);
		motors.push(motor);
	};
	
	collection.removeMotors = function (type) {
		
		var i, motorArr = [];
		
		for (i = 0 ; i < motors.length; i += 1)  {
			if (type) {
				if (motors[i].type === type) {
					motors[i].destroy();
				} else {
					motorArr.push(motors[i]);
				}
			} else {
				motors[i].destroy();
			}
		}
		motors = motorArr;
	};
	
	collection.destroy = function (spec) {
	
		var i, src;

		// Optional destroy behavior
		if (spec && spec.resetSrc && options.tiles) {
			for (i = 0; i < options.tiles.length; i += 1) {
				if (options.tiles[i].image) {
					src = options.tiles[i].image.src;
					options.tiles[i].image.src = null;
					options.tiles[i].image.src = src;
				}
			}
		}

		for (i = 0; i < visibleTiles.length; i += 1) {
			visibleTiles[i].destroy();
		}
		visibleTiles = [];
		collection = null;
	};
	
	Object.defineProperty(collection, "dirty", {
		get: function () {
			return dirty;
		},
		set: function (value) {
			if (dirty !== value) {
				dirty = value;
			}
		}
	});
	
	alpha = options.alpha || 1;
	Object.defineProperty(collection, "alpha", {
		get: function () {
			return alpha !== undefined ? alpha : 1;
		},
		set: function (value) {
			if (alpha !== value) {
				
				// Round the alpha value if it is really close
				if (value < 0.0001) {
					value = 0;
				} else if (value > 0.9999) {
					value = 1;
				}
				alpha = value;
				
				dirty = true;
			}
		}
	});
	
	Object.defineProperty(collection, "width", {
		get: function () {
			return tileIndexArray[0].length * tileWidth;
		}
	});
	
	Object.defineProperty(collection, "height", {
		get: function () {
			return tileIndexArray.length * tileHeight;
		}
	});
	
	x = options.x || 0;
	Object.defineProperty(collection, "x", {
		get: function () {
			return x;
		},
		set: function (value) {
			if (x !== value) {
				x = value;
				dirty = true;
			}
		}
	});
	
	y = options.y || 0;
	Object.defineProperty(collection, "y", {
		get: function () {
			return y;
		},
		set: function (value) {
			if (y !== value) {
				y = value;
				dirty = true;
			}
		}
	});
	
	layer = options.layer;
	Object.defineProperty(collection, "layer", {
		get: function () {
			return layer;
		},
		set: function (value) {
			if (layer !== value) {
				layer = value;
				dirty = true;
			}
		}
	});
	
	visible = options.visible || true;
	Object.defineProperty(collection, "visible", {
		get: function () {
			return visible;
		},
		set: function (value) {
			if (visible !== value) {
				visible = value;
				dirty = true;
			}
		}
	});
	
	speed = options.speed || 1;
	Object.defineProperty(collection, "speed", {
		get: function () {
			return speed;
		},
		set: function (value) {
			if (speed !== value) {
				speed = value;
			}
		}
	});
	
	loopX = options.loopX;
	Object.defineProperty(collection, "loopX", {
		get: function () {
			return loopX;
		},
		set: function (value) {
			if (loopX !== value) {
				loopX = value;
			}
		}
	});
	
	Object.defineProperty(collection, "tileWidth", {
		get: function () {
			return tileWidth;
		}
	});
	
	Object.defineProperty(collection, "tileHeight", {
		get: function () {
			return tileHeight;
		}
	});
	
	init();
	
	return collection;
};