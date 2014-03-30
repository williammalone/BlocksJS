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
		dirty,
		curPercentage = 0,
		fontFamily = "Arial,sans",
		fontSize = "24px",
		fontWeight = "bold",
		fontColor = "#eee",
		messageX = 0,
		messageY = 0,
		messageText = "loading... ",
		progressBarImageLoaded,
		
		createProgressBar = function () {
		
			if (!progressBar) {
				
				spec.progressBar.layer = layers.loading;
				progressBar = BLOCKS.slice(spec.progressBar);
				progressBar.x = spec.progressBar.x;
				progressBar.y = spec.progressBar.y;
			
				dirty = true;
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
		},
		
		prepare = function () {
		
			layers = {
				loadingBg: game.createLayer("loadingBg", {
					enableWebGL: false
				}),
				loading: game.createLayer("loading")
			};

			bg = BLOCKS.slice({
				layer: layers.loadingBg,
				image: spec.bg.image
			});
			
			// If the progress bar is ready to be created and was not already created
			if (progressBarImageLoaded && !progressBar) {
				createProgressBar();
			}

			clock = BLOCKS.clock();
			clock.addEventListener("tick", update);
			clock.addEventListener("render", render);
			clock.start();
		},
		
		update = function () {
		
			bg.update();
			
			if (progressBar) {
				progressBar.update();
			}
		},
		
		render = function () {
			
			if (dirty) {
			
				dirty = false;
			
				layers.loading.clear();
				
				if (progressBar) {
					progressBar.cropWidth = progressBar.width * curPercentage;
					progressBar.dirty = true;
				}
			
				if (!layers.loading.webGLEnabled) {
					layers.loading.ctx.fillStyle = fontColor;
					layers.loading.ctx.font = fontWeight + " " + fontSize + " " + fontFamily;
					layers.loading.ctx.textAlign = "right";
					
					layers.loading.ctx.fillText(messageText, messageX, messageY);
			
					layers.loading.ctx.textAlign = "left";
					layers.loading.ctx.fillText(Math.round(curPercentage * 100, 10) + "%", messageX, messageY);
				}
			}
			
			bg.render();
			
			if (progressBar) {
				progressBar.render();
			}
		};
	
	loadingScreen.destroy = function () {

		if (clock) {
			clock.destroy();
			
			layers.loadingBg.destroy();
			layers.loadingBg = null;
			layers.loading.destroy();
			layers.loading = null;
			
			if (progressBar) {
				progressBar.destroy();
			}
			bg.destroy();
		}
		
		loadingScreen = null;
	};
	
	loadingScreen.setProgress = function (loaded, total) {
		
		var percentage = loaded / total;
		
		if (curPercentage !== percentage) {
			curPercentage = percentage;
			dirty = true;
		}
	};
	
	if (spec && spec.message) {
	
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