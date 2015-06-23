/**
*  introScreen.js
*  _____________________________________________________________________________
*  
*  @author William Malone (www.williammalone.com)
*/

/*global window, BLOCKS, Image */

BLOCKS.introScreen = function (spec, game) {
	
	"use strict";
	
	var introScreen = BLOCKS.eventDispatcher(),
		bg,
		clock,
		layer,
		destroyed,
		button,
		buttonImageLoaded,
		
		createButton = function () {
			if (button === undefined && layer) {
				button = BLOCKS.slice({
					layer: layer,
					image: spec.button.image,
					centerRegistrationPoint: true
				});
				button.x = spec.button.x;
				button.y = spec.button.y;
				
				game.controller.addEventListener("mouseMove", onMouseMove);
			}
		},
		
		loadBg = function () {
			
			spec.bg.image = game.imageLoader.loadNow(spec.bg);
			spec.bg.image.onload = bgLoaded;
		},
		
		bgLoaded = function () {
			
			if (!destroyed) {
				if (spec.bg.image.width !== 0 && spec.bg.image.height !== 0) {
					prepare();
					
					if (button || !spec.button) {
						introScreen.loaded = true;
						introScreen.dispatchEvent("loaded");
					}
				} else {
					if (!destroyed) {
						window.setTimeout(bgLoaded, 10);
					}
				}
			}
		},
		
		loadButton = function () {
			
			if (spec.button) {
				spec.button.image = game.imageLoader.loadNow(spec.button);
				spec.button.image.onload = buttonLoaded;
			}
		},
		
		buttonLoaded = function () {
			
			if (!destroyed) {
				if (spec.button.image.width !== 0 && spec.button.image.height !== 0) {
					buttonImageLoaded = true;
					if (button === undefined) {
						createButton();
					}
					if (bg && !destroyed) {
						introScreen.loaded = true;
						introScreen.dispatchEvent("loaded");
					}
				} else {
					if (!destroyed) {
						window.setTimeout(buttonLoaded, 10);
					}
				}
			}
		},
		
		load = function () {
			
			layer = game.addLayer("intro", {
				zIndex: 1
			});
		
			loadBg();
			loadButton();
		},
		
		onTick = function () {
		
			update();
			render();
		},
		
		prepare = function () {

			if (!destroyed) {

				bg = BLOCKS.slice({
					layer: layer,
					image: spec.bg.image
				});
				
				if (buttonImageLoaded) {
					createButton();
				}
				
				clock = BLOCKS.clock();
				clock.addEventListener("tick", onTick);
				clock.start();
			}
		},
		
		update = function () {

			bg.update();
			
			if (button) {
				button.update();
			}
		},
		
		render = function () {
		
			if (layer.dirty || (button && button.dirty)) {
				bg.dirty = true;
				
				if (button) {
					button.dirty = true;
				}
			}

			bg.render(game);
			
			if (button) {
				button.render(game);
			}
		},
		
		onMouseMove = function (pos) {
				
			if (button.isPointInside(pos)) {
				button.scale = 1.1;
			} else {
				button.scale = 1;
			}
		};
	
	introScreen.destroy = function () {
	
		destroyed = true;
	
		if (clock) {
			clock.destroy();
		}
		
		if (bg) {
			bg.destroy();
		}
		
		if (button) {
			button.destroy();
			game.controller.removeEventListener("mouseMove", onMouseMove);
		}
		
		if (layer) {
			game.removeLayer("intro");
		}

		introScreen = null;
	};
	
	load();
			
	return introScreen;
};