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
		
		load = function () {
		
			spec.bg.image = game.imageLoader.loadNow(spec.bg);
			spec.bg.image.onload = prepare;
		},
		
		prepare = function () {
		
			if (!destroyed) {
		
				layer = game.createLayer("intro", {
					zIndex: 1
				});
			
				bg = BLOCKS.slice({
					layer: layer,
					image: spec.bg.image
				});
				
				clock = BLOCKS.clock();
				clock.addEventListener("tick", update);
				clock.addEventListener("render", render);
				clock.start();
			}
		},
		
		update = function () {

			bg.update();
		},
		
		render = function () {

			bg.render();
		};
	
	introScreen.destroy = function () {
	
		destroyed = true;
	
		if (clock) {
			clock.destroy();
		}
		
		if (layer) {
			layer.destroy();
			layer = null;
		}
		if (bg) {
			bg.destroy();
		}

		introScreen = null;
	};
	
	load();
			
	return introScreen;
};