/*
Copyright (c) 2013 William Malone (www.williammalone.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*global window, document, navigator */

var BLOCKS;

if (BLOCKS === undefined) {
	BLOCKS = {};
}

BLOCKS.game = function (spec, element) {
	
	"use strict";
	
	var game = BLOCKS.eventDispatcher(),
		clock = BLOCKS.clock(),
		gameContainer,
		interactionContainer,
		paused = false,
		virtualKeyboard,
		motors = [],
		tickers = [],
		debugPressTimeout,
		lastUpdateTime,
		remainingUpdate,
		minWidth,
		minHeight,
		maxHeight,
		maxWidth,
		scaleLandscape,
		scalePortrait,
		debugLayer,
		gameTappedOnce,
		loaded,
		tickerIndex = 0,
		prepared,
		wasMutedWhenPaused,
		
		handleTickers = function () {
			
			var i, 
				tickerArr = [], 
				callbacks = [];
			
			for (i = 0; i < tickers.length; i += 1) {
				tickers[i].curTick += 1;
				if (tickers[i].curTick >= tickers[i].totalTicks) {
					callbacks.push(tickers[i]);
				} else {
					tickerArr.push(tickers[i]);
				}
			}
			tickers = tickerArr;
			
			for (i = 0; i < callbacks.length; i += 1) {
				callbacks[i].callback(callbacks[i].parameters);
			}
		},

		onOrientationChange = function () {
		
			// Remove the space on iPhone / iPod when in landscape and using minimal ui meta tag
			if ((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i))) {
				if (window.orientation === 90 || window.orientation === -90) {
					window.scrollTo(0, 0);
					resizeGame();
				}
			}
		},
		
		onVisibilityChange = function () {
		
			if (document.hidden || document.webkitHidden || document.mozHidden || document.msHidden) {
				game.pause();
			} else {
				game.unpause();
			}
		},
		
		onFirstTap = function () {
			
			if (!gameTappedOnce) {
				game.controller.removeEventListener("tap", onFirstTap);
				
				game.dispatchEvent("firstTap");
				
				gameTappedOnce = true;
				
				if (game.introScreen) {
					game.introScreen.destroy();
					game.introScreen = null;
				}
				game.state = "loading";
				game.speaker.load();
				checkLoadProgress();
			}
		},
		
		init = function () {
		
			var i;
		
			gameContainer = document.createElement("article");
			gameContainer.id = "BlocksGameContainer";
			
			if (spec && spec.minWidth) {
				minWidth = spec.minWidth;
				gameContainer.style.minWidth = minWidth + "px";
			}
			if (spec && spec.minHeight) {
				minHeight = spec.minHeight;
				gameContainer.style.minHeight = minHeight + "px";
			}
			
			if (spec && spec.maxWidth) {
				maxWidth = spec.maxWidth;
				gameContainer.style.maxWidth = maxWidth + "px";
			}
			if (spec && spec.maxHeight) {
				maxHeight = spec.maxHeight;
				gameContainer.style.maxHeight = maxHeight + "px";
			}
			
			if (spec && spec.scaleLandscape !== undefined) {
				scaleLandscape = spec.scaleLandscape;
			} else {
				scaleLandscape = true;
			}
			if (spec && spec.scalePortrait !== undefined) {
				scalePortrait = spec.scalePortrait;
			} else {
				scalePortrait = true;
			}
			game.element.appendChild(gameContainer);
			
			interactionContainer = document.createElement("article");
			interactionContainer.id = "BlocksInteractionContainer";
			gameContainer.appendChild(interactionContainer);
			
			game.controller = BLOCKS.controller(interactionContainer);
			
			for (i = 0; i < 10; i += 1) {
				game.addLayer("blocksGameLayer" + (i + 1));
			}
			
			if (game.debug) {

				virtualKeyboard = BLOCKS.virtualKeyboard(game.controller, {
					layer: game.addLayer("internalblocksjsdebuglayer", {
						zIndex: 999999
					}, false),
					customKeys: spec.customVirtualKeys
				});
			}
	
			window.addEventListener("orientationchange", onOrientationChange);
			window.addEventListener("resize", resizeGame);
			
			resizeGame();
			
			game.controller.addEventListener("keyUp", onKeyUp);
			game.controller.addEventListener("keyDown", onKeyDown);
			
			game.controller.addEventListener("tap", onTap);
			game.controller.addEventListener("drag", onDrag);
			game.controller.addEventListener("release", onRelease);
			game.controller.addEventListener("cancel", onRelease); // Note cancel is retreated as a release
			
			game.controller.addEventListener("touchStart", onTouchStart);
			game.controller.addEventListener("touchMove", onTouchMove);
			game.controller.addEventListener("touchEnd", onTouchEnd);
			game.controller.addEventListener("touchCancel", onTouchEnd); // Note cancel is retreated as a touch end
			
			game.controller.addEventListener("mouseDown", onMouseDown);
			game.controller.addEventListener("mouseMove", onMouseMove);
			game.controller.addEventListener("mouseUp", onMouseUp);
			game.controller.addEventListener("mouseCancel", onMouseUp); // Note cancel is retreated as a mouse up
			game.controller.addEventListener("mouseOut", onMouseOut);
			game.controller.addEventListener("mouseUpOutside", mouseUpOutside);
			
			game.controller.addEventListener("tap", onFirstTap);
			
			// Mute and pause the game when the browser is not visible
			if (typeof document.hidden !== "undefined") {	
				document.addEventListener("visibilitychange", onVisibilityChange);
			} else if (typeof document.mozHidden !== "undefined") {
				document.addEventListener("mozvisibilitychange", onVisibilityChange);
			} else if (typeof document.msHidden !== "undefined") {
				document.addEventListener("msvisibilitychange", onVisibilityChange);
			} else if (typeof document.webkitHidden !== "undefined") {
				document.addEventListener("webkitvisibilitychange", onVisibilityChange);
			}
			
			window.onunload = game.destroy;
			
			// If autoLoad is not turned off then load
			if (game.autoLoad !== false) {
				game.load();
			}
		},
		
		gameUpdate = function () {
			
			var now;
			
			if (!paused) {

				now = + new Date();
				remainingUpdate += (now - lastUpdateTime);
				lastUpdateTime = now;	
				
				// If too much update then crop it
				if (remainingUpdate > game.maxLoopDuration) {
				
					BLOCKS.warn("Cannot keep up with game loop. Chopping " + Math.ceil((remainingUpdate - game.maxLoopDuration) / 60) + " frames.");
					remainingUpdate = game.maxLoopDuration;
				}
				
				//if (remainingUpdate < 16.666666666666) {
				//	BLOCKS.debug("No update this time: " + remainingUpdate);
				//}
	
				while (remainingUpdate >= 16.666666666666) {
				
					remainingUpdate -= 16.666666666666;
					
					game.dispatchEvent("tick"); // Simulate a clock
				
					game.dispatchEvent("preUpdate");
				
					if (game.debug) {
						virtualKeyboard.update();
					}
					
					handleTickers();
	
					game.update();
					
					game.dispatchEvent("postUpdate");
				}
			}
			
		},
		
		gameRender = function () {
			
			var e = {
				camera: game.camera
			};
		
			if (!paused) {

				game.dispatchEvent("preRender", e);
			
				if (game.debug) {
					virtualKeyboard.render(e);
				}
				
				game.render(e);
				
				game.dispatchEvent("postRender", e);
			}
		},
		
		onClockTick = function () {
			
			gameUpdate();
			gameRender();
		},
		
		onKeyDown = function (e) {
			
			if (game.keyDown) {
				game.keyDown(e);
			}
		},
		
		onKeyUp = function (e) {
			
			if (game.keyUp) {
				game.keyUp(e);
			}
		},
		
		onTap = function (pos) {

			if (game.debug) {
				if (pos.x < 100 && pos.y < 100) {
					debugPressTimeout = window.setTimeout(function () {
						virtualKeyboard.visible = !virtualKeyboard.visible;
						virtualKeyboard.dirty = true;
					}, 1000);
				}
				virtualKeyboard.onTap(pos);
			}
		
			if (game.tap) {
				game.tap(pos);
			}
		},
		
		onDrag = function (pos) {
		
			if (game.debug) {
				window.clearTimeout(debugPressTimeout);
			}
			
			if (game.drag) {
				game.drag(pos);
			}
		},
		
		onRelease = function (pos) {
			
			if (game.debug) {
				window.clearTimeout(debugPressTimeout);
			}
			
			if (game.release) {
				game.release(pos);
			}
		},
		
		onTouchStart = function (pos) {
				
			if (game.touchStart) {
				game.touchStart(pos);
			}
		},
		
		onTouchMove = function (pos) {
		
			if (game.touchMove) {
				game.touchMove(pos);
			}
		},
		
		onTouchEnd = function (pos) {
		
			if (game.touchEnd) {
				game.touchEnd(pos);
			}
		},
		
		onMouseDown = function (pos) {
				
			if (game.mouseDown) {
				game.mouseDown(pos);
			}
		},
		
		onMouseMove = function (pos) {
		
			if (game.mouseMove) {
				game.mouseMove(pos);
			}
		},
		
		onMouseUp = function (pos) {
		
			if (game.mouseUp) {
				game.mouseUp(pos);
			}
		},
		
		onMouseOut = function (pos) {
		
			if (game.mouseOut) {
				game.mouseOut(pos);
			}
		},
		
		mouseUpOutside = function (pos) {
		
			if (game.mouseUpOutside) {
				game.mouseUpOutside(pos);
			}
		},
		
		checkLoadProgress = function () {
		
//BLOCKS.debug("checkLoadProgress: " + gameTappedOnce + " " + game.imageLoader.isLoaded() + " " + game.speaker.isReady());
			if (!loaded) {
				if ((game.introScreen && gameTappedOnce) || !game.introScreen) {
					// If all images are loaded and all sounds (or number of sounds is zero) are laoded
					if (game.imageLoader.isLoaded() && (game.speaker.isReady() || game.speaker.getNumFiles() === 0)) {
		
						loaded = true;
						
						// If autoLoad is not turned off then load
						if (game.autoStart !== false) {
							game.start();
						}
						
						if (game.loadingScreen) {
							game.loadingScreen.destroy();
							game.loadingScreen = null;
						}
						game.dispatchEvent("loaded");
					}
				}
			}
		},
		
		// See wmalone.com/scale for an article discussing this scaling approach
		resizeGame = function () {
		
			var i, viewport, newGameWidth, newGameHeight, newGameX, newGameY;
					
			// Get the dimensions of the viewport
			viewport = {
				width: game.element.offsetWidth,
				height: game.element.offsetHeight
			};
			
			
			// If the viewport is greater than a minimum or maximum game dimension use that instead
			if (minWidth && viewport.width < minWidth) {
				viewport.width = minWidth;
			}
			if (minHeight && viewport.height < minHeight) {
				viewport.height = minHeight;
			}
			if (maxWidth && viewport.width > maxWidth) {
				viewport.width = maxWidth;
			}
			if (maxHeight && viewport.height > maxHeight) {
				viewport.height = maxHeight;
			}
		
			// If the game should not be scaled
			if (!scaleLandscape && Math.abs(window.orientation) === 90 || 
				!scalePortrait && Math.abs(window.orientation) !== 90) {
			
				newGameHeight = game.height;
				newGameWidth = game.width;
				
			} else {
				// Determine game size
				if (game.height / game.width > viewport.height / viewport.width) {
					if (game.safeHeight / game.width > viewport.height / viewport.width) {
						// A
						newGameHeight = viewport.height * game.height / game.safeHeight;
						newGameWidth = newGameHeight * game.width / game.height;
					} else {
						// B
						newGameWidth = viewport.width;
						newGameHeight = newGameWidth * game.height / game.width;
					}
				} else {
					if (game.height / game.safeWidth > viewport.height / viewport.width) {
						// C
						newGameHeight = viewport.height;
						newGameWidth = newGameHeight * game.width / game.height;
					} else {
						// D
						newGameWidth = viewport.width * game.width / game.safeWidth;
						newGameHeight = newGameWidth * game.height / game.width;
					}
				}
			}
		
			newGameX = (viewport.width - newGameWidth) / 2;
			newGameY = (viewport.height - newGameHeight) / 2;
			
			// Save the game scale amount
			game.scale = newGameWidth / game.width;
			
			// Define the camera
			game.camera.x = -Math.min(newGameX, 0) / game.scale;
			game.camera.y = -Math.min(newGameY, 0) / game.scale;
			game.camera.width = (viewport.width - Math.max(newGameX, 0) * 2) / game.scale;
			game.camera.height = (viewport.height - Math.max(newGameY, 0) * 2) / game.scale;
			
			// Resize the game container
			gameContainer.style.width = (viewport.width - Math.max(newGameX, 0) * 2) + "px";
			gameContainer.style.height = (viewport.height - Math.max(newGameY, 0) * 2)+ "px";
					
			// Set the new padding of the game so it will be centered
			gameContainer.style.padding = Math.max(newGameY, 0) + "px " + Math.max(newGameX, 0) + "px";
			
			// Tell the controller the game dimensions
			game.controller.scaleX = game.width / newGameWidth;
			game.controller.scaleY = game.height / newGameHeight;
			game.controller.offsetX = -game.camera.x * game.scale;
			game.controller.offsetY = -game.camera.y * game.scale;

			for (i = 0; i < game.layers.length; i += 1) {			
				game.layers[i].width = game.camera.width;
				game.layers[i].height = game.camera.height;
			}
			
			if (!loaded && game.loadingScreen) {
				game.loadingScreen.dirty = true;
			}
			game.dispatchEvent("resize");
		};
	
	// Define spec as empty object if it was specified as a parameter
	spec = spec || {};

	game.layers = [];
	game.width = spec.width !== undefined ? spec.width : 1024;
	game.height = spec.height !== undefined ? spec.height : 768;
	game.safeWidth = spec.safeWidth || game.width;
	game.safeHeight = spec.safeHeight || game.height;
	game.debug = spec.debug !== undefined ? spec.debug : false;
	game.maxLoopDuration = spec.maxLoopDuration !== undefined ? spec.maxLoopDuration : 500;
	game.scale = 1;
	game.stage = BLOCKS.container(game);
	game.camera = BLOCKS.camera({
		width: game.width,
		height: game.height
	});
	game.autoLoad = spec.autoLoad !== undefined ? spec.autoLoad : true;
	game.autoStart = spec.autoStart !== undefined ? spec.autoStart : true;
	game.state = "intro";
	
	// The element in which the game markup will be injected will be the element with
	//   the "BlockGame" id unless specified via a parameter of the game
	game.element = (element !== undefined) ? element : document.getElementById("BlocksGame");
	if (!game.element) {
		game.element = document.getElementsByClassName("BlocksGame")[0];
	}
	if (!game.element) {
		BLOCKS.error("Game does not have a game element");
	}
	
	game.imageLoader = (spec && spec.imagesPath) ? BLOCKS.preloader(spec.imagesPath) : BLOCKS.preloader();
	
	if (spec && spec.loading) {
		game.loadingScreen = BLOCKS.loadingScreen(spec.loading, game);
	}
	
	if (spec && spec.intro) {
		game.introScreen = BLOCKS.introScreen(spec.intro, game);
	}
	
	// Create sound player
	game.speaker = BLOCKS.speaker({
		path: (spec && spec.audioPath !== undefined) ? spec.audioPath : "",
		src: (spec && spec.audioSpriteSrc !== undefined) ? spec.audioSpriteSrc : ""
	});
	
	game.speaker.addEventListener("update", function (e) {
		var assetsLoaded = game.imageLoader.getNumFilesLoaded() + game.speaker.getNumFilesLoaded();

		if (game.loadingScreen) {
			game.loadingScreen.setProgress(assetsLoaded, game.imageLoader.getNumFiles() + game.speaker.getNumFiles());
		}
	});
	
	game.speaker.addEventListener("ready", function () {
		checkLoadProgress();
	}, true);
	
	Object.defineProperty(game, "paused", {
		get: function () {
			return paused;
		}
	});
	
	game.pause = function () {
	
		if (!paused) {
			//BLOCKS.debug("Game not visible so pause");
			paused = true;
			if (game.speaker) {
				wasMutedWhenPaused = game.speaker.isMuted();
				game.speaker.mute();
				game.speaker.pause();
				game.dispatchEvent("pause");
			}
		}
	};
	
	game.resize = function () {
	
		resizeGame();
	};
	
	game.unpause = function () {
	
		if (paused) {
			//BLOCKS.debug("Game is visible again so unpause");
			
			paused = false;
			lastUpdateTime = + new Date();	
			
			if (game.speaker) {
				if (!wasMutedWhenPaused) {
					game.speaker.unmute();
				}
				game.speaker.unpause();
				game.dispatchEvent("unpause");
			}
		}
	};
	
	game.update = function () {
		
		game.stage.update();
	};
	
	game.render = function (e) {

		game.stage.render(e);
	};
	
	game.getLayer = function (name) {
		
		var i;
		
		for (i = 0; i < game.layers.length; i += 1) {
			if (game.layers[i].name === name) {
				return game.layers[i];
			}
		}
	};
	
	game.createLayer = function (name, options) {
	
		options = options || {};
		options.name = name;
		
		options.parentElement = interactionContainer;
		if (!options.width) {
			options.width = game.camera.width;
		}
		if (!options.height) {
			options.height = game.camera.height;
		}

		return BLOCKS.layer(options);
	};
		
	game.destroyLayer = function (layer) {
		
		layer.destroy();
		layer = null;
	};
		
	game.addLayer = function (name, options) {
	
		var layer;
		
		if (!game.getLayer(name)) {
		
			layer = game.createLayer(name, options);

			game.layers.push(layer);
			return layer;
		} else {
			BLOCKS.warn("Cannot add layer '" + name + "' because it already exists.");
		}
	};
	
	game.removeLayer = function (name) {
	
		var i;
		
		for (i = 0; i < game.layers.length; i += 1) {
			if (game.layers[i].name === name) {
				game.destroyLayer(game.layers[i]);
				game.layers.splice(i, 1);
				return true;
			}
		}
	
		BLOCKS.warn("Cannot remove layer '" + name + "' because it cannot be found.");
	};
	
	game.addMotor = function (type) {
	
		var key,
			motor,
			spec = arguments[1] || {};
			
		spec.type = type;
		
		if (spec.type === "drag") {
			spec.controller = game.controller;
		} else {
			spec.clock = game;
		}

		motor = BLOCKS.motor(spec);
		
		if (motor) {
			motor.type = type;
			if (spec.object) {
				spec.object.motorize(motor);
			}
			motor.addEventListener("destroyed", game.removeMotor);
			motors.push(motor);	
		}
		
		return motor;
	};
	
	game.removeMotor = function (motor) {
	
		var i;
			
		for (i = 0; i < motors.length; i += 1)  {
			if (motors[i] === motor) {
				motors.splice(i, 1);
				return true;
			}
		}
	};
	
	game.addTicker = function (callback, duration, parameters) {
	
		var id = (+ new Date()).toString() + tickerIndex;
		
		tickerIndex += 1;
		if (tickerIndex > 99999999) {
			tickerIndex = 0;
		}

		tickers.push({
			id: id,
			curTick: 0,
			totalTicks: Math.ceil(duration * 60 / 1000),
			callback: callback,
			parameters: parameters
		});
		
		return id;
	};
	
	game.removeTicker = function (id) {
		
		var i, existingTickers = [];
		
		for (i = 0; i < tickers.length; i += 1) {
			if (tickers[i].id === id) {
				tickers[i] = null;
			} else {
				existingTickers.push(tickers[i]);
			}
		}
		
		tickers = existingTickers;
	};
	
	game.clearTickers = function () {
	
		tickers = [];
	};
	
	game.load = function () {
	
		var i;

		game.imageLoader.loadFromTree(spec);

		// Define game sounds
		if (spec.sounds) {
			for (i = 0; i < spec.sounds.length; i += 1) {
				game.speaker.createSound(spec.sounds[i]);
			}
		}

		game.imageLoader.addEventListener("update", function () {
		
			var assetsLoaded = game.imageLoader.getNumFilesLoaded() + game.speaker.getNumFilesLoaded();

			if (game.loadingScreen) {
				game.loadingScreen.setProgress(assetsLoaded, game.imageLoader.getNumFiles() + game.speaker.getNumFiles());
			}
		});
		
		game.imageLoader.addEventListener("complete", function () {
		
			checkLoadProgress();
		});
		game.imageLoader.load();
	};
	
	game.stop = function () {
		
		clock.removeEventListener("tick", onClockTick);	
		clock.stop();
	};
	
	game.start = function () {
	
		var i;
	
		lastUpdateTime = + new Date();
		remainingUpdate = 0;
		
		if (!prepared) {
			prepared = true;

			if (game.prepare) {
				game.prepare();
			}
		}
		
		clock.removeEventListener("tick", onClockTick);	
		clock.addEventListener("tick", onClockTick);
		clock.start();
	};
	
	game.destroy = function () {
	
		var i;

		clock.destroy();
		
		if (game.loadingScreen) {
			game.loadingScreen.destroy();
		}
		
		for (i = 0; i < game.layers; i += 1) {
			game.removeLayer(game.layers[i]);
		}
	};
	
    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/	
	(function() {
		var lastTime = 0;
		var vendors = ['webkit', 'moz'];
		for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
			window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
			window.cancelAnimationFrame =
				window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
		}
	
		if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	
		if (!window.cancelAnimationFrame)
			window.cancelAnimationFrame = function(id) {
				window.clearTimeout(id);
		};
	}());
	
	init();
	
	return game;
};