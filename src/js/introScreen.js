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
		
		load = function () {
		
			spec.bg.image = game.imageLoader.loadNow(spec.bg);
			spec.bg.image.onload = prepare;
		},
		
		prepare = function () {
		
			layer = game.createLayer("intro");
		
			bg = BLOCKS.slice({
				layer: layer,
				image: spec.bg.image
			});
			
			clock = BLOCKS.clock();
			clock.addEventListener("tick", update);
			clock.addEventListener("render", render);
			clock.start();
		},
		
		update = function () {

			bg.update();
		},
		
		render = function () {

			bg.render();
		};
	
	introScreen.destroy = function () {
	
		if (clock) {
			clock.destroy();
			
			layer.destroy();
			layer = null;
			
			bg.destroy();
		}

		introScreen = null;
	};
	
	load();
			
	return introScreen;
};