/**
*  loadingScreen.js
*  _____________________________________________________________________________
*  
*  @author William Malone (www.williammalone.com)
*/

/*global window, BLOCKS, Image */

BLOCKS.loadingScreen = function (spec, game) {
	
	"use strict";
	
	var loadingScreen = BLOCKS.eventDispatcher(),
		clock,
		bg,
		layers,
		progressBar,
		curPercentage = 0,
		fontFamily = "Arial,sans",
		animation,
		fontSize = "24px",
		fontWeight = "bold",
		fontColor = "#eee",
		messageX = 0,
		messageY = 0,
		messageText = "loading... ",
		progressBarImageLoaded,
		animationLoaded,
		
		createAnimation = function () {
		
			if (!animation) {
				
				spec.animation.layer = layers.loading;
				animation = BLOCKS.slice(spec.animation);
				animation.x = spec.animation.x;
				animation.y = spec.animation.y;
			
				loadingScreen.dirty = true;
			}
		},
		
		createProgressBar = function () {
		
			if (!progressBar) {
				
				spec.progressBar.layer = layers.loading;
				progressBar = BLOCKS.slice(spec.progressBar);
				progressBar.x = spec.progressBar.x;
				progressBar.y = spec.progressBar.y;
			
				loadingScreen.dirty = true;
			}
		},
		
		load = function () {

			spec.bg.image = game.imageLoader.loadNow(spec.bg);
			spec.bg.image.onload = prepare;
			
			spec.progressBar.image = game.imageLoader.loadNow(spec.progressBar);
			spec.progressBar.image.onload = function () {
			
				progressBarImageLoaded = true;
				
				if (layers && layers.loading) {
					createProgressBar();
				}
			};
			
			if (spec.animation) {
				spec.animation.image = game.imageLoader.loadNow(spec.animation);
				spec.animation.image.onload = function () {
				
					animationLoaded = true;
					
					if (layers && layers.loading) {
						createAnimation();
					}
				};
			}
		},
		
		prepare = function () {
		
			layers = {
				loadingBg: game.addLayer("loadingBg", {
					enableWebGL: false
				}),
				loading: game.addLayer("loading")
			};

			bg = BLOCKS.slice({
				layer: layers.loadingBg,
				image: spec.bg.image
			});
			
			// If the progress bar is ready to be created and was not already created
			if (progressBarImageLoaded && !progressBar) {
				createProgressBar();
			}
			
			// If the animation is ready to be created and was not already created
			if (spec.animation && animationLoaded && !animation) {
				createAnimation();
			}

			clock = BLOCKS.clock();
			clock.addEventListener("tick", function () {
				update();
				render();
			});
			clock.start();
			
			loadingScreen.dirty = true;
		},
		
		update = function () {
		
			bg.update();
			
			if (progressBar) {
				progressBar.update();
			}
			if (animation) {
				animation.update();
			}
		},
		
		render = function () {
			
			if (loadingScreen.dirty || bg.dirty || (animation && animation.dirty) || (progressBar && progressBar.dirty)) {
			
				layers.loading.clear();
				
				bg.dirty = true;
				if (progressBar) {
					progressBar.cropWidth = progressBar.width * curPercentage;
					progressBar.dirty = true;
				}
				if (animation) {
					animation.dirty = true;
				}
			
				bg.render(game);
			
				layers.loading.ctx.fillStyle = fontColor;
				layers.loading.ctx.font = fontWeight + " " + fontSize + " " + fontFamily;
				layers.loading.ctx.textAlign = "right";
				
				layers.loading.ctx.fillText(messageText, messageX, messageY);
		
				layers.loading.ctx.textAlign = "left";
				layers.loading.ctx.fillText(Math.round(curPercentage * 100, 10) + "%", messageX, messageY);
			
				if (progressBar) {
					progressBar.render(game);
				}
				if (animation) {
					animation.render(game);
				}
			}
			
			loadingScreen.dirty = false;
		};
		
	loadingScreen.dirty = true;
	
	loadingScreen.destroy = function () {

		if (clock) {
			clock.destroy();
			
			if (layers) {
				game.removeLayer("loadingBg");
				game.removeLayer("loading");
			}
			
			bg.destroy();
			bg = null;
			
			if (progressBar) {
				progressBar.destroy();
				progressBar = null;
			}
			
			if (animation) {
				animation.destroy();
				animation = null;
			}
		}
		
		loadingScreen = null;
	};
	
	loadingScreen.setProgress = function (loaded, total) {
		
		var percentage = loaded / total;
		
		if (curPercentage !== percentage) {
			curPercentage = percentage;
			loadingScreen.dirty = true;
		}
	};
	
	if (spec.message) {
	
		if (spec.message.fontFamily) {
			fontFamily = spec.message.fontFamily;
		}
		if (spec.message.fontSize) {
			fontSize = spec.message.fontSize.toString().replace("px", "") + "px";
		}
		if (spec.message.fontWeight) {
			fontWeight = spec.message.fontWeight;
		}
		if (spec.message.fontColor) {
			fontColor = spec.message.fontColor;
		}
		if (spec.message.x) {
			messageX = spec.message.x;
		}
		if (spec.message.y) {
			messageY = spec.message.y;
		}
		if (spec.message.text) {
			messageText = spec.message.text;
		}
	}
	
	load();
			
	return loadingScreen;
};