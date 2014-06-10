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
		container = BLOCKS.container(game),
		
		load = function () {
		
			spec.bg.image = game.imageLoader.loadNow(spec.bg);
			spec.bg.image.onload = prepare;
		},
		
		onTick = function () {
		
			update();
			render();
		},
		
		prepare = function () {
		
			if (!destroyed) {
		
				layer = game.addLayer("intro", {
					zIndex: 1
				});
			
				bg = BLOCKS.slice({
					layer: layer,
					image: spec.bg.image
				});
				
				clock = BLOCKS.clock();
				clock.addEventListener("tick", onTick);
				clock.start();
			}
		},
		
		update = function () {

			//container.update();
			bg.update();
		},
		
		render = function () {
		
			//container.render(game);
		
			if (layer.dirty) {
				bg.dirty = true;
				//layer.clear();
			}

			bg.render(game);
		};
	
	introScreen.destroy = function () {
	
		destroyed = true;
	
		if (clock) {
			clock.destroy();
		}
		
		if (bg) {
			bg.destroy();
		}
		
		if (layer) {
			game.removeLayer("intro");
		}

		introScreen = null;
	};
	
	load();
			
	return introScreen;
};