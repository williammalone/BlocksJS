/**
*  keyboard.js
*  _____________________________________________________________________________
*  
*  @author William Malone (www.williammalone.com)
*/

/*global window, BLOCKS, Image */

BLOCKS.key = function (spec) {

	
	"use strict";
	
	var key = BLOCKS.eventDispatcher();
	
	key.name = spec.name;
	key.keyCode = spec.keyCode;
	key.layer = spec.layer;
	key.x = spec.x || 0;
	key.y = spec.y || 0;
	key.width = spec.width || 80;
	key.height = spec.height || 80;
	key.scale = spec.scale || 1;
	key.visible = spec.visible || false;
	key.alpha = spec.alpha || 1;
	key.color = spec.color || "#333";
	key.textColor = spec.textColor || "#eee";
	key.dirty = true;
	
	key.update = function () {
	
	};
	
	key.render = function () {
	
		if (key.dirty && key.visible) {
		
			key.layer.ctx.save();
			
			// Draw key background
			key.layer.ctx.globalAlpha = key.alpha;
			key.layer.ctx.fillStyle = key.color;
			key.layer.ctx.fillRect(key.x, key.y, key.width, key.height);
			
			// Draw key name
			key.layer.ctx.fillStyle = key.textColor;
			key.layer.ctx.font = "bold 24px sans-serif";
			key.layer.ctx.textAlign = "center";
			key.layer.ctx.fillText(key.name, key.x + key.width / 2, key.y + key.height / 2 + 7);
				
			key.layer.ctx.restore();
		}
	};
	
	key.destroy = function () {
	
		key = null;
	};
		
	return key;
};

BLOCKS.virtualKeyboard = function (controller, spec) {
	
	"use strict";
	
	var keyboard = BLOCKS.eventDispatcher(),
		layer = spec.layer,
		keySpec = [
			[{
				name: "1",
				keyCode: 49
			}, {
				name: "2",
				keyCode: 50
			}, {
				name: "3",
				keyCode: 51
			}, {
				name: "4",
				keyCode: 52
			}, {
				name: "5",
				keyCode: 53
			}, {
				name: "6",
				keyCode: 54
			}, {
				name: "7",
				keyCode: 55
			}, {
				name: "8",
				keyCode: 56
			}, {
				name: "9",
				keyCode: 57
			}, {
				name: "0",
				keyCode: 48
			}]/*,
			[{
				name: "space",
				keyCode: 32,
				scale: 5
			}]*/
		],
		keys = [],
	
		init = function () {
		
			var i, j, key, margin = 20, padding = 20;
			
			// If any custom keys
			if (spec.customKeys) {
				for (i = 0; i < spec.customKeys.length; i += 1) {
					keySpec.push(spec.customKeys[i]);
				}
			}
			
			for (i = 0; i < keySpec.length; i += 1) {
			
				for (j = 0; j < keySpec[i].length; j += 1) {
			
					keySpec[i][j].layer = layer;
					key = BLOCKS.key(keySpec[i][j]);
					
					key.width = (key.width * key.scale);
					if (key.scale < 1) {
						key.width += (key.scale - 1) * (padding * j);
					}
					
					key.x = keyboard.x + margin + key.width * j;
					if (j <= keySpec[i].length - 1) {
						key.x += padding * j;
					}
					key.y = keyboard.y + margin + key.height * i;
					if (i <= keySpec.length - 1) {
						key.y += padding * i;
					}
					
					keys.push(key);
				}
			}
		};
	
	keyboard.x = spec.x || 0;
	keyboard.y = spec.y || 0;
	keyboard.width = spec.width || 640;
	keyboard.height = spec.height || 480;
	keyboard.dirty = false;
	keyboard.alpha = 0.8;
	keyboard.visible = false;
		
	keyboard.update = function () {

		var i;
		
		for (i = 0; i < keys.length; i += 1) {
			keys[i].update();
		}
	},
	
	keyboard.render = function () {
	
		var i;
		
		if (keyboard.dirty) {

			layer.clear();
			
			// Set all the keys dirty
			for (i = 0; i < keys.length; i += 1) {
				keys[i].visible = keyboard.visible;
				keys[i].dirty = true;
			}

			if (keyboard.visible) {
				// Draw background
				layer.ctx.save();
				layer.ctx.globalAlpha = keyboard.alpha;
				layer.ctx.fillStyle = "white";
				layer.ctx.fillRect(keyboard.x, keyboard.y, keyboard.width, keyboard.height);
				layer.ctx.restore();
			}
			keyboard.dirty = false;
		}
		
		for (i = 0; i < keys.length; i += 1) {
			keys[i].render();
		}
	};
	
	keyboard.destroy = function () {
	
		var i;
		
		for (i = 0; i < keys.length; i += 1) {
			keys[i].destroy();
		}
	};
	
	keyboard.onTap = function (pos) {
	
		var i;
		
		if (keyboard.visible) {
		
			for (i = 0; i < keys.length; i += 1) {
				if (BLOCKS.toolbox.isPointInsideRect(pos, keys[i])) {
				
					controller.simulateKeyDownEvent(keys[i].keyCode);
					break;
				}
			}
		}
	
		keyboard.visible = false;
		keyboard.dirty = true;
	};
	
	init();
			
	return keyboard;
};